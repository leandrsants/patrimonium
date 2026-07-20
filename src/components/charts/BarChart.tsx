import { formatBRL } from "@/lib/format";

export type Series = { label: string; color: string };
export type BarGroup = { label: string; values: number[] };

/** Gráfico de barras agrupadas em SVG puro (sem libs externas / sem CSP issues). */
export function BarChart({ groups, series, height = 200 }: { groups: BarGroup[]; series: Series[]; height?: number }) {
  const max = Math.max(1, ...groups.flatMap((g) => g.values.map((v) => Math.abs(v))));
  const allZero = groups.every((g) => g.values.every((v) => v === 0));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-2xs text-ink-faint">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="relative flex items-end justify-between gap-2" style={{ height }}>
        {allZero ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-dim">Sem movimentações no período ainda</div>
        ) : null}
        {groups.map((g, gi) => (
          <div key={gi} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: height - 24 }}>
              {g.values.map((v, vi) => {
                const h = allZero ? 2 : Math.max(2, (Math.abs(v) / max) * (height - 28));
                return (
                  <div
                    key={vi}
                    title={`${series[vi]?.label}: ${formatBRL(v)}`}
                    className="w-full max-w-[14px] rounded-sm transition-all"
                    style={{ height: h, backgroundColor: series[vi]?.color, opacity: allZero ? 0.3 : 1 }}
                  />
                );
              })}
            </div>
            <span className="text-2xs text-ink-dim">{g.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SplitBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.05]">
        {total > 0
          ? parts.map((p, i) => (
              <div key={i} style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }} title={`${p.label}: ${formatBRL(p.value)}`} />
            ))
          : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5 text-2xs">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
            <span className="text-ink-faint">{p.label}</span>
            <span className="tnum text-ink-soft">{formatBRL(p.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
