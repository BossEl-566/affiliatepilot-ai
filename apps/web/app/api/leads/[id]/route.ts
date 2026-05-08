import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { LeadModel } from "@/models/Lead";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function PATCH(request: Request, context: RouteContext) {
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

    const body = await request.json();

    const lead = await LeadModel.findByIdAndUpdate(
      id,
      {
        $set: {
          affiliateProductId:
            body.affiliateProductId &&
            isValidObjectId(String(body.affiliateProductId))
              ? body.affiliateProductId
              : undefined,
          platform: body.platform,
          name: body.name,
          username: body.username,
          contact: body.contact,
          source: body.source,
          message: body.message,
          notes: body.notes,
          interestLevel:
            body.interestLevel !== undefined
              ? Number(body.interestLevel)
              : undefined,
          status: body.status,
          lastContactedAt: body.lastContactedAt
            ? new Date(body.lastContactedAt)
            : undefined,
          convertedAt: body.convertedAt
            ? new Date(body.convertedAt)
            : undefined,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lead) {
      return Response.json(
        {
          ok: false,
          error: "Lead not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      lead,
    });
  } catch (error) {
    console.error("Failed to update lead:", error);

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
          error: "Invalid lead ID.",
        },
        { status: 400 }
      );
    }

    const lead = await LeadModel.findByIdAndDelete(id);

    if (!lead) {
      return Response.json(
        {
          ok: false,
          error: "Lead not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      message: "Lead deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete lead:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}