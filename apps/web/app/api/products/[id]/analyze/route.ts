import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function analyzeProduct(product: {
  name: string;
  platformName?: string;
  category?: string;
  targetAudience?: string;
  affiliateUrl: string;
  commissionType?: string;
  commissionValue?: number;
  price?: number;
}) {
  const name = product.name || "this product";
  const platform = product.platformName || "the affiliate platform";
  const category = product.category || "digital product";
  const audience =
    product.targetAudience ||
    "beginners, students, creators, and small business owners";

  const lowerText = `${name} ${platform} ${category} ${audience}`.toLowerCase();

  const isDigital =
    lowerText.includes("digital") ||
    lowerText.includes("course") ||
    lowerText.includes("training") ||
    lowerText.includes("marketing") ||
    lowerText.includes("skill");

  const isBusiness =
    lowerText.includes("business") ||
    lowerText.includes("entrepreneur") ||
    lowerText.includes("marketing") ||
    lowerText.includes("sales");

  const isStudent =
    lowerText.includes("student") ||
    lowerText.includes("beginner") ||
    lowerText.includes("youth");

  const productSummary = `${name} is a ${category} promoted through ${platform}. It appears suitable for ${audience}. The marketing approach should focus on education, trust-building, clear product value, and realistic expectations rather than exaggerated income claims.`;

  const buyerPersona = isStudent
    ? "A beginner or student who wants to learn a practical digital skill, improve career opportunities, or start a small online income path without feeling overwhelmed."
    : isBusiness
      ? "A small business owner, creator, freelancer, or beginner marketer who wants a practical solution to grow online visibility, improve sales, or learn digital marketing."
      : `A motivated buyer interested in ${category}, looking for a practical product that can solve a clear problem or improve their current situation.`;

  const painPoints = unique([
    "Does not know where to start",
    "Needs a simple and practical learning path",
    "Wants proof that the product is legitimate",
    isStudent ? "Has limited budget and needs beginner-friendly guidance" : "",
    isBusiness ? "Wants to attract more customers or improve online sales" : "",
    isDigital ? "Feels overwhelmed by too many online tutorials" : "",
  ]);

  const objections = unique([
    "Is this product legit?",
    "Is it beginner-friendly?",
    "Will it actually help me?",
    "Is it worth the money?",
    "What if I buy and do not get results?",
    "Can I trust the seller or platform?",
  ]);

  const allowedChannels = unique([
    "TikTok educational videos",
    "Instagram Reels",
    "Facebook posts",
    "YouTube Shorts",
    "Telegram opt-in channel",
    "Pinterest educational pins",
    "X educational threads",
  ]);

  const bannedClaims = [
    "Guaranteed income",
    "Make money instantly",
    "No work required",
    "100% sure profit",
    "Get rich quick",
    "You will become rich overnight",
  ];

  const recommendedPlatforms = unique([
    "TikTok",
    "Instagram",
    "Facebook",
    "YouTube Shorts",
    "Telegram",
    isDigital ? "Pinterest" : "",
    isBusiness ? "X" : "",
  ]);

  const contentAngles = unique([
    "Beginner mistakes to avoid",
    "Step-by-step educational post",
    "Honest product review",
    "Problem-solution post",
    "FAQ post",
    "Objection handling post",
    "Before buying this product, know these things",
    isStudent ? "Student-friendly digital skill angle" : "",
    isBusiness ? "Small business growth angle" : "",
    isDigital ? "Digital skill learning angle" : "",
  ]);

  let trustScore = 60;
  let riskScore = 35;

  if (product.affiliateUrl.startsWith("https://")) trustScore += 8;
  if (product.targetAudience && product.targetAudience.length > 20) trustScore += 8;
  if (product.category) trustScore += 5;
  if (product.commissionType && product.commissionType !== "unknown") trustScore += 5;

  if (lowerText.includes("money") || lowerText.includes("income")) riskScore += 15;
  if (lowerText.includes("guarantee")) riskScore += 20;
  if (!product.price || product.price === 0) riskScore += 5;
  if (!product.commissionType || product.commissionType === "unknown") riskScore += 5;

  trustScore = Math.min(100, Math.max(0, trustScore));
  riskScore = Math.min(100, Math.max(0, riskScore));

  const analysisNotes =
    "Use education-first content. Do not promote this product with exaggerated income promises. Build trust with tutorials, honest reviews, FAQs, and clear explanations of who the product is for.";

  return {
    productSummary,
    buyerPersona,
    painPoints,
    objections,
    allowedChannels,
    bannedClaims,
    recommendedPlatforms,
    contentAngles,
    trustScore,
    riskScore,
    analysisNotes,
    lastAnalyzedAt: new Date(),
  };
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return Response.json(
        {
          ok: false,
          error: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const product = await AffiliateProductModel.findById(id);

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const analysis = analyzeProduct({
      name: product.name,
      platformName: product.platformName,
      category: product.category,
      targetAudience: product.targetAudience,
      affiliateUrl: product.affiliateUrl,
      commissionType: product.commissionType,
      commissionValue: product.commissionValue,
      price: product.price,
    });

    product.set(analysis);
    await product.save();

    return Response.json({
      ok: true,
      product,
      analysis,
    });
  } catch (error) {
    console.error("Failed to analyze product:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}