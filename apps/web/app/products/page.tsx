"use client";

import { FormEvent, useEffect, useState } from "react";

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
  trustScore?: number;
  riskScore?: number;
  status: ProductStatus;
  createdAt?: string;
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
  status: ProductStatus;
};

const initialFormState: ProductFormState = {
  name: "",
  platformName: "",
  affiliateUrl: "",
  productUrl: "",
  category: "",
  targetAudience: "",
  currency: "GHS",
  price: "",
  commissionType: "unknown",
  commissionValue: "",
  status: "active",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchProducts() {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function updateForm<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      const response = await fetch("/api/products", {
        method: "POST",
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
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      setSuccessMessage("Product saved successfully.");
      setForm(initialFormState);
      await fetchProducts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              AffiliatePilot AI
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Product Vault
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Save affiliate products, links, commissions, target audiences,
              and product notes. This becomes the foundation for AI campaign
              generation later.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4">
            <p className="text-sm text-slate-300">Total products</p>
            <p className="mt-1 text-3xl font-bold text-cyan-300">
              {products.length}
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Add affiliate product</h2>
              <p className="mt-1 text-sm text-slate-400">
                Start with your Grodital link or any other affiliate product.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Product name *
                </label>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Grodital Digital Marketing Course"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Platform name
                </label>
                <input
                  value={form.platformName}
                  onChange={(event) =>
                    updateForm("platformName", event.target.value)
                  }
                  placeholder="Grodital, Selar, Jumia, Fiverr..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
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
                  placeholder="https://dashboard.grodital.com/buy?..."
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
                  placeholder="Main product page, if different from affiliate link"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Category
                  </label>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    placeholder="Digital Marketing"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Currency
                  </label>
                  <input
                    value={form.currency}
                    onChange={(event) =>
                      updateForm("currency", event.target.value)
                    }
                    placeholder="GHS"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
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
                  placeholder="Students, beginners, small business owners..."
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
                    placeholder="0"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Commission
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
                    Value
                  </label>
                  <input
                    type="number"
                    value={form.commissionValue}
                    onChange={(event) =>
                      updateForm("commissionValue", event.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
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
                className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving product..." : "Save product"}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Saved products</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Products you add here will later be used by the AI content
                  engine.
                </p>
              </div>

              <button
                onClick={fetchProducts}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                <p className="text-lg font-semibold">No products yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Add your first affiliate product using the form.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <article
                    key={product._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-cyan-400/50"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold">{product.name}</h3>
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                            {product.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {product.platformName || "Unknown platform"}{" "}
                          {product.category ? `• ${product.category}` : ""}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 px-3 py-2 text-right">
                        <p className="text-xs text-slate-400">Commission</p>
                        <p className="text-sm font-semibold text-white">
                          {product.commissionType === "percentage"
                            ? `${product.commissionValue || 0}%`
                            : product.commissionType === "fixed"
                              ? `${product.currency || "GHS"} ${
                                  product.commissionValue || 0
                                }`
                              : "Unknown"}
                        </p>
                      </div>
                    </div>

                    {product.targetAudience && (
                      <p className="mt-4 text-sm leading-6 text-slate-300">
                        <span className="font-semibold text-slate-100">
                          Audience:
                        </span>{" "}
                        {product.targetAudience}
                      </p>
                    )}

                    <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="truncate text-xs text-slate-400">
                        {product.affiliateUrl}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
                        View details
                      </button>
                      <button className="rounded-xl bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20">
                        Generate campaign
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}