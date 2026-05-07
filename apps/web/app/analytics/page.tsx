"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnalyticsStats = {
  totalProducts: number;
  totalPosts: number;
  totalClicks: number;
};

type ClicksByProduct = {
  _id: string;
  clicks: number;
  productName?: string;
  platformName?: string;
  trackingCode?: string;
};

type ClicksByPlatform = {
  _id: string;
  clicks: number;
};

type RecentClick = {
  _id: string;
  affiliateProductId: string;
  generatedPostId?: string;
  trackingCode: string;
  destinationUrl: string;
  platform?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  productName?: string;
  productPlatformName?: string;
  createdAt?: string;
};

type AnalyticsResponse = {
  ok: boolean;
  stats: AnalyticsStats;
  clicksByProduct: ClicksByProduct[];
  clicksByPlatform: ClicksByPlatform[];
  recentClicks: RecentClick[];
  error?: string;
};

function formatPlatformName(platform: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube Shorts",
    pinterest: "Pinterest",
    telegram: "Telegram",
    x: "X",
    website: "Website",
    unknown: "Unknown",
  };

  return labels[platform] || platform;
}

function formatDate(value?: string) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleString();
}

function getBarWidth(clicks: number, maxClicks: number) {
  if (maxClicks <= 0) return "0%";

  return `${Math.max(8, Math.round((clicks / maxClicks) * 100))}%`;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalProducts: 0,
    totalPosts: 0,
    totalClicks: 0,
  });

  const [clicksByProduct, setClicksByProduct] = useState<ClicksByProduct[]>([]);
  const [clicksByPlatform, setClicksByPlatform] = useState<ClicksByPlatform[]>(
    []
  );
  const [recentClicks, setRecentClicks] = useState<RecentClick[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchAnalytics() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/analytics", {
        cache: "no-store",
      });

      const data = (await response.json()) as AnalyticsResponse;

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch analytics");
      }

      setStats(data.stats);
      setClicksByProduct(data.clicksByProduct);
      setClicksByPlatform(data.clicksByPlatform);
      setRecentClicks(data.recentClicks);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const maxProductClicks = useMemo(() => {
    return Math.max(...clicksByProduct.map((item) => item.clicks), 0);
  }, [clicksByProduct]);

  const maxPlatformClicks = useMemo(() => {
    return Math.max(...clicksByPlatform.map((item) => item.clicks), 0);
  }, [clicksByPlatform]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <Link
            href="/products"
            className="mb-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Product Vault
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                AffiliatePilot AI
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Analytics Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Track clicks from your affiliate tracking links and see which
                products and platforms are getting attention.
              </p>
            </div>

            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Refreshing..." : "Refresh analytics"}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Total products</p>
            <p className="mt-2 text-4xl font-black text-white">
              {stats.totalProducts}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Generated posts</p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {stats.totalPosts}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Tracked clicks</p>
            <p className="mt-2 text-4xl font-black text-emerald-300">
              {stats.totalClicks}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Clicks by product</h2>
            <p className="mt-1 text-sm text-slate-400">
              Products ranked by total tracking-link clicks.
            </p>

            {isLoading ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
                Loading product analytics...
              </div>
            ) : clicksByProduct.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                <p className="font-semibold">No product clicks yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Copy a tracking link from a product page and open it to test
                  click tracking.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {clicksByProduct.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {item.productName || "Unknown product"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.platformName || "Unknown platform"}
                        </p>
                      </div>

                      <p className="text-2xl font-black text-cyan-300">
                        {item.clicks}
                      </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-300"
                        style={{
                          width: getBarWidth(item.clicks, maxProductClicks),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Clicks by platform</h2>
            <p className="mt-1 text-sm text-slate-400">
              Platform value comes from the tracking link query parameter.
            </p>

            {isLoading ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
                Loading platform analytics...
              </div>
            ) : clicksByPlatform.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                <p className="font-semibold">No platform data yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Later we’ll append platform values automatically to generated
                  post links.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {clicksByPlatform.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold">
                        {formatPlatformName(item._id || "unknown")}
                      </p>

                      <p className="text-2xl font-black text-emerald-300">
                        {item.clicks}
                      </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-300"
                        style={{
                          width: getBarWidth(item.clicks, maxPlatformClicks),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent clicks</h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest tracked visits through your affiliate redirect links.
              </p>
            </div>

            <Link
              href="/products"
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Get tracking link
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
              Loading recent clicks...
            </div>
          ) : recentClicks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
              <p className="text-lg font-semibold">No clicks recorded yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Open a product tracking link once to confirm tracking works.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-12 bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Platform</div>
                <div className="col-span-3">Time</div>
                <div className="col-span-3">Referrer</div>
              </div>

              <div className="divide-y divide-white/10">
                {recentClicks.map((click) => (
                  <div
                    key={click._id}
                    className="grid grid-cols-12 gap-2 px-4 py-4 text-sm"
                  >
                    <div className="col-span-4">
                      <p className="font-semibold text-white">
                        {click.productName || "Unknown product"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Code: {click.trackingCode}
                      </p>
                    </div>

                    <div className="col-span-2 text-slate-300">
                      {formatPlatformName(click.platform || "unknown")}
                    </div>

                    <div className="col-span-3 text-slate-300">
                      {formatDate(click.createdAt)}
                    </div>

                    <div className="col-span-3 truncate text-slate-400">
                      {click.referrer || "Direct / unknown"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}