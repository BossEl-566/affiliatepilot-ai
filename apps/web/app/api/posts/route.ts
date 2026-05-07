import { connectToDatabase } from "@/lib/mongodb";
import { GeneratedPostModel } from "@/models/GeneratedPost";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const query = productId ? { affiliateProductId: productId } : {};

    const posts = await GeneratedPostModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const productIds = Array.from(
      new Set(posts.map((post) => String(post.affiliateProductId)))
    );

    const products = await AffiliateProductModel.find({
      _id: { $in: productIds },
    })
      .select("name platformName trackingCode affiliateUrl")
      .lean();

    const productMap = new Map(
      products.map((product) => [
        String(product._id),
        {
          _id: String(product._id),
          name: product.name,
          platformName: product.platformName,
          trackingCode: product.trackingCode,
          affiliateUrl: product.affiliateUrl,
        },
      ])
    );

    const enrichedPosts = posts.map((post) => ({
      ...post,
      affiliateProduct: productMap.get(String(post.affiliateProductId)) || null,
    }));

    return Response.json({
      ok: true,
      posts: enrichedPosts,
    });
  } catch (error) {
    console.error("Failed to fetch generated posts:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}