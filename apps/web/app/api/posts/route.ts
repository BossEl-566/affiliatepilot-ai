import { connectToDatabase } from "@/lib/mongodb";
import { GeneratedPostModel } from "@/models/GeneratedPost";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const query = productId ? { affiliateProductId: productId } : {};

    const posts = await GeneratedPostModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      ok: true,
      posts,
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