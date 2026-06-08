import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { ClickEventModel } from "@/models/ClickEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    trackingCode: string;
  }>;
};

function getWhatsAppNumber() {
  const rawNumber = process.env.WHATSAPP_CONTACT_NUMBER || "";

  const normalizedNumber = rawNumber.replace(/\D/g, "");

  if (!/^\d{8,15}$/.test(normalizedNumber)) {
    throw new Error(
      "WHATSAPP_CONTACT_NUMBER must contain the international phone number using digits only."
    );
  }

  return normalizedNumber;
}

function normalizeSource(value: string | null) {
  const source = value?.trim().toLowerCase() || "offer_page";

  return /^[a-z0-9_-]{1,40}$/.test(source)
    ? source
    : "offer_page";
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "";
  }

  return request.headers.get("x-real-ip") || "";
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await connectToDatabase();

    const { trackingCode } = await context.params;

    const product = await AffiliateProductModel.findOne({
      trackingCode,
      landingPageEnabled: true,
      status: {
        $ne: "archived",
      },
    })
      .select("_id name trackingCode affiliateUrl")
      .lean();

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "Product offer not found.",
        },
        { status: 404 }
      );
    }

    if (!product.affiliateUrl) {
      return Response.json(
        {
          ok: false,
          error: "The product affiliate URL is missing.",
        },
        { status: 400 }
      );
    }

    const url = new URL(request.url);

    const source = normalizeSource(
      url.searchParams.get("source")
    );

    const userAgent =
      request.headers.get("user-agent") || "";

    const referrer =
      request.headers.get("referer") || "";

    const ipAddress = getClientIp(request);

    try {
      await ClickEventModel.create({
        affiliateProductId: product._id,
        trackingCode: product.trackingCode,
        destinationUrl: product.affiliateUrl,
        platform: "whatsapp",
        source: `whatsapp_cta_${source}`.slice(0, 80),
        userAgent,
        referrer,
        ipAddress,
      });
    } catch (trackingError) {
      console.error(
        "Failed to record WhatsApp contact click:",
        trackingError
      );
    }

    const phoneNumber = getWhatsAppNumber();

    const offerUrl =
      `${url.origin}/offer/${encodeURIComponent(
        String(product.trackingCode)
      )}?source=whatsapp_chat`;

    const message = cleanText(
      [
        `Hello, I would like more information about ${product.name}.`,
        `I found the product details here: ${offerUrl}`,
        "Please help me understand whether it may be suitable for my goal.",
      ].join(" ")
    );

    const whatsappUrl = new URL(
      `https://wa.me/${phoneNumber}`
    );

    whatsappUrl.searchParams.set("text", message);

    return NextResponse.redirect(whatsappUrl);
  } catch (error) {
    console.error("WhatsApp redirect failed:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "WhatsApp contact link could not be opened.",
      },
      { status: 500 }
    );
  }
}