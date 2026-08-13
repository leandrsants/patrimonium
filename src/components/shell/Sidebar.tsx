"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

function dot(active: boolean, color: string) {
  return <span className={`h-1.5 w-1.5 rounded-full ${active ? color : "bg-transparent"}`} />;
}

const ACCENT: Record<string, string> = {
  vision: "bg-vision",
  smile: "bg-smile",
  extras: "bg-extra",
  metas: "bg-vision",
  patrimonio: "bg-positive",
};

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden shrink-0 flex-col border-r border-line bg-surface px-3 py-6 md:flex md:w-56 lg:w-64">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg2 bg-gradient-to-br from-vision via-vision-soft to-smile">
          <span className="text-sm font-bold text-on-accent">P</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-ink">Patrimonium</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-lg2 px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-surface-hover text-ink shadow-panel" : "text-ink-faint hover:bg-surface-raised hover:text-ink-soft"
              }`}
            >
              <span>{item.label}</span>
              {ACCENT[item.key] ? dot(active, ACCENT[item.key]) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-line px-2 pt-4">
        <span className="text-2xs text-ink-dim">v0.2 · local</span>
      </div>
    </aside>
  );
}
