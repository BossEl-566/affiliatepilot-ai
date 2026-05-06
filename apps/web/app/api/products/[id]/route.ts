import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_request: Request, context: RouteContext) {
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

    return Response.json({
      ok: true,
      product,
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

    const product = await AffiliateProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          platformName: body.platformName,
          affiliateUrl: body.affiliateUrl,
          productUrl: body.productUrl,
          category: body.category,
          targetAudience: body.targetAudience,
          currency: body.currency,
          price: body.price !== undefined ? Number(body.price) : undefined,
          commissionType: body.commissionType,
          commissionValue:
            body.commissionValue !== undefined
              ? Number(body.commissionValue)
              : undefined,
          productSummary: body.productSummary,
          buyerPersona: body.buyerPersona,
          painPoints: body.painPoints,
          objections: body.objections,
          allowedChannels: body.allowedChannels,
          bannedClaims: body.bannedClaims,
          trustScore:
            body.trustScore !== undefined ? Number(body.trustScore) : undefined,
          riskScore:
            body.riskScore !== undefined ? Number(body.riskScore) : undefined,
          status: body.status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      product,
    });
  } catch (error) {
    console.error("Failed to update product:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    const product = await AffiliateProductModel.findByIdAndDelete(id);

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}