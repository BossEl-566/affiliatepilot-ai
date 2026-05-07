"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "telegram"
  | "x"
  | "website";

type PostFormat =
  | "short_video"
  | "image_post"
  | "carousel"
  | "text_post"
  | "thread"
  | "pin";

type PostStatus = "draft" | "approved" | "scheduled" | "published" | "failed";

type GeneratedPost = {
  _id: string;
  affiliateProductId: string;
  mediaAssetId?: string;
  platform: Platform;
  format: PostFormat;
  title?: string;
  hook?: string;
  caption?: string;
  script?: string;
  hashtags?: string[];
  callToAction?: string;
  status: PostStatus;
  riskNotes?: string[];
  createdAt?: string;
  updatedAt?: string;
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

type PostFormState = {
  mediaAssetId: string;
  platform: Platform;
  format: PostFormat;
  title: string;
  hook: string;
  caption: string;
  script: string;
  hashtags: string;
  callToAction: string;
  status: PostStatus;
  riskNotes: string;
};

function createFormState(post: GeneratedPost): PostFormState {
  return {
    mediaAssetId: post.mediaAssetId || "",
    platform: post.platform || "instagram",
    format: post.format || "text_post",
    title: post.title || "",
    hook: post.hook || "",
    caption: post.caption || "",
    script: post.script || "",
    hashtags: post.hashtags?.join(", ") || "",
    callToAction: post.callToAction || "",
    status: post.status || "draft",
    riskNotes: post.riskNotes?.join(", ") || "",
  };
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

function formatFileSize(bytes?: number) {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function PostDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [form, setForm] = useState<PostFormState | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchMediaAssets(productId: string) {
    try {
      setIsLoadingMedia(true);

      const response = await fetch(`/api/media?productId=${productId}`, {
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

  async function fetchPost() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`/api/posts/${params.id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch post");
      }

      const fetchedPost = data.post as GeneratedPost;

      setPost(fetchedPost);
      setForm(createFormState(fetchedPost));

      await fetchMediaAssets(fetchedPost.affiliateProductId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function updateForm<K extends keyof PostFormState>(
    key: K,
    value: PostFormState[K]
  ) {
    setForm((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });
  }

  const selectedMediaAsset =
    form?.mediaAssetId && mediaAssets.length
      ? mediaAssets.find((asset) => asset._id === form.mediaAssetId) || null
      : null;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) return;

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaAssetId: form.mediaAssetId,
          platform: form.platform,
          format: form.format,
          title: form.title,
          hook: form.hook,
          caption: form.caption,
          script: form.script,
          hashtags: form.hashtags,
          callToAction: form.callToAction,
          status: form.status,
          riskNotes: form.riskNotes,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to update post");
      }

      const updatedPost = data.post as GeneratedPost;

      setPost(updatedPost);
      setForm(createFormState(updatedPost));
      setSuccessMessage("Post updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this generated post?"
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setErrorMessage("");

      const response = await fetch(`/api/posts/${params.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete post");
      }

      const deletedPost = data.post as GeneratedPost;
      router.push(`/products/${deletedPost.affiliateProductId}`);
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
          Loading generated post...
        </div>
      </main>
    );
  }

  if (!post || !form) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
          {errorMessage || "Generated post not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <Link
            href={`/products/${post.affiliateProductId}`}
            className="mb-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Product
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                Campaign draft editor
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                {post.title || "Untitled draft"}
              </h1>

              <p className="mt-3 text-sm text-slate-400">
                {formatPlatformName(post.platform)} •{" "}
                {formatPostFormat(post.format)} • {post.status}
              </p>
            </div>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete draft"}
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handleSave}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20"
          >
            <h2 className="mb-5 text-xl font-semibold">Edit draft</h2>

            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Platform
                  </label>
                  <select
                    value={form.platform}
                    onChange={(event) =>
                      updateForm("platform", event.target.value as Platform)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
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
                    Format
                  </label>
                  <select
                    value={form.format}
                    onChange={(event) =>
                      updateForm("format", event.target.value as PostFormat)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="short_video">Short Video</option>
                    <option value="image_post">Image Post</option>
                    <option value="carousel">Carousel</option>
                    <option value="text_post">Text Post</option>
                    <option value="thread">Thread</option>
                    <option value="pin">Pin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm("status", event.target.value as PostStatus)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Attached media
                </label>

                <select
                  value={form.mediaAssetId}
                  onChange={(event) =>
                    updateForm("mediaAssetId", event.target.value)
                  }
                  disabled={isLoadingMedia}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">No media attached</option>
                  {mediaAssets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.title || asset.originalFileName} —{" "}
                      {asset.mediaType}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Only media attached to this product will appear here.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Hook
                </label>
                <textarea
                  value={form.hook}
                  onChange={(event) => updateForm("hook", event.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Caption / body
                </label>
                <textarea
                  value={form.caption}
                  onChange={(event) =>
                    updateForm("caption", event.target.value)
                  }
                  rows={8}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Video script
                </label>
                <textarea
                  value={form.script}
                  onChange={(event) => updateForm("script", event.target.value)}
                  rows={8}
                  placeholder="For TikTok, Reels, Shorts, or video-based content."
                  className="w-full resize-y rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Call to action
                </label>
                <input
                  value={form.callToAction}
                  onChange={(event) =>
                    updateForm("callToAction", event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Hashtags
                </label>
                <textarea
                  value={form.hashtags}
                  onChange={(event) =>
                    updateForm("hashtags", event.target.value)
                  }
                  rows={3}
                  placeholder="AffiliateMarketing, DigitalSkills, GhanaBusiness"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Separate hashtags with commas. You can write them with or
                  without #.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Risk notes
                </label>
                <textarea
                  value={form.riskNotes}
                  onChange={(event) =>
                    updateForm("riskNotes", event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
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
                {isSaving ? "Saving draft..." : "Save draft"}
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Attached media</h2>

              {!selectedMediaAsset ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-6 text-center">
                  <p className="text-sm text-slate-400">
                    No media attached to this draft.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  {selectedMediaAsset.mediaType === "image" ? (
                    <img
                      src={selectedMediaAsset.fileUrl}
                      alt={
                        selectedMediaAsset.title ||
                        selectedMediaAsset.originalFileName
                      }
                      className="max-h-72 w-full object-cover"
                    />
                  ) : selectedMediaAsset.mediaType === "video" ? (
                    <video
                      src={selectedMediaAsset.fileUrl}
                      controls
                      className="max-h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="p-6 text-center text-sm text-slate-400">
                      Document attached
                    </div>
                  )}

                  <div className="p-4">
                    <p className="font-semibold">
                      {selectedMediaAsset.title ||
                        selectedMediaAsset.originalFileName}
                    </p>

                    <p className="mt-1 text-sm capitalize text-slate-400">
                      {selectedMediaAsset.mediaType} •{" "}
                      {formatFileSize(selectedMediaAsset.sizeBytes)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Preview</h2>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                    {formatPlatformName(form.platform)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                    {formatPostFormat(form.format)}
                  </span>

                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs capitalize text-amber-300">
                    {form.status}
                  </span>
                </div>

                {selectedMediaAsset && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    {selectedMediaAsset.mediaType === "image" ? (
                      <img
                        src={selectedMediaAsset.fileUrl}
                        alt={
                          selectedMediaAsset.title ||
                          selectedMediaAsset.originalFileName
                        }
                        className="max-h-72 w-full object-cover"
                      />
                    ) : selectedMediaAsset.mediaType === "video" ? (
                      <video
                        src={selectedMediaAsset.fileUrl}
                        controls
                        className="max-h-72 w-full object-cover"
                      />
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-400">
                        Document preview unavailable
                      </div>
                    )}
                  </div>
                )}

                <h3 className="mt-4 text-lg font-bold">
                  {form.title || "Untitled draft"}
                </h3>

                {form.hook && (
                  <p className="mt-3 text-sm font-semibold text-cyan-200">
                    {form.hook}
                  </p>
                )}

                {form.caption && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">
                    {form.caption}
                  </p>
                )}

                {form.script && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      Script
                    </p>
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
                      {form.script}
                    </p>
                  </div>
                )}

                {form.callToAction && (
                  <p className="mt-4 text-sm text-slate-300">
                    <span className="font-semibold text-white">CTA:</span>{" "}
                    {form.callToAction}
                  </p>
                )}

                {form.hashtags && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.hashtags
                      .split(",")
                      .map((tag) => tag.trim().replace(/^#/, ""))
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Status guide</h2>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p>
                  <span className="font-bold text-white">Draft:</span> Not ready
                  yet.
                </p>
                <p>
                  <span className="font-bold text-white">Approved:</span> Ready
                  to schedule or publish.
                </p>
                <p>
                  <span className="font-bold text-white">Scheduled:</span> Will
                  be posted later when scheduling is added.
                </p>
                <p>
                  <span className="font-bold text-white">Published:</span>{" "}
                  Already posted manually or by integration.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}