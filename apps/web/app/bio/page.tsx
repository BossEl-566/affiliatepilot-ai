import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { AffiliateProductModel } from "@/models/AffiliateProduct";

export const metadata: Metadata = {
  title: "Recommended Digital Products",
  description:
    "Browse selected digital products and review the details before deciding.",
};

type BioProduct = {
  _id: unknown;
  name: string;
  trackingCode: string;
  category?: string;
  currency?: string;
  price?: number;
  productSummary?: string;
  landingHeadline?: string;
  landingSubheadline?: string;
  landingCtaLabel?: string;
};

async function getPublicProducts() {
  await connectToDatabase();

  const products = await AffiliateProductModel.find({
    status: "active",
    landingPageEnabled: true,
    trackingCode: {
      $exists: true,
      $ne: "",
    },
  })
    .select(
      [
        "name",
        "trackingCode",
        "category",
        "currency",
        "price",
        "productSummary",
        "landingHeadline",
        "landingSubheadline",
        "landingCtaLabel",
      ].join(" ")
    )
    .sort({
      updatedAt: -1,
    })
    .lean();

  return products as BioProduct[];
}

export default async function BioPage() {
  const products = await getPublicProducts();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 md:py-16">
        <header className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-white/[0.04] to-violet-500/10 p-6 text-center md:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950">
            AP
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
            AffiliatePilot Picks
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Recommended Digital Products
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Browse selected offers, review the details carefully, and choose
            only products that match your actual goal.
          </p>
        </header>

        {products.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-center">
            <h2 className="text-xl font-bold">No active offers yet</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              New product recommendations will appear here soon.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {products.map((product) => {
              const offerLink = `/offer/${encodeURIComponent(
                product.trackingCode
              )}?source=bio`;

              const description =
                product.landingSubheadline ||
                product.productSummary ||
                "Review the product details and decide whether this offer is suitable for your goal.";

              return (
                <article
                  key={String(product._id)}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-400/50"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      {product.category && (
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                          {product.category}
                        </p>
                      )}

                      <h2 className="mt-2 text-2xl font-black tracking-tight">
                        {product.landingHeadline || product.name}
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {description}
                      </p>

                      {product.price && product.price > 0 ? (
                        <p className="mt-3 text-sm font-bold text-emerald-300">
                          Price: {product.currency || "GHS"}{" "}
                          {product.price.toFixed(2)}
                        </p>
                      ) : null}
                    </div>

                    <a
                      href={offerLink}
                      className="shrink-0 rounded-2xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      {product.landingCtaLabel || "View product details"}
                    </a>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs leading-5 text-slate-400">
            Affiliate disclosure: Some links on this page are affiliate links.
            I may earn a commission when you purchase through them, at no
            additional cost to you. Review each product carefully before making
            a decision.
          </p>
        </footer>
      </section>
    </main>
  );
}