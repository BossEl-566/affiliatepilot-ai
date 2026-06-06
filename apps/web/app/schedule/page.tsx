"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PostStatus = "all" | "draft" | "approved" | "scheduled" | "published" | "failed";

type GeneratedPost = {
  _id: string;
  affiliateProductId: string;
  platform:
    | "instagram"
    | "facebook"
    | "tiktok"
    | "youtube"
    | "pinterest"
    | "telegram"
    | "x"
    | "website";
  format:
    | "short_video"
    | "image_post"
    | "carousel"
    | "text_post"
    | "thread"
    | "pin";
  title?: string;
  hook?: string;
  caption?: string;
  script?: string;
  hashtags?: string[];
  callToAction?: string;
  status: "draft" | "approved" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  publishedAt?: string;
  createdAt?: string;
  telegramMessageId?: number;
telegramChatId?: string;
telegramPublishedAt?: string;
telegramError?: string;
  affiliateProduct?: {
    _id: string;
    name: string;
    platformName?: string;
    trackingCode?: string;
    affiliateUrl?: string;
  } | null;
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
  };

  return labels[platform] || platform;
}

function formatPostFormat(format: string) {
  return format
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value?: string) {
  if (!value) return "Not set";

  return new Date(value).toLocaleString();
}

function statusClasses(status: string) {
  const classes: Record<string, string> = {
    draft: "bg-slate-400/10 text-slate-300",
    approved: "bg-emerald-400/10 text-emerald-300",
    scheduled: "bg-cyan-400/10 text-cyan-300",
    published: "bg-violet-400/10 text-violet-300",
    failed: "bg-red-400/10 text-red-300",
  };

  return classes[status] || "bg-white/10 text-slate-300";
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<PostStatus>("scheduled");
  const [origin, setOrigin] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [publishingTelegramPostId, setPublishingTelegramPostId] =
  useState("");

  async function fetchPosts() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/posts", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch posts");
      }

      setPosts(data.posts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (statusFilter === "all") return true;
        return post.status === statusFilter;
      })
      .sort((a, b) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;

        return aTime - bTime;
      });
  }, [posts, statusFilter]);

  const stats = useMemo(() => {
    return {
      approved: posts.filter((post) => post.status === "approved").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      published: posts.filter((post) => post.status === "published").length,
      failed: posts.filter((post) => post.status === "failed").length,
    };
  }, [posts]);

  function createPostTrackingLink(post: GeneratedPost) {
    if (!post.affiliateProduct?.trackingCode || !origin) return "";

    const params = new URLSearchParams({
      postId: post._id,
      platform: post.platform,
    });

    return `${origin}/r/${post.affiliateProduct.trackingCode}?${params.toString()}`;
  }

  async function copyText(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage(success);
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not copy to clipboard.");
    }
  }

  function buildPostCopy(post: GeneratedPost) {
    const parts = [];

    if (post.title) parts.push(post.title);
    if (post.hook) parts.push(post.hook);
    if (post.caption) parts.push(post.caption);
    if (post.callToAction) parts.push(`CTA: ${post.callToAction}`);

    const trackingLink = createPostTrackingLink(post);

    if (trackingLink) {
      parts.push(`Link: ${trackingLink}`);
    }

    if (post.hashtags?.length) {
      parts.push(post.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" "));
    }

    return parts.filter(Boolean).join("\n\n");
  }

  async function publishToTelegram(post: GeneratedPost) {
  const confirmed = window.confirm(
    `Publish "${post.title || "Untitled post"}" to your Telegram channel now?`
  );

  if (!confirmed) return;

  try {
    setPublishingTelegramPostId(post._id);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(
      `/api/posts/${post._id}/publish/telegram`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to publish to Telegram");
    }

    setSuccessMessage("Post published to Telegram successfully.");

    await fetchPosts();
  } catch (error) {
    setErrorMessage(
      error instanceof Error ? error.message : "Something went wrong"
    );
  } finally {
    setPublishingTelegramPostId("");
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <Link
            href="/content"
            className="mb-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Content Studio
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                AffiliatePilot AI
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Publishing Queue
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Manage approved, scheduled, and published posts. For now, use
                this as your manual posting command center.
              </p>
            </div>

            <button
              onClick={fetchPosts}
              disabled={isLoading}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Refreshing..." : "Refresh queue"}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Approved</p>
            <p className="mt-2 text-4xl font-black text-emerald-300">
              {stats.approved}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Scheduled</p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {stats.scheduled}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Published</p>
            <p className="mt-2 text-4xl font-black text-violet-300">
              {stats.published}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Failed</p>
            <p className="mt-2 text-4xl font-black text-red-300">
              {stats.failed}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Filter queue
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as PostStatus)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All posts</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <Link
              href="/content"
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Open Content Studio
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Queue items</h2>
            <p className="mt-1 text-sm text-slate-400">
              Showing {filteredPosts.length} of {posts.length} posts.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
              Loading publishing queue...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
              <p className="text-lg font-semibold">No posts in this queue</p>
              <p className="mt-2 text-sm text-slate-400">
                Open a draft, set status to Scheduled, and add a scheduled date.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => {
                const trackingLink = createPostTrackingLink(post);
                const fullPostCopy = buildPostCopy(post);

                return (
                  <article
                    key={post._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-cyan-400/50"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                            {formatPlatformName(post.platform)}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                            {formatPostFormat(post.format)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClasses(
                              post.status
                            )}`}
                          >
                            {post.status}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-white">
                          {post.title || "Untitled draft"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          Product:{" "}
                          {post.affiliateProduct?.name || "Unknown product"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/posts/${post._id}`}
                          className="rounded-xl bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                        >
                          Edit
                        </Link>

                        {post.platform === "telegram" && (
  <button
    type="button"
    onClick={() => publishToTelegram(post)}
    disabled={
      publishingTelegramPostId === post._id ||
      (post.status !== "approved" && post.status !== "scheduled")
    }
    className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {publishingTelegramPostId === post._id
      ? "Publishing..."
      : post.status === "published"
        ? "Published"
        : "Publish to Telegram"}
  </button>
)}

                        <button
                          type="button"
                          onClick={() =>
                            copyText(fullPostCopy, "Full post copied.")
                          }
                          className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                        >
                          Copy post
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                          Scheduled time
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {formatDate(post.scheduledAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                          Published time
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </div>
                    {post.telegramError && (
  <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">
      Telegram publishing error
    </p>

    <p className="mt-2 text-sm leading-6 text-red-100">
      {post.telegramError}
    </p>
  </div>
)}

                    {post.caption && (
                      <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-300">
                        {post.caption}
                      </p>
                    )}

                    {trackingLink && (
                      <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                          Tracking link
                        </p>

                        <p className="break-all text-xs leading-5 text-cyan-100">
                          {trackingLink}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            copyText(trackingLink, "Tracking link copied.")
                          }
                          className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Copy tracking link
                        </button>
                      </div>
                    )}

                    {post.hashtags?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.hashtags.slice(0, 10).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}