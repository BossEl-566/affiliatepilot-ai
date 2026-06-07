"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { AiStatusBadge } from "@/components/AiStatusBadge";

type AppShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  label: string;
  shortLabel: string;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "DB",
  },
  {
    href: "/products",
    label: "Product Vault",
    shortLabel: "PV",
  },
  {
    href: "/content",
    label: "Content Studio",
    shortLabel: "CS",
  },
  {
    href: "/media",
    label: "Media Library",
    shortLabel: "ML",
  },
  {
    href: "/schedule",
    label: "Publishing Queue",
    shortLabel: "PQ",
  },
  {
    href: "/analytics",
    label: "Analytics",
    shortLabel: "AN",
  },
  {
    href: "/optimizer",
    label: "Weekly Optimizer",
    shortLabel: "WO",
  },
  {
    href: "/leads",
    label: "Lead Inbox",
    shortLabel: "LI",
  },
  {
    href: "/templates",
    label: "Message Templates",
    shortLabel: "MT",
  },
  {
    href: "/sales",
    label: "Revenue Tracker",
    shortLabel: "RT",
  },
  {
  href: "/planner",
  label: "7-Day Planner",
  shortLabel: "7D",
},
];

function SidebarLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function isActiveRoute(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="grid gap-2">
      {navigationItems.map((item) => {
        const isActive = isActiveRoute(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
              isActive
                ? "bg-cyan-400 text-slate-950"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black tracking-wide ${
                isActive
                  ? "bg-slate-950/15 text-slate-950"
                  : "bg-white/10 text-cyan-300"
              }`}
            >
              {item.shortLabel}
            </span>

            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function CurrentModeCard() {
  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  return (
    <div className="mt-4 shrink-0 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
        Current mode
      </p>

      <p className="mt-2 text-sm leading-6 text-cyan-50">
        Manual publishing with analytics and lead tracking.
      </p>

      <div className="mt-3">
        <AiStatusBadge compact />
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
      >
        Sign out
      </button>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

if (
  pathname === "/login" ||
  pathname === "/offer" ||
  pathname.startsWith("/offer/")
) {
  return <>{children}</>;
}

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="font-black tracking-tight">
          AffiliatePilot <span className="text-cyan-300">AI</span>
        </Link>

        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-300"
        >
          Menu
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-72 flex-col overflow-hidden border-r border-white/10 bg-slate-950 px-4 py-6 lg:flex">
        <Link href="/dashboard" className="block shrink-0 px-2">
          <p className="text-lg font-black tracking-tight">
            AffiliatePilot <span className="text-cyan-300">AI</span>
          </p>

          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
            Marketing OS
          </p>
        </Link>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          <SidebarLinks />
        </div>

        <CurrentModeCard />
      </aside>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <aside className="absolute inset-y-0 left-0 flex h-screen w-[88%] max-w-sm flex-col overflow-hidden border-r border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-black tracking-tight"
              >
                AffiliatePilot <span className="text-cyan-300">AI</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <SidebarLinks onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>

            <CurrentModeCard />
          </aside>
        </div>
      )}

      {/* Page content */}
      <div className="min-h-screen pt-16 lg:pl-72 lg:pt-0">{children}</div>
    </div>
  );
}