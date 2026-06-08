"use client";

import { useMemo, useState } from "react";

type PromotionProduct = {
  name: string;
  trackingCode?: string;
  category?: string;
  platformName?: string;
  productSummary?: string;
  targetAudience?: string;
  buyerPersona?: string;
  contentAngles?: string[];
  landingPageEnabled?: boolean;
  landingHeadline?: string;
  landingSubheadline?: string;
  landingCtaLabel?: string;
};

type ProductPromotionToolkitProps = {
  product: PromotionProduct;
  origin: string;
};

type PromotionAsset = {
  id: string;
  label: string;
  description: string;
  content: string;
};

function normalizeHashtag(value: string) {
  return value
    .trim()
    .replace(/^#/, "")
    .replace(/[^a-zA-Z0-9_]/g, "");
}

function createHashtags(product: PromotionProduct) {
  const categoryTag = normalizeHashtag(
    product.category || "DigitalProducts"
  );

  return Array.from(
    new Set([
      categoryTag,
      "DigitalProducts",
      "AffiliateMarketing",
      "OnlineBusiness",
    ])
  )
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(" ");
}

function createCampaignLink(input: {
  origin: string;
  trackingCode?: string;
  source: string;
  platform: string;
  landingPageEnabled?: boolean;
}) {
  if (!input.origin || !input.trackingCode) return "";

  const encodedTrackingCode = encodeURIComponent(input.trackingCode);
  const encodedSource = encodeURIComponent(input.source);
  const encodedPlatform = encodeURIComponent(input.platform);

  if (input.landingPageEnabled) {
    return `${input.origin}/offer/${encodedTrackingCode}?source=${encodedSource}`;
  }

  return `${input.origin}/r/${encodedTrackingCode}?platform=${encodedPlatform}&source=${encodedSource}`;
}

function CopyButton({
  content,
  label = "Copy",
  disabled = false,
  onCopied,
}: {
  content: string;
  label?: string;
  disabled?: boolean;
  onCopied: () => void;
}) {
  async function handleCopy() {
    if (!content || disabled) return;

    await navigator.clipboard.writeText(content);

    onCopied();
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !content}
      className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function ProductPromotionToolkit({
  product,
  origin,
}: ProductPromotionToolkitProps) {
  const [copiedItem, setCopiedItem] = useState("");

  const toolkit = useMemo(() => {
    const name = product.name || "This product";

    const headline =
      product.landingHeadline ||
      `${name}: review the details before deciding`;

    const summary =
      product.landingSubheadline ||
      product.productSummary ||
      `Review what ${name} includes, who it may be suitable for, and whether it matches your current goal before making a decision.`;

    const targetAudience =
      product.targetAudience ||
      product.buyerPersona ||
      "people looking for a practical digital-product solution";

    const primaryAngle =
      product.contentAngles?.[0] ||
      `Understand what ${name} includes before deciding whether it fits your goal.`;

    const cta =
      product.landingCtaLabel ||
      "Review the product details before deciding.";

    const hashtags = createHashtags(product);

    function getLink(source: string, platform: string) {
      return createCampaignLink({
        origin,
        trackingCode: product.trackingCode,
        source,
        platform,
        landingPageEnabled: product.landingPageEnabled,
      });
    }

    const bioLink = origin ? `${origin}/bio` : "";

    const landingPageLink =
      origin && product.trackingCode
        ? `${origin}/offer/${encodeURIComponent(product.trackingCode)}`
        : "";

    const directTrackingLink =
      origin && product.trackingCode
        ? `${origin}/r/${encodeURIComponent(
            product.trackingCode
          )}?platform=website&source=direct_toolkit`
        : "";

    const whatsappLink = getLink("whatsapp_status", "whatsapp");
    const telegramLink = getLink("telegram_manual", "telegram");
    const facebookLink = getLink("facebook_post", "facebook");
    const instagramLink = getLink("instagram_caption", "instagram");
    const tiktokLink = getLink("tiktok_video", "tiktok");
    const xLink = getLink("x_post", "x");

    const assets: PromotionAsset[] = [
      {
        id: "whatsapp",
        label: "WhatsApp status",
        description: "Short copy for WhatsApp Status or an opt-in reply.",
        content: [
          headline,
          "",
          summary,
          "",
          `👉 ${cta}`,
          whatsappLink ? `🔗 ${whatsappLink}` : "",
          "",
          "Affiliate disclosure: I may earn a commission if you purchase through this link, at no additional cost to you.",
        ]
          .filter(Boolean)
          .join("\n"),
      },

      {
        id: "telegram",
        label: "Telegram caption",
        description: "Manual Telegram caption with a tracked offer link.",
        content: [
          headline,
          "",
          summary,
          "",
          `👉 ${cta}`,
          telegramLink ? `🔗 ${telegramLink}` : "",
          "",
          hashtags,
        ]
          .filter(Boolean)
          .join("\n"),
      },

      {
        id: "facebook",
        label: "Facebook post",
        description: "Educational Facebook post with a low-pressure CTA.",
        content: [
          `Are you considering ${name}?`,
          "",
          summary,
          "",
          `This may be useful for ${targetAudience}.`,
          "",
          "Take time to review the information carefully instead of making a rushed decision.",
          "",
          `👉 ${cta}`,
          facebookLink ? `🔗 ${facebookLink}` : "",
          "",
          "Affiliate disclosure: I may earn a commission if you purchase through this link.",
          "",
          hashtags,
        ]
          .filter(Boolean)
          .join("\n"),
      },

      {
        id: "instagram",
        label: "Instagram caption",
        description: "Caption for an image, carousel, or Reel.",
        content: [
          headline,
          "",
          primaryAngle,
          "",
          summary,
          "",
          `👉 ${cta}`,
          instagramLink ? `🔗 ${instagramLink}` : "",
          "",
          "Affiliate disclosure: I may earn a commission through this link.",
          "",
          hashtags,
        ]
          .filter(Boolean)
          .join("\n"),
      },

      {
        id: "tiktok",
        label: "TikTok short-video script",
        description: "Simple education-first short-video script.",
        content: [
          `HOOK: Before you spend money on ${name}, check these three things.`,
          "",
          "SCRIPT:",
          `First, understand exactly what ${name} includes.`,
          "Second, ask whether it matches your current goal.",
          "Third, compare the price with the value before deciding.",
          "",
          "Avoid buying only because of hype. Review the details and make an informed choice.",
          "",
          `CTA: ${cta}`,
          tiktokLink ? `LINK: ${tiktokLink}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },

      {
        id: "x",
        label: "X post",
        description: "Short copy for X or the opening post of a thread.",
        content: [
          `Considering ${name}?`,
          "",
          "Before buying:",
          "1. Check what the offer includes.",
          "2. Confirm it matches your goal.",
          "3. Compare the value with the price.",
          "4. Avoid rushed decisions.",
          "",
          xLink ? `Details: ${xLink}` : "",
          "",
          "#DigitalProducts #AffiliateMarketing",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ];

    return {
      bioLink,
      landingPageLink,
      directTrackingLink,
      assets,
    };
  }, [origin, product]);

  function showCopiedMessage(label: string) {
    setCopiedItem(label);

    window.setTimeout(() => {
      setCopiedItem("");
    }, 2500);
  }

  const isTrackingReady = Boolean(product.trackingCode && origin);

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
          Promotion toolkit
        </p>

        <h2 className="mt-2 text-xl font-black text-white">
          Copy-ready marketing assets
        </h2>

        <p className="mt-2 text-sm leading-6 text-violet-100/80">
          Use these drafts as a starting point. Review every message before
          posting and avoid exaggerated claims.
        </p>
      </div>

      {!isTrackingReady && (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-100">
          This product needs a tracking code before copy-ready links can be
          generated.
        </div>
      )}

      {copiedItem && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {copiedItem} copied successfully.
        </div>
      )}

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold text-white">Public bio link</p>

              <p className="mt-2 break-all text-xs leading-5 text-slate-300">
                {toolkit.bioLink || "Unavailable"}
              </p>
            </div>

            <CopyButton
              content={toolkit.bioLink}
              label="Copy bio link"
              disabled={!toolkit.bioLink}
              onCopied={() => showCopiedMessage("Public bio link")}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold text-white">
                Public product-page link
              </p>

              <p className="mt-2 break-all text-xs leading-5 text-slate-300">
                {product.landingPageEnabled
                  ? toolkit.landingPageLink
                  : "Generate the public landing page first."}
              </p>
            </div>

            <CopyButton
              content={toolkit.landingPageLink}
              label="Copy offer link"
              disabled={!product.landingPageEnabled}
              onCopied={() => showCopiedMessage("Public offer-page link")}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold text-white">
                Direct tracked affiliate link
              </p>

              <p className="mt-2 break-all text-xs leading-5 text-slate-300">
                {toolkit.directTrackingLink || "Unavailable"}
              </p>
            </div>

            <CopyButton
              content={toolkit.directTrackingLink}
              label="Copy direct link"
              disabled={!toolkit.directTrackingLink}
              onCopied={() =>
                showCopiedMessage("Direct tracked affiliate link")
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {toolkit.assets.map((asset) => (
          <article
            key={asset.id}
            className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-sm font-black text-white">
                  {asset.label}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {asset.description}
                </p>
              </div>

              <CopyButton
                content={asset.content}
                disabled={!isTrackingReady}
                onCopied={() => showCopiedMessage(asset.label)}
              />
            </div>

            <pre className="mt-4 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-300">
              {asset.content}
            </pre>
          </article>
        ))}
      </div>
    </section>
  );
}