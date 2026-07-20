import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  accent = "neutral",
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: "neutral" | "vision" | "smile";
  actions?: ReactNode;
}) {
  const eyebrowColor = accent === "vision" ? "text-vision" : accent === "smile" ? "text-smile" : "text-ink-faint";
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className={`text-2xs font-semibold uppercase tracking-[0.12em] ${eyebrowColor}`}>{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-faint">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
