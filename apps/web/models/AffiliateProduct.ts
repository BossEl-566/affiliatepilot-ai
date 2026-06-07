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

    trackingCode: {
  type: String,
  unique: true,
  sparse: true,
  index: true,
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
    landingPageEnabled: {
  type: Boolean,
  default: false,
  index: true,
},

landingHeadline: {
  type: String,
  default: "",
  trim: true,
},

landingSubheadline: {
  type: String,
  default: "",
  trim: true,
},

landingBenefits: {
  type: [String],
  default: [],
},

landingWhoItsFor: {
  type: [String],
  default: [],
},

landingFaq: {
  type: [
    {
      question: {
        type: String,
        required: true,
        trim: true,
      },

      answer: {
        type: String,
        required: true,
        trim: true,
      },
    },
  ],
  default: [],
},

landingCtaLabel: {
  type: String,
  default: "Review product details",
  trim: true,
},

landingDisclosure: {
  type: String,
  default:
    "Affiliate disclosure: I may earn a commission if you purchase through this link, at no additional cost to you.",
  trim: true,
},

landingLastGeneratedAt: {
  type: Date,
},

landingGenerationMode: {
  type: String,
  enum: ["gemini", "fallback", ""],
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