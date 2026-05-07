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
  },
  {
    timestamps: true,
  }
);

export type MediaAsset = InferSchemaType<typeof MediaAssetSchema>;

export const MediaAssetModel =
  mongoose.models.MediaAsset || mongoose.model("MediaAsset", MediaAssetSchema);