import { timingSafeEqual } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { publishTelegramGeneratedPost } from "@/lib/publishing/publishTelegramGeneratedPost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishResult = {
  postId: string;
  title: string;
  status: "published" | "failed";
  telegramMessageId?: number;
  error?: string;
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw new Error("CRON_SECRET is not configured.");
  }

  const expected = `Bearer ${secret}`;
  const received = request.headers.get("authorization") || "";

  return safeEqual(received, expected);
}

export async function POST(request: Request) {
  try {
    if (!verifyCronRequest(request)) {
      return Response.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const now = new Date();

    const duePosts = await GeneratedPostModel.find({
      platform: "telegram",
      status: {
        $in: ["approved", "scheduled"],
      },
      scheduledAt: {
        $lte: now,
      },
      telegramPublishedAt: null,
    })
      .sort({
        scheduledAt: 1,
      })
      .limit(3)
      .lean();

    const results: PublishResult[] = [];

    for (const post of duePosts) {
      try {
        const result = await publishTelegramGeneratedPost({
          postId: String(post._id),
          requestOrigin: new URL(request.url).origin,
        });

        results.push({
          postId: String(post._id),
          title: post.title || "Untitled Telegram post",
          status: "published",
          telegramMessageId:
            result.telegram.primaryMessage.message_id,
        });
      } catch (error) {
        results.push({
          postId: String(post._id),
          title: post.title || "Untitled Telegram post",
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Telegram publishing failed.",
        });
      }
    }

    const publishedCount = results.filter(
      (result) => result.status === "published"
    ).length;

    const failedCount = results.filter(
      (result) => result.status === "failed"
    ).length;

    return Response.json(
      {
        ok: failedCount === 0,
        checked: duePosts.length,
        published: publishedCount,
        failed: failedCount,
        results,
      },
      {
        status: failedCount === 0 ? 200 : 500,
      }
    );
  } catch (error) {
    console.error("Scheduled Telegram publishing failed:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduled Telegram publishing failed.",
      },
      { status: 500 }
    );
  }
}