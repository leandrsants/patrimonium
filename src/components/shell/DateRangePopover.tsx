"use client";

import { useState } from "react";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function ymd(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function parseYmd(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
}
function fmtBR(s: string | null): string {
  if (!s) return "—";
  const { y, m, d } = parseYmd(s);
  return `${pad(d)}/${pad(m + 1)}/${y}`;
}

/**
 * Popover de seleção de intervalo (range) — calendário nativo do Patrimonium.
 * Trabalha com strings "YYYY-MM-DD" (comparáveis lexicograficamente e livres de
 * fuso), mesmo formato que `period.from`/`period.to` e as datas do banco.
 */
export function DateRangePopover({
  initialFrom,
  initialTo,
  onApply,
  onCancel,
}: {
  initialFrom: string;
  initialTo: string;
  onApply: (from: string, to: string) => void;
  onCancel: () => void;
}) {
  const [start, setStart] = useState<string | null>(initialFrom || null);
  const [end, setEnd] = useState<string | null>(initialTo || null);

  const now = new Date();
  const base = initialFrom ? parseYmd(initialFrom) : { y: now.getFullYear(), m: now.getMonth(), d: 1 };
  const [view, setView] = useState<{ y: number; m: number }>({ y: base.y, m: base.m });

  const hoje = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  function pickDay(s: string) {
    // Sem seleção ou intervalo já completo -> reinicia a partir da nova data.
    if (!start || (start && end)) {
      setStart(s);
      setEnd(null);
      return;
    }
    // Segundo clique: ordena automaticamente início/fim.
    if (s >= start) setEnd(s);
    else {
      setEnd(start);
      setStart(s);
    }
  }

  function prevMonth() {
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  }
  function nextMonth() {
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  }

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // segunda = 0
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function dayClasses(s: string): string {
    const isStart = start === s;
    const isEnd = end === s;
    const isEndpoint = isStart || isEnd;
    const inRange = !!start && !!end && s > start && s < end;

    if (isEndpoint) {
      const rounding =
        !end || start === end
          ? "rounded-lg2"
          : isStart
            ? "rounded-l-lg2 rounded-r-none"
            : "rounded-r-lg2 rounded-l-none";
      return `bg-ink font-semibold text-canvas ${rounding}`;
    }
    if (inRange) return "rounded-none bg-surface-hover text-ink";
    const hoje0 = s === hoje ? "ring-1 ring-line-strong" : "";
    return `rounded-lg2 text-ink-soft hover:bg-surface-hover hover:text-ink ${hoje0}`;
  }

  const canApply = !!start && !!end;

  return (
    <div className="w-[300px] max-w-[calc(100vw-1.5rem)] rounded-xl2 border border-line bg-surface-raised p-3 shadow-pop animate-scale-in">
      {/* Cabeçalho: navegação de mês */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label="Mês anterior"
          className="rounded-lg2 p-1.5 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-medium text-ink">
          {MESES[view.m]} {view.y}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Próximo mês"
          className="rounded-lg2 p-1.5 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1.5 text-2xs font-medium uppercase tracking-wide text-ink-dim">
            {w}
          </span>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />;
          const s = ymd(view.y, view.m, d);
          return (
            <button
              key={s}
              onClick={() => pickDay(s)}
              className={`flex h-9 items-center justify-center text-xs tnum transition-colors ${dayClasses(s)}`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Resumo do intervalo */}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
        <div className="rounded-lg2 border border-line bg-surface-input px-3 py-2">
          <span className="block text-2xs font-medium uppercase tracking-wide text-ink-faint">De</span>
          <span className="mt-0.5 block text-sm tnum text-ink">{fmtBR(start)}</span>
        </div>
        <div className="rounded-lg2 border border-line bg-surface-input px-3 py-2">
          <span className="block text-2xs font-medium uppercase tracking-wide text-ink-faint">Até</span>
          <span className="mt-0.5 block text-sm tnum text-ink">{fmtBR(end)}</span>
        </div>
      </div>

      {/* Ações */}
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="inline-flex h-9 items-center rounded-lg2 border border-line-strong bg-surface-raised px-3.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
        >
          Cancelar
        </button>
        <button
          onClick={() => canApply && onApply(start!, end!)}
          disabled={!canApply}
          className="inline-flex h-9 items-center rounded-lg2 bg-ink px-3.5 text-sm font-medium text-canvas transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
