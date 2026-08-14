"use client";

import { useId, useRef, useState } from "react";
import { formatBRL } from "@/lib/format";
import { BarChart, type BarGroup, type Series } from "@/components/charts/BarChart";

/**
 * Painel de faturamento/despesas/lucro com dois modos de leitura sobre os
 * MESMOS dados: barras (comparar meses entre si) e linhas (ver a evolução).
 *
 * As cores seguem as das barras de propósito — cor acompanha a entidade, então
 * trocar de modo não pode repintar as séries. Só que esse trio falha na
 * separação para daltonismo (verde x vermelho, ΔE 4,6 deutan no tema claro),
 * por isso o modo linha carrega codificação secundária obrigatória: cada série
 * tem um traço diferente e um rótulo direto na ponta. Nenhuma identidade
 * depende só da cor.
 */
export function FluxoChart({ groups, series }: { groups: BarGroup[]; series: Series[] }) {
  const [modo, setModo] = useState<"barras" | "linhas">("barras");

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-lg2 border border-line p-0.5" role="group" aria-label="Modo de visualização">
          {(["barras", "linhas"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              aria-pressed={modo === m}
              className={`rounded-[5px] px-2.5 py-1 text-2xs font-medium capitalize transition-colors ${
                modo === m ? "bg-surface-hover text-ink" : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {modo === "barras" ? <BarChart groups={groups} series={series} /> : <LinhasFluxo groups={groups} series={series} />}
    </div>
  );
}

// Traço por série: 0 = cheia, depois tracejada e pontilhada. É o que garante a
// leitura sem depender da cor.
const TRACOS = [undefined, "6 4", "1.5 4"];

function LinhasFluxo({ groups, series }: { groups: BarGroup[]; series: Series[] }) {
  const [hover, setHover] = useState<{ i: number; px: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const clipId = useId();

  // Meses vazios no fim do ano ainda não aconteceram — a linha para no último
  // mês com movimento, senão desabaria até zero e leria como queda real.
  let fim = groups.length;
  while (fim > 1 && groups[fim - 1].values.every((v) => v === 0)) fim--;
  const g = groups.slice(0, fim);
  const n = g.length;
  const vazio = g.every((x) => x.values.every((v) => v === 0));

  const W = 640;
  const H = 220;
  const padL = 10;
  const padR = 64; // espaço para os rótulos diretos na ponta
  const padTop = 16;
  const padBottom = 26;
  const vals = g.flatMap((x) => x.values);
  const max = Math.max(1, ...vals);
  const min = Math.min(0, ...vals); // lucro pode ser negativo
  const x = (i: number) => (n <= 1 ? padL : padL + (i / (n - 1)) * (W - padL - padR));
  const y = (v: number) => padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);

  const linhas = series.map((s, si) => ({
    ...s,
    traco: TRACOS[si % TRACOS.length],
    ultimo: g[n - 1]?.values[si] ?? 0,
    d: g.map((x0, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(x0.values[si]).toFixed(1)}`).join(" "),
  }));

  // Rótulos diretos na ponta: empurra para não sobrepor quando as linhas
  // terminam próximas.
  const pontas = linhas
    .map((l, si) => ({ si, label: l.label, cor: l.color, valor: l.ultimo, y: y(l.ultimo) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < pontas.length; i++) {
    if (pontas[i].y - pontas[i - 1].y < 13) pontas[i].y = pontas[i - 1].y + 13;
  }

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let i = Math.round(((svgX - padL) / (W - padL - padR)) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover({ i, px: Math.min(Math.max((x(i) / W) * rect.width, 64), rect.width - 64) });
  }

  const hi = hover?.i ?? null;

  if (vazio) {
    return (
      <div className="flex items-center justify-center text-xs text-ink-dim" style={{ height: H }}>
        Sem movimentações no período ainda
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {linhas.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-2xs text-ink-faint">
            <svg width="14" height="2" aria-hidden="true">
              <line x1="0" y1="1" x2="14" y2="1" stroke={l.color} strokeWidth="2" strokeDasharray={l.traco} />
            </svg>
            {l.label}
          </span>
        ))}
      </div>

      <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Evolução de faturamento, despesas e lucro mês a mês">
          <clipPath id={clipId}>
            <rect x="0" y="0" width={W - padR + 4} height={H} />
          </clipPath>

          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={padL} x2={W - padR} y1={padTop + f * (H - padTop - padBottom)} y2={padTop + f * (H - padTop - padBottom)} stroke="rgb(var(--line))" strokeWidth="1" />
          ))}
          {/* Zero explícito quando há lucro negativo, senão a queda não tem referência. */}
          {min < 0 ? <line x1={padL} x2={W - padR} y1={y(0)} y2={y(0)} stroke="rgb(var(--line-strong))" strokeWidth="1" /> : null}

          <g clipPath={`url(#${clipId})`}>
            {linhas.map((l) => (
              <path key={l.label} d={l.d} fill="none" stroke={l.color} strokeWidth="2" strokeDasharray={l.traco} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
            {hi !== null ? (
              <>
                <line x1={x(hi)} x2={x(hi)} y1={padTop} y2={H - padBottom} stroke="rgb(var(--line-strong))" strokeWidth="1" />
                {linhas.map((l, si) => (
                  <circle key={l.label} cx={x(hi)} cy={y(g[hi].values[si])} r="4" fill={l.color} stroke="rgb(var(--surface))" strokeWidth="2" />
                ))}
              </>
            ) : null}
          </g>

          {/* Rótulo direto: identidade sem depender da cor. */}
          {pontas.map((p) => (
            <text key={p.si} x={W - padR + 8} y={p.y + 3} fontSize="9" fill={p.cor} className="tnum">
              {formatBRL(p.valor, { compact: true })}
            </text>
          ))}
        </svg>

        {hover ? (
          <div
            className="pointer-events-none absolute z-10 top-2 -translate-x-1/2 whitespace-nowrap rounded-lg2 border border-line bg-surface-raised px-2.5 py-1.5 shadow-pop"
            style={{ left: hover.px }}
          >
            <p className="text-2xs text-ink-faint">{g[hi!].label}</p>
            {linhas.map((l, si) => (
              <p key={l.label} className="mt-0.5 flex items-center gap-1.5 text-xs tnum text-ink-soft">
                <svg width="10" height="2" aria-hidden="true">
                  <line x1="0" y1="1" x2="10" y2="1" stroke={l.color} strokeWidth="2" strokeDasharray={l.traco} />
                </svg>
                {l.label}: {formatBRL(g[hi!].values[si])}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex" style={{ paddingRight: `${(padR / W) * 100}%` }}>
        {g.map((x0, i) => (
          <span key={i} className="flex-1 text-center text-2xs text-ink-dim">
            {x0.label}
          </span>
        ))}
      </div>
    </div>
  );
}
