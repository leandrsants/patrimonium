import { formatBRL } from "@/lib/format";
import { METODO_LABEL } from "@/lib/calc";
import type { MetodoBreakdown } from "@/lib/metrics";

/** Comparação de aquisição por método: Prospecção ativa x Tráfego pago x Orgânico x Indicação. */
export function MetodoBreakdownPanel({ breakdown }: { breakdown: MetodoBreakdown[] }) {
  const comDados = breakdown.filter((m) => m.investimento > 0 || m.vendas > 0 || (m.atividade && m.atividade.contatos_feitos > 0));
  const rows = comDados.length > 0 ? comDados : breakdown.filter((m) => m.metodo === "prospeccao_ativa" || m.metodo === "trafego_pago");

  return (
    <div className="overflow-x-auto rounded-xl2 border border-line">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
            <th className="px-4 py-3 text-left font-semibold">Método</th>
            <th className="px-4 py-3 text-right font-semibold">Investimento</th>
            <th className="px-4 py-3 text-right font-semibold">Vendas</th>
            <th className="px-4 py-3 text-right font-semibold">Clientes novos</th>
            <th className="px-4 py-3 text-right font-semibold">Receita</th>
            <th className="px-4 py-3 text-right font-semibold">CAC</th>
            <th className="px-4 py-3 text-right font-semibold">Custo/venda</th>
            <th className="px-4 py-3 text-right font-semibold">Ticket</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.metodo} className="border-b border-line/70 last:border-0">
              <td className="px-4 py-3 text-ink-soft">{METODO_LABEL[m.metodo]}</td>
              <td className="px-4 py-3 text-right tnum text-ink-faint">{formatBRL(m.investimento)}</td>
              <td className="px-4 py-3 text-right tnum text-ink-soft">{m.vendas}</td>
              <td className="px-4 py-3 text-right tnum text-ink-soft">{m.clientesNovos}</td>
              <td className="px-4 py-3 text-right tnum text-positive">{formatBRL(m.receita)}</td>
              <td className="px-4 py-3 text-right tnum text-ink-soft">{m.cac === null ? (m.metodo === "prospeccao_ativa" && m.investimento === 0 ? "sem custo reg." : "—") : formatBRL(m.cac)}</td>
              <td className="px-4 py-3 text-right tnum text-ink-soft">{m.custoPorVenda === null ? "—" : formatBRL(m.custoPorVenda)}</td>
              <td className="px-4 py-3 text-right tnum text-ink-soft">{m.ticket === null ? "—" : formatBRL(m.ticket)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
