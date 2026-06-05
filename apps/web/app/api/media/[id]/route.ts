import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { MediaAssetModel } from "@/models/MediaAsset";
import {
  deleteCloudinaryMedia,
  type CloudinaryResourceType,
} from "@/lib/cloudinary";

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
          error: "Invalid media asset ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

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

    const mediaAsset = await MediaAssetModel.findByIdAndUpdate(
      id,
      {
        $set: {
          affiliateProductId: body.affiliateProductId || undefined,
          title: body.title,
          description: body.description,
          suggestedCaption: body.suggestedCaption,
          suggestedHashtags: Array.isArray(body.suggestedHashtags)
            ? body.suggestedHashtags
            : undefined,
          status: body.status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!mediaAsset) {
      return Response.json(
        {
          ok: false,
          error: "Media asset not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      mediaAsset,
    });
  } catch (error) {
    console.error("Failed to update media asset:", error);

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
          error: "Invalid media asset ID.",
        },
        { status: 400 }
      );
    }

    const mediaAsset = await MediaAssetModel.findById(id);

    if (!mediaAsset) {
      return Response.json(
        {
          ok: false,
          error: "Media asset not found.",
        },
        { status: 404 }
      );
    }

    if (
      mediaAsset.storageProvider === "cloudinary" &&
      mediaAsset.cloudinaryPublicId
    ) {
      await deleteCloudinaryMedia(
        mediaAsset.cloudinaryPublicId,
        mediaAsset.cloudinaryResourceType as CloudinaryResourceType
      );
    }

    await mediaAsset.deleteOne();

    return Response.json({
      ok: true,
      message: "Media asset deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete media asset:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}