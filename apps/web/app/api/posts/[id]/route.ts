import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { GeneratedPostModel } from "@/models/GeneratedPost";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim().replace(/^#/, ""))
      .filter(Boolean);
  }

  return [];
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid post ID.",
        },
        { status: 400 }
      );
    }

    const post = await GeneratedPostModel.findById(id).lean();

    if (!post) {
      return Response.json(
        {
          ok: false,
          error: "Post not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      post,
    });
  } catch (error) {
    console.error("Failed to fetch post:", error);

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
          error: "Invalid post ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const post = await GeneratedPostModel.findByIdAndUpdate(
      id,
      {
          $set: {
      mediaAssetId:
        body.mediaAssetId && isValidObjectId(body.mediaAssetId)
          ? body.mediaAssetId
          : undefined,
      platform: body.platform,
      format: body.format,
      title: body.title,
      hook: body.hook,
      caption: body.caption,
      script: body.script,
      callToAction: body.callToAction,
      hashtags: normalizeStringArray(body.hashtags),
      riskNotes: normalizeStringArray(body.riskNotes),
      status: body.status,
    },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!post) {
      return Response.json(
        {
          ok: false,
          error: "Post not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      post,
    });
  } catch (error) {
    console.error("Failed to update post:", error);

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
          error: "Invalid post ID.",
        },
        { status: 400 }
      );
    }

    const post = await GeneratedPostModel.findByIdAndDelete(id);

    if (!post) {
      return Response.json(
        {
          ok: false,
          error: "Post not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      message: "Post deleted successfully.",
      post,
    });
  } catch (error) {
    console.error("Failed to delete post:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}