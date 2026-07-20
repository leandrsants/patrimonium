export type PeriodKind = "mes" | "trimestre" | "ano" | "custom" | "meta";

export type Period = {
  kind: PeriodKind;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  label: string;
};

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Resolve o período a partir dos searchParams da rota. Default: mês corrente. */
export function resolvePeriod(sp: Record<string, string | string[] | undefined>): Period {
  const kind = (typeof sp.periodo === "string" ? sp.periodo : "mes") as PeriodKind;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (kind === "ano") {
    return { kind, from: `${y}-01-01`, to: `${y}-12-31`, label: `${y}` };
  }
  if (kind === "trimestre") {
    const q = Math.floor(m / 3);
    const startM = q * 3;
    const from = new Date(y, startM, 1);
    const to = new Date(y, startM + 3, 0);
    return { kind, from: iso(from), to: iso(to), label: `${q + 1}º trimestre ${y}` };
  }
  if (kind === "meta") {
    return { kind, from: "2026-06-22", to: "2026-12-31", label: "Ciclo Meta 10K" };
  }
  if (kind === "custom") {
    const from = typeof sp.from === "string" ? sp.from : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const to = typeof sp.to === "string" ? sp.to : iso(new Date(y, m + 1, 0));
    return { kind, from, to, label: "Personalizado" };
  }

  // mês corrente (default)
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);
  return { kind: "mes", from: iso(from), to: iso(to), label: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) };
}

export function inRange(date: string | null | undefined, period: Period): boolean {
  if (!date) return false;
  const d = date.slice(0, 10);
  return d >= period.from && d <= period.to;
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

/** Ranges rápidos para produtividade: hoje, últimos 7 dias, mês corrente. */
export function quickRanges(): { hoje: [string, string]; semana: [string, string]; mes: [string, string] } {
  const now = new Date();
  const t = now.toISOString().slice(0, 10);
  const wStart = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
  const mStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { hoje: [t, t], semana: [wStart, t], mes: [mStart, mEnd] };
}

export function inRangePair(date: string | null | undefined, range: [string, string]): boolean {
  if (!date) return false;
  const d = date.slice(0, 10);
  return d >= range[0] && d <= range[1];
}
