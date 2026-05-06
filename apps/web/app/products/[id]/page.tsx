"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProductStatus = "draft" | "active" | "paused" | "archived";

type AffiliateProduct = {
  _id: string;
  name: string;
  platformName?: string;
  affiliateUrl: string;
  productUrl?: string;
  category?: string;
  targetAudience?: string;
  currency?: string;
  price?: number;
  commissionType?: "percentage" | "fixed" | "unknown";
  commissionValue?: number;
  productSummary?: string;
  buyerPersona?: string;
  painPoints?: string[];
  objections?: string[];
  allowedChannels?: string[];
  bannedClaims?: string[];
  contentAngles?: string[];
  recommendedPlatforms?: string[];
  analysisNotes?: string;
  lastAnalyzedAt?: string;
  trustScore?: number;
  riskScore?: number;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
};

type ProductFormState = {
  name: string;
  platformName: string;
  affiliateUrl: string;
  productUrl: string;
  category: string;
  targetAudience: string;
  currency: string;
  price: string;
  commissionType: "percentage" | "fixed" | "unknown";
  commissionValue: string;
  productSummary: string;
  buyerPersona: string;
  status: ProductStatus;
};

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
};

function createFormState(product: AffiliateProduct): ProductFormState {
  return {
    name: product.name || "",
    platformName: product.platformName || "",
    affiliateUrl: product.affiliateUrl || "",
    productUrl: product.productUrl || "",
    category: product.category || "",
    targetAudience: product.targetAudience || "",
    currency: product.currency || "GHS",
    price: String(product.price || ""),
    commissionType: product.commissionType || "unknown",
    commissionValue: String(product.commissionValue || ""),
    productSummary: product.productSummary || "",
    buyerPersona: product.buyerPersona || "",
    status: product.status || "draft",
  };
}

function TagList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return <p className="mt-2 text-sm text-slate-400">No data yet.</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({
  items,
  emptyMessage,
  limit,
}: {
  items?: string[];
  emptyMessage: string;
  limit?: number;
}) {
  const list = limit ? items?.slice(0, limit) : items;

  if (!list?.length) {
    return <p className="mt-3 text-sm text-slate-400">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-6 text-slate-300">
      {list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

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

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<AffiliateProduct | null>(null);
  const [form, setForm] = useState<ProductFormState | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchProduct() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`/api/products/${params.id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      const fetchedProduct = data.product as AffiliateProduct;

      setProduct(fetchedProduct);
      setForm(createFormState(fetchedProduct));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchGeneratedPosts() {
    try {
      setIsLoadingPosts(true);

      const response = await fetch(`/api/posts?productId=${params.id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch generated posts");
      }

      setGeneratedPosts(data.posts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoadingPosts(false);
    }
  }

  useEffect(() => {
    fetchProduct();
    fetchGeneratedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function updateForm<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) {
    setForm((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) return;

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!form.name.trim()) {
        throw new Error("Product name is required.");
      }

      if (!form.affiliateUrl.trim()) {
        throw new Error("Affiliate URL is required.");
      }

      const response = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          platformName: form.platformName,
          affiliateUrl: form.affiliateUrl,
          productUrl: form.productUrl,
          category: form.category,
          targetAudience: form.targetAudience,
          currency: form.currency,
          price: Number(form.price || 0),
          commissionType: form.commissionType,
          commissionValue: Number(form.commissionValue || 0),
          productSummary: form.productSummary,
          buyerPersona: form.buyerPersona,
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      const updatedProduct = data.product as AffiliateProduct;

      setProduct(updatedProduct);
      setForm(createFormState(updatedProduct));
      setSuccessMessage("Product updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAnalyzeProduct() {
    try {
      setIsAnalyzing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/products/${params.id}/analyze`, {
        method: "POST",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to analyze product");
      }

      const analyzedProduct = data.product as AffiliateProduct;

      setProduct(analyzedProduct);
      setForm(createFormState(analyzedProduct));
      setSuccessMessage("AI product analysis generated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerateCampaign() {
    try {
      setIsGeneratingCampaign(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/products/${params.id}/generate-campaign`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to generate campaign");
      }

      setSuccessMessage("Campaign draft posts generated successfully.");
      await fetchGeneratedPosts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsGeneratingCampaign(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setErrorMessage("");

      const response = await fetch(`/api/products/${params.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      router.push("/products");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          Loading product...
        </div>
      </main>
    );
  }

  if (!product || !form) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
          {errorMessage || "Product not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/products"
              className="mb-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              ← Back to Product Vault
            </Link>

            <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Product workspace
            </p>

            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              {product.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Edit product details, prepare campaign data, generate AI analysis,
              and create platform-specific marketing drafts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold capitalize text-cyan-300">
              {product.status}
            </span>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSave}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20"
          >
            <h2 className="mb-5 text-xl font-semibold">Product details</h2>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Product name *
                </label>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Platform name
                  </label>
                  <input
                    value={form.platformName}
                    onChange={(event) =>
                      updateForm("platformName", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Category
                  </label>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Affiliate URL *
                </label>
                <textarea
                  value={form.affiliateUrl}
                  onChange={(event) =>
                    updateForm("affiliateUrl", event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Product URL
                </label>
                <input
                  value={form.productUrl}
                  onChange={(event) =>
                    updateForm("productUrl", event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Target audience
                </label>
                <textarea
                  value={form.targetAudience}
                  onChange={(event) =>
                    updateForm("targetAudience", event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Currency
                  </label>
                  <input
                    value={form.currency}
                    onChange={(event) =>
                      updateForm("currency", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Price
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      updateForm("price", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Commission type
                  </label>
                  <select
                    value={form.commissionType}
                    onChange={(event) =>
                      updateForm(
                        "commissionType",
                        event.target.value as ProductFormState["commissionType"]
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Commission value
                  </label>
                  <input
                    type="number"
                    value={form.commissionValue}
                    onChange={(event) =>
                      updateForm("commissionValue", event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Product summary
                </label>
                <textarea
                  value={form.productSummary}
                  onChange={(event) =>
                    updateForm("productSummary", event.target.value)
                  }
                  rows={4}
                  placeholder="The AI analyzer can fill this automatically."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Buyer persona
                </label>
                <textarea
                  value={form.buyerPersona}
                  onChange={(event) =>
                    updateForm("buyerPersona", event.target.value)
                  }
                  rows={4}
                  placeholder="Who is most likely to buy this product?"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-slate-200">
                    Pain points
                  </p>
                  <BulletList
                    items={product.painPoints}
                    emptyMessage="Generate AI analysis to discover buyer pain points."
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-slate-200">
                    Buyer objections
                  </p>
                  <BulletList
                    items={product.objections}
                    emptyMessage="Generate AI analysis to discover buyer objections."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-slate-200">
                    Allowed channels
                  </p>
                  <BulletList
                    items={product.allowedChannels}
                    emptyMessage="Generate AI analysis to see recommended safe channels."
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <p className="text-sm font-semibold text-slate-200">
                    Banned claims
                  </p>
                  <BulletList
                    items={product.bannedClaims}
                    emptyMessage="Generate AI analysis to list claims to avoid."
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Generated campaign drafts
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Draft posts created for each platform. Later, we will add
                      editing, approval, scheduling, and publishing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchGeneratedPosts}
                    disabled={isLoadingPosts}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingPosts ? "Refreshing..." : "Refresh posts"}
                  </button>
                </div>

                {isLoadingPosts ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                    Loading generated posts...
                  </div>
                ) : generatedPosts.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
                    <p className="font-semibold">No campaign drafts yet</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Click “Generate campaign” to create platform-specific draft
                      posts.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4">
                    {generatedPosts.map((post) => (
                      <article
                        key={post._id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                                {formatPlatformName(post.platform)}
                              </span>

                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                                {formatPostFormat(post.format)}
                              </span>

                              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium capitalize text-amber-300">
                                {post.status}
                              </span>
                            </div>

                            <h3 className="mt-3 text-base font-bold text-white">
                              {post.title || "Untitled draft"}
                            </h3>

                            {post.hook && (
                              <p className="mt-2 text-sm font-medium text-cyan-200">
                                Hook: {post.hook}
                              </p>
                            )}
                          </div>
                        </div>

                        {post.caption && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
                            <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
                              {post.caption}
                            </p>
                          </div>
                        )}

                        {post.script && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 p-4">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                              Script
                            </p>
                            <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
                              {post.script}
                            </p>
                          </div>
                        )}

                        {post.callToAction && (
                          <p className="mt-4 text-sm text-slate-300">
                            <span className="font-semibold text-slate-100">
                              CTA:
                            </span>{" "}
                            {post.callToAction}
                          </p>
                        )}

                        {post.hashtags?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {post.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {post.riskNotes?.length ? (
                          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                              Risk notes
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-amber-100">
                              {post.riskNotes.map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value as ProductFormState["status"]
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

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

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving changes..." : "Save changes"}
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Quick actions</h2>

              <div className="mt-4 grid gap-3">
                <button
                  onClick={handleAnalyzeProduct}
                  disabled={isAnalyzing}
                  className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing
                    ? "Analyzing product..."
                    : "Generate AI analysis"}
                </button>

                <button
                  onClick={handleGenerateCampaign}
                  disabled={isGeneratingCampaign}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingCampaign
                    ? "Generating campaign..."
                    : "Generate campaign"}
                </button>

                <button className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300">
                  Attach media
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Product score</h2>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">Trust score</p>
                  <p className="mt-1 text-3xl font-black text-emerald-300">
                    {product.trustScore || 0}/100
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">Risk score</p>
                  <p className="mt-1 text-3xl font-black text-amber-300">
                    {product.riskScore || 0}/100
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">AI analysis</h2>

              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Recommended platforms
                  </p>
                  <TagList items={product.recommendedPlatforms} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Content angles
                  </p>
                  <BulletList
                    items={product.contentAngles}
                    emptyMessage="No content angles yet."
                    limit={6}
                  />
                </div>

                {product.analysisNotes && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
                    <p className="text-sm leading-6 text-amber-100">
                      {product.analysisNotes}
                    </p>
                  </div>
                )}

                {product.lastAnalyzedAt && (
                  <p className="text-xs text-slate-500">
                    Last analyzed:{" "}
                    {new Date(product.lastAnalyzedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Affiliate link</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="break-all text-xs leading-5 text-slate-400">
                  {product.affiliateUrl}
                </p>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}