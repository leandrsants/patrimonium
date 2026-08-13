import { Panel, PanelHeader, Metric, MiniMetric, EmptyState } from "@/components/ui/primitives";
import { FunnelChart } from "@/components/comercial/FunnelChart";
import { MetasDiaPanel, type MetaDiaRow } from "@/components/digital-smile/ComercialPanels";
import { RegistrarProspeccaoButton } from "@/components/comercial/RegistrarProspeccaoButton";
import { EditarProspeccaoButton, type RegistroEditavel } from "@/components/digital-smile/EditarProspeccaoButton";
import { LeadsPendentesBanner } from "@/components/digital-smile/LeadsPendentesBanner";
import type { LeadCandidate, PendenciaView } from "@/components/digital-smile/CompletarLeadForm";
import { formatNumber, formatPercent, formatDateBR } from "@/lib/format";
import {
  taxaResposta, taxaInteresse, taxaAgendamento, taxaComparecimento,
  taxaNoShow, taxaProposta, taxaFechamento, conversaoTotal,
} from "@/lib/calc";
import type { FunnelStageOut } from "@/lib/calc";
import type { FormOptions } from "@/components/forms/options";

export type ProdBucket = { abordagens: number; respostas: number; positivas: number; reunioes: number };
export type CanalRow = { canal: string; abordagens: number; respostas: number; positivas: number; agendadas: number; contratos: number };
export type Resultados = {
  abordagens: number; respostas: number; positivas: number;
  reunioes_agendadas: number; reunioes_realizadas: number; no_shows: number;
  propostas: number; contratos: number;
};

const pctOrDash = (v: number | null) => (v === null ? "—" : formatPercent(v, v % 1 !== 0 ? 1 : 0));
const numOrDash = (n: number, contratos: number) => (contratos > 0 ? (n / contratos).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—");

export function ProspeccaoAtivaPanel({
  metasRows, resultados, funnel, prod, canais, historico, options, empresaId, leadsExistentes = [], pendencias = [],
}: {
  metasRows: MetaDiaRow[];
  resultados: Resultados;
  funnel: FunnelStageOut[];
  prod: { hoje: ProdBucket; semana: ProdBucket; mes: ProdBucket };
  canais: CanalRow[];
  historico: RegistroEditavel[];
  options: FormOptions;
  empresaId: string;
  leadsExistentes?: LeadCandidate[];
  pendencias?: PendenciaView[];
}) {
  const r = resultados;
  const semDados = r.abordagens === 0 && historico.length === 0;
  // Destino das reuniões agendadas (realizadas + no-show + o restante).
  const outrasReunioes = Math.max(0, r.reunioes_agendadas - r.reunioes_realizadas - r.no_shows);

  const taxas: { label: string; value: string }[] = [
    { label: "Taxa de resposta", value: pctOrDash(taxaResposta(r.respostas, r.abordagens)) },
    { label: "Taxa de interesse", value: pctOrDash(taxaInteresse(r.positivas, r.respostas)) },
    { label: "Taxa de agendamento", value: pctOrDash(taxaAgendamento(r.reunioes_agendadas, r.positivas)) },
    { label: "Taxa de comparecimento", value: pctOrDash(taxaComparecimento(r.reunioes_realizadas, r.reunioes_agendadas)) },
    { label: "Taxa de no-show", value: pctOrDash(taxaNoShow(r.no_shows, r.reunioes_agendadas)) },
    { label: "Taxa de proposta", value: pctOrDash(taxaProposta(r.propostas, r.reunioes_realizadas)) },
    { label: "Taxa de fechamento", value: pctOrDash(taxaFechamento(r.contratos, r.propostas)) },
    { label: "Conversão total", value: pctOrDash(conversaoTotal(r.contratos, r.abordagens)) },
  ];

  const esforco: { label: string; k: keyof Resultados }[] = [
    { label: "Abordagens", k: "abordagens" }, { label: "Primeiras respostas", k: "respostas" }, { label: "Positivas", k: "positivas" },
    { label: "Reuniões agendadas", k: "reunioes_agendadas" }, { label: "Realizadas", k: "reunioes_realizadas" }, { label: "Propostas", k: "propostas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-faint">Controle de números e performance do outbound. Cadastrar leads individuais é opcional.</p>
        <RegistrarProspeccaoButton options={options} empresaId={empresaId} variante="smile" leadsExistentes={leadsExistentes} />
      </div>

      <LeadsPendentesBanner pendencias={pendencias} options={options} empresaId={empresaId} leadsExistentes={leadsExistentes} />

      <MetasDiaPanel rows={metasRows} />

      {/* Resultados do período — manuais (esforço) + contratos derivados */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <Metric label="Abordagens" value={formatNumber(r.abordagens)} accent="smile" />
        <Metric label="Respostas" value={formatNumber(r.respostas)} />
        <Metric label="Positivas" value={formatNumber(r.positivas)} accent="positive" />
        <Metric label="Reun. agendadas" value={formatNumber(r.reunioes_agendadas)} />
        <Metric label="Reun. realizadas" value={formatNumber(r.reunioes_realizadas)} />
        <Metric label="No-shows" value={formatNumber(r.no_shows)} accent={r.no_shows > 0 ? "warning" : "neutral"} />
        <Metric label="Propostas" value={formatNumber(r.propostas)} />
        <Metric label="Contratos" value={formatNumber(r.contratos)} accent="positive" hint="Derivado dos contratos reais" />
      </div>

      {semDados ? (
        <EmptyState
          title="Você ainda não registrou prospecção neste período"
          description="Registre os números do outbound: abordagens, respostas, reuniões e propostas. Contratos derivam dos negócios reais fechados."
          cta={<RegistrarProspeccaoButton options={options} empresaId={empresaId} variante="smile" leadsExistentes={leadsExistentes} />}
        />
      ) : (
        <>
          <Panel>
            <PanelHeader title="Funil da prospecção ativa" description="Atividade registrada + resultados comerciais vinculados" />
            <FunnelChart stages={funnel} />
          </Panel>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader title="Métricas de conversão" description="Calculadas a partir dos números do período" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {taxas.map((t) => (
                  <MiniMetric key={t.label} label={t.label} value={t.value} />
                ))}
              </div>
            </Panel>
            <Panel>
              <PanelHeader title="Destino das reuniões" description="O que aconteceu com as agendadas" />
              <div className="space-y-2 text-sm">
                {([["Agendadas", r.reunioes_agendadas, "text-ink"], ["Realizadas", r.reunioes_realizadas, "text-positive"], ["No-show", r.no_shows, "text-negative"], ["Pendentes / outras", outrasReunioes, "text-ink-faint"]] as const).map(([label, val, cls]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg2 border border-line px-3 py-2">
                    <span className="text-ink-soft">{label}</span><span className={`tnum ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Esforço por contrato */}
          {r.contratos > 0 ? (
            <Panel>
              <PanelHeader title="Quanto esforço gera um contrato?" description={`Média por contrato no período · base: ${r.contratos} contrato(s)`} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {esforco.map((e) => (
                  <MiniMetric key={e.k} label={e.label} value={numOrDash(r[e.k], r.contratos)} />
                ))}
              </div>
            </Panel>
          ) : null}

          {/* Produtividade — volume + eficiência por janela */}
          <Panel>
            <PanelHeader title="Produtividade" description="Volume e eficiência: hoje vs. média do mês" />
            <div className="overflow-x-auto rounded-xl2 border border-line">
              <table className="w-full min-w-[440px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
                    <th className="px-4 py-2.5 text-left font-semibold"></th>
                    <th className="px-4 py-2.5 text-right font-semibold">Hoje</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Semana</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Mês</th>
                  </tr>
                </thead>
                <tbody>
                  {([["Abordagens", "abordagens"], ["Respostas", "respostas"], ["Positivas", "positivas"], ["Reuniões agendadas", "reunioes"]] as const).map(([label, k]) => (
                    <tr key={k} className="border-b border-line/70">
                      <td className="px-4 py-2.5 text-ink-soft">{label}</td>
                      <td className="px-4 py-2.5 text-right tnum text-ink-soft">{prod.hoje[k]}</td>
                      <td className="px-4 py-2.5 text-right tnum text-ink-faint">{prod.semana[k]}</td>
                      <td className="px-4 py-2.5 text-right tnum text-ink-faint">{prod.mes[k]}</td>
                    </tr>
                  ))}
                  {([
                    ["Taxa de resposta", (b: ProdBucket) => taxaResposta(b.respostas, b.abordagens)],
                    ["Taxa de interesse", (b: ProdBucket) => taxaInteresse(b.positivas, b.respostas)],
                    ["Taxa de agendamento", (b: ProdBucket) => taxaAgendamento(b.reunioes, b.positivas)],
                  ] as const).map(([label, fn]) => (
                    <tr key={label} className="border-b border-line/70 last:border-0 bg-surface-raised">
                      <td className="px-4 py-2.5 text-2xs uppercase tracking-wide text-ink-dim">{label}</td>
                      <td className="px-4 py-2.5 text-right tnum text-ink-soft">{pctOrDash(fn(prod.hoje))}</td>
                      <td className="px-4 py-2.5 text-right tnum text-ink-faint">{pctOrDash(fn(prod.semana))}</td>
                      <td className="px-4 py-2.5 text-right tnum text-ink-faint">{pctOrDash(fn(prod.mes))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Desempenho por canal — com conversões */}
          <Panel>
            <PanelHeader title="Desempenho por canal" description="Onde converte melhor · contratos derivados dos negócios reais" />
            {canais.length === 0 ? <p className="text-sm text-ink-faint">Sem canal registrado.</p> : (
              <div className="overflow-x-auto rounded-xl2 border border-line">
                <table className="w-full min-w-[640px] text-sm">
                  <thead><tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
                    <th className="px-3 py-2.5 text-left font-semibold">Canal</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Abordagens</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Resposta</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Interesse</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Reuniões</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Contratos</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Conversão</th>
                  </tr></thead>
                  <tbody>{canais.map((c) => (
                    <tr key={c.canal} className="border-b border-line/70 last:border-0">
                      <td className="px-3 py-2.5 text-ink-soft">{c.canal}</td>
                      <td className="px-3 py-2.5 text-right tnum text-ink-soft">{c.abordagens}</td>
                      <td className="px-3 py-2.5 text-right tnum text-ink-faint">{pctOrDash(taxaResposta(c.respostas, c.abordagens))}</td>
                      <td className="px-3 py-2.5 text-right tnum text-ink-faint">{pctOrDash(taxaInteresse(c.positivas, c.respostas))}</td>
                      <td className="px-3 py-2.5 text-right tnum text-ink-faint">{c.agendadas}</td>
                      <td className="px-3 py-2.5 text-right tnum text-positive">{c.contratos}</td>
                      <td className="px-3 py-2.5 text-right tnum text-ink-soft">{pctOrDash(conversaoTotal(c.contratos, c.abordagens))}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* Histórico — apenas esforço manual (contratos são derivados, não por linha) */}
          <Panel>
            <PanelHeader title="Histórico de prospecção" description="Registros do período · editável · contratos derivados (não digitados)" />
            <div className="overflow-x-auto rounded-xl2 border border-line">
              <table className="w-full min-w-[680px] text-sm">
                <thead><tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
                  <th className="px-3 py-2.5 text-left font-semibold">Data</th><th className="px-3 py-2.5 text-left font-semibold">Canal</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Abord.</th><th className="px-3 py-2.5 text-right font-semibold">Resp.</th><th className="px-3 py-2.5 text-right font-semibold">Pos.</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Agend.</th><th className="px-3 py-2.5 text-right font-semibold">Realiz.</th><th className="px-3 py-2.5 text-right font-semibold">Prop.</th>
                  <th className="px-3 py-2.5 text-right font-semibold"></th>
                </tr></thead>
                <tbody>{historico.map((h) => (
                  <tr key={h.id} className="border-b border-line/70 last:border-0">
                    <td className="px-3 py-2.5 text-ink-faint">{formatDateBR(h.data)}</td><td className="px-3 py-2.5 text-ink-soft">{h.canal ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right tnum text-ink-soft">{h.abordagens}</td><td className="px-3 py-2.5 text-right tnum text-ink-faint">{h.respostas}</td><td className="px-3 py-2.5 text-right tnum text-positive">{h.positivas}</td>
                    <td className="px-3 py-2.5 text-right tnum text-ink-faint">{h.agendadas}</td><td className="px-3 py-2.5 text-right tnum text-ink-faint">{h.realizadas}</td><td className="px-3 py-2.5 text-right tnum text-ink-faint">{h.propostas}</td>
                    <td className="px-3 py-2.5 text-right"><EditarProspeccaoButton registro={h} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
