"use client";

import { useId, useRef, useState } from "react";
import { formatBRL } from "@/lib/format";
import type { MetaPonto } from "@/lib/metrics";

const COR_REAL = "rgb(var(--vision))";
const COR_RITMO = "rgb(var(--chart-guide))";

/**
 * Burn-up da Meta 10K: recebido acumulado (linha cheia, com área) contra o
 * ritmo necessário para fechar no prazo (linha tracejada). A leitura é
 * imediata — acima da tracejada é adiantado, abaixo é atrasado.
 *
 * A linha real para no presente de propósito: prolongá-la reta até o fim do
 * ano leria como previsão, que é coisa que este gráfico não faz.
 *
 * O eixo X é proporcional ao tempo (`ponto.pos`), não ao índice, porque os
 * marcos não são equidistantes — hoje e o último dia entram fora da grade
 * semanal.
 *
 * Cores: dourado (--vision) contra o cinza-guia (--chart-guide), par validado
 * nos dois temas para visão normal e daltonismo. O tracejado é codificação
 * secundária, e as duas séries também têm rótulo direto.
 */
export function MetaPaceChart({ serie, alvo }: { serie: MetaPonto[]; alvo: number }) {
  const [hover, setHover] = useState<{ i: number; px: number; py: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gradId = useId();

  const n = serie.length;
  const reais = serie.filter((p) => p.acumulado !== null);
  const ultimo = reais[reais.length - 1];
  const atual = ultimo?.acumulado ?? 0;
  const adiantado = atual - (ultimo?.ritmo ?? 0);

  const W = 640;
  const H = 220;
  const padX = 10;
  const padTop = 16;
  const padBottom = 26;
  const max = Math.max(alvo, ...serie.map((p) => p.acumulado ?? 0));
  const x = (pos: number) => padX + pos * (W - 2 * padX);
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const traco = (pts: MetaPonto[], valor: (p: MetaPonto) => number) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.pos).toFixed(1)},${y(valor(p)).toFixed(1)}`).join(" ");

  const lineReal = traco(reais, (p) => p.acumulado!);
  const areaReal =
    reais.length > 1
      ? `${lineReal} L${x(ultimo.pos).toFixed(1)},${(H - padBottom).toFixed(1)} L${x(reais[0].pos).toFixed(1)},${(H - padBottom).toFixed(1)} Z`
      : "";
  const lineRitmo = traco(serie, (p) => p.ritmo);

  // Rótulos do eixo: um a cada N marcos, sempre com o último. Como os marcos
  // não são equidistantes, o penúltimo pode encostar no último — nesse caso ele
  // sai, porque a data final é a que importa.
  const rotulos = (() => {
    const passo = Math.max(1, Math.ceil(n / 8));
    const out: number[] = [];
    for (let i = 0; i < n; i += passo) out.push(i);
    if (out[out.length - 1] !== n - 1) out.push(n - 1);
    while (out.length > 1 && serie[out[out.length - 1]].pos - serie[out[out.length - 2]].pos < 0.06) {
      out.splice(out.length - 2, 1);
    }
    return new Set(out);
  })();

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const f = (((e.clientX - rect.left) / rect.width) * W - padX) / (W - 2 * padX);
    let i = 0;
    for (let k = 1; k < n; k++) if (Math.abs(serie[k].pos - f) < Math.abs(serie[i].pos - f)) i = k;
    const px = Math.min(Math.max((x(serie[i].pos) / W) * rect.width, 56), rect.width - 56);
    const py = (y(serie[i].acumulado ?? serie[i].ritmo) / H) * rect.height;
    setHover({ i, px, py });
  }

  const hi = hover?.i ?? null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-4">
          <Legenda cor={COR_REAL} texto="Recebido" />
          <Legenda cor={COR_RITMO} texto="Ritmo necessário" tracejado />
        </div>
        <span className="text-2xs text-ink-dim">
          {adiantado >= 0 ? "Adiantado em " : "Atrasado em "}
          <span className={`tnum ${adiantado >= 0 ? "text-positive" : "text-negative"}`}>{formatBRL(Math.abs(adiantado))}</span>
        </span>
      </div>

      <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Progresso da meta: ${formatBRL(atual)} recebidos de ${formatBRL(alvo)}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COR_REAL} stopOpacity="0.18" />
              <stop offset="100%" stopColor={COR_REAL} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((f) => (
            <line
              key={f}
              x1={padX}
              x2={W - padX}
              y1={padTop + f * (H - padTop - padBottom)}
              y2={padTop + f * (H - padTop - padBottom)}
              stroke="rgb(var(--line))"
              strokeWidth="1"
            />
          ))}

          <path d={areaReal} fill={`url(#${gradId})`} />
          <path d={lineRitmo} fill="none" stroke={COR_RITMO} strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={lineReal} fill="none" stroke={COR_REAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

          {/* Ponta da linha real: onde você está hoje. Anel na cor da superfície
              para o marcador não encostar na área. */}
          {ultimo ? <circle cx={x(ultimo.pos)} cy={y(atual)} r="4" fill={COR_REAL} stroke="rgb(var(--surface))" strokeWidth="2" /> : null}

          {hi !== null ? (
            <>
              <line x1={x(serie[hi].pos)} x2={x(serie[hi].pos)} y1={padTop} y2={H - padBottom} stroke="rgb(var(--line-strong))" strokeWidth="1" />
              <circle cx={x(serie[hi].pos)} cy={y(serie[hi].ritmo)} r="3.5" fill={COR_RITMO} />
              {serie[hi].acumulado !== null ? (
                <circle cx={x(serie[hi].pos)} cy={y(serie[hi].acumulado!)} r="4.5" fill={COR_REAL} stroke="rgb(var(--surface))" strokeWidth="2" />
              ) : null}
            </>
          ) : null}
        </svg>

        {hover ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-lg2 border border-line bg-surface-raised px-2.5 py-1.5 shadow-pop"
            style={{ left: hover.px, top: hover.py }}
          >
            <p className="text-2xs text-ink-faint">{serie[hi!].full}</p>
            {serie[hi!].acumulado !== null ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs tnum text-ink">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COR_REAL }} />
                {formatBRL(serie[hi!].acumulado!)} recebido
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-ink-dim">ainda não chegou</p>
            )}
            <p className="mt-0.5 flex items-center gap-1.5 text-xs tnum text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COR_RITMO }} />
              {formatBRL(serie[hi!].ritmo)} no ritmo
            </p>
          </div>
        ) : null}
      </div>

      {/* Rótulos posicionados pelo tempo, na mesma escala do SVG. */}
      <div className="relative mt-2 h-4">
        {serie.map((p, i) =>
          rotulos.has(i) ? (
            <span
              key={i}
              className="absolute text-2xs text-ink-dim"
              style={{
                left: `calc(${(x(p.pos) / W) * 100}% )`,
                transform: i === 0 ? "translateX(0)" : i === n - 1 ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {p.label}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function Legenda({ cor, texto, tracejado }: { cor: string; texto: string; tracejado?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-2xs text-ink-faint">
      <svg width="14" height="2" aria-hidden="true">
        <line x1="0" y1="1" x2="14" y2="1" stroke={cor} strokeWidth="2" strokeDasharray={tracejado ? "4 3" : undefined} />
      </svg>
      {texto}
    </span>
  );
}
