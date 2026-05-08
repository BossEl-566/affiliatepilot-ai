import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { LeadModel } from "@/models/Lead";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

export const runtime = "nodejs";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET() {
  try {
    await connectToDatabase();

    const leads = await LeadModel.find().sort({ createdAt: -1 }).lean();

    const productIds = Array.from(
      new Set(
        leads
          .map((lead) => lead.affiliateProductId)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );

    const products = await AffiliateProductModel.find({
      _id: { $in: productIds },
    })
      .select("name platformName trackingCode")
      .lean();

    const productMap = new Map(
      products.map((product) => [
        String(product._id),
        {
          _id: String(product._id),
          name: product.name,
          platformName: product.platformName,
          trackingCode: product.trackingCode,
        },
      ])
    );

    const enrichedLeads = leads.map((lead) => ({
      ...lead,
      affiliateProduct: lead.affiliateProductId
        ? productMap.get(String(lead.affiliateProductId)) || null
        : null,
    }));

    return Response.json({
      ok: true,
      leads: enrichedLeads,
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    if (!body.name && !body.username && !body.contact) {
      return Response.json(
        {
          ok: false,
          error: "Provide at least a name, username, or contact.",
        },
        { status: 400 }
      );
    }

    if (
      body.affiliateProductId &&
      !isValidObjectId(String(body.affiliateProductId))
    ) {
      return Response.json(
        {
          ok: false,
          error: "Invalid affiliate product ID.",
        },
        { status: 400 }
      );
    }

    const lead = await LeadModel.create({
      affiliateProductId: body.affiliateProductId || undefined,
      generatedPostId:
        body.generatedPostId && isValidObjectId(String(body.generatedPostId))
          ? body.generatedPostId
          : undefined,
      platform: body.platform ?? "other",
      name: body.name ?? "",
      username: body.username ?? "",
      contact: body.contact ?? "",
      source: body.source ?? "",
      message: body.message ?? "",
      notes: body.notes ?? "",
      interestLevel: Number(body.interestLevel ?? 1),
      status: body.status ?? "new",
      lastContactedAt: body.lastContactedAt
        ? new Date(body.lastContactedAt)
        : undefined,
      convertedAt: body.convertedAt ? new Date(body.convertedAt) : undefined,
    });

    return Response.json(
      {
        ok: true,
        lead,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create lead:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}