import { randomBytes } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

function createTrackingCode() {
  return randomBytes(5).toString("hex");
}

export async function POST() {
  try {
    await connectToDatabase();

    const products = await AffiliateProductModel.find({
      $or: [{ trackingCode: { $exists: false } }, { trackingCode: "" }],
    });

    for (const product of products) {
      product.trackingCode = createTrackingCode();
      await product.save();
    }

    return Response.json({
      ok: true,
      updated: products.length,
    });
  } catch (error) {
    console.error("Failed to generate tracking codes:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}