import { GoogleGenAI } from "@google/genai";

const SUPPORTED_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "telegram",
  "pinterest",
  "x",
] as const;

const SUPPORTED_FORMATS = [
  "short_video",
  "image_post",
  "carousel",
  "text_post",
  "thread",
  "pin",
] as const;

type CampaignPlatform = (typeof SUPPORTED_PLATFORMS)[number];
type CampaignFormat = (typeof SUPPORTED_FORMATS)[number];

type AiMode = "gemini" | "fallback";

type AiResult<T> = {
  data: T;
  mode: AiMode;
  warning?: string;
};

export type AffiliateProductInput = {
  name?: string;
  platformName?: string;
  category?: string;
  targetAudience?: string;
  currency?: string;
  price?: number;
  commissionType?: "percentage" | "fixed" | "unknown";
  commissionValue?: number;
  productSummary?: string;
  buyerPersona?: string;
  painPoints?: string[];
  objections?: string[];
  allowedChannels?: string[];
  bannedClaims?: string[];
  contentAngles?: string[];
  recommendedPlatforms?: string[];
};

export type ProductAnalysis = {
  productSummary: string;
  buyerPersona: string;
  painPoints: string[];
  objections: string[];
  allowedChannels: string[];
  bannedClaims: string[];
  contentAngles: string[];
  recommendedPlatforms: string[];
  analysisNotes: string;
  trustScore: number;
  riskScore: number;
};

export type CampaignDraft = {
  platform: CampaignPlatform;
  format: CampaignFormat;
  title: string;
  hook: string;
  caption: string;
  script: string;
  hashtags: string[];
  callToAction: string;
  riskNotes: string[];
};

export type LeadInput = {
  name?: string;
  username?: string;
  platform?: string;
  source?: string;
  message?: string;
  notes?: string;
  interestLevel?: number;
  status?: string;
};

export type LeadReplySuggestion = {
  reply: string;
  followUpQuestion: string;
  riskNotes: string[];
};

const productAnalysisSchema = {
  type: "object",
  properties: {
    productSummary: {
      type: "string",
      description: "Clear and accurate summary of the affiliate product.",
    },
    buyerPersona: {
      type: "string",
      description: "Description of the likely buyer without inventing facts.",
    },
    painPoints: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8,
    },
    objections: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8,
    },
    allowedChannels: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 8,
    },
    bannedClaims: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 10,
    },
    contentAngles: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 10,
    },
    recommendedPlatforms: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "instagram",
          "facebook",
          "tiktok",
          "youtube",
          "telegram",
          "pinterest",
          "x",
        ],
      },
      minItems: 3,
      maxItems: 7,
    },
    analysisNotes: {
      type: "string",
    },
    trustScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    riskScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
  },
  required: [
    "productSummary",
    "buyerPersona",
    "painPoints",
    "objections",
    "allowedChannels",
    "bannedClaims",
    "contentAngles",
    "recommendedPlatforms",
    "analysisNotes",
    "trustScore",
    "riskScore",
  ],
};

const campaignSchema = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          platform: {
            type: "string",
            enum: [
              "instagram",
              "facebook",
              "tiktok",
              "youtube",
              "telegram",
              "pinterest",
              "x",
            ],
          },
          format: {
            type: "string",
            enum: [
              "short_video",
              "image_post",
              "carousel",
              "text_post",
              "thread",
              "pin",
            ],
          },
          title: { type: "string" },
          hook: { type: "string" },
          caption: { type: "string" },
          script: { type: "string" },
          hashtags: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 8,
          },
          callToAction: { type: "string" },
          riskNotes: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5,
          },
        },
        required: [
          "platform",
          "format",
          "title",
          "hook",
          "caption",
          "script",
          "hashtags",
          "callToAction",
          "riskNotes",
        ],
      },
    },
  },
  required: ["posts"],
};

const leadReplySchema = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description: "Short professional reply to send to the lead.",
    },
    followUpQuestion: {
      type: "string",
      description: "A helpful question that moves the conversation forward.",
    },
    riskNotes: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
  },
  required: ["reply", "followUpQuestion", "riskNotes"],
};

function getProvider() {
  return String(process.env.AI_PROVIDER || "fallback").toLowerCase();
}

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
}

function hasGeminiConfiguration() {
  return getProvider() === "gemini" && Boolean(process.env.GEMINI_API_KEY);
}

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({
    apiKey,
  });
}

export function getAiRuntimeStatus() {
  return {
    provider: getProvider(),
    configured: hasGeminiConfiguration(),
    mode: hasGeminiConfiguration() ? "gemini" : "fallback",
    model: getModel(),
  };
}

function cleanString(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;

  return value.trim() || fallback;
}

function cleanStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

  const values = value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .map((item) => item.replace(/^#/, ""));

  return Array.from(new Set(values));
}

function clampScore(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function isPlatform(value: unknown): value is CampaignPlatform {
  return SUPPORTED_PLATFORMS.includes(value as CampaignPlatform);
}

function isFormat(value: unknown): value is CampaignFormat {
  return SUPPORTED_FORMATS.includes(value as CampaignFormat);
}

function createProductPromptPayload(product: AffiliateProductInput) {
  return {
    name: product.name || "",
    platformName: product.platformName || "",
    category: product.category || "",
    targetAudience: product.targetAudience || "",
    currency: product.currency || "",
    price: product.price || 0,
    commissionType: product.commissionType || "unknown",
    commissionValue: product.commissionValue || 0,
    productSummary: product.productSummary || "",
    buyerPersona: product.buyerPersona || "",
    painPoints: product.painPoints || [],
    objections: product.objections || [],
    allowedChannels: product.allowedChannels || [],
    bannedClaims: product.bannedClaims || [],
    contentAngles: product.contentAngles || [],
    recommendedPlatforms: product.recommendedPlatforms || [],
  };
}

async function requestStructuredJson<T>(input: {
  prompt: string;
  schema: Record<string, unknown>;
}) {
  const client = createGeminiClient();

  const response = await client.models.generateContent({
    model: getModel(),
    contents: input.prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: input.schema as never,
    },
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(response.text) as T;
}

function createFallbackAnalysis(
  product: AffiliateProductInput
): ProductAnalysis {
  const name = product.name || "This product";
  const category = product.category || "digital product";

  return {
    productSummary: `${name} is a ${category}. Explain the offer clearly, show the practical value, and encourage buyers to review the full details before deciding.`,

    buyerPersona:
      product.targetAudience ||
      "People seeking a practical solution who need a clear explanation before making a purchasing decision.",

    painPoints: [
      "The buyer may not understand exactly what the offer includes.",
      "The buyer may be unsure whether the product suits their goal.",
      "The buyer may be concerned about value for money.",
      "The buyer may need a beginner-friendly explanation.",
    ],

    objections: [
      "What exactly will I receive after buying?",
      "Is the product suitable for a beginner?",
      "Is the offer worth the price?",
      "How can I verify the product details?",
    ],

    allowedChannels: [
      "Educational posts",
      "Short-form videos",
      "Telegram posts",
      "Opt-in direct replies",
      "Website content",
    ],

    bannedClaims: [
      "Guaranteed income",
      "Guaranteed results",
      "Instant success",
      "Risk-free profit",
      "False scarcity",
      "Unverified testimonials",
    ],

    contentAngles: [
      `Explain what ${name} includes.`,
      "Create a beginner-friendly breakdown.",
      "Answer common buyer questions.",
      "Share an honest checklist before purchase.",
      "Explain who the product is suitable for.",
      "Create a practical pros-and-cons post.",
    ],

    recommendedPlatforms: [
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
      "telegram",
      "x",
    ],

    analysisNotes:
      "Local fallback analysis generated. Verify every product claim before publishing.",

    trustScore: 55,
    riskScore: 35,
  };
}

function normalizeAnalysis(
  raw: Partial<ProductAnalysis>,
  fallback: ProductAnalysis
): ProductAnalysis {
  return {
    productSummary: cleanString(raw.productSummary, fallback.productSummary),

    buyerPersona: cleanString(raw.buyerPersona, fallback.buyerPersona),

    painPoints: cleanStringArray(raw.painPoints, fallback.painPoints),

    objections: cleanStringArray(raw.objections, fallback.objections),

    allowedChannels: cleanStringArray(
      raw.allowedChannels,
      fallback.allowedChannels
    ),

    bannedClaims: cleanStringArray(raw.bannedClaims, fallback.bannedClaims),

    contentAngles: cleanStringArray(raw.contentAngles, fallback.contentAngles),

    recommendedPlatforms: cleanStringArray(
      raw.recommendedPlatforms,
      fallback.recommendedPlatforms
    ),

    analysisNotes: cleanString(raw.analysisNotes, fallback.analysisNotes),

    trustScore: clampScore(raw.trustScore, fallback.trustScore),

    riskScore: clampScore(raw.riskScore, fallback.riskScore),
  };
}

export async function analyzeAffiliateProduct(
  product: AffiliateProductInput
): Promise<AiResult<ProductAnalysis>> {
  const fallback = createFallbackAnalysis(product);

  if (!hasGeminiConfiguration()) {
    return {
      data: fallback,
      mode: "fallback",
    };
  }

  try {
    const raw = await requestStructuredJson<Partial<ProductAnalysis>>({
      schema: productAnalysisSchema,

      prompt: `
You are an ethical affiliate-marketing product analyst.

Analyze the product information below.

Rules:
- Use only the supplied product data.
- Do not invent product features.
- Do not promise guaranteed income or guaranteed outcomes.
- Identify claims that the marketer should avoid.
- Recommend education-first content.
- Return a practical analysis for a solo affiliate marketer.

Product data:
${JSON.stringify(createProductPromptPayload(product), null, 2)}
      `.trim(),
    });

    return {
      data: normalizeAnalysis(raw, fallback),
      mode: "gemini",
    };
  } catch (error) {
    console.error("Gemini product analysis failed:", error);

    return {
      data: fallback,
      mode: "fallback",
      warning:
        "Gemini analysis failed, so the local fallback analyzer was used.",
    };
  }
}

function createFallbackCampaignDrafts(
  product: AffiliateProductInput
): CampaignDraft[] {
  const name = product.name || "the product";

  const risks = [
    "Verify product details before publishing.",
    "Avoid guarantees, exaggerated claims, and false urgency.",
  ];

  return [
    {
      platform: "instagram",
      format: "carousel",
      title: `${name}: what to know before deciding`,
      hook: `Thinking about ${name}? Start with these key questions.`,
      caption: `Before buying ${name}, check what the offer includes, who it is designed for, and whether it matches your actual goal.`,
      script: "",
      hashtags: ["AffiliateMarketing", "DigitalProducts", "SmartBuying"],
      callToAction: "Review the details and decide whether it fits your goal.",
      riskNotes: risks,
    },

    {
      platform: "facebook",
      format: "text_post",
      title: `A simple breakdown of ${name}`,
      hook: `Not every product is right for everyone.`,
      caption: `Before deciding, understand the offer, compare the value with the price, and review the full product information.`,
      script: "",
      hashtags: ["AffiliateMarketing", "DigitalSkills", "OnlineBusiness"],
      callToAction: "Send a message if you need a simple breakdown.",
      riskNotes: risks,
    },

    {
      platform: "tiktok",
      format: "short_video",
      title: `${name}: beginner breakdown`,
      hook: `Before buying ${name}, check these three things.`,
      caption: `A short checklist to help you make an informed decision.`,
      script: `Opening: Before buying ${name}, check these three things.\n\n1. What exactly does the offer include?\n2. Is it suitable for your current goal?\n3. Does the value justify the price?\n\nClosing: Review the full details before deciding.`,
      hashtags: ["TikTokTips", "DigitalProducts", "AffiliateMarketing"],
      callToAction: "Check the details if it fits your goal.",
      riskNotes: risks,
    },

    {
      platform: "youtube",
      format: "short_video",
      title: `${name}: three questions to ask`,
      hook: `Ask these questions before deciding whether ${name} is right for you.`,
      caption: `A quick buyer checklist for anyone considering ${name}.`,
      script: `Question 1: What problem does the offer address?\nQuestion 2: What will you receive?\nQuestion 3: Does it fit your goal?\n\nReview the details before purchasing.`,
      hashtags: ["YouTubeShorts", "DigitalProducts", "AffiliateMarketing"],
      callToAction: "Review the offer details before deciding.",
      riskNotes: risks,
    },

    {
      platform: "telegram",
      format: "text_post",
      title: `${name}: quick product note`,
      hook: `Here is a quick checklist for anyone considering ${name}.`,
      caption: `Confirm what the offer includes, who it is for, and whether it aligns with your goal before purchasing.`,
      script: "",
      hashtags: ["DigitalProducts", "AffiliateMarketing"],
      callToAction: "Open the link to review the full details.",
      riskNotes: risks,
    },

    {
      platform: "pinterest",
      format: "pin",
      title: `${name} decision checklist`,
      hook: `Save this checklist before reviewing ${name}.`,
      caption: `Understand the offer, check audience fit, compare price and value, then verify the details before deciding.`,
      script: "",
      hashtags: ["DigitalProducts", "OnlineBusiness", "SmartBuying"],
      callToAction: "Save this checklist and review the full details.",
      riskNotes: risks,
    },

    {
      platform: "x",
      format: "thread",
      title: `${name}: buyer checklist`,
      hook: `Before buying ${name}, ask these simple questions.`,
      caption: `1. What does the product include?\n2. Who is it for?\n3. Does it match your goal?\n4. Is the offer clear?\n5. Have you reviewed the full details?`,
      script: "",
      hashtags: ["AffiliateMarketing", "DigitalProducts"],
      callToAction: "Review the product details before deciding.",
      riskNotes: risks,
    },
  ];
}

function normalizeCampaignDraft(
  raw: Partial<CampaignDraft>,
  fallback: CampaignDraft
): CampaignDraft {
  return {
    platform: isPlatform(raw.platform) ? raw.platform : fallback.platform,

    format: isFormat(raw.format) ? raw.format : fallback.format,

    title: cleanString(raw.title, fallback.title),

    hook: cleanString(raw.hook, fallback.hook),

    caption: cleanString(raw.caption, fallback.caption),

    script: cleanString(raw.script, fallback.script),

    hashtags: cleanStringArray(raw.hashtags, fallback.hashtags),

    callToAction: cleanString(raw.callToAction, fallback.callToAction),

    riskNotes: cleanStringArray(raw.riskNotes, fallback.riskNotes),
  };
}

export async function generateCampaignDrafts(
  product: AffiliateProductInput
): Promise<AiResult<CampaignDraft[]>> {
  const fallbackPosts = createFallbackCampaignDrafts(product);

  if (!hasGeminiConfiguration()) {
    return {
      data: fallbackPosts,
      mode: "fallback",
    };
  }

  try {
    const raw = await requestStructuredJson<{
      posts?: Array<Partial<CampaignDraft>>;
    }>({
      schema: campaignSchema,

      prompt: `
You are an ethical affiliate-marketing content strategist.

Create exactly seven platform-specific campaign drafts using only the product
data supplied below.

Required platforms:
instagram, facebook, tiktok, youtube, telegram, pinterest, x

Rules:
- Make each platform post meaningfully different.
- Use an education-first approach.
- Do not invent product features.
- Do not promise guaranteed income or guaranteed results.
- Avoid false urgency and misleading claims.
- TikTok and YouTube must include a useful short-video script.
- Hashtags must not include the # symbol.

Product data:
${JSON.stringify(createProductPromptPayload(product), null, 2)}
      `.trim(),
    });

    const rawPosts = Array.isArray(raw.posts) ? raw.posts : [];

    const mergedPosts = fallbackPosts.map((fallback) => {
      const matchingPost = rawPosts.find(
        (post) => post.platform === fallback.platform
      );

      return matchingPost
        ? normalizeCampaignDraft(matchingPost, fallback)
        : fallback;
    });

    return {
      data: mergedPosts,
      mode: "gemini",
    };
  } catch (error) {
    console.error("Gemini campaign generation failed:", error);

    return {
      data: fallbackPosts,
      mode: "fallback",
      warning:
        "Gemini campaign generation failed, so local fallback drafts were used.",
    };
  }
}

function createFallbackLeadReply(input: {
  lead: LeadInput;
  product?: AffiliateProductInput | null;
}): LeadReplySuggestion {
  const name =
    input.lead.name || input.lead.username || "there";

  const productName = input.product?.name || "the product";

  return {
    reply: `Hi ${name}, thanks for reaching out about ${productName}. I can share a clear breakdown of what the offer includes so you can decide whether it fits your goal. Please review the details carefully before making a decision.`,

    followUpQuestion:
      "What specific goal are you hoping the product will help you with?",

    riskNotes: [
      "Do not promise results.",
      "Answer the lead’s question before sharing a link.",
      "Avoid pressure tactics.",
    ],
  };
}

export async function generateLeadReply(input: {
  lead: LeadInput;
  product?: AffiliateProductInput | null;
}): Promise<AiResult<LeadReplySuggestion>> {
  const fallback = createFallbackLeadReply(input);

  if (!hasGeminiConfiguration()) {
    return {
      data: fallback,
      mode: "fallback",
    };
  }

  try {
    const raw = await requestStructuredJson<Partial<LeadReplySuggestion>>({
      schema: leadReplySchema,

      prompt: `
You are an ethical affiliate-marketing support assistant.

Write a concise, professional reply to the lead using only the information
provided below.

Rules:
- Be helpful and conversational.
- Address the lead's question when possible.
- Do not invent facts about the product.
- Do not pressure the lead.
- Do not promise income or guaranteed results.
- Include one useful follow-up question.

Lead and product data:
${JSON.stringify(
  {
    lead: {
      name: input.lead.name || "",
      username: input.lead.username || "",
      platform: input.lead.platform || "",
      source: input.lead.source || "",
      message: input.lead.message || "",
      notes: input.lead.notes || "",
      interestLevel: input.lead.interestLevel || 1,
      status: input.lead.status || "new",
    },
    product: createProductPromptPayload(input.product || {}),
  },
  null,
  2
)}
      `.trim(),
    });

    return {
      data: {
        reply: cleanString(raw.reply, fallback.reply),

        followUpQuestion: cleanString(
          raw.followUpQuestion,
          fallback.followUpQuestion
        ),

        riskNotes: cleanStringArray(raw.riskNotes, fallback.riskNotes),
      },

      mode: "gemini",
    };
  } catch (error) {
    console.error("Gemini lead reply generation failed:", error);

    return {
      data: fallback,
      mode: "fallback",
      warning:
        "Gemini lead reply generation failed, so a local fallback reply was used.",
    };
  }
}

export type TelegramWeeklyPlanItem = {
  dayNumber: number;
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  riskNotes: string[];
};

const telegramWeeklyPlanSchema = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          dayNumber: {
            type: "integer",
            minimum: 1,
            maximum: 7,
          },
          title: {
            type: "string",
          },
          hook: {
            type: "string",
          },
          caption: {
            type: "string",
          },
          hashtags: {
            type: "array",
            items: {
              type: "string",
            },
            minItems: 2,
            maxItems: 6,
          },
          callToAction: {
            type: "string",
          },
          riskNotes: {
            type: "array",
            items: {
              type: "string",
            },
            minItems: 1,
            maxItems: 4,
          },
        },
        required: [
          "dayNumber",
          "title",
          "hook",
          "caption",
          "hashtags",
          "callToAction",
          "riskNotes",
        ],
      },
    },
  },
  required: ["posts"],
};

function createFallbackTelegramWeeklyPlan(
  product: AffiliateProductInput
): TelegramWeeklyPlanItem[] {
  const name = product.name || "the product";

  const riskNotes = [
    "Verify product details before publishing.",
    "Avoid guarantees, exaggerated claims, and false urgency.",
  ];

  return [
    {
      dayNumber: 1,
      title: `${name}: a simple introduction`,
      hook: `Before deciding whether ${name} fits your goal, start with the basics.`,
      caption: `${name} may be useful for the right person, but the first step is understanding the offer clearly. Review what it includes, who it is designed for, and whether it matches your current goal.`,
      hashtags: ["DigitalProducts", "AffiliateMarketing", "SmartBuying"],
      callToAction: "Review the full details before making a decision.",
      riskNotes,
    },

    {
      dayNumber: 2,
      title: `${name}: who is it for?`,
      hook: `Not every product is suitable for everyone.`,
      caption: `Before considering ${name}, ask whether it fits your current situation. Look at your goal, your experience level, the price, and what the product includes.`,
      hashtags: ["OnlineBusiness", "DigitalProducts", "LearnOnline"],
      callToAction: "Check the details and decide whether the offer fits you.",
      riskNotes,
    },

    {
      dayNumber: 3,
      title: `Three questions to ask before buying ${name}`,
      hook: `Use this quick checklist before spending money.`,
      caption: `1. What exactly will you receive?\n2. Does it match your current goal?\n3. Is the value clear enough for the price?\n\nA good purchase decision starts with clear information.`,
      hashtags: ["SmartBuying", "DigitalSkills", "OnlineLearning"],
      callToAction: "Open the link to review the full product information.",
      riskNotes,
    },

    {
      dayNumber: 4,
      title: `${name}: beginner checklist`,
      hook: `Are you considering ${name} as a beginner?`,
      caption: `Take time to understand the offer before deciding. Check whether the instructions are suitable for your current experience level and whether the product addresses the problem you want to solve.`,
      hashtags: ["BeginnerTips", "DigitalProducts", "AffiliateMarketing"],
      callToAction: "Send a message if you need a simple breakdown.",
      riskNotes,
    },

    {
      dayNumber: 5,
      title: `${name}: avoid rushed decisions`,
      hook: `Do not buy a digital product only because of pressure.`,
      caption: `Review the offer carefully. Look at what is included, compare the price with the expected value, and decide whether it matches your needs. Avoid making decisions based on hype alone.`,
      hashtags: ["SmartBuying", "DigitalProducts", "OnlineBusiness"],
      callToAction: "Review the details carefully before deciding.",
      riskNotes,
    },

    {
      dayNumber: 6,
      title: `${name}: common buyer questions`,
      hook: `Here are a few questions worth asking before purchasing.`,
      caption: `Is the offer suitable for beginners?\nWhat exactly is included?\nDoes it match your goal?\nIs the product information clear?\n\nThese questions can help you make a more informed decision.`,
      hashtags: ["DigitalProducts", "BuyerTips", "AffiliateMarketing"],
      callToAction: "Check the product information for the complete breakdown.",
      riskNotes,
    },

    {
      dayNumber: 7,
      title: `${name}: final review checklist`,
      hook: `Before deciding, run through this final checklist.`,
      caption: `✅ Understand the offer\n✅ Check whether it fits your goal\n✅ Compare the price with the value\n✅ Read the details carefully\n✅ Ask questions when something is unclear`,
      hashtags: ["SmartBuying", "DigitalProducts", "OnlineLearning"],
      callToAction: "Open the link if you are ready to review the details.",
      riskNotes,
    },
  ];
}

function normalizeTelegramWeeklyPlanItem(
  raw: Partial<TelegramWeeklyPlanItem>,
  fallback: TelegramWeeklyPlanItem
): TelegramWeeklyPlanItem {
  return {
    dayNumber:
      Number.isInteger(raw.dayNumber) &&
      Number(raw.dayNumber) >= 1 &&
      Number(raw.dayNumber) <= 7
        ? Number(raw.dayNumber)
        : fallback.dayNumber,

    title: cleanString(raw.title, fallback.title),

    hook: cleanString(raw.hook, fallback.hook),

    caption: cleanString(raw.caption, fallback.caption),

    hashtags: cleanStringArray(raw.hashtags, fallback.hashtags),

    callToAction: cleanString(raw.callToAction, fallback.callToAction),

    riskNotes: cleanStringArray(raw.riskNotes, fallback.riskNotes),
  };
}

export async function generateTelegramWeeklyPlan(
  product: AffiliateProductInput
): Promise<AiResult<TelegramWeeklyPlanItem[]>> {
  const fallbackPosts = createFallbackTelegramWeeklyPlan(product);

  if (!hasGeminiConfiguration()) {
    return {
      data: fallbackPosts,
      mode: "fallback",
    };
  }

  try {
    const raw = await requestStructuredJson<{
      posts?: Array<Partial<TelegramWeeklyPlanItem>>;
    }>({
      schema: telegramWeeklyPlanSchema,

      prompt: `
You are an ethical affiliate-marketing Telegram content strategist.

Create exactly seven Telegram channel posts for the affiliate product below.
Each post will be published on a different day.

Rules:
- Use only the supplied product information.
- Create a meaningful seven-day content sequence.
- Make each post different.
- Use concise Telegram-friendly writing.
- Use an education-first approach.
- Do not invent product features.
- Do not promise income or guaranteed outcomes.
- Do not use fake testimonials.
- Do not use false urgency.
- Hashtags must not include the # symbol.
- Day numbers must be 1 through 7.

Suggested sequence:
Day 1: introduction
Day 2: audience fit
Day 3: checklist
Day 4: beginner-friendly explanation
Day 5: objection handling
Day 6: frequently asked questions
Day 7: final review and CTA

Product data:
${JSON.stringify(createProductPromptPayload(product), null, 2)}
      `.trim(),
    });

    const rawPosts = Array.isArray(raw.posts) ? raw.posts : [];

    const mergedPosts = fallbackPosts.map((fallbackPost) => {
      const matchingPost = rawPosts.find(
        (post) => Number(post.dayNumber) === fallbackPost.dayNumber
      );

      return matchingPost
        ? normalizeTelegramWeeklyPlanItem(matchingPost, fallbackPost)
        : fallbackPost;
    });

    return {
      data: mergedPosts,
      mode: "gemini",
    };
  } catch (error) {
    console.error("Gemini Telegram weekly-plan generation failed:", error);

    return {
      data: fallbackPosts,
      mode: "fallback",
      warning:
        "Gemini weekly-plan generation failed, so local fallback drafts were created.",
    };
  }
}
export type ProductLandingPageContent = {
  headline: string;
  subheadline: string;
  benefits: string[];
  whoItsFor: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  ctaLabel: string;
};

const productLandingPageSchema = {
  type: "object",
  properties: {
    headline: {
      type: "string",
    },

    subheadline: {
      type: "string",
    },

    benefits: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 3,
      maxItems: 6,
    },

    whoItsFor: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 3,
      maxItems: 6,
    },

    faq: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
          },

          answer: {
            type: "string",
          },
        },
        required: ["question", "answer"],
      },
    },

    ctaLabel: {
      type: "string",
    },
  },

  required: [
    "headline",
    "subheadline",
    "benefits",
    "whoItsFor",
    "faq",
    "ctaLabel",
  ],
};

function createFallbackProductLandingPage(
  product: AffiliateProductInput
): ProductLandingPageContent {
  const name = product.name || "This product";

  return {
    headline: `Is ${name} suitable for your goal?`,

    subheadline:
      "Review the product details, understand what the offer is designed to provide, and make an informed decision.",

    benefits: [
      "Review the offer before making a purchasing decision.",
      "Understand whether the product aligns with your current goal.",
      "Consider the value, price, and product details carefully.",
      "Ask questions when any part of the offer is unclear.",
    ],

    whoItsFor: [
      "People who want to review the offer before purchasing.",
      "People looking for a clear product breakdown.",
      "People comparing digital-product options carefully.",
    ],

    faq: [
      {
        question: "What should I check before purchasing?",
        answer:
          "Review the product details, price, intended audience, and what is included in the offer before deciding.",
      },

      {
        question: "Is this suitable for everyone?",
        answer:
          "Not necessarily. Consider your specific goal and review the full product information carefully.",
      },

      {
        question: "Are results guaranteed?",
        answer:
          "No. Avoid any product promotion that guarantees results. Review the offer and decide whether it is suitable for your situation.",
      },
    ],

    ctaLabel: "Review product details",
  };
}

function cleanFaqItems(
  value: unknown,
  fallback: ProductLandingPageContent["faq"]
) {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const candidate = item as {
        question?: unknown;
        answer?: unknown;
      };

      const question = cleanString(candidate.question);
      const answer = cleanString(candidate.answer);

      if (!question || !answer) return null;

      return {
        question,
        answer,
      };
    })
    .filter(
      (
        item
      ): item is {
        question: string;
        answer: string;
      } => Boolean(item)
    )
    .slice(0, 6);

  return cleaned.length >= 3 ? cleaned : fallback;
}

function normalizeProductLandingPage(
  raw: Partial<ProductLandingPageContent>,
  fallback: ProductLandingPageContent
): ProductLandingPageContent {
  return {
    headline: cleanString(raw.headline, fallback.headline),

    subheadline: cleanString(
      raw.subheadline,
      fallback.subheadline
    ),

    benefits: cleanStringArray(raw.benefits, fallback.benefits).slice(
      0,
      6
    ),

    whoItsFor: cleanStringArray(
      raw.whoItsFor,
      fallback.whoItsFor
    ).slice(0, 6),

    faq: cleanFaqItems(raw.faq, fallback.faq),

    ctaLabel: cleanString(raw.ctaLabel, fallback.ctaLabel),
  };
}

export async function generateProductLandingPage(
  product: AffiliateProductInput
): Promise<AiResult<ProductLandingPageContent>> {
  const fallback = createFallbackProductLandingPage(product);

  if (!hasGeminiConfiguration()) {
    return {
      data: fallback,
      mode: "fallback",
    };
  }

  try {
    const raw =
      await requestStructuredJson<Partial<ProductLandingPageContent>>({
        schema: productLandingPageSchema,

        prompt: `
You are an ethical affiliate-marketing landing-page writer.

Create a concise public landing page for the affiliate product below.

Rules:
- Use only the supplied product information.
- Do not invent product features.
- Do not promise income, guaranteed results, or instant success.
- Do not use fake testimonials.
- Do not use false urgency.
- Use clear, simple wording.
- Write for a buyer who needs enough information to decide whether to review
  the product offer.
- Keep the CTA factual and low-pressure.

Product data:
${JSON.stringify(createProductPromptPayload(product), null, 2)}
        `.trim(),
      });

    return {
      data: normalizeProductLandingPage(raw, fallback),
      mode: "gemini",
    };
  } catch (error) {
    console.error("Gemini landing-page generation failed:", error);

    return {
      data: fallback,
      mode: "fallback",
      warning:
        "Gemini landing-page generation failed, so a local fallback page was created.",
    };
  }
}

export type HookLabIdea = {
  platform: string;
  style: string;
  hook: string;
  captionStarter: string;
  callToAction: string;
};

const hookLabSchema = {
  type: "object",

  properties: {
    ideas: {
      type: "array",
      minItems: 12,
      maxItems: 12,

      items: {
        type: "object",

        properties: {
          style: {
            type: "string",
            enum: [
              "curiosity",
              "checklist",
              "problem_solution",
              "beginner",
              "myth_busting",
              "comparison",
              "question",
              "educational",
            ],
          },

          hook: {
            type: "string",
          },

          captionStarter: {
            type: "string",
          },

          callToAction: {
            type: "string",
          },
        },

        required: [
          "style",
          "hook",
          "captionStarter",
          "callToAction",
        ],
      },
    },
  },

  required: ["ideas"],
};

function createFallbackHookLabIdeas(
  product: AffiliateProductInput,
  platform: string
): HookLabIdea[] {
  const name = product.name || "this product";

  const rawIdeas = [
    {
      style: "curiosity",
      hook: `Before you spend money on ${name}, check these three things first.`,
      captionStarter: `A good product decision starts with understanding the offer clearly.`,
      callToAction: "Review the details before deciding.",
    },

    {
      style: "question",
      hook: `Is ${name} actually suitable for your goal?`,
      captionStarter: `Not every product is right for every person. Here is what to review first.`,
      callToAction: "Check the full breakdown.",
    },

    {
      style: "checklist",
      hook: `Use this quick checklist before buying ${name}.`,
      captionStarter: `Check the audience fit, price, value, and what the offer includes.`,
      callToAction: "Save this checklist and review the offer.",
    },

    {
      style: "beginner",
      hook: `Thinking about ${name} as a beginner? Start here.`,
      captionStarter: `You do not need to rush. First understand what the offer is designed to provide.`,
      callToAction: "Read the details carefully.",
    },

    {
      style: "problem_solution",
      hook: `The real question is not whether ${name} is popular. Does it solve your problem?`,
      captionStarter: `Focus on your actual goal instead of buying because of hype.`,
      callToAction: "Review whether the offer matches your need.",
    },

    {
      style: "myth_busting",
      hook: `You should not buy ${name} just because someone promises fast results.`,
      captionStarter: `Avoid exaggerated claims. A better approach is to understand the product properly.`,
      callToAction: "Make an informed decision.",
    },

    {
      style: "comparison",
      hook: `Before choosing ${name}, compare the price with the value.`,
      captionStarter: `Ask what you will receive and whether it aligns with your current goal.`,
      callToAction: "Open the product details.",
    },

    {
      style: "educational",
      hook: `Here is what to review before deciding whether ${name} is worth considering.`,
      captionStarter: `Start with the offer details, audience fit, and the problem it is designed to address.`,
      callToAction: "Read the full product information.",
    },

    {
      style: "question",
      hook: `What exactly will you receive after purchasing ${name}?`,
      captionStarter: `This is one of the most important questions to ask before buying any digital product.`,
      callToAction: "Review what the offer includes.",
    },

    {
      style: "checklist",
      hook: `Four questions to ask before buying ${name}.`,
      captionStarter: `What is included? Who is it for? Does it match your goal? Is the value clear?`,
      callToAction: "Check the full breakdown.",
    },

    {
      style: "curiosity",
      hook: `Most people skip this step before buying ${name}.`,
      captionStarter: `Take time to confirm whether the offer actually matches what you need.`,
      callToAction: "Review the details before deciding.",
    },

    {
      style: "problem_solution",
      hook: `Do not start with the product. Start with the problem you want to solve.`,
      captionStarter: `Then ask whether ${name} is genuinely suitable for that goal.`,
      callToAction: "Open the offer details.",
    },
  ];

  return rawIdeas.map((idea) => ({
    platform,
    ...idea,
  }));
}

function normalizeHookLabIdea(
  raw: Partial<HookLabIdea>,
  fallback: HookLabIdea,
  platform: string
): HookLabIdea {
  return {
    platform,

    style: cleanString(raw.style, fallback.style),

    hook: cleanString(raw.hook, fallback.hook),

    captionStarter: cleanString(
      raw.captionStarter,
      fallback.captionStarter
    ),

    callToAction: cleanString(
      raw.callToAction,
      fallback.callToAction
    ),
  };
}

export async function generateHookLabIdeas(
  product: AffiliateProductInput,
  platform: string
): Promise<AiResult<HookLabIdea[]>> {
  const fallbackIdeas = createFallbackHookLabIdeas(
    product,
    platform
  );

  if (!hasGeminiConfiguration()) {
    return {
      data: fallbackIdeas,
      mode: "fallback",
    };
  }

  try {
    const raw = await requestStructuredJson<{
      ideas?: Array<Partial<HookLabIdea>>;
    }>({
      schema: hookLabSchema,

      prompt: `
You are an ethical affiliate-marketing content strategist.

Create exactly 12 strong marketing hooks for ${platform}.

Use only the supplied product information.

Rules:
- Make each hook meaningfully different.
- Keep hooks concise and attention-grabbing.
- Use curiosity, questions, checklists, educational framing, comparison,
  beginner-friendly framing, and problem-solution angles.
- Do not invent product features.
- Do not promise income or guaranteed results.
- Do not use false scarcity.
- Do not use fake testimonials.
- Do not use deceptive clickbait.
- Each caption starter should naturally follow the hook.
- Each CTA should be factual and low pressure.

Product data:
${JSON.stringify(createProductPromptPayload(product), null, 2)}
      `.trim(),
    });

    const rawIdeas = Array.isArray(raw.ideas)
      ? raw.ideas
      : [];

    const ideas = fallbackIdeas.map((fallbackIdea, index) => {
      const generatedIdea = rawIdeas[index];

      return generatedIdea
        ? normalizeHookLabIdea(
            generatedIdea,
            fallbackIdea,
            platform
          )
        : fallbackIdea;
    });

    return {
      data: ideas,
      mode: "gemini",
    };
  } catch (error) {
    console.error("Gemini Hook Lab generation failed:", error);

    return {
      data: fallbackIdeas,
      mode: "fallback",
      warning:
        "Gemini Hook Lab generation failed, so local fallback hooks were created.",
    };
  }
}