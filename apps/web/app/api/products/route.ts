import { randomBytes } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

export const runtime = "nodejs";

function createTrackingCode() {
  return randomBytes(5).toString("hex");
}

async function createUniqueTrackingCode() {
  let trackingCode = createTrackingCode();

  let existingProduct = await AffiliateProductModel.findOne({
    trackingCode,
  }).lean();

  while (existingProduct) {
    trackingCode = createTrackingCode();

    existingProduct = await AffiliateProductModel.findOne({
      trackingCode,
    }).lean();
  }

  return trackingCode;
}

export async function GET() {
  try {
    await connectToDatabase();

    const products = await AffiliateProductModel.find()
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      ok: true,
      products,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);

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

    if (!body.name || !body.affiliateUrl) {
      return Response.json(
        {
          ok: false,
          error: "Product name and affiliate URL are required.",
        },
        { status: 400 }
      );
    }

    const trackingCode = await createUniqueTrackingCode();

    const product = await AffiliateProductModel.create({
      name: body.name,
      platformName: body.platformName ?? "",
      affiliateUrl: body.affiliateUrl,
      trackingCode,
      productUrl: body.productUrl ?? "",
      category: body.category ?? "",
      targetAudience: body.targetAudience ?? "",
      currency: body.currency ?? "GHS",
      price: Number(body.price ?? 0),
      commissionType: body.commissionType ?? "unknown",
      commissionValue: Number(body.commissionValue ?? 0),
      productSummary: body.productSummary ?? "",
      buyerPersona: body.buyerPersona ?? "",
      painPoints: Array.isArray(body.painPoints) ? body.painPoints : [],
      objections: Array.isArray(body.objections) ? body.objections : [],
      allowedChannels: Array.isArray(body.allowedChannels)
        ? body.allowedChannels
        : [],
      bannedClaims: Array.isArray(body.bannedClaims) ? body.bannedClaims : [],
      contentAngles: Array.isArray(body.contentAngles) ? body.contentAngles : [],
      recommendedPlatforms: Array.isArray(body.recommendedPlatforms)
        ? body.recommendedPlatforms
        : [],
      analysisNotes: body.analysisNotes ?? "",
      trustScore: Number(body.trustScore ?? 0),
      riskScore: Number(body.riskScore ?? 0),
      status: body.status ?? "draft",
    });

    return Response.json(
      {
        ok: true,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create product:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}