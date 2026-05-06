import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { GeneratedPostModel } from "@/models/GeneratedPost";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function baseHashtags(product: {
  category?: string;
  targetAudience?: string;
  platformName?: string;
}) {
  const tags = [
    "AffiliateMarketing",
    "DigitalSkills",
    "OnlineBusiness",
    "GhanaBusiness",
  ];

  const text = `${product.category || ""} ${product.targetAudience || ""} ${
    product.platformName || ""
  }`.toLowerCase();

  if (text.includes("student")) tags.push("StudentBusiness");
  if (text.includes("marketing")) tags.push("DigitalMarketing");
  if (text.includes("business")) tags.push("SmallBusiness");
  if (text.includes("course")) tags.push("OnlineCourse");

  return Array.from(new Set(tags));
}

function generateDraftPosts(product: {
  _id: unknown;
  name: string;
  platformName?: string;
  affiliateUrl: string;
  category?: string;
  targetAudience?: string;
  productSummary?: string;
  buyerPersona?: string;
  contentAngles?: string[];
  bannedClaims?: string[];
}) {
  const productName = product.name;
  const category = product.category || "digital product";
  const audience =
    product.targetAudience ||
    "beginners, students, creators, and small business owners";
  const summary =
    product.productSummary ||
    `${productName} is a ${category} for ${audience}.`;

  const hashtags = baseHashtags(product);

  const riskNotes = [
    "Avoid guaranteed income claims.",
    "Do not promise instant results.",
    "Keep the content educational and honest.",
  ];

  return [
    {
      platform: "tiktok",
      format: "short_video",
      title: `Why beginners should understand ${category}`,
      hook: "Most beginners fail because they start by posting links instead of building trust.",
      script: `Most beginners fail at affiliate marketing because they only post links. But people buy when they trust you. If you are looking at ${productName}, first understand what problem it solves, who it is for, and how it can help you learn or improve. Do not expect instant results. Focus on learning, practicing, and applying what you learn.`,
      caption: `Most beginners do affiliate marketing wrongly. Start with trust, education, and a clear problem. ${productName} may help if you are serious about learning.`,
      callToAction: "Comment START if you want the beginner-friendly breakdown.",
      hashtags,
      riskNotes,
    },
    {
      platform: "instagram",
      format: "carousel",
      title: `Before you buy ${productName}`,
      hook: "Before you buy any digital product, check these things first.",
      script: "",
      caption: `Before you buy ${productName}, ask: Who is this for? What problem does it solve? Is it beginner-friendly? What effort is required after buying? ${summary}`,
      callToAction: "DM or comment START if you want the product breakdown.",
      hashtags,
      riskNotes,
    },
    {
      platform: "facebook",
      format: "text_post",
      title: `${productName} honest breakdown`,
      hook: "A lot of people want to learn digital skills, but they do not know where to start.",
      script: "",
      caption: `A lot of people want to learn digital skills, but the problem is knowing where to start. ${productName} is worth reviewing if you are interested in ${category}. My advice is simple: do not buy anything because someone promised quick money. Buy because the product solves a clear problem and you are ready to learn and apply it.`,
      callToAction: "Comment START if you want me to send the details.",
      hashtags,
      riskNotes,
    },
    {
      platform: "youtube",
      format: "short_video",
      title: `Do this before buying ${productName}`,
      hook: "Do not buy any online course before checking these 3 things.",
      script: `Before you buy any online course or digital product, check three things. One, who is it for? Two, what exact skill or result does it help with? Three, what effort is required from you? ${productName} may be useful for ${audience}, but your result depends on how you apply what you learn.`,
      caption: `A quick beginner-friendly breakdown of what to check before buying ${productName}.`,
      callToAction: "Check the description for more details.",
      hashtags,
      riskNotes,
    },
    {
      platform: "telegram",
      format: "text_post",
      title: `${productName} product note`,
      hook: "Product research note",
      script: "",
      caption: `Product note: ${productName}\n\nCategory: ${category}\nAudience: ${audience}\n\nMy recommendation: Look at the product as a learning/resource tool, not a magic income shortcut. Read the details, understand what it teaches, and only buy if it matches your goal.\n\nAffiliate link: ${product.affiliateUrl}`,
      callToAction: "Reply with START if you want help deciding whether it fits you.",
      hashtags,
      riskNotes,
    },
    {
      platform: "pinterest",
      format: "pin",
      title: `${category} beginner guide`,
      hook: "Beginner digital skill checklist",
      script: "",
      caption: `A beginner-friendly guide for people interested in ${category}. Learn what to check before choosing a digital product like ${productName}.`,
      callToAction: "Save this and check the product details.",
      hashtags,
      riskNotes,
    },
    {
      platform: "x",
      format: "thread",
      title: `${productName} beginner thread`,
      hook: "Most beginners approach affiliate marketing wrongly.",
      script: "",
      caption: `Most beginners approach affiliate marketing wrongly.\n\nThey start by posting links.\n\nBetter approach:\n1. Understand the product\n2. Know the buyer\n3. Teach first\n4. Build trust\n5. Share the offer when relevant\n\nThat is how I would approach ${productName}.`,
      callToAction: "Reply START if you want the full breakdown.",
      hashtags,
      riskNotes,
    },
  ];
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

    const product = await AffiliateProductModel.findById(id).lean();

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const drafts = generateDraftPosts({
      _id: product._id,
      name: product.name,
      platformName: product.platformName,
      affiliateUrl: product.affiliateUrl,
      category: product.category,
      targetAudience: product.targetAudience,
      productSummary: product.productSummary,
      buyerPersona: product.buyerPersona,
      contentAngles: product.contentAngles,
      bannedClaims: product.bannedClaims,
    });

    const createdPosts = await GeneratedPostModel.insertMany(
      drafts.map((draft) => ({
        ...draft,
        affiliateProductId: product._id,
        status: "draft",
      }))
    );

    return Response.json(
      {
        ok: true,
        message: "Campaign drafts generated successfully.",
        posts: createdPosts,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to generate campaign:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}