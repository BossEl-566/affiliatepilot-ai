import mongoose, { Schema, type InferSchemaType } from "mongoose";

const LeadSchema = new Schema(
  {
    affiliateProductId: {
      type: Schema.Types.ObjectId,
      ref: "AffiliateProduct",
      required: false,
      index: true,
    },

    generatedPostId: {
      type: Schema.Types.ObjectId,
      ref: "GeneratedPost",
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
        "website",
        "other",
      ],
      default: "other",
      index: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    username: {
      type: String,
      default: "",
      trim: true,
    },

    contact: {
      type: String,
      default: "",
      trim: true,
    },

    source: {
      type: String,
      default: "",
      trim: true,
    },

    message: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    interestLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "interested", "converted", "not_interested"],
      default: "new",
      index: true,
    },

    lastContactedAt: {
      type: Date,
    },

    convertedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export type Lead = InferSchemaType<typeof LeadSchema>;

export const LeadModel =
  mongoose.models.Lead || mongoose.model("Lead", LeadSchema);