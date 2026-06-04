import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { LeadModel } from "@/models/Lead";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { generateLeadReply } from "@/lib/ai/affiliateAi";

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
          error: "Invalid lead ID.",
        },
        { status: 400 }
      );
    }

    const lead = await LeadModel.findById(id).lean();

    if (!lead) {
      return Response.json(
        {
          ok: false,
          error: "Lead not found.",
        },
        { status: 404 }
      );
    }

    const product = lead.affiliateProductId
      ? await AffiliateProductModel.findById(lead.affiliateProductId).lean()
      : null;

    const result = await generateLeadReply({
      lead,
      product,
    });

    return Response.json({
      ok: true,
      suggestion: result.data,
      aiMode: result.mode,
      warning: result.warning || "",
    });
  } catch (error) {
    console.error("Failed to generate lead reply:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}