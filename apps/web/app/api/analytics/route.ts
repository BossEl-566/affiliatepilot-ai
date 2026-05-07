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

    const clicksByProductRaw = await ClickEventModel.aggregate([
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

    const clicksByPlatformRaw = await ClickEventModel.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              {
                $or: [
                  { $eq: ["$platform", ""] },
                  { $eq: ["$platform", null] },
                  { $not: ["$platform"] },
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

    const recentClicksWithProducts = await Promise.all(
      recentClicks.map(async (click) => {
        const product = await AffiliateProductModel.findById(
          click.affiliateProductId
        )
          .select("name platformName trackingCode")
          .lean();

        return {
          ...click,
          productName: product?.name || "Unknown product",
          productPlatformName: product?.platformName || "",
          productTrackingCode: product?.trackingCode || "",
        };
      })
    );

    return Response.json({
      ok: true,
      stats: {
        totalProducts,
        totalPosts,
        totalClicks,
      },
      clicksByProduct: clicksByProductRaw,
      clicksByPlatform: clicksByPlatformRaw,
      recentClicks: recentClicksWithProducts,
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