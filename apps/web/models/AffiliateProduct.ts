import mongoose, { Schema, type InferSchemaType } from "mongoose";

const AffiliateProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    platformName: {
      type: String,
      trim: true,
      default: "",
    },

    affiliateUrl: {
      type: String,
      required: true,
      trim: true,
    },

    productUrl: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    targetAudience: {
      type: String,
      trim: true,
      default: "",
    },

    currency: {
      type: String,
      trim: true,
      default: "GHS",
    },

    price: {
      type: Number,
      default: 0,
    },

    commissionType: {
      type: String,
      enum: ["percentage", "fixed", "unknown"],
      default: "unknown",
    },

    commissionValue: {
      type: Number,
      default: 0,
    },

    productSummary: {
      type: String,
      default: "",
    },

    buyerPersona: {
      type: String,
      default: "",
    },

    painPoints: {
      type: [String],
      default: [],
    },

    objections: {
      type: [String],
      default: [],
    },

    allowedChannels: {
      type: [String],
      default: [],
    },

        bannedClaims: {
      type: [String],
      default: [],
    },

    contentAngles: {
      type: [String],
      default: [],
    },

    recommendedPlatforms: {
      type: [String],
      default: [],
    },

    analysisNotes: {
      type: String,
      default: "",
    },

    lastAnalyzedAt: {
      type: Date,
    },

    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["draft", "active", "paused", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

export type AffiliateProduct = InferSchemaType<typeof AffiliateProductSchema>;

export const AffiliateProductModel =
  mongoose.models.AffiliateProduct ||
  mongoose.model("AffiliateProduct", AffiliateProductSchema);