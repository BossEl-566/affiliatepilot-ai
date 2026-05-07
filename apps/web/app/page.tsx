import Link from "next/link";


export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-5 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
          AffiliatePilot AI
        </p>

        <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-7xl">
          Your AI-powered affiliate marketing operating system.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
          Manage affiliate products, generate campaigns, upload media, schedule
          content, track clicks, and improve your marketing every week.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Open Product Vault
          </Link>
          <Link
            href="/content"
            className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Open Content Studio
          </Link>
          <Link
            href="/media"
            className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Open Media Library
          </Link>

          <a
            href="/api/health"
            className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Check API Health
          </a>
        </div>
      </section>
    </main>
  );
}