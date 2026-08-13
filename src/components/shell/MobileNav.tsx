"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-vision to-smile">
            <span className="text-2xs font-bold text-on-accent">P</span>
          </div>
          <span className="text-sm font-semibold text-ink">Patrimonium</span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex gap-1 overflow-x-auto px-3 pb-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg2 px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-surface-raised text-ink" : "text-ink-faint"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
