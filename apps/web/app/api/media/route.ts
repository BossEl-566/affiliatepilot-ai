import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { MediaAssetModel } from "@/models/MediaAsset";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function getMediaType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "document";

  return "unknown";
}

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension) return extension;

  return "";
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function createSuggestedCaption(input: {
  title?: string;
  mediaType: string;
  originalFileName: string;
}) {
  const title = input.title || input.originalFileName;

  if (input.mediaType === "video") {
    return `Here is a quick breakdown from this video: ${title}. Watch it, understand the value, and only take action if it fits your goal.`;
  }

  if (input.mediaType === "image") {
    return `A quick visual breakdown: ${title}. Save this and review the details before making a decision.`;
  }

  return `Resource uploaded: ${title}. Review the details and use it as part of your campaign.`;
}

function createSuggestedHashtags(mediaType: string) {
  const base = ["AffiliateMarketing", "DigitalSkills", "OnlineBusiness"];

  if (mediaType === "video") {
    base.push("ShortVideo", "ContentMarketing");
  }

  if (mediaType === "image") {
    base.push("VisualMarketing", "SocialMediaMarketing");
  }

  return base;
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const query =
      productId && isValidObjectId(productId)
        ? { affiliateProductId: productId }
        : {};

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

    const file = formData.get("file");
    const title = String(formData.get("title") || "");
    const description = String(formData.get("description") || "");
    const affiliateProductId = String(formData.get("affiliateProductId") || "");

    if (!(file instanceof File)) {
      return Response.json(
        {
          ok: false,
          error: "File is required.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        {
          ok: false,
          error: "File is too large. Maximum size is 50MB for now.",
        },
        { status: 400 }
      );
    }

    if (affiliateProductId && !isValidObjectId(affiliateProductId)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid affiliate product ID.",
        },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const mediaType = getMediaType(mimeType);

    if (mediaType === "unknown") {
      return Response.json(
        {
          ok: false,
          error: "Unsupported file type. Upload an image, video, or PDF.",
        },
        { status: 400 }
      );
    }

    const extension = getFileExtension(file.name);
    const storedFileName = `${randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, storedFileName);

    await mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${storedFileName}`;

    const mediaAsset = await MediaAssetModel.create({
      affiliateProductId: affiliateProductId || undefined,
      originalFileName: file.name,
      storedFileName,
      fileUrl,
      mediaType,
      mimeType,
      sizeBytes: file.size,
      title,
      description,
      suggestedCaption: createSuggestedCaption({
        title,
        mediaType,
        originalFileName: file.name,
      }),
      suggestedHashtags: createSuggestedHashtags(mediaType),
      status: affiliateProductId ? "attached" : "uploaded",
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