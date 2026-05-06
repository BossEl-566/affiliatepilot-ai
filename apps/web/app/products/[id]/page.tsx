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

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<AffiliateProduct | null>(null);
  const [form, setForm] = useState<ProductFormState | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

      setForm({
        name: fetchedProduct.name || "",
        platformName: fetchedProduct.platformName || "",
        affiliateUrl: fetchedProduct.affiliateUrl || "",
        productUrl: fetchedProduct.productUrl || "",
        category: fetchedProduct.category || "",
        targetAudience: fetchedProduct.targetAudience || "",
        currency: fetchedProduct.currency || "GHS",
        price: String(fetchedProduct.price || ""),
        commissionType: fetchedProduct.commissionType || "unknown",
        commissionValue: String(fetchedProduct.commissionValue || ""),
        productSummary: fetchedProduct.productSummary || "",
        buyerPersona: fetchedProduct.buyerPersona || "",
        status: fetchedProduct.status || "draft",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProduct();
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

      setProduct(data.product);
      setSuccessMessage("Product updated successfully.");
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
              Edit product details, prepare campaign data, and later generate AI
              marketing assets for this product.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300">
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
                  placeholder="Later, the AI analyzer will fill this automatically."
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
                <button className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                  Generate AI analysis
                </button>

                <button className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300">
                  Generate campaign
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