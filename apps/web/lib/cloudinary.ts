import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from "cloudinary";

export type CloudinaryResourceType = "image" | "video" | "raw";

function assertCloudinaryConfiguration() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not configured.");
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    throw new Error("CLOUDINARY_API_KEY is not configured.");
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error("CLOUDINARY_API_SECRET is not configured.");
  }
}

function configureCloudinary() {
  assertCloudinaryConfiguration();

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadMediaBuffer(
  buffer: Buffer,
  originalFileName: string
): Promise<UploadApiResponse> {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "affiliatepilot-ai/media",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: originalFileName,
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) {
          reject(new Error(error.message));
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload did not return a result."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteCloudinaryMedia(
  publicId: string,
  resourceType: CloudinaryResourceType
) {
  configureCloudinary();

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}