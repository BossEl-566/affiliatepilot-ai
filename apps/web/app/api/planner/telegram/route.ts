import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { generateTelegramWeeklyPlan } from "@/lib/ai/affiliateAi";

export const runtime = "nodejs";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const affiliateProductId =
      typeof body.affiliateProductId === "string"
        ? body.affiliateProductId
        : "";

    const startDateTime =
      typeof body.startDateTime === "string"
        ? body.startDateTime
        : "";

    if (!isValidObjectId(affiliateProductId)) {
      return Response.json(
        {
          ok: false,
          error: "Select a valid affiliate product.",
        },
        { status: 400 }
      );
    }

    const firstScheduledAt = new Date(startDateTime);

    if (Number.isNaN(firstScheduledAt.getTime())) {
      return Response.json(
        {
          ok: false,
          error: "Select a valid starting date and posting time.",
        },
        { status: 400 }
      );
    }

    if (firstScheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
      return Response.json(
        {
          ok: false,
          error: "The first posting time must not be in the past.",
        },
        { status: 400 }
      );
    }

    const product = await AffiliateProductModel.findById(
      affiliateProductId
    ).lean();

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Affiliate product not found.",
        },
        { status: 404 }
      );
    }

    const result = await generateTelegramWeeklyPlan(product);

    const plannerBatchId = randomUUID();
    const plannerGeneratedAt = new Date();

    const posts = await GeneratedPostModel.insertMany(
      result.data.map((draft, index) => ({
        affiliateProductId: product._id,
        platform: "telegram",
        format: "text_post",
        title: draft.title,
        hook: draft.hook,
        caption: draft.caption,
        script: "",
        hashtags: draft.hashtags,
        callToAction: draft.callToAction,
        riskNotes: draft.riskNotes,
        status: "draft",
        scheduledAt: new Date(
          firstScheduledAt.getTime() + index * ONE_DAY_MS
        ),
        plannerBatchId,
        plannerSource: "telegram_weekly_plan",
        plannerGeneratedAt,
      }))
    );

    return Response.json(
      {
        ok: true,
        plannerBatchId,
        posts,
        aiMode: result.mode,
        warning: result.warning || "",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create Telegram weekly plan:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Telegram weekly plan.",
      },
      { status: 500 }
    );
  }
}