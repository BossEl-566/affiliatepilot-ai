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

type SaleStatus = "pending" | "confirmed" | "paid" | "refunded" | "cancelled";

type AffiliateProduct = {
  _id: string;
  name: string;
  platformName?: string;
};

type Lead = {
  _id: string;
  name?: string;
  username?: string;
  contact?: string;
};

type Sale = {
  _id: string;
  affiliateProductId: string;
  leadId?: string;
  platform: Platform;
  customerName?: string;
  currency: string;
  saleAmount: number;
  commissionEarned: number;
  status: SaleStatus;
  notes?: string;
  soldAt?: string;
  affiliateProduct?: AffiliateProduct | null;
  lead?: Lead | null;
};

type SalesStats = {
  totalSales: number;
  confirmedSales: number;
  totalRevenue: number;
  totalCommission: number;
};

type FormState = {
  affiliateProductId: string;
  leadId: string;
  platform: Platform;
  customerName: string;
  currency: string;
  saleAmount: string;
  commissionEarned: string;
  status: SaleStatus;
  notes: string;
  soldAt: string;
};

const initialFormState: FormState = {
  affiliateProductId: "",
  leadId: "",
  platform: "other",
  customerName: "",
  currency: "GHS",
  saleAmount: "",
  commissionEarned: "",
  status: "confirmed",
  notes: "",
  soldAt: "",
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

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function statusClasses(status: SaleStatus) {
  const classes: Record<SaleStatus, string> = {
    pending: "bg-amber-400/10 text-amber-300",
    confirmed: "bg-cyan-400/10 text-cyan-300",
    paid: "bg-emerald-400/10 text-emerald-300",
    refunded: "bg-red-400/10 text-red-300",
    cancelled: "bg-slate-400/10 text-slate-300",
  };

  return classes[status];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);

  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    confirmedSales: 0,
    totalRevenue: 0,
    totalCommission: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function fetchSales() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/sales", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch sales");
      }

      setSales(data.sales);
      setStats(data.stats);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProducts() {
    const response = await fetch("/api/products", {
      cache: "no-store",
    });

    const data = await response.json();

    if (data.ok) {
      setProducts(data.products);
    }
  }

  async function fetchLeads() {
    const response = await fetch("/api/leads", {
      cache: "no-store",
    });

    const data = await response.json();

    if (data.ok) {
      setLeads(data.leads);
    }
  }

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchLeads();
  }, []);

  function updateForm<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleCreateSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!form.affiliateProductId) {
        throw new Error("Select a product.");
      }

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affiliateProductId: form.affiliateProductId,
          leadId: form.leadId || undefined,
          platform: form.platform,
          customerName: form.customerName,
          currency: form.currency,
          saleAmount: Number(form.saleAmount || 0),
          commissionEarned: Number(form.commissionEarned || 0),
          status: form.status,
          notes: form.notes,
          soldAt: form.soldAt || undefined,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save sale");
      }

      setForm(initialFormState);
      setSuccessMessage("Sale recorded successfully.");
      await fetchSales();
      await fetchLeads();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  }

  const salesByProduct = useMemo(() => {
    const map = new Map<string, number>();

    for (const sale of sales) {
      if (sale.status !== "confirmed" && sale.status !== "paid") continue;

      const name = sale.affiliateProduct?.name || "Unknown product";
      map.set(name, (map.get(name) || 0) + Number(sale.commissionEarned || 0));
    }

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sales]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <Link
            href="/analytics"
            className="mb-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Analytics
          </Link>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Revenue Tracker
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Record affiliate sales and commissions so you can measure actual
            income, not only clicks.
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

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">All sales</p>
            <p className="mt-2 text-4xl font-black">{stats.totalSales}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Confirmed sales</p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {stats.confirmedSales}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Revenue</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">
              GHS {stats.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Commission earned</p>
            <p className="mt-2 text-3xl font-black text-yellow-300">
              GHS {stats.totalCommission.toFixed(2)}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleCreateSale}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
          >
            <h2 className="text-xl font-semibold">Record sale</h2>

            <div className="mt-5 space-y-4">
              <select
                value={form.affiliateProductId}
                onChange={(event) =>
                  updateForm("affiliateProductId", event.target.value)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <select
                value={form.leadId}
                onChange={(event) => updateForm("leadId", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
              >
                <option value="">No lead attached</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name || lead.username || lead.contact || "Lead"}
                  </option>
                ))}
              </select>

              <select
                value={form.platform}
                onChange={(event) =>
                  updateForm("platform", event.target.value as Platform)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
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

              <input
                value={form.customerName}
                onChange={(event) =>
                  updateForm("customerName", event.target.value)
                }
                placeholder="Customer name"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={form.currency}
                  onChange={(event) =>
                    updateForm("currency", event.target.value)
                  }
                  placeholder="GHS"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
                />

                <input
                  type="number"
                  value={form.saleAmount}
                  onChange={(event) =>
                    updateForm("saleAmount", event.target.value)
                  }
                  placeholder="Sale amount"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
                />

                <input
                  type="number"
                  value={form.commissionEarned}
                  onChange={(event) =>
                    updateForm("commissionEarned", event.target.value)
                  }
                  placeholder="Commission"
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
                />
              </div>

              <select
                value={form.status}
                onChange={(event) =>
                  updateForm("status", event.target.value as SaleStatus)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <input
                type="datetime-local"
                value={form.soldAt}
                onChange={(event) => updateForm("soldAt", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
              />

              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Notes"
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
              />

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Record sale"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold">Recorded sales</h2>

            {isLoading ? (
              <p className="mt-5 text-sm text-slate-300">Loading sales...</p>
            ) : sales.length === 0 ? (
              <p className="mt-5 text-sm text-slate-400">
                No sales recorded yet.
              </p>
            ) : (
              <div className="mt-5 grid gap-4">
                {sales.map((sale) => (
                  <article
                    key={sale._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
                        {formatPlatform(sale.platform)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs capitalize ${statusClasses(
                          sale.status
                        )}`}
                      >
                        {sale.status}
                      </span>
                    </div>

                    <h3 className="mt-3 font-bold">
                      {sale.affiliateProduct?.name || "Unknown product"}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      Revenue: {sale.currency} {sale.saleAmount.toFixed(2)}
                    </p>

                    <p className="text-sm text-emerald-300">
                      Commission: {sale.currency}{" "}
                      {sale.commissionEarned.toFixed(2)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(sale.soldAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {salesByProduct.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-bold">Commission by product</h3>

                <div className="mt-3 space-y-2">
                  {salesByProduct.map(([name, commission]) => (
                    <div
                      key={name}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <span className="text-slate-300">{name}</span>
                      <span className="font-bold text-yellow-300">
                        GHS {commission.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}