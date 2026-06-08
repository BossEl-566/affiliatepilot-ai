import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";
import { PublicLeadCaptureForm } from "@/components/PublicLeadCaptureForm";

type OfferPageProps = {
  params: Promise<{
    trackingCode: string;
  }>;
};

async function getProduct(trackingCode: string) {
  await connectToDatabase();

  return AffiliateProductModel.findOne({
    trackingCode,
    landingPageEnabled: true,
    status: {
      $ne: "archived",
    },
  }).lean();
}

export async function generateMetadata({
  params,
}: OfferPageProps): Promise<Metadata> {
  const { trackingCode } = await params;

  const product = await getProduct(trackingCode);

  if (!product) {
    return {
      title: "Offer not found",
    };
  }

  return {
    title: `${product.name} | Product Details`,

    description:
      product.landingSubheadline ||
      product.productSummary ||
      "Review product details before deciding.",
  };
}

export default async function OfferPage({
  params,
}: OfferPageProps) {
  const { trackingCode } = await params;

  const product = await getProduct(trackingCode);

  if (!product) {
    notFound();
  }

  const trackingLink = `/r/${product.trackingCode}?platform=website&source=landing_page`;

 type LandingFaqItem = {
  question: string;
  answer: string;
};

const benefits: string[] = Array.isArray(product.landingBenefits)
  ? product.landingBenefits
  : [];

const whoItsFor: string[] = Array.isArray(product.landingWhoItsFor)
  ? product.landingWhoItsFor
  : [];

const faq: LandingFaqItem[] = Array.isArray(product.landingFaq)
  ? product.landingFaq
  : [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 md:py-16">
        <header className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.04] to-violet-500/10 p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
            Product Review
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
            {product.landingHeadline || product.name}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
            {product.landingSubheadline ||
              product.productSummary ||
              "Review the product details carefully before deciding."}
          </p>

          {product.price && product.price > 0 ? (
            <p className="mt-5 text-lg font-bold text-white">
              Price: {product.currency || "GHS"}{" "}
              {product.price.toFixed(2)}
            </p>
          ) : null}

          <a
            href={trackingLink}
            className="mt-7 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
          >
            {product.landingCtaLabel || "Review product details"}
          </a>

          <p className="mt-5 max-w-3xl text-xs leading-5 text-slate-400">
            {product.landingDisclosure ||
              "Affiliate disclosure: I may earn a commission if you purchase through this link, at no additional cost to you."}
          </p>
        </header>

        {benefits.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold">
              What to consider
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                >
                  <p className="text-sm leading-6 text-slate-300">
                    ✓ {benefit}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {whoItsFor.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold">
              Who may find this useful?
            </h2>

            <ul className="mt-5 grid gap-3">
              {whoItsFor.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm leading-6 text-slate-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {faq.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-bold">
              Frequently asked questions
            </h2>

            <div className="mt-5 grid gap-4">
              {faq.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                >
                  <h3 className="font-bold text-white">
                    {item.question}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
        <PublicLeadCaptureForm
  trackingCode={String(product.trackingCode)}
  productName={product.name}
/>

        <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-center">
          <h2 className="text-2xl font-black">
            Ready to review the full offer?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-cyan-50">
            Read the product information carefully and decide whether it
            matches your goal.
          </p>

          <a
            href={trackingLink}
            className="mt-5 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
          >
            {product.landingCtaLabel || "Review product details"}
          </a>
        </section>
      </section>
    </main>
  );
}