"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "telegram"
  | "x"
  | "whatsapp"
  | "website"
  | "other";

type TemplateCategory =
  | "first_reply"
  | "product_details"
  | "objection_handling"
  | "follow_up"
  | "closing"
  | "after_purchase"
  | "custom";

type Tone = "friendly" | "professional" | "casual" | "direct";

type AffiliateProduct = {
  _id: string;
  name: string;
  platformName?: string;
  trackingCode?: string;
  affiliateUrl?: string;
};

type MessageTemplate = {
  _id: string;
  affiliateProductId?: string;
  name: string;
  platform: Platform;
  category: TemplateCategory;
  tone: Tone;
  body: string;
  variables?: string[];
  status: "active" | "archived";
  createdAt?: string;
  affiliateProduct?: AffiliateProduct | null;
};

type TemplateFormState = {
  affiliateProductId: string;
  name: string;
  platform: Platform;
  category: TemplateCategory;
  tone: Tone;
  body: string;
  status: "active" | "archived";
};

const initialFormState: TemplateFormState = {
  affiliateProductId: "",
  name: "",
  platform: "other",
  category: "first_reply",
  tone: "professional",
  body: "Hi {{name}}, thanks for reaching out. {{productName}} may be useful depending on your goal. I can send you a simple breakdown so you know what it does before deciding.\n\nHere is the link: {{trackingLink}}",
  status: "active",
};

function formatPlatformName(platform: string) {
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

function formatCategory(category: string) {
  return category
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function buildTrackingLink(product?: AffiliateProduct | null) {
  if (!product?.trackingCode) return "";

  return `${window.location.origin}/r/${product.trackingCode}`;
}

function renderTemplate(
  body: string,
  product?: AffiliateProduct | null,
  name = "there"
) {
  const trackingLink = buildTrackingLink(product);

  return body
    .replaceAll("{{name}}", name)
    .replaceAll("{{productName}}", product?.name || "the product")
    .replaceAll("{{platformName}}", product?.platformName || "the platform")
    .replaceAll("{{trackingLink}}", trackingLink || "[tracking link]");
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [form, setForm] = useState<TemplateFormState>(initialFormState);

  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<
    TemplateCategory | "all"
  >("all");

  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchTemplates() {
    try {
      setIsLoadingTemplates(true);
      setErrorMessage("");

      const response = await fetch("/api/templates", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch templates");
      }

      setTemplates(data.templates);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoadingTemplates(false);
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
    fetchTemplates();
    fetchProducts();
  }, []);

  function updateForm<K extends keyof TemplateFormState>(
    key: K,
    value: TemplateFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleCreateTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!form.name.trim()) {
        throw new Error("Template name is required.");
      }

      if (!form.body.trim()) {
        throw new Error("Template body is required.");
      }

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affiliateProductId: form.affiliateProductId || undefined,
          name: form.name,
          platform: form.platform,
          category: form.category,
          tone: form.tone,
          body: form.body,
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to create template");
      }

      setSuccessMessage("Template saved successfully.");
      setForm(initialFormState);
      await fetchTemplates();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTemplate(templateId: string) {
    const confirmed = window.confirm("Delete this template?");

    if (!confirmed) return;

    try {
      setDeletingTemplateId(templateId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete template");
      }

      setSuccessMessage("Template deleted.");
      await fetchTemplates();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setDeletingTemplateId("");
    }
  }

  async function copyTemplate(template: MessageTemplate) {
    try {
      const message = renderTemplate(
        template.body,
        template.affiliateProduct,
        "there"
      );

      await navigator.clipboard.writeText(message);
      setSuccessMessage("Template message copied.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not copy template.");
    }
  }

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const platformMatches =
        platformFilter === "all" || template.platform === platformFilter;

      const categoryMatches =
        categoryFilter === "all" || template.category === categoryFilter;

      return platformMatches && categoryMatches;
    });
  }, [templates, platformFilter, categoryFilter]);

  const selectedProduct = useMemo(() => {
    if (!form.affiliateProductId) return null;

    return products.find((product) => product._id === form.affiliateProductId);
  }, [products, form.affiliateProductId]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <Link
            href="/leads"
            className="mb-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Lead Inbox
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                AffiliatePilot AI
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Message Templates
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Save reusable professional replies for leads, DMs, comments,
                follow-ups, objections, and closing messages.
              </p>
            </div>

            <button
              onClick={fetchTemplates}
              disabled={isLoadingTemplates}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingTemplates ? "Refreshing..." : "Refresh templates"}
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

        <section className="grid gap-6 lg:grid-cols-[440px_1fr]">
          <form
            onSubmit={handleCreateTemplate}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Create template</h2>
              <p className="mt-1 text-sm text-slate-400">
                Use variables: {"{{name}}"}, {"{{productName}}"},{" "}
                {"{{platformName}}"}, {"{{trackingLink}}"}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Template name *
                </label>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="First reply for interested lead"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Product
                </label>
                <select
                  value={form.affiliateProductId}
                  onChange={(event) =>
                    updateForm("affiliateProductId", event.target.value)
                  }
                  disabled={isLoadingProducts}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">No product selected</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

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
                    <option value="youtube">YouTube</option>
                    <option value="pinterest">Pinterest</option>
                    <option value="telegram">Telegram</option>
                    <option value="x">X</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target.value as TemplateCategory
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="first_reply">First Reply</option>
                    <option value="product_details">Product Details</option>
                    <option value="objection_handling">
                      Objection Handling
                    </option>
                    <option value="follow_up">Follow Up</option>
                    <option value="closing">Closing</option>
                    <option value="after_purchase">After Purchase</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Tone
                  </label>
                  <select
                    value={form.tone}
                    onChange={(event) =>
                      updateForm("tone", event.target.value as Tone)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Message body *
                </label>
                <textarea
                  value={form.body}
                  onChange={(event) => updateForm("body", event.target.value)}
                  rows={8}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Preview
                </p>
                <p className="whitespace-pre-line text-sm leading-6 text-cyan-50">
                  {renderTemplate(form.body, selectedProduct, "there")}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving template..." : "Save template"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Saved templates</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Showing {filteredTemplates.length} of {templates.length}.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={platformFilter}
                  onChange={(event) =>
                    setPlatformFilter(event.target.value as Platform | "all")
                  }
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="all">All platforms</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="telegram">Telegram</option>
                  <option value="x">X</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="website">Website</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value as TemplateCategory | "all"
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="all">All categories</option>
                  <option value="first_reply">First Reply</option>
                  <option value="product_details">Product Details</option>
                  <option value="objection_handling">
                    Objection Handling
                  </option>
                  <option value="follow_up">Follow Up</option>
                  <option value="closing">Closing</option>
                  <option value="after_purchase">After Purchase</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            {isLoadingTemplates ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
                Loading templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                <p className="text-lg font-semibold">No templates found</p>
                <p className="mt-2 text-sm text-slate-400">
                  Create your first reusable lead reply template.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredTemplates.map((template) => (
                  <article
                    key={template._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-cyan-400/50"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                            {formatPlatformName(template.platform)}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                            {formatCategory(template.category)}
                          </span>

                          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                            {template.tone}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold">
                          {template.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {template.affiliateProduct?.name ||
                            "No product attached"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyTemplate(template)}
                          className="rounded-xl bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                        >
                          Copy
                        </button>

                        <button
                          type="button"
                          disabled={deletingTemplateId === template._id}
                          onClick={() => deleteTemplate(template._id)}
                          className="rounded-xl bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
                        {renderTemplate(
                          template.body,
                          template.affiliateProduct,
                          "there"
                        )}
                      </p>
                    </div>

                    {template.variables?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                          >
                            {"{{"}
                            {variable}
                            {"}}"}
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