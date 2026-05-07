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

export async function POST() {
  try {
    await connectToDatabase();

    const products = await AffiliateProductModel.find({
      $or: [
        { trackingCode: { $exists: false } },
        { trackingCode: "" },
        { trackingCode: null },
      ],
    });

    let updated = 0;

    for (const product of products) {
      const trackingCode = await createUniqueTrackingCode();

      await AffiliateProductModel.updateOne(
        { _id: product._id },
        {
          $set: {
            trackingCode,
          },
        }
      );

      updated += 1;
    }

    return Response.json({
      ok: true,
      updated,
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