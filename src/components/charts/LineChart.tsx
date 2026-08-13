"use client";

import { useId, useRef, useState } from "react";
import { formatBRL } from "@/lib/format";
import type { FaturamentoPonto } from "@/lib/metrics";

const COR_ATUAL = "rgb(var(--vision))";
const COR_ANTERIOR = "rgb(var(--ink-faint))";

/**
 * Evolução do Faturamento da Vision em SVG puro, coerente com o design do
 * Patrimonium. Hover mostra tooltip discreto (data + valor em R$) e destaca o
 * ponto. Toggle "Comparar período anterior" adiciona uma segunda linha tracejada
 * (mesma duração, mesma lógica de `previousPeriod`), sempre secundária à atual.
 */
export function PeriodLineChart({ serie }: { serie: FaturamentoPonto[] }) {
  const [comparar, setComparar] = useState(false);
  const [hover, setHover] = useState<{ i: number; px: number; py: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gradId = useId();

  const atual = serie.map((p) => p.atual);
  const anterior = serie.map((p) => p.anterior);
  const totalAtual = atual.reduce((s, v) => s + v, 0);
  const max = Math.max(1, ...atual, ...(comparar ? anterior : []));
  const allZero = totalAtual === 0 && (!comparar || anterior.every((v) => v === 0));

  const W = 640;
  const H = 200;
  const padX = 10;
  const padTop = 14;
  const padBottom = 26;
  const n = serie.length;
  const x = (i: number) => (n <= 1 ? W / 2 : padX + (i / (n - 1)) * (W - 2 * padX));
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const toPath = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const lineAtual = toPath(atual);
  const areaAtual = n > 0 ? `${lineAtual} L${x(n - 1).toFixed(1)},${(H - padBottom).toFixed(1)} L${x(0).toFixed(1)},${(H - padBottom).toFixed(1)} Z` : "";
  const lineAnterior = toPath(anterior);
  const everyLabel = Math.ceil(n / 8);

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let i = Math.round(((svgX - padX) / (W - 2 * padX)) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    const px = Math.min(Math.max((x(i) / W) * rect.width, 44), rect.width - 44);
    const py = (y(atual[i]) / H) * rect.height;
    setHover({ i, px, py });
  }

  const hi = hover?.i ?? null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setComparar((v) => !v)}
          aria-pressed={comparar}
          className={`inline-flex items-center gap-2 rounded-lg2 border px-2.5 py-1 text-2xs font-medium transition-colors ${
            comparar ? "border-line-strong bg-surface-hover text-ink-soft" : "border-line text-ink-faint hover:text-ink-soft"
          }`}
        >
          <span className={`flex h-3 w-3 items-center justify-center rounded-[3px] border ${comparar ? "border-transparent bg-ink text-canvas" : "border-line-strong"}`}>
            {comparar ? (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : null}
          </span>
          Comparar período anterior
        </button>
        <span className="text-2xs text-ink-dim">
          Total no período: <span className="tnum text-ink-soft">{formatBRL(totalAtual)}</span>
        </span>
      </div>

      {allZero ? (
        <div className="flex items-center justify-center text-xs text-ink-dim" style={{ height: H }}>
          Sem faturamento no período ainda
        </div>
      ) : (
        <>
          <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Evolução do faturamento">
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COR_ATUAL} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={COR_ATUAL} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((f) => (
                <line key={f} x1={padX} x2={W - padX} y1={padTop + f * (H - padTop - padBottom)} y2={padTop + f * (H - padTop - padBottom)} stroke="rgb(var(--line))" strokeWidth="1" />
              ))}
              <path d={areaAtual} fill={`url(#${gradId})`} />
              {comparar ? (
                <path d={lineAnterior} fill="none" stroke={COR_ANTERIOR} strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              ) : null}
              <path d={lineAtual} fill="none" stroke={COR_ATUAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {hi !== null ? (
                <>
                  <line x1={x(hi)} x2={x(hi)} y1={padTop} y2={H - padBottom} stroke="rgb(var(--line-strong))" strokeWidth="1" />
                  {comparar ? <circle cx={x(hi)} cy={y(anterior[hi])} r="3.5" fill={COR_ANTERIOR} /> : null}
                  <circle cx={x(hi)} cy={y(atual[hi])} r="4.5" fill={COR_ATUAL} stroke="rgb(var(--surface))" strokeWidth="2" />
                </>
              ) : null}
            </svg>

            {hover ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-lg2 border border-line bg-surface-raised px-2.5 py-1.5 shadow-pop"
                style={{ left: hover.px, top: hover.py }}
              >
                <p className="text-2xs text-ink-faint">{serie[hi!].full}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs tnum text-ink">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COR_ATUAL }} />
                  {formatBRL(atual[hi!])}
                </p>
                {comparar ? (
                  <>
                    <p className="mt-1.5 text-2xs text-ink-dim">{serie[hi!].anteriorFull || "—"} · anterior</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs tnum text-ink-soft">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COR_ANTERIOR }} />
                      {formatBRL(anterior[hi!])}
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex justify-between">
            {serie.map((p, i) => (
              <span key={i} className="flex-1 text-center text-2xs text-ink-dim" style={{ visibility: i % everyLabel === 0 || i === n - 1 ? "visible" : "hidden" }}>
                {p.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
