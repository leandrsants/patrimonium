export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { PeriodFilter } from "@/components/shell/PeriodFilter";
import { Metric, Panel, PanelHeader, EmptyState, Badge } from "@/components/ui/primitives";
import { NovaReceitaButton } from "@/components/actions/QuickButtons";
import { SplitBar } from "@/components/charts/BarChart";
import { formatBRL, formatDateBR } from "@/lib/format";
import { resolvePeriod, inRange } from "@/lib/period";
import { getLancamentos, getCategorias, getFormOptions } from "@/lib/data";

const CORES = ["#9b7ad6", "#cda349", "#3d8bfd", "#3ecf8e", "#e0a64d"];

export default async function ExtrasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const [lancamentos, categorias, options] = await Promise.all([getLancamentos(), getCategorias(), getFormOptions()]);

  const extras = lancamentos.filter((l) => l.natureza === "receita_extra");
  const noPeriodo = extras.filter((l) => l.status === "recebido" && inRange(l.data_pagamento, period));
  const recebidoPeriodo = noPeriodo.reduce((s, l) => s + Number(l.valor), 0);
  const totalHistorico = extras.filter((l) => l.status === "recebido").reduce((s, l) => s + Number(l.valor), 0);
  const catNome = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? "Sem categoria";

  const porCategoria = new Map<string, number>();
  for (const l of noPeriodo) porCategoria.set(catNome(l.categoria_id), (porCategoria.get(catNome(l.categoria_id)) ?? 0) + Number(l.valor));
  const composicao = Array.from(porCategoria.entries()).map(([label, value], i) => ({ label, value, color: CORES[i % CORES.length] }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Receitas extras" title="Extras" subtitle="Sonati, Trium, presentes, projetos por fora" accent="neutral" actions={<div className="flex gap-2"><PeriodFilter current={period.kind} /><NovaReceitaButton options={options} /></div>} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric label="Recebido no período" value={formatBRL(recebidoPeriodo)} accent="extra" size="lg" />
        <Metric label="Histórico total" value={formatBRL(totalHistorico)} />
        <Metric label="Lançamentos" value={String(extras.length)} />
      </div>

      <Panel className="border-extra/20 bg-extra/[0.02]">
        <p className="text-sm text-ink-faint">
          Receitas extras entram no <span className="text-ink">caixa e no patrimônio</span>, mas <span className="text-ink">nunca</span> no faturamento da Vision/Digital Smile, CAC, ticket, lucro empresarial ou Meta 10K.
        </p>
      </Panel>

      {composicao.length > 0 ? (
        <Panel>
          <PanelHeader title="Composição por categoria" description={`Recebido no período · ${period.label}`} />
          <SplitBar parts={composicao} />
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Histórico de receitas extras" />
        {extras.length === 0 ? (
          <EmptyState title="Nenhuma receita extra" description="Registre receitas extras (Sonati, Trium, presentes, projetos por fora). Elas aumentam seu caixa e patrimônio, mas ficam fora das métricas das empresas." cta={<NovaReceitaButton options={options} />} />
        ) : (
          <div className="overflow-x-auto rounded-xl2 border border-line">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                  <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th className="px-4 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {extras.map((l) => (
                  <tr key={l.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 text-ink-faint">{formatDateBR(l.data_pagamento ?? l.data_competencia)}</td>
                    <td className="px-4 py-3 text-ink-soft">{catNome(l.categoria_id)}</td>
                    <td className="px-4 py-3 text-ink-faint">{l.observacao ?? "—"}</td>
                    <td className="px-4 py-3 text-right tnum text-extra">{formatBRL(l.valor)}</td>
                    <td className="px-4 py-3 text-right"><Badge accent={l.status === "recebido" ? "positive" : "warning"}>{l.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
