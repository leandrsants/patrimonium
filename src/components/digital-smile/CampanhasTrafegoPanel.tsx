import { EmptyState, Badge } from "@/components/ui/primitives";
import { formatBRL } from "@/lib/format";
import { cpl as calcCpl, cac as calcCac, custoPorVenda, roas as calcRoas, custoPorReuniaoMarcada } from "@/lib/calc";
import { NovaCampanhaButton } from "@/components/actions/QuickButtons";
import type { FormOptions } from "@/components/forms/options";

export type CampanhaMetrics = {
  id: string;
  nome: string;
  ativa: boolean;
  investimento: number;
  leads: number;
  reunioesMarcadas: number;
  clientes: number;
  contratos: number;
  receita: number;
};

const fmt = (v: number | null) => (v === null ? "—" : formatBRL(v));

export function CampanhasTrafegoPanel({ campanhas, options, empresaId }: { campanhas: CampanhaMetrics[]; options: FormOptions; empresaId: string }) {
  if (campanhas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma campanha de aquisição"
        description="Cadastre campanhas de tráfego pago da própria Digital Smile (para adquirir dentistas) e registre o investimento. CPL, CAC, custo por venda e ROAS aparecem aqui."
        cta={<NovaCampanhaButton options={options} empresaId={empresaId} variant="primary" />}
      />
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl2 border border-line">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
            <th className="px-3 py-3 text-left font-semibold">Campanha</th>
            <th className="px-3 py-3 text-right font-semibold">Invest.</th>
            <th className="px-3 py-3 text-right font-semibold">Leads</th>
            <th className="px-3 py-3 text-right font-semibold">CPL</th>
            <th className="px-3 py-3 text-right font-semibold">Reuniões</th>
            <th className="px-3 py-3 text-right font-semibold">Custo/reun.</th>
            <th className="px-3 py-3 text-right font-semibold">Contratos</th>
            <th className="px-3 py-3 text-right font-semibold">CAC</th>
            <th className="px-3 py-3 text-right font-semibold">Custo/venda</th>
            <th className="px-3 py-3 text-right font-semibold">Receita</th>
            <th className="px-3 py-3 text-right font-semibold">ROAS</th>
          </tr>
        </thead>
        <tbody>
          {campanhas.map((c) => {
            const roasV = calcRoas(c.receita, c.investimento);
            return (
              <tr key={c.id} className="border-b border-line/70 last:border-0">
                <td className="px-3 py-3">
                  <span className="text-ink-soft">{c.nome}</span>{" "}
                  <Badge accent={c.ativa ? "smile" : "neutral"}>{c.ativa ? "ativa" : "encerrada"}</Badge>
                </td>
                <td className="px-3 py-3 text-right tnum text-ink-faint">{formatBRL(c.investimento, { compact: true })}</td>
                <td className="px-3 py-3 text-right tnum text-ink-soft">{c.leads}</td>
                <td className="px-3 py-3 text-right tnum text-ink-faint">{fmt(calcCpl(c.investimento, c.leads))}</td>
                <td className="px-3 py-3 text-right tnum text-ink-soft">{c.reunioesMarcadas}</td>
                <td className="px-3 py-3 text-right tnum text-ink-faint">{fmt(custoPorReuniaoMarcada(c.investimento, c.reunioesMarcadas))}</td>
                <td className="px-3 py-3 text-right tnum text-ink-soft">{c.contratos}</td>
                <td className="px-3 py-3 text-right tnum text-ink-faint">{fmt(calcCac(c.investimento, c.clientes))}</td>
                <td className="px-3 py-3 text-right tnum text-ink-faint">{fmt(custoPorVenda(c.investimento, c.contratos))}</td>
                <td className="px-3 py-3 text-right tnum text-positive">{formatBRL(c.receita, { compact: true })}</td>
                <td className="px-3 py-3 text-right tnum text-ink-soft">{roasV === null ? "—" : `${roasV.toFixed(2)}x`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
