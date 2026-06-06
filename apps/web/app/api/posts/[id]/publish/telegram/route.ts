import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { MediaAssetModel } from "@/models/MediaAsset";
import { sendTelegramPost } from "@/lib/telegram";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeHashtag(tag: string) {
  const cleanTag = tag.trim().replace(/^#/, "");

  return cleanTag ? `#${cleanTag}` : "";
}

function buildTelegramPostText(input: {
  title?: string;
  hook?: string;
  caption?: string;
  callToAction?: string;
  hashtags?: string[];
  trackingLink: string;
}) {
  const sections: string[] = [];

  if (input.title?.trim()) {
    sections.push(input.title.trim());
  }

  if (input.hook?.trim()) {
    sections.push(input.hook.trim());
  }

  if (input.caption?.trim()) {
    sections.push(input.caption.trim());
  }

  if (input.callToAction?.trim()) {
    sections.push(`👉 ${input.callToAction.trim()}`);
  }

  sections.push(`🔗 ${input.trackingLink}`);

  const hashtags = (input.hashtags || [])
    .map(normalizeHashtag)
    .filter(Boolean)
    .join(" ");

  if (hashtags) {
    sections.push(hashtags);
  }

  return sections.join("\n\n");
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid post ID.",
        },
        { status: 400 }
      );
    }

    const post = await GeneratedPostModel.findById(id).lean();

    if (!post) {
      return Response.json(
        {
          ok: false,
          error: "Generated post not found.",
        },
        { status: 404 }
      );
    }

    if (post.platform !== "telegram") {
      return Response.json(
        {
          ok: false,
          error:
            "Only Telegram drafts can be published through this Telegram integration.",
        },
        { status: 400 }
      );
    }

    if (post.status !== "approved" && post.status !== "scheduled") {
      return Response.json(
        {
          ok: false,
          error:
            "Approve or schedule this Telegram draft before publishing it.",
        },
        { status: 400 }
      );
    }

    const product = await AffiliateProductModel.findById(
      post.affiliateProductId
    ).lean();

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Attached affiliate product not found.",
        },
        { status: 404 }
      );
    }

    if (!product.trackingCode) {
      return Response.json(
        {
          ok: false,
          error: "The attached product does not have a tracking code.",
        },
        { status: 400 }
      );
    }

    const mediaAsset =
      post.mediaAssetId && isValidObjectId(String(post.mediaAssetId))
        ? await MediaAssetModel.findById(post.mediaAssetId).lean()
        : null;

    const origin = new URL(request.url).origin;

    const query = new URLSearchParams({
      postId: String(post._id),
      platform: "telegram",
    });

    const trackingLink = `${origin}/r/${
      product.trackingCode
    }?${query.toString()}`;

    const text = buildTelegramPostText({
      title: post.title,
      hook: post.hook,
      caption: post.caption,
      callToAction: post.callToAction,
      hashtags: post.hashtags,
      trackingLink,
    });

    const telegramResult = await sendTelegramPost({
      text,
      mediaUrl: mediaAsset?.fileUrl,
      mediaType: mediaAsset?.mediaType,
    });

    const publishedAt = new Date();

    const updatedPost = await GeneratedPostModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "published",
          publishedAt,
          telegramMessageId:
            telegramResult.primaryMessage.message_id,
          telegramChatId: String(
            telegramResult.primaryMessage.chat?.id || ""
          ),
          telegramPublishedAt: publishedAt,
          telegramError: "",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return Response.json({
      ok: true,
      post: updatedPost,
      telegram: telegramResult,
      trackingLink,
    });
  } catch (error) {
    console.error("Telegram publishing failed:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Telegram publishing failed.",
      },
      { status: 500 }
    );
  }
}