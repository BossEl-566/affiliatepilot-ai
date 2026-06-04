import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SaleSchema = new Schema(
  {
    affiliateProductId: {
      type: Schema.Types.ObjectId,
      ref: "AffiliateProduct",
      required: true,
      index: true,
    },

    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
      index: true,
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

    customerName: {
      type: String,
      default: "",
      trim: true,
    },

    currency: {
      type: String,
      default: "GHS",
      trim: true,
    },

    saleAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    commissionEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "refunded", "cancelled"],
      default: "confirmed",
      index: true,
    },

    notes: {
      type: String,
      default: "",
    },

    soldAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export type Sale = InferSchemaType<typeof SaleSchema>;

export const SaleModel =
  mongoose.models.Sale || mongoose.model("Sale", SaleSchema);