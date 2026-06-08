"use client";

import Link from "next/link";
import { useMemo } from "react";

type PostStatus =
  | "draft"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "converted"
  | "not_interested";

type SaleStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "refunded"
  | "cancelled";

type DailyPost = {
  _id: string;
  platform: string;
  title?: string;
  status: PostStatus;
  scheduledAt?: string;
  plannerSource?: string;
  affiliateProduct?: {
    _id: string;
    name: string;
  } | null;
};

type DailyLead = {
  _id: string;
  platform: string;
  name?: string;
  username?: string;
  contact?: string;
  status: LeadStatus;
  createdAt?: string;
  affiliateProduct?: {
    _id: string;
    name: string;
  } | null;
};

type DailySale = {
  _id: string;
  status: SaleStatus;
  soldAt?: string;
  currency?: string;
  commissionEarned?: number;
  affiliateProduct?: {
    _id: string;
    name: string;
  } | null;
};

type DailyActionCenterProps = {
  posts: DailyPost[];
  leads: DailyLead[];
  sales: DailySale[];
};

function formatPlatform(platform: string) {
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
  };

  return labels[platform] || platform;
}

function formatTime(value?: string) {
  if (!value) return "No time";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLeadName(lead: DailyLead) {
  return lead.name || lead.username || lead.contact || "Unnamed lead";
}

function isToday(value?: string) {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isWithinLastSevenDays(value?: string) {
  if (!value) return false;

  const time = new Date(value).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return time >= sevenDaysAgo;
}

function ActionCard({
  label,
  value,
  description,
  href,
  buttonLabel,
  valueClassName,
}: {
  label: string;
  value: string | number;
  description: string;
  href: string;
  buttonLabel: string;
  valueClassName: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-slate-400">{label}</p>

      <p className={`mt-2 text-4xl font-black ${valueClassName}`}>
        {value}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-flex rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
      >
        {buttonLabel}
      </Link>
    </article>
  );
}

export function DailyActionCenter({
  posts,
  leads,
  sales,
}: DailyActionCenterProps) {
  const summary = useMemo(() => {
    const postsDueToday = posts
      .filter((post) => post.scheduledAt)
      .filter((post) => isToday(post.scheduledAt))
      .filter((post) => post.status !== "published")
      .sort((a, b) => {
        return (
          new Date(a.scheduledAt || "").getTime() -
          new Date(b.scheduledAt || "").getTime()
        );
      });

    const telegramDraftsWaitingApproval = posts
      .filter((post) => post.platform === "telegram")
      .filter((post) => post.status === "draft")
      .filter((post) => Boolean(post.scheduledAt));

    const newWebsiteLeads = leads.filter(
      (lead) =>
        lead.platform === "website" &&
        lead.status === "new"
    );

    const interestedLeads = leads.filter(
      (lead) => lead.status === "interested"
    );

    const recentSales = sales.filter(
      (sale) =>
        (sale.status === "confirmed" || sale.status === "paid") &&
        isWithinLastSevenDays(sale.soldAt)
    );

    const recentCommission = recentSales.reduce(
      (sum, sale) =>
        sum + Number(sale.commissionEarned || 0),
      0
    );

    return {
      postsDueToday,
      telegramDraftsWaitingApproval,
      newWebsiteLeads,
      interestedLeads,
      recentSales,
      recentCommission,
    };
  }, [posts, leads, sales]);

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-200">
            Daily action center
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            What needs your attention today?
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-100/80">
            Review these items first. The goal is to spend less time searching
            through pages and more time publishing, replying, and tracking
            results.
          </p>
        </div>

        <Link
          href="/planner"
          className="rounded-2xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-300"
        >
          Generate weekly plan
        </Link>
      </div>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ActionCard
          label="Posts due today"
          value={summary.postsDueToday.length}
          description="Scheduled posts that still need to publish today."
          href="/schedule"
          buttonLabel="Open queue"
          valueClassName="text-cyan-300"
        />

        <ActionCard
          label="Telegram drafts to approve"
          value={summary.telegramDraftsWaitingApproval.length}
          description="Review these drafts before the scheduler can publish them."
          href="/schedule"
          buttonLabel="Review drafts"
          valueClassName="text-amber-300"
        />

        <ActionCard
          label="New website leads"
          value={summary.newWebsiteLeads.length}
          description="Visitors who submitted questions from public offer pages."
          href="/leads"
          buttonLabel="Reply to leads"
          valueClassName="text-emerald-300"
        />

        <ActionCard
          label="Interested leads"
          value={summary.interestedLeads.length}
          description="Qualified prospects who may need a useful follow-up."
          href="/leads"
          buttonLabel="Follow up"
          valueClassName="text-violet-300"
        />

        <ActionCard
          label="7-day commission"
          value={`GHS ${summary.recentCommission.toFixed(2)}`}
          description={`${summary.recentSales.length} confirmed or paid sales during the last 7 days.`}
          href="/sales"
          buttonLabel="Open revenue"
          valueClassName="text-yellow-300"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-white">
              Today&apos;s scheduled posts
            </h3>

            <Link
              href="/schedule"
              className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
            >
              Open queue
            </Link>
          </div>

          {summary.postsDueToday.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              No unpublished posts are due today.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {summary.postsDueToday.slice(0, 4).map((post) => (
                <Link
                  key={post._id}
                  href={`/posts/${post._id}`}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-400/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      {formatPlatform(post.platform)}
                    </span>

                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] capitalize text-slate-300">
                      {post.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-white">
                    {post.title || "Untitled post"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatTime(post.scheduledAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-white">
              New website leads
            </h3>

            <Link
              href="/leads"
              className="text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              Open inbox
            </Link>
          </div>

          {summary.newWebsiteLeads.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              No new website leads are waiting for a reply.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {summary.newWebsiteLeads.slice(0, 4).map((lead) => (
                <Link
                  key={lead._id}
                  href="/leads"
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-emerald-400/50"
                >
                  <p className="text-sm font-bold text-white">
                    {getLeadName(lead)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {lead.affiliateProduct?.name ||
                      "No product attached"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-white">
              Interested leads
            </h3>

            <Link
              href="/leads"
              className="text-xs font-bold text-violet-300 hover:text-violet-200"
            >
              Follow up
            </Link>
          </div>

          {summary.interestedLeads.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              No interested leads currently require follow-up.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {summary.interestedLeads.slice(0, 4).map((lead) => (
                <Link
                  key={lead._id}
                  href="/leads"
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-violet-400/50"
                >
                  <p className="text-sm font-bold text-white">
                    {getLeadName(lead)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {lead.affiliateProduct?.name ||
                      "No product attached"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}