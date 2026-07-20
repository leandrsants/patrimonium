import { Badge } from "@/components/ui/primitives";
import { formatBRL } from "@/lib/format";
import { ratio } from "@/lib/calc";
import type { ProdutoBreakdown } from "@/lib/metrics";
import type { ProdutoServico } from "@/lib/types";

/** Faturamento, vendas e ticket por produto + catálogo (ativos e inativos preparados). */
export function ProdutosMetricasPanel({ breakdown, produtos }: { breakdown: ProdutoBreakdown[]; produtos: ProdutoServico[] }) {
  const inativos = produtos.filter((p) => !p.ativo);
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
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
