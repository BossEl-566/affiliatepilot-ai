import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { generateCampaignDrafts } from "@/lib/ai/affiliateAi";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const product = await AffiliateProductModel.findById(id).lean();

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const result = await generateCampaignDrafts(product);

    const posts = await GeneratedPostModel.insertMany(
      result.data.map((draft) => ({
        affiliateProductId: product._id,
        platform: draft.platform,
        format: draft.format,
        title: draft.title,
        hook: draft.hook,
        caption: draft.caption,
        script: draft.script,
        hashtags: draft.hashtags,
        callToAction: draft.callToAction,
        riskNotes: draft.riskNotes,
        status: "draft",
      }))
    );

    return Response.json(
      {
        ok: true,
        posts,
        aiMode: result.mode,
        warning: result.warning || "",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to generate campaign:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}