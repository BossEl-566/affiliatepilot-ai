"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AffiliateProduct = {
  _id: string;
  name: string;
  platformName?: string;
  status: "draft" | "active" | "paused" | "archived";
};

type MediaAsset = {
  _id: string;
  affiliateProductId?: string;
  originalFileName: string;
  storedFileName: string;
  fileUrl: string;
  mediaType: "image" | "video" | "document" | "unknown";
  mimeType?: string;
  sizeBytes?: number;
  title?: string;
  description?: string;
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  status: "uploaded" | "attached" | "archived";
  createdAt?: string;
};

type MediaFilter = "all" | "image" | "video" | "document";

function formatFileSize(bytes?: number) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

function mediaBadgeClasses(mediaType: string) {
  const classes: Record<string, string> = {
    image: "bg-emerald-400/10 text-emerald-300",
    video: "bg-cyan-400/10 text-cyan-300",
    document: "bg-amber-400/10 text-amber-300",
    unknown: "bg-slate-400/10 text-slate-300",
  };

  return classes[mediaType] || classes.unknown;
}

export default function MediaLibraryPage() {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [affiliateProductId, setAffiliateProductId] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");

  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchMediaAssets() {
    try {
      setIsLoadingMedia(true);
      setErrorMessage("");

      const response = await fetch("/api/media", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch media assets");
      }

      setMediaAssets(data.mediaAssets);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoadingMedia(false);
    }
  }

  async function fetchProducts() {
    try {
      setIsLoadingProducts(true);

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
    fetchMediaAssets();
    fetchProducts();
  }, []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsUploading(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!file) {
        throw new Error("Please select a file to upload.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);

      if (affiliateProductId) {
        formData.append("affiliateProductId", affiliateProductId);
      }

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to upload media");
      }

      setSuccessMessage("Media uploaded successfully.");
      setFile(null);
      setTitle("");
      setDescription("");
      setAffiliateProductId("");

      const fileInput = document.getElementById(
        "media-file-input"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchMediaAssets();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsUploading(false);
    }
  }

  const filteredMedia = useMemo(() => {
    if (mediaFilter === "all") return mediaAssets;

    return mediaAssets.filter((asset) => asset.mediaType === mediaFilter);
  }, [mediaAssets, mediaFilter]);

  const stats = useMemo(() => {
    return {
      total: mediaAssets.length,
      images: mediaAssets.filter((asset) => asset.mediaType === "image").length,
      videos: mediaAssets.filter((asset) => asset.mediaType === "video").length,
      documents: mediaAssets.filter((asset) => asset.mediaType === "document")
        .length,
    };
  }, [mediaAssets]);

  function getProductName(productId?: string) {
    if (!productId) return "No product attached";

    const product = products.find((item) => item._id === productId);

    return product?.name || "Attached product";
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
                Media Library
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Upload images, videos, and PDFs. Attach them to affiliate
                products and later use them in social media campaigns.
              </p>
            </div>

            <button
              onClick={fetchMediaAssets}
              disabled={isLoadingMedia}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMedia ? "Refreshing..." : "Refresh media"}
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Total assets</p>
            <p className="mt-2 text-3xl font-black text-white">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Images</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              {stats.images}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Videos</p>
            <p className="mt-2 text-3xl font-black text-cyan-300">
              {stats.videos}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Documents</p>
            <p className="mt-2 text-3xl font-black text-amber-300">
              {stats.documents}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleUpload}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Upload media</h2>
              <p className="mt-1 text-sm text-slate-400">
                Start with images and videos you create yourself.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  File *
                </label>
                <input
                  id="media-file-input"
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] || null)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-950 hover:file:bg-cyan-300 focus:border-cyan-400"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Max file size for now: 50MB.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Grodital promo video"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Short note about what this media is for."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Attach to product
                </label>
                <select
                  value={affiliateProductId}
                  onChange={(event) => setAffiliateProductId(event.target.value)}
                  disabled={isLoadingProducts}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">No product attached</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
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
                disabled={isUploading}
                className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Uploading media..." : "Upload media"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Uploaded assets</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Showing {filteredMedia.length} of {mediaAssets.length} media
                  assets.
                </p>
              </div>

              <select
                value={mediaFilter}
                onChange={(event) =>
                  setMediaFilter(event.target.value as MediaFilter)
                }
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All media</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>

            {isLoadingMedia ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
                Loading media assets...
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                <p className="text-lg font-semibold">No media yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Upload your first image, video, or PDF using the form.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredMedia.map((asset) => (
                  <article
                    key={asset._id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition hover:border-cyan-400/50"
                  >
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                      <div className="min-h-48 bg-black/30">
                        {asset.mediaType === "image" ? (
                          <img
                            src={asset.fileUrl}
                            alt={asset.title || asset.originalFileName}
                            className="h-full max-h-64 w-full object-cover"
                          />
                        ) : asset.mediaType === "video" ? (
                          <video
                            src={asset.fileUrl}
                            controls
                            className="h-full max-h-64 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-48 items-center justify-center p-6 text-center text-sm text-slate-400">
                            Document uploaded
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${mediaBadgeClasses(
                              asset.mediaType
                            )}`}
                          >
                            {asset.mediaType}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                            {formatFileSize(asset.sizeBytes)}
                          </span>

                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                            {asset.status}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold">
                          {asset.title || asset.originalFileName}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {getProductName(asset.affiliateProductId)}
                        </p>

                        {asset.description && (
                          <p className="mt-3 text-sm leading-6 text-slate-300">
                            {asset.description}
                          </p>
                        )}

                        {asset.suggestedCaption && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                              Suggested caption
                            </p>
                            <p className="text-sm leading-6 text-slate-300">
                              {asset.suggestedCaption}
                            </p>
                          </div>
                        )}

                        {asset.suggestedHashtags?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {asset.suggestedHashtags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
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