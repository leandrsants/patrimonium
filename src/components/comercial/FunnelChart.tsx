import { formatNumber, formatPercent } from "@/lib/format";
import type { FunnelStageOut } from "@/lib/calc";

const ACCENT = ["#cda349", "#d2b25e", "#8fa5c0", "#6f9bd0", "#4f92e0", "#3d8bfd", "#5aa0f0", "#3ecf8e"];

export function FunnelChart({ stages }: { stages: FunnelStageOut[] }) {
  const topo = stages[0]?.valor ?? 0;
  const allZero = stages.every((s) => s.valor === 0);

  return (
    <div className="space-y-1.5">
      {allZero ? (
        <div className="rounded-xl2 border border-dashed border-line px-4 py-6 text-center text-xs text-ink-dim">
          Sem atividade de prospecção registrada no período. Use “Registrar prospecção” para lançar o esforço comercial.
        </div>
      ) : (
        stages.map((s, i) => {
          const widthPct = topo > 0 ? Math.max(6, (s.valor / topo) * 100) : 6;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-40 shrink-0 text-right text-2xs text-ink-faint">{s.label}</div>
              <div className="relative h-8 flex-1">
                <div
                  className="flex h-full items-center rounded-md px-3 text-xs font-medium text-on-accent transition-all"
                  style={{ width: `${widthPct}%`, backgroundColor: ACCENT[i % ACCENT.length], minWidth: "52px" }}
                >
                  <span className="tnum">{formatNumber(s.valor)}</span>
                </div>
              </div>
              <div className="w-28 shrink-0 text-right text-2xs">
                <span className="tnum text-ink-soft">{s.pctAnterior === null ? "—" : formatPercent(s.pctAnterior, 0)}</span>
                <span className="text-ink-dim"> · {s.pctTopo === null ? "—" : formatPercent(s.pctTopo, 0)} topo</span>
              </div>
            </div>
          );
        })
      )}
      {!allZero ? (
        <div className="flex items-center gap-3 pt-1">
          <div className="w-40" />
          <div className="flex-1" />
          <div className="w-28 shrink-0 text-right text-2xs text-ink-dim">% etapa · % topo</div>
        </div>
      ) : null}
    </div>
  );
}
