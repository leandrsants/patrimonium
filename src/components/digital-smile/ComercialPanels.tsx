import { Panel, PanelHeader, MiniMetric, EmptyState, Progress } from "@/components/ui/primitives";
import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import { pct } from "@/lib/calc";
import type { ProspeccaoAgregada } from "@/lib/calc";

export type MetaDiaRow = { chave: string; label: string; meta: number; realizado: number };

/** Metas do dia por canal + consolidado. */
export function MetasDiaPanel({ rows }: { rows: MetaDiaRow[] }) {
  const totalMeta = rows.reduce((s, r) => s + r.meta, 0);
  const totalReal = rows.reduce((s, r) => s + r.realizado, 0);
  return (
    <Panel>
      <PanelHeader title="Metas de hoje" description="Ações de prospecção · meta configurável em Configurações" />
      {rows.length === 0 ? (
        <p className="text-sm text-ink-faint">Nenhuma meta configurada.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            // % REAL (pode passar de 100). A barra satura em 100, o texto não.
            const pReal = r.meta > 0 ? (r.realizado / r.meta) * 100 : r.realizado > 0 ? 100 : 0;
            const acima = Math.max(0, r.realizado - r.meta);
            const falta = Math.max(0, r.meta - r.realizado);
            const bateu = r.meta > 0 && r.realizado >= r.meta;
            return (
              <div key={r.chave}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-ink-soft">{r.label}</span>
                  <span className="tnum text-ink-faint">
                    {r.realizado}/{r.meta} · <span className={bateu ? "text-positive" : ""}>{pReal.toFixed(0)}%</span>
                    {acima > 0 ? <span className="text-positive"> · +{acima} acima</span> : falta > 0 ? <span> · falta {falta}</span> : null}
                  </span>
                </div>
                <Progress value={Math.min(100, pReal)} accent={bateu ? "positive" : "smile"} />
              </div>
            );
          })}
          <div className="border-t border-line pt-3">
            {(() => {
              const pTotal = totalMeta > 0 ? (totalReal / totalMeta) * 100 : totalReal > 0 ? 100 : 0;
              const acimaTotal = Math.max(0, totalReal - totalMeta);
              return (
                <>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">Total de ações</span>
                    <span className="tnum text-ink-soft">{totalReal}/{totalMeta} · {pTotal.toFixed(0)}%{acimaTotal > 0 ? <span className="text-positive"> · +{acimaTotal} acima</span> : null}</span>
                  </div>
                  <Progress value={Math.min(100, pTotal)} accent={totalMeta > 0 && totalReal >= totalMeta ? "positive" : "vision"} />
                </>
              );
            })()}
          </div>
        </div>
      )}
    </Panel>
  );
}

/** Produtividade Hoje / Semana / Mês + "quanto esforço gera uma venda". */
export function ProdutividadePanel({
  hoje, semana, mes, contratosMes, acoesMes,
}: {
  hoje: ProspeccaoAgregada; semana: ProspeccaoAgregada; mes: ProspeccaoAgregada; contratosMes: number; acoesMes: number;
}) {
  const linha = (label: string, get: (p: ProspeccaoAgregada) => number) => (
    <tr className="border-b border-line/70 last:border-0">
      <td className="px-4 py-2.5 text-ink-soft">{label}</td>
      <td className="px-4 py-2.5 text-right tnum text-ink-soft">{get(hoje)}</td>
      <td className="px-4 py-2.5 text-right tnum text-ink-faint">{get(semana)}</td>
      <td className="px-4 py-2.5 text-right tnum text-ink-faint">{get(mes)}</td>
    </tr>
  );
  return (
    <Panel>
      <PanelHeader title="Produtividade comercial" description="Esforço no período" />
      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-2.5 text-left font-semibold"></th>
              <th className="px-4 py-2.5 text-right font-semibold">Hoje</th>
              <th className="px-4 py-2.5 text-right font-semibold">Semana</th>
              <th className="px-4 py-2.5 text-right font-semibold">Mês</th>
            </tr>
          </thead>
          <tbody>
            {linha("Novos prospectados", (p) => p.novos_prospectados)}
            {linha("Ações comerciais", (p) => p.acoes_instagram + p.acoes_whatsapp + p.acoes_ligacao + p.acoes_outras)}
            {linha("Respostas", (p) => p.respostas)}
            {linha("Qualificados", (p) => p.qualificados)}
            {linha("Reuniões marcadas", (p) => p.reunioes_marcadas)}
            {linha("Reuniões realizadas", (p) => p.reunioes_realizadas)}
            {linha("Propostas", (p) => p.propostas_enviadas)}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-xl2 border border-smile/20 bg-smile/[0.03] p-4">
        <p className="mb-3 text-2xs font-semibold uppercase tracking-wide text-smile">Quanto esforço gera 1 contrato? (mês)</p>
        {contratosMes === 0 ? (
          <p className="text-sm text-ink-faint">Nenhum contrato fechado no mês ainda — registre atividade e feche contratos para ver o custo de esforço por venda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniMetric label="Prospectados/contrato" value={formatNumber(Math.round(mes.novos_prospectados / contratosMes))} />
            <MiniMetric label="Ações/contrato" value={formatNumber(Math.round(acoesMes / contratosMes))} />
            <MiniMetric label="Reuniões/contrato" value={formatNumber(Math.round(mes.reunioes_realizadas / contratosMes))} />
            <MiniMetric label="Propostas/contrato" value={formatNumber(Math.round(mes.propostas_enviadas / contratosMes))} />
          </div>
        )}
      </div>
    </Panel>
  );
}

export type MotivoRow = { motivo: string; quantidade: number; valorPotencial: number };

export function MotivosPerdaPanel({ motivos, totalPerdidos }: { motivos: MotivoRow[]; totalPerdidos: number }) {
  return (
    <Panel>
      <PanelHeader title="Motivos de perda" description={`${totalPerdidos} oportunidade(s) perdida(s)`} />
      {motivos.length === 0 ? (
        <p className="text-sm text-ink-faint">Nenhuma oportunidade perdida com motivo registrado no período.</p>
      ) : (
        <div className="space-y-2">
          {motivos.map((m) => (
            <div key={m.motivo} className="flex items-center justify-between rounded-lg2 border border-line px-3 py-2 text-sm">
              <span className="text-ink-soft">{m.motivo}</span>
              <span className="tnum text-ink-faint">{m.quantidade}× {m.valorPotencial > 0 ? `· ${formatBRL(m.valorPotencial)} pot.` : ""} · {formatPercent(pct(m.quantidade, totalPerdidos) ?? 0, 0)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function TempoMedioVendaPanel({ media, mediana, amostra }: { media: number | null; mediana: number | null; amostra: number }) {
  return (
    <Panel>
      <PanelHeader title="Tempo até a venda" description="Da entrada da oportunidade ao contrato fechado" />
      {amostra === 0 ? (
        <p className="text-sm text-ink-faint">Sem contratos fechados com data de entrada e fechamento registradas.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <MiniMetric label="Média" value={media === null ? "—" : `${Math.round(media)} dias`} />
          <MiniMetric label="Mediana" value={mediana === null ? "—" : `${Math.round(mediana)} dias`} />
          <MiniMetric label="Amostra" value={`${amostra} contrato(s)`} />
        </div>
      )}
    </Panel>
  );
}

export type CanalRow = { canal: string; leads: number; contratos: number };

export function DesempenhoCanalPanel({ rows }: { rows: CanalRow[] }) {
  if (rows.length === 0) {
    return <EmptyState title="Sem dados por canal" description="Cadastre leads com canal e método para comparar Instagram, WhatsApp, Google Maps, indicação, etc." />;
  }
  return (
    <div className="overflow-x-auto rounded-xl2 border border-line">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
            <th className="px-4 py-3 text-left font-semibold">Canal</th>
            <th className="px-4 py-3 text-right font-semibold">Leads</th>
            <th className="px-4 py-3 text-right font-semibold">Contratos</th>
            <th className="px-4 py-3 text-right font-semibold">Conversão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.canal} className="border-b border-line/70 last:border-0">
              <td className="px-4 py-3 text-ink-soft">{r.canal}</td>
              <td className="px-4 py-3 text-right tnum text-ink-soft">{r.leads}</td>
              <td className="px-4 py-3 text-right tnum text-ink-soft">{r.contratos}</td>
              <td className="px-4 py-3 text-right tnum text-ink-faint">{formatPercent(pct(r.contratos, r.leads) ?? 0, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
