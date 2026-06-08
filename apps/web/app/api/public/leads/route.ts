import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { LeadModel } from "@/models/Lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

declare global {
  var affiliatePilotLeadRateLimit:
    | Map<string, RateLimitEntry>
    | undefined;
}

const rateLimitStore =
  globalThis.affiliatePilotLeadRateLimit ||
  new Map<string, RateLimitEntry>();

globalThis.affiliatePilotLeadRateLimit = rateLimitStore;

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  return value.trim().slice(0, maxLength);
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(clientIp: string) {
  const now = Date.now();
  const current = rateLimitStore.get(clientIp);

  if (!current || current.expiresAt <= now) {
    rateLimitStore.set(clientIp, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (current.count >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false;
  }

  current.count += 1;

  rateLimitStore.set(clientIp, current);

  return true;
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    if (!checkRateLimit(clientIp)) {
      return Response.json(
        {
          ok: false,
          error:
            "Too many submissions from this device. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    const trackingCode = cleanText(body.trackingCode, 120);
    const name = cleanText(body.name, 120);
    const contact = cleanText(body.contact, 180);
    const message = cleanText(body.message, 1200);

    // Hidden honeypot field. Real visitors should leave this empty.
    const website = cleanText(body.website, 180);

    const formStartedAt = Number(body.formStartedAt || 0);

    if (website) {
      return Response.json({
        ok: true,
        message: "Thank you. Your message has been received.",
      });
    }

    if (
      Number.isFinite(formStartedAt) &&
      formStartedAt > 0 &&
      Date.now() - formStartedAt < 1500
    ) {
      return Response.json(
        {
          ok: false,
          error: "Please review your details and submit again.",
        },
        { status: 400 }
      );
    }

    if (!trackingCode) {
      return Response.json(
        {
          ok: false,
          error: "Product tracking code is missing.",
        },
        { status: 400 }
      );
    }

    if (!contact) {
      return Response.json(
        {
          ok: false,
          error:
            "Enter a phone number, email address, WhatsApp number, or social-media handle.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const product = await AffiliateProductModel.findOne({
      trackingCode,
      landingPageEnabled: true,
      status: {
        $ne: "archived",
      },
    })
      .select("_id name")
      .lean();

    if (!product) {
      return Response.json(
        {
          ok: false,
          error: "This product page is no longer available.",
        },
        { status: 404 }
      );
    }

    const lead = await LeadModel.create({
      affiliateProductId: product._id,
      platform: "website",
      name,
      contact,
      source: "Public product landing page",
      message,
      notes:
        "Automatically captured through the public product landing page.",
      interestLevel: 3,
      status: "new",
    });

    return Response.json(
      {
        ok: true,
        leadId: String(lead._id),
        message:
          "Thank you. Your details have been received. You will be contacted with more information.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to capture public lead:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Your message could not be submitted.",
      },
      { status: 500 }
    );
  }
}