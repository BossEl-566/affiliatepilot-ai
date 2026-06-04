"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnalyticsResponse = {
  ok: boolean;
  stats: {
    totalProducts: number;
    totalPosts: number;
    totalClicks: number;
  };
  clicksByProduct: Array<{
    _id: string;
    clicks: number;
    productName?: string;
    platformName?: string;
  }>;
  clicksByPlatform: Array<{
    _id: string;
    clicks: number;
  }>;
  error?: string;
};

type SalesResponse = {
  ok: boolean;
  stats: {
    totalSales: number;
    confirmedSales: number;
    totalRevenue: number;
    totalCommission: number;
  };
  error?: string;
};

type Lead = {
  _id: string;
  platform: string;
  name?: string;
  username?: string;
  contact?: string;
  status: "new" | "contacted" | "interested" | "converted" | "not_interested";
  interestLevel: number;
  createdAt?: string;
  affiliateProduct?: {
    _id: string;
    name: string;
  } | null;
};

type GeneratedPost = {
  _id: string;
  platform: string;
  title?: string;
  status: "draft" | "approved" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  affiliateProduct?: {
    _id: string;
    name: string;
  } | null;
};

type MediaAsset = {
  _id: string;
};

function formatPlatform(platform?: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    pinterest: "Pinterest",
    telegram: "Telegram",
    x: "X",
    whatsapp: "WhatsApp",
    website: "Website",
    other: "Other",
    unknown: "Unknown",
  };

  if (!platform) return "Unknown";

  return labels[platform] || platform;
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";

  return new Date(value).toLocaleString();
}

function leadStatusClasses(status: Lead["status"]) {
  const classes: Record<Lead["status"], string> = {
    new: "bg-cyan-400/10 text-cyan-300",
    contacted: "bg-violet-400/10 text-violet-300",
    interested: "bg-emerald-400/10 text-emerald-300",
    converted: "bg-yellow-400/10 text-yellow-300",
    not_interested: "bg-slate-400/10 text-slate-300",
  };

  return classes[status];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [salesStats, setSalesStats] = useState<SalesResponse["stats"]>({
    totalSales: 0,
    confirmedSales: 0,
    totalRevenue: 0,
    totalCommission: 0,
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchDashboard() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [
        analyticsResponse,
        salesResponse,
        leadsResponse,
        postsResponse,
        mediaResponse,
      ] = await Promise.all([
        fetch("/api/analytics", { cache: "no-store" }),
        fetch("/api/sales", { cache: "no-store" }),
        fetch("/api/leads", { cache: "no-store" }),
        fetch("/api/posts", { cache: "no-store" }),
        fetch("/api/media", { cache: "no-store" }),
      ]);

      const [
        analyticsData,
        salesData,
        leadsData,
        postsData,
        mediaData,
      ] = await Promise.all([
        analyticsResponse.json(),
        salesResponse.json(),
        leadsResponse.json(),
        postsResponse.json(),
        mediaResponse.json(),
      ]);

      if (!analyticsData.ok) {
        throw new Error(analyticsData.error || "Failed to fetch analytics");
      }

      if (!salesData.ok) {
        throw new Error(salesData.error || "Failed to fetch revenue stats");
      }

      if (!leadsData.ok) {
        throw new Error(leadsData.error || "Failed to fetch leads");
      }

      if (!postsData.ok) {
        throw new Error(postsData.error || "Failed to fetch posts");
      }

      if (!mediaData.ok) {
        throw new Error(mediaData.error || "Failed to fetch media");
      }

      setAnalytics(analyticsData);
      setSalesStats(salesData.stats);
      setLeads(leadsData.leads);
      setPosts(postsData.posts);
      setMediaAssets(mediaData.mediaAssets);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const convertedLeads = useMemo(() => {
    return leads.filter((lead) => lead.status === "converted").length;
  }, [leads]);

  const interestedLeads = useMemo(() => {
    return leads.filter((lead) => lead.status === "interested").length;
  }, [leads]);

  const leadConversionRate = useMemo(() => {
    if (leads.length === 0) return 0;

    return (convertedLeads / leads.length) * 100;
  }, [leads, convertedLeads]);

  const upcomingScheduledPosts = useMemo(() => {
    return posts
      .filter((post) => post.scheduledAt)
      .filter((post) => {
        const scheduledTime = new Date(post.scheduledAt as string).getTime();

        return scheduledTime >= Date.now();
      })
      .sort((a, b) => {
        return (
          new Date(a.scheduledAt as string).getTime() -
          new Date(b.scheduledAt as string).getTime()
        );
      })
      .slice(0, 5);
  }, [posts]);

  const recentLeads = useMemo(() => {
    return leads.slice(0, 5);
  }, [leads]);

  const topProduct = analytics?.clicksByProduct?.[0];
  const topPlatform = analytics?.clicksByPlatform?.[0];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                AffiliatePilot AI
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Command Dashboard
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Monitor products, campaigns, clicks, leads, scheduled posts, and
                commissions from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDashboard}
              disabled={isLoading}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Refreshing..." : "Refresh dashboard"}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Tracked clicks</p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {analytics?.stats.totalClicks || 0}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Total leads</p>
            <p className="mt-2 text-4xl font-black text-white">
              {leads.length}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Confirmed sales</p>
            <p className="mt-2 text-4xl font-black text-emerald-300">
              {salesStats.confirmedSales}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Commission earned</p>
            <p className="mt-2 text-3xl font-black text-yellow-300">
              GHS {salesStats.totalCommission.toFixed(2)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Affiliate products</p>
            <p className="mt-2 text-3xl font-black text-white">
              {analytics?.stats.totalProducts || 0}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Generated posts</p>
            <p className="mt-2 text-3xl font-black text-violet-300">
              {analytics?.stats.totalPosts || 0}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Uploaded media</p>
            <p className="mt-2 text-3xl font-black text-cyan-300">
              {mediaAssets.length}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Lead conversion rate</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              {leadConversionRate.toFixed(1)}%
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Upcoming posts</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Your next scheduled content items.
                </p>
              </div>

              <Link
                href="/schedule"
                className="rounded-xl bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                Open queue
              </Link>
            </div>

            {isLoading ? (
              <p className="mt-5 text-sm text-slate-300">Loading posts...</p>
            ) : upcomingScheduledPosts.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-6 text-center">
                <p className="font-semibold">No upcoming scheduled posts</p>
                <p className="mt-2 text-sm text-slate-400">
                  Open a generated draft, add a date, and save it.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {upcomingScheduledPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/posts/${post._id}`}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4 transition hover:border-cyan-400/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                        {formatPlatform(post.platform)}
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-slate-300">
                        {post.status}
                      </span>
                    </div>

                    <h3 className="mt-3 font-bold">
                      {post.title || "Untitled post"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {post.affiliateProduct?.name || "Unknown product"}
                    </p>

                    <p className="mt-2 text-xs text-cyan-300">
                      {formatDate(post.scheduledAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Current leaders</h2>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">Top product</p>
                  <p className="mt-1 font-bold">
                    {topProduct?.productName || "No click data yet"}
                  </p>
                  <p className="mt-1 text-sm text-cyan-300">
                    {topProduct?.clicks || 0} clicks
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">Top platform</p>
                  <p className="mt-1 font-bold">
                    {formatPlatform(topPlatform?._id)}
                  </p>
                  <p className="mt-1 text-sm text-emerald-300">
                    {topPlatform?.clicks || 0} clicks
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">Interested leads</p>
                  <p className="mt-1 text-2xl font-black text-emerald-300">
                    {interestedLeads}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Fast actions</h2>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/products"
                  className="rounded-2xl bg-cyan-400 px-4 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Add product
                </Link>

                <Link
                  href="/content"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-bold transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  Open content
                </Link>

                <Link
                  href="/leads"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-bold transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  Add lead
                </Link>

                <Link
                  href="/sales"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-bold transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  Record sale
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent leads</h2>
              <p className="mt-1 text-sm text-slate-400">
                Your latest manually recorded prospects.
              </p>
            </div>

            <Link
              href="/leads"
              className="rounded-xl bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Open Lead Inbox
            </Link>
          </div>

          {isLoading ? (
            <p className="mt-5 text-sm text-slate-300">Loading leads...</p>
          ) : recentLeads.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-6 text-center">
              <p className="font-semibold">No leads recorded yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Add people who comment, DM, or request product details.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {recentLeads.map((lead) => (
                <article
                  key={lead._id}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                      {formatPlatform(lead.platform)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs capitalize ${leadStatusClasses(
                        lead.status
                      )}`}
                    >
                      {lead.status.replace("_", " ")}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      Interest {lead.interestLevel}/5
                    </span>
                  </div>

                  <h3 className="mt-3 font-bold">
                    {lead.name || lead.username || lead.contact || "Unnamed lead"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {lead.affiliateProduct?.name || "No product attached"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}