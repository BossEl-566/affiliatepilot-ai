import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { ClickEventModel } from "@/models/ClickEvent";

export const runtime = "nodejs";

type ActionPriority = "high" | "medium" | "low";

type RecommendedAction = {
  title: string;
  description: string;
  priority: ActionPriority;
};

function getStartOfWeekWindow() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

function formatPlatformName(platform: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube Shorts",
    pinterest: "Pinterest",
    telegram: "Telegram",
    x: "X",
    website: "Website",
    unknown: "Unknown",
  };

  return labels[platform] || platform;
}

function buildRecommendedActions(input: {
  totalProducts: number;
  totalPosts: number;
  totalClicks: number;
  clicksLast7Days: number;
  approvedPosts: number;
  draftPosts: number;
  topPlatform?: string;
  topProductName?: string;
  topPostTitle?: string;
}) {
  const actions: RecommendedAction[] = [];

  if (input.totalProducts === 0) {
    actions.push({
      priority: "high",
      title: "Add your first affiliate product",
      description:
        "The system cannot generate campaigns or track performance until you add at least one product.",
    });
  }

  if (input.totalProducts > 0 && input.totalPosts === 0) {
    actions.push({
      priority: "high",
      title: "Generate campaign drafts",
      description:
        "You have products but no generated posts. Open a product and click “Generate campaign” to create platform-specific drafts.",
    });
  }

  if (input.totalPosts > 0 && input.approvedPosts === 0) {
    actions.push({
      priority: "high",
      title: "Approve your best drafts",
      description:
        "All posts are still drafts. Review the strongest ones, edit them, attach media, and change their status to Approved.",
    });
  }

  if (input.totalClicks === 0) {
    actions.push({
      priority: "high",
      title: "Test your tracking links",
      description:
        "No clicks have been recorded yet. Copy a post-level tracking link, open it once, and confirm it appears in analytics.",
    });
  }

  if (input.clicksLast7Days === 0 && input.totalClicks > 0) {
    actions.push({
      priority: "medium",
      title: "Restart posting this week",
      description:
        "You have historical clicks but no clicks in the last 7 days. Publish or share approved content again and track which platforms respond.",
    });
  }

  if (input.topPlatform && input.topPlatform !== "unknown") {
    actions.push({
      priority: "high",
      title: `Double down on ${formatPlatformName(input.topPlatform)}`,
      description:
        "This platform currently has the highest click activity. Create 3–5 more posts using the same style, hook, and CTA pattern.",
    });
  }

  if (input.topProductName) {
    actions.push({
      priority: "medium",
      title: `Create more content for ${input.topProductName}`,
      description:
        "This product is currently getting the most attention. Generate fresh posts, attach better media, and test a clearer CTA.",
    });
  }

  if (input.topPostTitle) {
    actions.push({
      priority: "medium",
      title: "Reuse your best post angle",
      description: `Your strongest tracked post is “${input.topPostTitle}”. Turn that idea into a short video, carousel, Telegram post, and Facebook post.`,
    });
  }

  if (input.draftPosts > input.approvedPosts) {
    actions.push({
      priority: "low",
      title: "Clean up your draft backlog",
      description:
        "You have more drafts than approved posts. Review old drafts, delete weak ones, and approve the ones worth publishing.",
    });
  }

  actions.push({
    priority: "medium",
    title: "Use honest, education-first CTAs",
    description:
      "Avoid income guarantees. Use CTAs like “Comment START for the breakdown” or “Check the details if this fits your goal.”",
  });

  return actions;
}

export async function GET() {
  try {
    await connectToDatabase();

    const sevenDaysAgo = getStartOfWeekWindow();

    const [
      totalProducts,
      totalPosts,
      totalClicks,
      clicksLast7Days,
      draftPosts,
      approvedPosts,
      scheduledPosts,
      publishedPosts,
    ] = await Promise.all([
      AffiliateProductModel.countDocuments(),
      GeneratedPostModel.countDocuments(),
      ClickEventModel.countDocuments(),
      ClickEventModel.countDocuments({
        createdAt: {
          $gte: sevenDaysAgo,
        },
      }),
      GeneratedPostModel.countDocuments({ status: "draft" }),
      GeneratedPostModel.countDocuments({ status: "approved" }),
      GeneratedPostModel.countDocuments({ status: "scheduled" }),
      GeneratedPostModel.countDocuments({ status: "published" }),
    ]);

    const clicksByPlatform = await ClickEventModel.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              {
                $or: [
                  { $eq: ["$platform", ""] },
                  { $eq: ["$platform", null] },
                ],
              },
              "unknown",
              "$platform",
            ],
          },
          clicks: { $sum: 1 },
        },
      },
      {
        $sort: {
          clicks: -1,
        },
      },
    ]);

    const clicksByProduct = await ClickEventModel.aggregate([
      {
        $group: {
          _id: "$affiliateProductId",
          clicks: { $sum: 1 },
        },
      },
      {
        $sort: {
          clicks: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "affiliateproducts",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          clicks: 1,
          productName: "$product.name",
          platformName: "$product.platformName",
          trackingCode: "$product.trackingCode",
        },
      },
    ]);

    const clicksByPost = await ClickEventModel.aggregate([
      {
        $match: {
          generatedPostId: {
            $exists: true,
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$generatedPostId",
          clicks: { $sum: 1 },
        },
      },
      {
        $sort: {
          clicks: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "generatedposts",
          localField: "_id",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $unwind: {
          path: "$post",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          clicks: 1,
          postTitle: "$post.title",
          platform: "$post.platform",
          format: "$post.format",
          status: "$post.status",
        },
      },
    ]);

    const topPlatform = clicksByPlatform[0]?._id || "unknown";
    const topProductName = clicksByProduct[0]?.productName || "";
    const topPostTitle = clicksByPost[0]?.postTitle || "";

    const actions = buildRecommendedActions({
      totalProducts,
      totalPosts,
      totalClicks,
      clicksLast7Days,
      approvedPosts,
      draftPosts,
      topPlatform,
      topProductName,
      topPostTitle,
    });

    const summaryParts = [];

    if (totalClicks === 0) {
      summaryParts.push(
        "No tracked clicks have been recorded yet. The priority is to test tracking links and begin sharing approved content."
      );
    } else {
      summaryParts.push(
        `The system has recorded ${totalClicks} total click${
          totalClicks === 1 ? "" : "s"
        }, with ${clicksLast7Days} click${
          clicksLast7Days === 1 ? "" : "s"
        } in the last 7 days.`
      );
    }

    if (topPlatform && topPlatform !== "unknown") {
      summaryParts.push(
        `${formatPlatformName(
          topPlatform
        )} is currently the strongest tracked platform.`
      );
    }

    if (topProductName) {
      summaryParts.push(`${topProductName} is currently the top product.`);
    }

    return Response.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      window: {
        label: "Last 7 days",
        start: sevenDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
      stats: {
        totalProducts,
        totalPosts,
        totalClicks,
        clicksLast7Days,
        draftPosts,
        approvedPosts,
        scheduledPosts,
        publishedPosts,
      },
      leaders: {
        topPlatform,
        topProduct: clicksByProduct[0] || null,
        topPost: clicksByPost[0] || null,
      },
      clicksByPlatform,
      clicksByProduct,
      clicksByPost,
      summary: summaryParts.join(" "),
      recommendedActions: actions,
    });
  } catch (error) {
    console.error("Failed to generate weekly optimizer:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}