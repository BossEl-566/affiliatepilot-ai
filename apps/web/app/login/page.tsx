"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  ok: boolean;
  redirectTo?: string;
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");

    if (from?.startsWith("/") && !from.startsWith("//")) {
      setRedirectTo(from);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          redirectTo,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!data.ok) {
        throw new Error(data.error || "Login failed.");
      }

      router.replace(data.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
          AffiliatePilot AI
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Private Admin Login
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Enter your private dashboard password to access products, leads,
          analytics, media, and revenue information.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Open dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}