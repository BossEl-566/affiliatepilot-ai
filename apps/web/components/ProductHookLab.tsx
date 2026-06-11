"use client";

import { useMemo, useState } from "react";

type HookLabIdea = {
  _id?: string;
  platform: string;
  style: string;
  hook: string;
  captionStarter: string;
  callToAction: string;
};

type ProductHookLabProps = {
  productId: string;
  productName: string;
  initialIdeas?: HookLabIdea[];
  initialMode?: string;
};

type HookLabResponse = {
  ok: boolean;
  ideas?: HookLabIdea[];
  aiMode?: string;
  warning?: string;
  error?: string;
};

function formatStyle(style: string) {
  return style
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPlatform(platform: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    x: "X",
  };

  return labels[platform] || platform;
}

export function ProductHookLab({
  productId,
  productName,
  initialIdeas = [],
  initialMode = "",
}: ProductHookLabProps) {
  const [platform, setPlatform] = useState("instagram");
  const [ideas, setIdeas] = useState<HookLabIdea[]>(
    initialIdeas
  );

  const [winnerIndex, setWinnerIndex] = useState<number | null>(
    null
  );

  const [aiMode, setAiMode] = useState(initialMode);
  const [warningMessage, setWarningMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const winner = useMemo(() => {
    if (winnerIndex === null) return null;

    return ideas[winnerIndex] || null;
  }, [ideas, winnerIndex]);

  async function generateHooks() {
    try {
      setIsGenerating(true);
      setErrorMessage("");
      setSuccessMessage("");
      setWarningMessage("");
      setWinnerIndex(null);

      const response = await fetch(
        `/api/products/${productId}/generate-hooks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform,
          }),
        }
      );

      const data = (await response.json()) as HookLabResponse;

      if (!data.ok || !data.ideas) {
        throw new Error(
          data.error || "Failed to generate hook ideas"
        );
      }

      setIdeas(data.ideas);
      setAiMode(data.aiMode || "fallback");
      setWarningMessage(data.warning || "");
      setSuccessMessage(
        `Generated ${data.ideas.length} hooks for ${formatPlatform(
          platform
        )}.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function spinWinner() {
    if (!ideas.length) {
      setErrorMessage("Generate hooks before spinning.");
      return;
    }

    setIsSpinning(true);
    setErrorMessage("");
    setSuccessMessage("");

    let spins = 0;

    const interval = window.setInterval(() => {
      setWinnerIndex(
        Math.floor(Math.random() * ideas.length)
      );

      spins += 1;

      if (spins >= 14) {
        window.clearInterval(interval);

        const finalIndex = Math.floor(
          Math.random() * ideas.length
        );

        setWinnerIndex(finalIndex);
        setIsSpinning(false);
        setSuccessMessage("Winner selected. Test this hook next.");
      }
    }, 90);
  }

  async function copyText(
    text: string,
    successMessage: string
  ) {
    await navigator.clipboard.writeText(text);

    setSuccessMessage(successMessage);
    setErrorMessage("");
  }

  function buildPostStarter(idea: HookLabIdea) {
    return [
      idea.hook,
      "",
      idea.captionStarter,
      "",
      `👉 ${idea.callToAction}`,
    ].join("\n");
  }

  return (
    <section className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-200">
            AI Hook Lab
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Content roulette for {productName}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-fuchsia-100/80">
            Generate multiple hooks, spin for a random winner, then
            test the winning idea in your next post.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={platform}
            onChange={(event) =>
              setPlatform(event.target.value)
            }
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400"
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="x">X</option>
          </select>

          <button
            type="button"
            onClick={generateHooks}
            disabled={isGenerating}
            className="rounded-2xl bg-fuchsia-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating
              ? "Generating hooks..."
              : "Generate 12 hooks"}
          </button>

          <button
            type="button"
            onClick={spinWinner}
            disabled={!ideas.length || isSpinning}
            className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-5 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSpinning ? "Spinning..." : "🎯 Spin winner"}
          </button>
        </div>
      </div>

      {aiMode && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              aiMode === "gemini"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-amber-400/10 text-amber-300"
            }`}
          >
            {aiMode === "gemini"
              ? "Gemini AI"
              : "Local fallback"}
          </span>

          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
            {ideas.length} ideas
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {successMessage}
        </div>
      )}

      {warningMessage && (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          {warningMessage}
        </div>
      )}

      {winner && (
        <section className="mt-5 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
            🎯 Winning hook
          </p>

          <h3 className="mt-3 text-2xl font-black leading-tight text-white">
            {winner.hook}
          </h3>

          <p className="mt-3 text-sm leading-6 text-yellow-50/90">
            {winner.captionStarter}
          </p>

          <p className="mt-3 text-sm font-bold text-yellow-200">
            CTA: {winner.callToAction}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                copyText(
                  winner.hook,
                  "Winning hook copied."
                )
              }
              className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-yellow-300"
            >
              Copy hook
            </button>

            <button
              type="button"
              onClick={() =>
                copyText(
                  buildPostStarter(winner),
                  "Winning post starter copied."
                )
              }
              className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-100 transition hover:bg-yellow-400/20"
            >
              Copy post starter
            </button>
          </div>
        </section>
      )}

      {ideas.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center">
          <p className="font-semibold text-white">
            No hooks generated yet
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Pick a platform and generate twelve content ideas.
          </p>
        </div>
      ) : (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea, index) => {
            const isWinner = winnerIndex === index;

            return (
              <article
                key={idea._id || `${idea.style}-${index}`}
                className={`rounded-2xl border p-4 transition ${
                  isWinner
                    ? "border-yellow-400/60 bg-yellow-400/10"
                    : "border-white/10 bg-slate-950/40 hover:border-fuchsia-400/40"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-fuchsia-400/10 px-3 py-1 text-xs font-bold text-fuchsia-200">
                    {formatStyle(idea.style)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                    {formatPlatform(idea.platform)}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-black leading-7 text-white">
                  {idea.hook}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {idea.captionStarter}
                </p>

                <p className="mt-3 text-xs font-bold text-emerald-300">
                  CTA: {idea.callToAction}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        idea.hook,
                        "Hook copied successfully."
                      )
                    }
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                  >
                    Copy hook
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        buildPostStarter(idea),
                        "Post starter copied successfully."
                      )
                    }
                    className="rounded-xl bg-fuchsia-400/10 px-3 py-2 text-xs font-bold text-fuchsia-200 transition hover:bg-fuchsia-400/20"
                  >
                    Copy starter
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
}