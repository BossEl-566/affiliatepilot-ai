import mongoose, { Schema, type InferSchemaType } from "mongoose";

const MediaAssetSchema = new Schema(
  {
    affiliateProductId: {
      type: Schema.Types.ObjectId,
      ref: "AffiliateProduct",
      required: false,
      index: true,
    },

    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },

    storedFileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video", "document", "unknown"],
      default: "unknown",
      index: true,
    },

    mimeType: {
      type: String,
      default: "",
    },

    sizeBytes: {
      type: Number,
      default: 0,
      min: 0,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    suggestedCaption: {
      type: String,
      default: "",
    },

    suggestedHashtags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["uploaded", "attached", "archived"],
      default: "uploaded",
      index: true,
    },

    storageProvider: {
      type: String,
      enum: ["cloudinary", "local"],
      default: "cloudinary",
      index: true,
    },

    cloudinaryPublicId: {
      type: String,
      default: "",
      index: true,
    },

    cloudinaryAssetId: {
      type: String,
      default: "",
    },

    cloudinaryResourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "image",
    },

    cloudinaryFormat: {
      type: String,
      default: "",
    },

    width: {
      type: Number,
    },

    height: {
      type: Number,
    },

    duration: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export type MediaAsset = InferSchemaType<typeof MediaAssetSchema>;

export const MediaAssetModel =
  mongoose.models.MediaAsset ||
  mongoose.model("MediaAsset", MediaAssetSchema);