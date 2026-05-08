import mongoose, { Schema, type InferSchemaType } from "mongoose";

const MessageTemplateSchema = new Schema(
  {
    affiliateProductId: {
      type: Schema.Types.ObjectId,
      ref: "AffiliateProduct",
      required: false,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    platform: {
      type: String,
      enum: [
        "instagram",
        "facebook",
        "tiktok",
        "youtube",
        "pinterest",
        "telegram",
        "x",
        "whatsapp",
        "website",
        "other",
      ],
      default: "other",
      index: true,
    },

    category: {
      type: String,
      enum: [
        "first_reply",
        "product_details",
        "objection_handling",
        "follow_up",
        "closing",
        "after_purchase",
        "custom",
      ],
      default: "custom",
      index: true,
    },

    tone: {
      type: String,
      enum: ["friendly", "professional", "casual", "direct"],
      default: "professional",
    },

    body: {
      type: String,
      required: true,
    },

    variables: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export type MessageTemplate = InferSchemaType<typeof MessageTemplateSchema>;

export const MessageTemplateModel =
  mongoose.models.MessageTemplate ||
  mongoose.model("MessageTemplate", MessageTemplateSchema);