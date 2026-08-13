import { Panel, PanelHeader, Progress } from "@/components/ui/primitives";
import { formatBRL } from "@/lib/format";
import type { AtencaoItem } from "@/lib/metrics";

/** Pendências que pedem ação hoje. Sem pendências, não renderiza nada. */
export function AtencaoVision({ items }: { items: AtencaoItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl2 border border-warning/20 bg-warning/[0.03] px-4 py-3.5 shadow-panel">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Precisa de ação</p>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${it.tone === "negative" ? "bg-negative" : it.tone === "warning" ? "bg-warning" : "bg-ink-dim"}`} />
            <span className="text-ink-soft">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Quanto a Vision já colocou dentro do ciclo da meta + ritmo. */
export function MetaContribuicaoCard({
  nome,
  contribuicao,
  alvo,
  diasRestantes,
  mediaDia,
}: {
  nome: string;
  contribuicao: number;
  alvo: number;
  diasRestantes: number;
  mediaDia: number;
}) {
  const pct = alvo > 0 ? Math.min(100, (contribuicao / alvo) * 100) : 0;
  return (
    <Panel>
      <PanelHeader title={`Contribuição para a ${nome}`} description="Recebido da Vision dentro do ciclo da meta" />
      <div className="mb-3 flex items-end justify-between">
        <span className="text-2xl font-semibold tnum text-ink">{formatBRL(contribuicao)}</span>
        <span className="text-sm text-ink-faint">de {formatBRL(alvo)} · {pct.toFixed(0)}%</span>
      </div>
      <Progress value={pct} accent="vision" />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-2xs text-ink-dim">
        <span>{diasRestantes} dias restantes no ciclo</span>
        <span className="text-ink-dim">·</span>
        <span>Vision fez ~{formatBRL(mediaDia)}/dia no ciclo</span>
      </div>
    </Panel>
  );
}
