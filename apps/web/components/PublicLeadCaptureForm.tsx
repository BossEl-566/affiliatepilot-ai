"use client";

import { FormEvent, useState } from "react";

type PublicLeadCaptureFormProps = {
  trackingCode: string;
  productName: string;
};

type PublicLeadResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

export function PublicLeadCaptureForm({
  trackingCode,
  productName,
}: PublicLeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");

  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!contact.trim()) {
        throw new Error(
          "Enter a phone number, email address, WhatsApp number, or social-media handle."
        );
      }

      const response = await fetch("/api/public/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingCode,
          name,
          contact,
          message,
          website,
          formStartedAt,
        }),
      });

      const data = (await response.json()) as PublicLeadResponse;

      if (!data.ok) {
        throw new Error(data.error || "Your message could not be submitted.");
      }

      setSuccessMessage(
        data.message ||
          "Thank you. Your details have been received successfully."
      );

      setName("");
      setContact("");
      setMessage("");
      setWebsite("");
      setFormStartedAt(Date.now());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
          Ask a question
        </p>

        <h2 className="mt-3 text-2xl font-black md:text-3xl">
          Need more information about {productName}?
        </h2>

        <p className="mt-3 text-sm leading-6 text-emerald-50/90">
          Leave your contact details and your question. You will receive a
          helpful response before deciding whether the product is suitable for
          your goal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-emerald-50">
              Name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="Your name"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-emerald-50">
              Contact details *
            </label>

            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              maxLength={180}
              required
              placeholder="WhatsApp, phone, email, or social handle"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-emerald-50">
            Question or message
          </label>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={1200}
            rows={4}
            placeholder="What would you like to know about this product?"
            className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
          />
        </div>

        {/* Honeypot field: hidden from real visitors */}
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <p className="text-xs leading-5 text-emerald-50/70">
          Do not enter passwords, card details, mobile-money PINs, or other
          sensitive financial information.
        </p>

        {errorMessage && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Request more information"}
        </button>
      </form>
    </section>
  );
}