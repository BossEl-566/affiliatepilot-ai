import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { ClickEventModel } from "@/models/ClickEvent";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  await connectToDatabase();

  const { code } = await context.params;

  const product = await AffiliateProductModel.findOne({
    trackingCode: code,
  }).lean();

  if (!product) {
    return Response.json(
      {
        ok: false,
        error: "Tracking link not found.",
      },
      { status: 404 }
    );
  }

  const requestHeaders = await headers();

  const userAgent = requestHeaders.get("user-agent") || "";
  const referrer = requestHeaders.get("referer") || "";
  const forwardedFor = requestHeaders.get("x-forwarded-for") || "";
  const ipAddress = forwardedFor.split(",")[0]?.trim() || "";

  const url = new URL(request.url);
  const generatedPostId = url.searchParams.get("postId");
  const platform = url.searchParams.get("platform") || "";

  await ClickEventModel.create({
    affiliateProductId: product._id,
    generatedPostId: generatedPostId || undefined,
    trackingCode: code,
    destinationUrl: product.affiliateUrl,
    platform,
    referrer,
    userAgent,
    ipAddress,
  });

  redirect(product.affiliateUrl);
}