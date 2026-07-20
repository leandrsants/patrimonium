export function formatBRL(value: number | null | undefined, opts?: { compact?: boolean }): string {
  const v = value ?? 0;
  if (opts?.compact && Math.abs(v) >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  return `${(value ?? 0).toFixed(digits)}%`;
}

export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split("-").map(Number);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function formatCompetencia(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m] = value.slice(0, 10).split("-").map(Number);
  return `${MESES[(m ?? 1) - 1]}/${y}`;
}

/** "CAC ÷ 0" e afins devem exibir travessão, nunca Infinity/NaN. */
export function safeRatio(numerador: number, denominador: number): number | null {
  if (!denominador || denominador === 0) return null;
  const r = numerador / denominador;
  if (!Number.isFinite(r)) return null;
  return r;
}
