"use client";

import { useEffect, useState } from "react";

type AiStatusResponse = {
  ok: boolean;
  ai?: {
    provider: string;
    configured: boolean;
    mode: string;
    model: string;
  };
  error?: string;
};

export function AiStatusBadge({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<AiStatusResponse["ai"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchAiStatus() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/ai/status", {
        cache: "no-store",
      });

      const data = (await response.json()) as AiStatusResponse;

      if (!data.ok || !data.ai) {
        throw new Error(data.error || "Could not load AI status");
      }

      setStatus(data.ai);
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAiStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400">
        Checking AI...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">
        AI status unavailable
      </div>
    );
  }

  const isGemini = status.mode === "gemini" && status.configured;

  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        isGemini
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
          : "border-amber-400/20 bg-amber-500/10 text-amber-100"
      }`}
    >
      <p className="text-xs font-bold">
        {isGemini ? "Gemini AI active" : "Local fallback active"}
      </p>

      {!compact && (
        <p className="mt-1 text-[11px] opacity-80">
          {isGemini ? status.model : "Rule-based generator"}
        </p>
      )}
    </div>
  );
}