import { Badge } from "@/components/ui/primitives";
import { SplitBar } from "@/components/charts/BarChart";
import { formatBRL } from "@/lib/format";
import { ratio } from "@/lib/calc";
import type { ProdutoBreakdown } from "@/lib/metrics";
import type { ProdutoServico } from "@/lib/types";

const PALETTE = ["rgb(var(--vision))", "rgb(var(--smile))", "rgb(var(--extra))", "rgb(var(--positive))", "rgb(var(--warning))"];

/** Faturamento, vendas e ticket por produto + mix visual + catálogo. */
export function ProdutosMetricasPanel({
  breakdown,
  produtos,
  legado,
}: {
  breakdown: ProdutoBreakdown[];
  produtos: ProdutoServico[];
  legado?: { count: number; valor: number };
}) {
  const inativos = produtos.filter((p) => !p.ativo);

  const mixParts = [
    ...breakdown.filter((b) => b.valor > 0).map((b, i) => ({ label: b.nome, value: b.valor, color: PALETTE[i % PALETTE.length] })),
    ...(legado && legado.valor > 0 ? [{ label: "Sem produto real", value: legado.valor, color: "rgb(var(--ink-dim))" }] : []),
  ];

  return (
    <div className="space-y-5">
      {legado && legado.count > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl2 border border-warning/20 bg-warning/[0.03] px-4 py-3 text-2xs text-ink-soft">
          <Badge accent="warning">{legado.count} sem produto real</Badge>
          <span>Vendas ainda em “Venda avulsa — legado” ({formatBRL(legado.valor)}). Reclassifique na aba Vendas para o faturamento por produto ficar completo.</span>
        </div>
      ) : null}

      {mixParts.length > 0 ? (
        <div className="rounded-xl2 border border-line bg-surface p-5 shadow-panel">
          <p className="mb-3 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Mix de faturamento no período</p>
          <SplitBar parts={mixParts} />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 text-left font-semibold">Produto</th>
              <th className="px-4 py-3 text-right font-semibold">Vendas</th>
              <th className="px-4 py-3 text-right font-semibold">Faturamento</th>
              <th className="px-4 py-3 text-right font-semibold">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-ink-faint">Nenhum produto ativo.</td></tr>
            ) : (
              breakdown.map((b) => {
                const ticket = ratio(b.valor, b.vendas);
                return (
                  <tr key={b.nome} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{b.nome}</td>
                    <td className="px-4 py-3 text-right tnum text-ink-soft">{b.vendas}</td>
                    <td className="px-4 py-3 text-right tnum text-ink-soft">{formatBRL(b.valor)}</td>
                    <td className="px-4 py-3 text-right tnum text-ink-faint">{ticket === null ? "—" : formatBRL(ticket)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {inativos.length > 0 ? (
        <div>
          <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Produtos preparados (inativos)</h4>
          <div className="flex flex-wrap gap-2">
            {inativos.map((p) => (
              <Badge key={p.id} accent="neutral">{p.nome}</Badge>
            ))}
          </div>
          <p className="mt-2 text-2xs text-ink-dim">Mentoria, curso e comunidade já existem no catálogo. Ative em Configurações para começar a vender sem alterar código.</p>
        </div>
      ) : null}
    </div>
  );
}
