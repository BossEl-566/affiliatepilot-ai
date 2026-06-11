import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { generateHookLabIdeas } from "@/lib/ai/affiliateAi";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedPlatforms = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "telegram",
  "whatsapp",
  "x",
];

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizePlatform(value: unknown) {
  if (
    typeof value === "string" &&
    allowedPlatforms.includes(value)
  ) {
    return value;
  }

  return "instagram";
}

export async function POST(
  request: Request,
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

    const body = await request.json();

    const platform = normalizePlatform(body.platform);

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

    const result = await generateHookLabIdeas(
      product,
      platform
    );

    const updatedProduct =
      await AffiliateProductModel.findByIdAndUpdate(
        id,
        {
          $set: {
            hookLabIdeas: result.data,
            hookLabLastGeneratedAt: new Date(),
            hookLabGenerationMode: result.mode,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    return Response.json({
      ok: true,
      ideas: updatedProduct?.hookLabIdeas || [],
      aiMode: result.mode,
      warning: result.warning || "",
    });
  } catch (error) {
    console.error("Failed to generate Hook Lab ideas:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate hooks.",
      },
      { status: 500 }
    );
  }
}