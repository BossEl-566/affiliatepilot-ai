import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { MediaAssetModel } from "@/models/MediaAsset";
import { uploadMediaBuffer } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeResourceType(value?: string) {
  if (value === "video" || value === "raw") return value;

  return "image";
}

function determineMediaType(input: {
  mimeType: string;
  resourceType: "image" | "video" | "raw";
}) {
  if (input.mimeType.startsWith("image/")) return "image";
  if (input.mimeType.startsWith("video/")) return "video";

  if (
    input.mimeType === "application/pdf" ||
    input.resourceType === "raw"
  ) {
    return "document";
  }

  return "unknown";
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");

    if (productId && !isValidObjectId(productId)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const query = productId
      ? {
          affiliateProductId: productId,
          status: { $ne: "archived" },
        }
      : {
          status: { $ne: "archived" },
        };

    const mediaAssets = await MediaAssetModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      ok: true,
      mediaAssets,
    });
  } catch (error) {
    console.error("Failed to fetch media assets:", error);

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

    const formData = await request.formData();

    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return Response.json(
        {
          ok: false,
          error: "Select an image, video, or PDF file.",
        },
        { status: 400 }
      );
    }

    if (fileValue.size <= 0) {
      return Response.json(
        {
          ok: false,
          error: "The selected file is empty.",
        },
        { status: 400 }
      );
    }

    if (fileValue.size > MAX_UPLOAD_BYTES) {
      return Response.json(
        {
          ok: false,
          error: "File is too large. Use a file smaller than 25 MB.",
        },
        { status: 400 }
      );
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(fileValue.type)) {
      return Response.json(
        {
          ok: false,
          error:
            "Unsupported file type. Upload JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, or PDF.",
        },
        { status: 400 }
      );
    }

    const affiliateProductId =
      getText(formData, "affiliateProductId") ||
      getText(formData, "productId");

    if (
      affiliateProductId &&
      !isValidObjectId(affiliateProductId)
    ) {
      return Response.json(
        {
          ok: false,
          error: "Invalid affiliate product ID.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await fileValue.arrayBuffer());

    const uploadResult = await uploadMediaBuffer(
      buffer,
      fileValue.name
    );

    const cloudinaryResourceType = normalizeResourceType(
      uploadResult.resource_type
    );

    const mediaAsset = await MediaAssetModel.create({
      affiliateProductId: affiliateProductId || undefined,
      originalFileName: fileValue.name,
      storedFileName: uploadResult.public_id,
      fileUrl: uploadResult.secure_url,
      mediaType: determineMediaType({
        mimeType: fileValue.type,
        resourceType: cloudinaryResourceType,
      }),
      mimeType: fileValue.type,
      sizeBytes: fileValue.size,
      title: getText(formData, "title") || fileValue.name,
      description: getText(formData, "description"),
      suggestedCaption: "",
      suggestedHashtags: [],
      status: affiliateProductId ? "attached" : "uploaded",
      storageProvider: "cloudinary",
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryAssetId: uploadResult.asset_id || "",
      cloudinaryResourceType,
      cloudinaryFormat: uploadResult.format || "",
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
    });

    return Response.json(
      {
        ok: true,
        mediaAsset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to upload media:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}