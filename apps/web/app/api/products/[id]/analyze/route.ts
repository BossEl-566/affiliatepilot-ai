import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { analyzeAffiliateProduct } from "@/lib/ai/affiliateAi";

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

    const result = await analyzeAffiliateProduct(product);

    const updatedProduct = await AffiliateProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          productSummary: result.data.productSummary,
          buyerPersona: result.data.buyerPersona,
          painPoints: result.data.painPoints,
          objections: result.data.objections,
          allowedChannels: result.data.allowedChannels,
          bannedClaims: result.data.bannedClaims,
          contentAngles: result.data.contentAngles,
          recommendedPlatforms: result.data.recommendedPlatforms,
          analysisNotes: result.data.analysisNotes,
          trustScore: result.data.trustScore,
          riskScore: result.data.riskScore,
          lastAnalyzedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return Response.json({
      ok: true,
      product: updatedProduct,
      aiMode: result.mode,
      warning: result.warning || "",
    });
  } catch (error) {
    console.error("Failed to analyze product:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}