"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AffiliateProduct = {
  _id: string;
  name: string;
  platformName?: string;
  status?: string;
};

type PlannedPost = {
  _id: string;
  title?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  callToAction?: string;
  scheduledAt?: string;
  status: "draft" | "approved" | "scheduled" | "published" | "failed";
};

type PlanResponse = {
  ok: boolean;
  plannerBatchId?: string;
  posts?: PlannedPost[];
  aiMode?: "gemini" | "fallback";
  warning?: string;
  error?: string;
};

function getTomorrowDate() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";

  return new Date(value).toLocaleString();
}

export default function PlannerPage() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);

  const [affiliateProductId, setAffiliateProductId] = useState("");
  const [startDate, setStartDate] = useState(getTomorrowDate);
  const [postingTime, setPostingTime] = useState("09:00");

  const [plannedPosts, setPlannedPosts] = useState<PlannedPost[]>([]);
  const [plannerBatchId, setPlannerBatchId] = useState("");
  const [aiMode, setAiMode] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchProducts() {
    try {
      setIsLoadingProducts(true);
      setErrorMessage("");

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }

      setProducts(data.products);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) => product._id === affiliateProductId
    );
  }, [products, affiliateProductId]);

  async function handleGeneratePlan(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!affiliateProductId) {
      setErrorMessage("Select a product first.");
      return;
    }

    const confirmed = window.confirm(
      "Generate seven Telegram drafts and schedule one post per day?"
    );

    if (!confirmed) return;

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");
      setWarningMessage("");
      setPlannedPosts([]);
      setPlannerBatchId("");

      const startDateTime = new Date(
        `${startDate}T${postingTime}:00`
      ).toISOString();

      const response = await fetch("/api/planner/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affiliateProductId,
          startDateTime,
        }),
      });

      const data = (await response.json()) as PlanResponse;

      if (!data.ok || !data.posts || !data.plannerBatchId) {
        throw new Error(data.error || "Failed to generate weekly plan");
      }

      setPlannedPosts(data.posts);
      setPlannerBatchId(data.plannerBatchId);
      setAiMode(data.aiMode || "fallback");
      setWarningMessage(data.warning || "");

      setSuccessMessage(
        "Seven Telegram drafts generated. Review them before approval."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function approveAllPosts() {
    if (!plannerBatchId) return;

    const confirmed = window.confirm(
      "Approve all seven Telegram posts? Your scheduler will automatically publish them when each date arrives."
    );

    if (!confirmed) return;

    try {
      setIsApproving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch("/api/planner/telegram/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plannerBatchId,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to approve weekly plan");
      }

      setPlannedPosts((current) =>
        current.map((post) =>
          post.status === "draft"
            ? {
                ...post,
                status: "approved",
              }
            : post
        )
      );

      setSuccessMessage(
        `${data.approved} Telegram posts approved for automatic publishing.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            AffiliatePilot AI
          </p>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            7-Day Telegram Planner
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            Generate one Telegram post per day, review the content, approve the
            plan, and let your free scheduler publish automatically.
          </p>
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

        {warningMessage && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {warningMessage}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={handleGeneratePlan}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
          >
            <h2 className="text-xl font-semibold">Generate plan</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Posts begin as drafts. Review the content before approving the
              weekly schedule.
            </p>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Affiliate product
                </label>

                <select
                  value={affiliateProductId}
                  onChange={(event) =>
                    setAffiliateProductId(event.target.value)
                  }
                  disabled={isLoadingProducts}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="">Select product</option>

                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  First posting date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Daily posting time
                </label>

                <input
                  type="time"
                  value={postingTime}
                  onChange={(event) => setPostingTime(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating
                  ? "Generating weekly plan..."
                  : "Generate 7-day plan"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Generated plan</h2>

                <p className="mt-1 text-sm text-slate-400">
                  {selectedProduct?.name ||
                    "Select a product to generate your plan."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {aiMode && (
                  <span
                    className={`rounded-full px-3 py-2 text-xs font-bold ${
                      aiMode === "gemini"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {aiMode === "gemini" ? "Gemini AI" : "Fallback"}
                  </span>
                )}

                {plannedPosts.length > 0 && (
                  <button
                    type="button"
                    onClick={approveAllPosts}
                    disabled={isApproving}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {isApproving
                      ? "Approving..."
                      : "Approve all posts"}
                  </button>
                )}

                <Link
                  href="/schedule"
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  Open queue
                </Link>
              </div>
            </div>

            {plannedPosts.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                <p className="font-semibold">
                  No weekly plan generated yet
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Select a product and generate seven Telegram drafts.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {plannedPosts.map((post, index) => (
                  <article
                    key={post._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                            Day {index + 1}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-slate-300">
                            {post.status}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-white">
                          {post.title || "Untitled post"}
                        </h3>

                        <p className="mt-2 text-xs text-cyan-300">
                          {formatDate(post.scheduledAt)}
                        </p>
                      </div>

                      <Link
                        href={`/posts/${post._id}`}
                        className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                      >
                        Review and edit
                      </Link>
                    </div>

                    {post.hook && (
                      <p className="mt-4 text-sm font-semibold text-cyan-200">
                        {post.hook}
                      </p>
                    )}

                    {post.caption && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">
                        {post.caption}
                      </p>
                    )}

                    {post.callToAction && (
                      <p className="mt-3 text-sm text-emerald-300">
                        CTA: {post.callToAction}
                      </p>
                    )}

                    {post.hashtags?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.hashtags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                          >
                            #{tag.replace(/^#/, "")}
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
      </section>
    </main>
  );
}