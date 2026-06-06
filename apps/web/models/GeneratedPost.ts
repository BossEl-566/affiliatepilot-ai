import mongoose, { Schema, type InferSchemaType } from "mongoose";

const GeneratedPostSchema = new Schema(
  {
    affiliateProductId: {
      type: Schema.Types.ObjectId,
      ref: "AffiliateProduct",
      required: true,
      index: true,
    },
    
    mediaAssetId: {
      type: Schema.Types.ObjectId,
      ref: "MediaAsset",
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
      ],
      required: true,
    },

    format: {
      type: String,
      enum: [
        "short_video",
        "image_post",
        "carousel",
        "text_post",
        "thread",
        "pin",
      ],
      default: "text_post",
    },

    title: {
      type: String,
      default: "",
    },

    hook: {
      type: String,
      default: "",
    },

    caption: {
      type: String,
      default: "",
    },

    script: {
      type: String,
      default: "",
    },

    hashtags: {
      type: [String],
      default: [],
    },

    callToAction: {
      type: String,
      default: "",
    },
    

    status: {
      type: String,
      enum: ["draft", "approved", "scheduled", "published", "failed"],
      default: "draft",
    },

    riskNotes: {
      type: [String],
      default: [],
    },

    scheduledAt: {
      type: Date,
    },

    publishedAt: {
      type: Date,
    },
    telegramMessageId: {
  type: Number,
},

telegramChatId: {
  type: String,
  default: "",
},

telegramPublishedAt: {
  type: Date,
},

telegramError: {
  type: String,
  default: "",
},

    platformPostId: {
      type: String,
      default: "",
    },

    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export type GeneratedPost = InferSchemaType<typeof GeneratedPostSchema>;

export const GeneratedPostModel =
  mongoose.models.GeneratedPost ||
  mongoose.model("GeneratedPost", GeneratedPostSchema);