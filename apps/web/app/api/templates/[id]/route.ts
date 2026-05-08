import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { MessageTemplateModel } from "@/models/MessageTemplate";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid template ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const template = await MessageTemplateModel.findByIdAndUpdate(
      id,
      {
        $set: {
          affiliateProductId:
            body.affiliateProductId &&
            isValidObjectId(String(body.affiliateProductId))
              ? body.affiliateProductId
              : undefined,
          name: body.name,
          platform: body.platform,
          category: body.category,
          tone: body.tone,
          body: body.body,
          variables:
            typeof body.body === "string" ? extractVariables(body.body) : [],
          status: body.status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!template) {
      return Response.json(
        {
          ok: false,
          error: "Template not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      template,
    });
  } catch (error) {
    console.error("Failed to update template:", error);

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
          error: "Invalid template ID.",
        },
        { status: 400 }
      );
    }

    const template = await MessageTemplateModel.findByIdAndDelete(id);

    if (!template) {
      return Response.json(
        {
          ok: false,
          error: "Template not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      message: "Template deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete template:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}