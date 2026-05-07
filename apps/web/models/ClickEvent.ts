import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ClickEventSchema = new Schema(
  {
    affiliateProductId: {
      type: Schema.Types.ObjectId,
      ref: "AffiliateProduct",
      required: true,
      index: true,
    },

    generatedPostId: {
      type: Schema.Types.ObjectId,
      ref: "GeneratedPost",
      required: false,
      index: true,
    },

    trackingCode: {
      type: String,
      required: true,
      index: true,
    },

    destinationUrl: {
      type: String,
      required: true,
    },

    platform: {
      type: String,
      default: "",
      index: true,
    },

    referrer: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export type ClickEvent = InferSchemaType<typeof ClickEventSchema>;

export const ClickEventModel =
  mongoose.models.ClickEvent || mongoose.model("ClickEvent", ClickEventSchema);