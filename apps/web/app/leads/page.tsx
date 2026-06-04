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
  | "website"
  | "other";

type LeadStatus =
  | "all"
  | "new"
  | "contacted"
  | "interested"
  | "converted"
  | "not_interested";

type ProductStatus = "draft" | "active" | "paused" | "archived";

type AffiliateProduct = {
  _id: string;
  name: string;
  platformName?: string;
  status: ProductStatus;
};

type Lead = {
  _id: string;
  affiliateProductId?: string;
  platform: Platform;
  name?: string;
  username?: string;
  contact?: string;
  source?: string;
  message?: string;
  notes?: string;
  interestLevel: number;
  status: Exclude<LeadStatus, "all">;
  createdAt?: string;
  updatedAt?: string;
  affiliateProduct?: {
    _id: string;
    name: string;
    platformName?: string;
    trackingCode?: string;
  } | null;
};

type LeadFormState = {
  affiliateProductId: string;
  platform: Platform;
  name: string;
  username: string;
  contact: string;
  source: string;
  message: string;
  notes: string;
  interestLevel: string;
  status: Exclude<LeadStatus, "all">;
};

type AiReplySuggestion = {
  reply: string;
  followUpQuestion: string;
  riskNotes: string[];
};

type AiReplyResponse = {
  ok: boolean;
  suggestion?: AiReplySuggestion;
  aiMode?: "gemini" | "fallback";
  warning?: string;
  error?: string;
};
const initialFormState: LeadFormState = {
  affiliateProductId: "",
  platform: "other",
  name: "",
  username: "",
  contact: "",
  source: "",
  message: "",
  notes: "",
  interestLevel: "3",
  status: "new",
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
    website: "Website",
    other: "Other",
  };

  return labels[platform] || platform;
}

function statusClasses(status: string) {
  const classes: Record<string, string> = {
    new: "bg-cyan-400/10 text-cyan-300",
    contacted: "bg-violet-400/10 text-violet-300",
    interested: "bg-emerald-400/10 text-emerald-300",
    converted: "bg-yellow-400/10 text-yellow-300",
    not_interested: "bg-slate-400/10 text-slate-300",
  };

  return classes[status] || "bg-white/10 text-slate-300";
}

function formatStatus(status: string) {
  return status.replace("_", " ");
}

function formatDate(value?: string) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleString();
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [form, setForm] = useState<LeadFormState>(initialFormState);

  const [statusFilter, setStatusFilter] = useState<LeadStatus>("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");

  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [aiSuggestions, setAiSuggestions] = useState<
  Record<string, AiReplySuggestion>
>({});

const [aiSuggestionModes, setAiSuggestionModes] = useState<
  Record<string, string>
>({});

const [aiSuggestionWarnings, setAiSuggestionWarnings] = useState<
  Record<string, string>
>({});

const [generatingReplyLeadId, setGeneratingReplyLeadId] = useState("");

  async function fetchLeads() {
    try {
      setIsLoadingLeads(true);
      setErrorMessage("");

      const response = await fetch("/api/leads", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }

      setLeads(data.leads);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoadingLeads(false);
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
    fetchLeads();
    fetchProducts();
  }, []);

  function updateForm<K extends keyof LeadFormState>(
    key: K,
    value: LeadFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!form.name.trim() && !form.username.trim() && !form.contact.trim()) {
        throw new Error("Add at least a name, username, or contact.");
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affiliateProductId: form.affiliateProductId || undefined,
          platform: form.platform,
          name: form.name,
          username: form.username,
          contact: form.contact,
          source: form.source,
          message: form.message,
          notes: form.notes,
          interestLevel: Number(form.interestLevel || 1),
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      setSuccessMessage("Lead saved successfully.");
      setForm(initialFormState);
      await fetchLeads();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateLeadStatus(
    lead: Lead,
    status: Exclude<LeadStatus, "all">
  ) {
    try {
      setUpdatingLeadId(lead._id);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affiliateProductId: lead.affiliateProductId,
          platform: lead.platform,
          name: lead.name,
          username: lead.username,
          contact: lead.contact,
          source: lead.source,
          message: lead.message,
          notes: lead.notes,
          interestLevel: lead.interestLevel,
          status,
          convertedAt: status === "converted" ? new Date().toISOString() : "",
          lastContactedAt:
            status === "contacted" || status === "interested"
              ? new Date().toISOString()
              : "",
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      setSuccessMessage("Lead updated.");
      await fetchLeads();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setUpdatingLeadId("");
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const statusMatches =
        statusFilter === "all" || lead.status === statusFilter;

      const platformMatches =
        platformFilter === "all" || lead.platform === platformFilter;

      return statusMatches && platformMatches;
    });
  }, [leads, statusFilter, platformFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((lead) => lead.status === "new").length,
      interested: leads.filter((lead) => lead.status === "interested").length,
      converted: leads.filter((lead) => lead.status === "converted").length,
      averageInterest:
        leads.length === 0
          ? 0
          : leads.reduce((sum, lead) => sum + (lead.interestLevel || 0), 0) /
            leads.length,
    };
  }, [leads]);

  async function generateAiReply(leadId: string) {
  try {
    setGeneratingReplyLeadId(leadId);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(`/api/leads/${leadId}/suggest-reply`, {
      method: "POST",
    });

    const data = (await response.json()) as AiReplyResponse;

    if (!data.ok || !data.suggestion) {
      throw new Error(data.error || "Failed to generate AI reply");
    }

    setAiSuggestions((current) => ({
      ...current,
      [leadId]: data.suggestion as AiReplySuggestion,
    }));

    setAiSuggestionModes((current) => ({
      ...current,
      [leadId]: data.aiMode || "fallback",
    }));

    setAiSuggestionWarnings((current) => ({
      ...current,
      [leadId]: data.warning || "",
    }));

    setSuccessMessage(
      data.aiMode === "gemini"
        ? "Gemini reply generated successfully."
        : "Fallback reply generated successfully."
    );
  } catch (error) {
    setErrorMessage(
      error instanceof Error ? error.message : "Something went wrong"
    );
  } finally {
    setGeneratingReplyLeadId("");
  }
}

async function copyAiReply(
  suggestion: AiReplySuggestion,
  includeFollowUp = false
) {
  try {
    const text = includeFollowUp
      ? `${suggestion.reply}\n\n${suggestion.followUpQuestion}`
      : suggestion.reply;

    await navigator.clipboard.writeText(text);

    setSuccessMessage(
      includeFollowUp
        ? "AI reply and follow-up question copied."
        : "AI reply copied."
    );

    setErrorMessage("");
  } catch {
    setErrorMessage("Could not copy AI reply.");
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
                Lead Inbox
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Record people who comment, DM, ask questions, or show buying
                interest. Later, we can connect this to platform inboxes.
              </p>
            </div>

            <button
              onClick={fetchLeads}
              disabled={isLoadingLeads}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingLeads ? "Refreshing..." : "Refresh leads"}
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Total leads</p>
            <p className="mt-2 text-4xl font-black text-white">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">New</p>
            <p className="mt-2 text-4xl font-black text-cyan-300">
              {stats.new}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Interested</p>
            <p className="mt-2 text-4xl font-black text-emerald-300">
              {stats.interested}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Converted</p>
            <p className="mt-2 text-4xl font-black text-yellow-300">
              {stats.converted}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleCreateLead}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20"
          >
            <div className="mb-5">
              <h2 className="text-xl font-semibold">Add lead</h2>
              <p className="mt-1 text-sm text-slate-400">
                Add people who interact with your affiliate content.
              </p>
            </div>

            <div className="space-y-4">
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

              <div className="grid gap-4 md:grid-cols-2">
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
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
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
                        event.target.value as LeadFormState["status"]
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="interested">Interested</option>
                    <option value="converted">Converted</option>
                    <option value="not_interested">Not Interested</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Samuel"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Username
                  </label>
                  <input
                    value={form.username}
                    onChange={(event) =>
                      updateForm("username", event.target.value)
                    }
                    placeholder="@username"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Contact
                </label>
                <input
                  value={form.contact}
                  onChange={(event) =>
                    updateForm("contact", event.target.value)
                  }
                  placeholder="Phone, email, Telegram handle, WhatsApp..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Source
                </label>
                <input
                  value={form.source}
                  onChange={(event) => updateForm("source", event.target.value)}
                  placeholder="Commented START, replied to story, asked in DM..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Message / question
                </label>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    updateForm("message", event.target.value)
                  }
                  rows={3}
                  placeholder="What did the person ask or say?"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  rows={3}
                  placeholder="Follow-up notes, objections, next action..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Interest level: {form.interestLevel}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={form.interestLevel}
                  onChange={(event) =>
                    updateForm("interestLevel", event.target.value)
                  }
                  className="w-full"
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
                className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving lead..." : "Save lead"}
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Saved leads</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Showing {filteredLeads.length} of {leads.length} leads.
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
                  <option value="website">Website</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as LeadStatus)
                  }
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="converted">Converted</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>
            </div>

            {isLoadingLeads ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-300">
                Loading leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center">
                <p className="text-lg font-semibold">No leads found</p>
                <p className="mt-2 text-sm text-slate-400">
                  Add a lead when someone comments, DMs, or asks for product
                  details.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredLeads.map((lead) => (
                  <article
                    key={lead._id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-cyan-400/50"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                            {formatPlatformName(lead.platform)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClasses(
                              lead.status
                            )}`}
                          >
                            {formatStatus(lead.status)}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                            Interest {lead.interestLevel}/5
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-bold text-white">
                          {lead.name || lead.username || lead.contact}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {lead.affiliateProduct?.name || "No product attached"}
                        </p>

                        {lead.username && (
                          <p className="mt-1 text-sm text-slate-400">
                            Username: {lead.username}
                          </p>
                        )}

                        {lead.contact && (
                          <p className="mt-1 text-sm text-slate-400">
                            Contact: {lead.contact}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updatingLeadId === lead._id}
                          onClick={() => updateLeadStatus(lead, "contacted")}
                          className="rounded-xl bg-violet-400/10 px-4 py-2 text-xs font-bold text-violet-300 transition hover:bg-violet-400/20 disabled:opacity-60"
                        >
                          Contacted
                        </button>

                        <button
                          type="button"
                          disabled={updatingLeadId === lead._id}
                          onClick={() => updateLeadStatus(lead, "interested")}
                          className="rounded-xl bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-60"
                        >
                          Interested
                        </button>

                        <button
                          type="button"
                          disabled={updatingLeadId === lead._id}
                          onClick={() => updateLeadStatus(lead, "converted")}
                          className="rounded-xl bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-300 transition hover:bg-yellow-400/20 disabled:opacity-60"
                        >
                          Converted
                        </button>
                      </div>
                    </div>

                    {lead.source && (
                      <p className="mt-4 text-sm text-slate-300">
                        <span className="font-semibold text-white">
                          Source:
                        </span>{" "}
                        {lead.source}
                      </p>
                    )}

                    {lead.message && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                          Message
                        </p>
                        <p className="text-sm leading-6 text-slate-300">
                          {lead.message}
                        </p>
                      </div>
                    )}

                    {lead.notes && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                          Notes
                        </p>
                        <p className="text-sm leading-6 text-slate-300">
                          {lead.notes}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-sm font-bold text-violet-100">
        AI reply assistant
      </p>

      <p className="mt-1 text-xs leading-5 text-violet-200/80">
        Generate a professional reply based on this lead&apos;s question and
        attached product.
      </p>
    </div>

    <button
      type="button"
      onClick={() => generateAiReply(lead._id)}
      disabled={generatingReplyLeadId === lead._id}
      className="rounded-xl bg-violet-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {generatingReplyLeadId === lead._id
        ? "Generating..."
        : aiSuggestions[lead._id]
          ? "Regenerate reply"
          : "Generate AI reply"}
    </button>
  </div>

  {aiSuggestions[lead._id] && (
    <div className="mt-4 grid gap-3">
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
            Suggested reply
          </p>

          <span
            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
              aiSuggestionModes[lead._id] === "gemini"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-amber-400/10 text-amber-300"
            }`}
          >
            {aiSuggestionModes[lead._id] === "gemini"
              ? "Gemini"
              : "Fallback"}
          </span>
        </div>

        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-200">
          {aiSuggestions[lead._id].reply}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
          Follow-up question
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-200">
          {aiSuggestions[lead._id].followUpQuestion}
        </p>
      </div>

      {aiSuggestions[lead._id].riskNotes.length > 0 && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
            Reply notes
          </p>

          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-amber-100">
            {aiSuggestions[lead._id].riskNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {aiSuggestionWarnings[lead._id] && (
        <p className="text-xs leading-5 text-amber-200">
          {aiSuggestionWarnings[lead._id]}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copyAiReply(aiSuggestions[lead._id])}
          className="rounded-xl bg-violet-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-violet-300"
        >
          Copy reply
        </button>

        <button
          type="button"
          onClick={() => copyAiReply(aiSuggestions[lead._id], true)}
          className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-bold text-violet-200 transition hover:bg-violet-400/20"
        >
          Copy reply + follow-up
        </button>
      </div>
    </div>
  )}
</div>

                    <p className="mt-4 text-xs text-slate-500">
                      Added: {formatDate(lead.createdAt)}
                    </p>
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