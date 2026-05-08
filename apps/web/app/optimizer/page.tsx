"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OptimizerStats = {
  totalProducts: number;
  totalPosts: number;
  totalClicks: number;
  clicksLast7Days: number;
  draftPosts: number;
  approvedPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  interestedLeads: number;
  convertedLeads: number;
  notInterestedLeads: number;
  averageInterestLevel: number;
};

type RecommendedAction = {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
};

type ClicksByPlatform = {
  _id: string;
  clicks: number;
};

type ClicksByProduct = {
  _id: string;
  clicks: number;
  productName?: string;
  platformName?: string;
  trackingCode?: string;
};

type ClicksByPost = {
  _id: string;
  clicks: number;
  postTitle?: string;
  platform?: string;
  format?: string;
  status?: string;
};

type LeadsByPlatform = {
  _id: string;
  leads: number;
  interested: number;
  converted: number;
};

type OptimizerResponse = {
  ok: boolean;
  generatedAt: string;
  window: {
    label: string;
    start: string;
    end: string;
  };
  stats: OptimizerStats;
  leaders: {
  topPlatform?: string;
  topLeadPlatform?: string;
  topProduct?: ClicksByProduct | null;
  topPost?: ClicksByPost | null;
};
leadsByPlatform: LeadsByPlatform[];
  clicksByPlatform: ClicksByPlatform[];
  clicksByProduct: ClicksByProduct[];
  clicksByPost: ClicksByPost[];
  summary: string;
  recommendedActions: RecommendedAction[];
  error?: string;
};

function formatPlatformName(platform?: string) {
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

  if (!platform) return "Unknown";

  return labels[platform] || platform;
}

function formatDate(value?: string) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleString();
}

function priorityClasses(priority: string) {
  const classes: Record<string, string> = {
    high: "border-red-400/20 bg-red-500/10 text-red-200",
    medium: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    low: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  };

  return classes[priority] || classes.medium;
}

function barWidth(value: number, max: number) {
  if (max <= 0) return "0%";

  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

export default function OptimizerPage() {
  const [data, setData] = useState<OptimizerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchOptimizer() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/optimizer/weekly", {
        cache: "no-store",
      });

      const result = (await response.json()) as OptimizerResponse;

      if (!result.ok) {
        throw new Error(result.error || "Failed to generate optimizer report");
      }

      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOptimizer();
  }, []);

  const maxPlatformClicks = useMemo(() => {
    return Math.max(...(data?.clicksByPlatform || []).map((item) => item.clicks), 0);
  }, [data]);

  const maxProductClicks = useMemo(() => {
    return Math.max(...(data?.clicksByProduct || []).map((item) => item.clicks), 0);
  }, [data]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <Link
            href="/analytics"
            className="mb-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Analytics
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                AffiliatePilot AI
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Weekly Optimizer
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                A practical growth report based on products, generated posts,
                tracking clicks, and platform performance.
              </p>
            </div>

            <button
              onClick={fetchOptimizer}
              disabled={isLoading}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Generating..." : "Regenerate report"}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-300">
            Generating optimizer report...
          </div>
        ) : !data ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
            Optimizer report could not be loaded.
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-200">
                    Summary
                  </p>
                  <p className="mt-3 max-w-4xl text-lg leading-8 text-cyan-50">
                    {data.summary}
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/40 p-4 text-sm text-cyan-100">
                  <p>Window: {data.window.label}</p>
                  <p className="mt-1 text-xs text-cyan-200/80">
                    {formatDate(data.window.start)} → {formatDate(data.window.end)}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Total clicks</p>
                <p className="mt-2 text-4xl font-black text-emerald-300">
                  {data.stats.totalClicks}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Clicks last 7 days</p>
                <p className="mt-2 text-4xl font-black text-cyan-300">
                  {data.stats.clicksLast7Days}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Approved posts</p>
                <p className="mt-2 text-4xl font-black text-violet-300">
                  {data.stats.approvedPosts}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Draft posts</p>
                <p className="mt-2 text-4xl font-black text-slate-300">
                  {data.stats.draftPosts}
                </p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
    <p className="text-sm text-slate-400">Total leads</p>
    <p className="mt-2 text-4xl font-black text-white">
      {data.stats.totalLeads}
    </p>
  </div>

  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
    <p className="text-sm text-slate-400">Interested leads</p>
    <p className="mt-2 text-4xl font-black text-emerald-300">
      {data.stats.interestedLeads}
    </p>
  </div>

  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
    <p className="text-sm text-slate-400">Converted leads</p>
    <p className="mt-2 text-4xl font-black text-yellow-300">
      {data.stats.convertedLeads}
    </p>
  </div>

  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
    <p className="text-sm text-slate-400">Avg. interest</p>
    <p className="mt-2 text-4xl font-black text-cyan-300">
      {data.stats.averageInterestLevel.toFixed(1)}/5
    </p>
  </div>
</section>

            <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-semibold">Recommended actions</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Follow these actions before creating more random content.
                </p>

                <div className="mt-5 grid gap-4">
                  {data.recommendedActions.map((action) => (
                    <article
                      key={`${action.priority}-${action.title}`}
                      className={`rounded-2xl border p-4 ${priorityClasses(
                        action.priority
                      )}`}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.25em]">
                            {action.priority} priority
                          </p>
                          <h3 className="mt-2 text-lg font-bold">
                            {action.title}
                          </h3>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6">
                        {action.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-lg font-semibold">Current leaders</h2>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Top platform</p>
                      <p className="mt-1 text-2xl font-black text-cyan-300">
                        {formatPlatformName(data.leaders.topPlatform)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-4">
  <p className="text-sm text-slate-400">Top lead platform</p>
  <p className="mt-1 text-2xl font-black text-emerald-300">
    {formatPlatformName(data.leaders.topLeadPlatform)}
  </p>
</div>

                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Top product</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {data.leaders.topProduct?.productName || "No data yet"}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {data.leaders.topProduct?.clicks || 0} clicks
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">Top post</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {data.leaders.topPost?.postTitle || "No data yet"}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {data.leaders.topPost?.clicks || 0} clicks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-lg font-semibold">Quick links</h2>

                  <div className="mt-4 grid gap-3">
                    <Link
                      href="/products"
                      className="rounded-2xl bg-cyan-400 px-4 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Product Vault
                    </Link>

                    <Link
                      href="/content"
                      className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
                    >
                      Content Studio
                    </Link>

                    <Link
                      href="/analytics"
                      className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              </aside>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-semibold">Platform performance</h2>

                {data.clicksByPlatform.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                    <p className="font-semibold">No platform clicks yet</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Use post-level tracking links to capture platform data.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {data.clicksByPlatform.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold">
                            {formatPlatformName(item._id)}
                          </p>

                          <p className="text-2xl font-black text-cyan-300">
                            {item.clicks}
                          </p>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-cyan-300"
                            style={{
                              width: barWidth(
                                item.clicks,
                                maxPlatformClicks
                              ),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-semibold">Product performance</h2>

                {data.clicksByProduct.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                    <p className="font-semibold">No product clicks yet</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Share a tracking link to start measuring product demand.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {data.clicksByProduct.map((item) => (
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

                          <p className="text-2xl font-black text-emerald-300">
                            {item.clicks}
                          </p>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-300"
                            style={{
                              width: barWidth(item.clicks, maxProductClicks),
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
  <h2 className="text-xl font-semibold">Lead platform performance</h2>
  <p className="mt-1 text-sm text-slate-400">
    Platforms ranked by manually recorded leads and conversions.
  </p>

  {data.leadsByPlatform.length === 0 ? (
    <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
      <p className="font-semibold">No lead platform data yet</p>
      <p className="mt-2 text-sm text-slate-400">
        Add leads from the Lead Inbox to see which platform produces serious
        prospects.
      </p>
    </div>
  ) : (
    <div className="mt-5 grid gap-4">
      {data.leadsByPlatform.map((item) => (
        <div
          key={item._id}
          className="rounded-2xl border border-white/10 bg-slate-900 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-bold">
                {formatPlatformName(item._id)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {item.leads} leads • {item.interested} interested •{" "}
                {item.converted} converted
              </p>
            </div>

            <Link
              href="/leads"
              className="rounded-xl bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Open leads
            </Link>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
          </>
        )}
      </section>
    </main>
  );
}