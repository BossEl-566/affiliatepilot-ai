import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { ClickEventModel } from "@/models/ClickEvent";

export async function GET() {
  try {
    await connectToDatabase();

    const [totalProducts, totalPosts, totalClicks, recentClicks] =
      await Promise.all([
        AffiliateProductModel.countDocuments(),
        GeneratedPostModel.countDocuments(),
        ClickEventModel.countDocuments(),
        ClickEventModel.find().sort({ createdAt: -1 }).limit(20).lean(),
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
        $limit: 10,
      },
    ]);

    const clicksByPlatform = await ClickEventModel.aggregate([
      {
        $group: {
          _id: "$platform",
          clicks: { $sum: 1 },
        },
      },
      {
        $sort: {
          clicks: -1,
        },
      },
    ]);

    return Response.json({
      ok: true,
      stats: {
        totalProducts,
        totalPosts,
        totalClicks,
      },
      clicksByProduct,
      clicksByPlatform,
      recentClicks,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}