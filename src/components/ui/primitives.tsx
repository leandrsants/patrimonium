import Link from "next/link";
import type { ReactNode } from "react";

type Accent = "neutral" | "vision" | "smile" | "extra" | "positive" | "negative" | "warning";

const ACCENT_TEXT: Record<Accent, string> = {
  neutral: "text-ink",
  vision: "text-vision",
  smile: "text-smile",
  extra: "text-extra",
  positive: "text-positive",
  negative: "text-negative",
  warning: "text-warning",
};

const ACCENT_DOT: Record<Accent, string> = {
  neutral: "bg-ink-dim",
  vision: "bg-vision",
  smile: "bg-smile",
  extra: "bg-extra",
  positive: "bg-positive",
  negative: "bg-negative",
  warning: "bg-warning",
};

export function Panel({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`rounded-xl2 border border-line bg-surface shadow-panel ${padded ? "p-5 md:p-6" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-2xs text-ink-faint md:text-xs">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  accent = "neutral",
  size = "md",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: Accent;
  size?: "md" | "lg";
}) {
  return (
    <div className="rounded-xl2 border border-line bg-surface p-5 shadow-panel transition-colors hover:border-line-strong">
      <p className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-faint">{label}</p>
      <p className={`mt-2 font-semibold tnum ${size === "lg" ? "text-[1.75rem] leading-8" : "text-2xl"} ${ACCENT_TEXT[accent]}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-2xs text-ink-dim">{hint}</p> : null}
    </div>
  );
}

export function MiniMetric({ label, value, accent = "neutral" }: { label: string; value: string; accent?: Accent }) {
  return (
    <div>
      <p className="text-2xs uppercase tracking-wide text-ink-dim">{label}</p>
      <p className={`mt-1 text-lg font-medium tnum ${ACCENT_TEXT[accent]}`}>{value}</p>
    </div>
  );
}

export function Badge({
  children,
  accent = "neutral",
  subtle = true,
}: {
  children: ReactNode;
  accent?: Accent;
  subtle?: boolean;
}) {
  const bg: Record<Accent, string> = {
    neutral: "bg-white/[0.06] text-ink-soft",
    vision: "bg-vision-dim text-vision",
    smile: "bg-smile-dim text-smile",
    extra: "bg-extra-dim text-extra",
    positive: "bg-positive-dim text-positive",
    negative: "bg-negative-dim text-negative",
    warning: "bg-warning-dim text-warning",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-medium ${subtle ? bg[accent] : ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ACCENT_DOT[accent]}`} />
      {children}
    </span>
  );
}

export function Progress({ value, accent = "vision" }: { value: number; accent?: Accent }) {
  const bar: Record<Accent, string> = {
    neutral: "bg-ink-soft",
    vision: "bg-gradient-to-r from-vision to-vision-soft",
    smile: "bg-gradient-to-r from-smile to-smile-soft",
    extra: "bg-extra",
    positive: "bg-positive",
    negative: "bg-negative",
    warning: "bg-warning",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div className={`h-full rounded-full transition-all ${bar[accent]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  cta,
  icon,
}: {
  title: string;
  description: string;
  cta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-line px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-ink-dim">{icon}</div> : null}
      <p className="text-sm font-medium text-ink-soft">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-ink-faint">{description}</p>
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">{children}</h3>;
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <span className="text-ink-faint">{label}</span>
      <span className="text-right text-ink-soft">{value ?? "—"}</span>
    </div>
  );
}

export function LinkCard({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="block rounded-xl2 border border-line bg-surface p-5 shadow-panel transition-colors hover:border-line-strong hover:bg-surface-hover">
      {children}
    </Link>
  );
}

export { ACCENT_TEXT, ACCENT_DOT };
export type { Accent };
