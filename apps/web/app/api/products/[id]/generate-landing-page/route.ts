import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { generateProductLandingPage } from "@/lib/ai/affiliateAi";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(
  _request: Request,
  context: RouteContext
) {
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
          error: "Affiliate product not found.",
        },
        { status: 404 }
      );
    }

    if (!product.trackingCode) {
      return Response.json(
        {
          ok: false,
          error:
            "This product does not have a tracking code yet.",
        },
        { status: 400 }
      );
    }

    const result = await generateProductLandingPage(product);

    const updatedProduct =
      await AffiliateProductModel.findByIdAndUpdate(
        id,
        {
          $set: {
            landingPageEnabled: true,
            landingHeadline: result.data.headline,
            landingSubheadline: result.data.subheadline,
            landingBenefits: result.data.benefits,
            landingWhoItsFor: result.data.whoItsFor,
            landingFaq: result.data.faq,
            landingCtaLabel: result.data.ctaLabel,
            landingDisclosure:
              "Affiliate disclosure: I may earn a commission if you purchase through this link, at no additional cost to you.",
            landingLastGeneratedAt: new Date(),
            landingGenerationMode: result.mode,
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
    console.error("Failed to generate landing page:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate landing page.",
      },
      { status: 500 }
    );
  }
}