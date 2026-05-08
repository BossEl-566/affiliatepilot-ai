import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { MessageTemplateModel } from "@/models/MessageTemplate";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

export const runtime = "nodejs";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function extractVariables(body: string) {
  const matches = body.match(/{{\s*[\w]+\s*}}/g) || [];

  return Array.from(
    new Set(
      matches.map((match) =>
        match.replace("{{", "").replace("}}", "").trim()
      )
    )
  );
}

export async function GET() {
  try {
    await connectToDatabase();

    const templates = await MessageTemplateModel.find()
      .sort({ createdAt: -1 })
      .lean();

    const productIds = Array.from(
      new Set(
        templates
          .map((template) => template.affiliateProductId)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );

    const products = await AffiliateProductModel.find({
      _id: { $in: productIds },
    })
      .select("name platformName trackingCode affiliateUrl")
      .lean();

    const productMap = new Map(
      products.map((product) => [
        String(product._id),
        {
          _id: String(product._id),
          name: product.name,
          platformName: product.platformName,
          trackingCode: product.trackingCode,
          affiliateUrl: product.affiliateUrl,
        },
      ])
    );

    const enrichedTemplates = templates.map((template) => ({
      ...template,
      affiliateProduct: template.affiliateProductId
        ? productMap.get(String(template.affiliateProductId)) || null
        : null,
    }));

    return Response.json({
      ok: true,
      templates: enrichedTemplates,
    });
  } catch (error) {
    console.error("Failed to fetch templates:", error);

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

    if (!body.name || !body.body) {
      return Response.json(
        {
          ok: false,
          error: "Template name and message body are required.",
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

    const template = await MessageTemplateModel.create({
      affiliateProductId: body.affiliateProductId || undefined,
      name: body.name,
      platform: body.platform ?? "other",
      category: body.category ?? "custom",
      tone: body.tone ?? "professional",
      body: body.body,
      variables: extractVariables(body.body),
      status: body.status ?? "active",
    });

    return Response.json(
      {
        ok: true,
        template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create template:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}