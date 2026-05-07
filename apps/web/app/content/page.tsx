"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Platform =
  | "all"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "telegram"
  | "x"
  | "website";

type PostStatus =
  | "all"
  | "draft"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

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
  riskNotes?: string[];
  createdAt?: string;
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

export default function ContentStudioPage() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [platformFilter, setPlatformFilter] = useState<Platform>("all");
  const [statusFilter, setStatusFilter] = useState<PostStatus>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
  setOrigin(window.location.origin);
  fetchPosts();
}, []);

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
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const platformMatches =
        platformFilter === "all" || post.platform === platformFilter;
      const statusMatches =
        statusFilter === "all" || post.status === statusFilter;

      return platformMatches && statusMatches;
    });
  }, [posts, platformFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      drafts: posts.filter((post) => post.status === "draft").length,
      approved: posts.filter((post) => post.status === "approved").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      published: posts.filter((post) => post.status === "published").length,
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

async function copyPostTrackingLink(post: GeneratedPost) {
  const link = createPostTrackingLink(post);

  if (!link) {
    setErrorMessage("This post does not have a tracking link yet.");
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    setErrorMessage("");
  } catch {
    setErrorMessage("Could not copy tracking link.");
  }
}

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
                Content Studio
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Manage all AI-generated campaign drafts across products,
                platforms, and statuses.
              </p>
            </div>

            <button
              onClick={fetchPosts}
              disabled={isLoading}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Total posts</p>
            <p className="mt-2 text-3xl font-black text-white">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Drafts</p>
            <p className="mt-2 text-3xl font-black text-slate-300">
              {stats.drafts}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Approved</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              {stats.approved}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Scheduled</p>
            <p className="mt-2 text-3xl font-black text-cyan-300">
              {stats.scheduled}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Published</p>
            <p className="mt-2 text-3xl font-black text-violet-300">
              {stats.published}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Filter by platform
              </label>
              <select
                value={platformFilter}
                onChange={(event) =>
                  setPlatformFilter(event.target.value as Platform)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All platforms</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube Shorts</option>
                <option value="pinterest">Pinterest</option>
                <option value="telegram">Telegram</option>
                <option value="x">X</option>
                <option value="website">Website</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Filter by status
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as PostStatus)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Generated posts</h2>
              <p className="mt-1 text-sm text-slate-400">
                Showing {filteredPosts.length} of {posts.length} posts.
              </p>
            </div>

            <Link
              href="/products"
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Generate from product
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
              Loading content drafts...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
              <p className="text-lg font-semibold">No posts found</p>
              <p className="mt-2 text-sm text-slate-400">
                Generate campaign drafts from a product first.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
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

                      {post.hook && (
                        <p className="mt-2 text-sm font-medium text-cyan-200">
                          Hook: {post.hook}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/posts/${post._id}`}
                      className="rounded-xl bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                    >
                      Open editor
                    </Link>
                  </div>

                  {post.caption && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">
                      {post.caption}
                    </p>
                  )}

                  {post.affiliateProduct?.trackingCode && (
                    <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                        Tracking link
                      </p>

                      <p className="break-all text-xs leading-5 text-cyan-100">
                        {createPostTrackingLink(post)}
                      </p>

                      <button
                        type="button"
                        onClick={() => copyPostTrackingLink(post)}
                        className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Copy tracking link
                      </button>
                    </div>
                  )}

                  {post.hashtags?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.hashtags.slice(0, 8).map((tag) => (
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
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}