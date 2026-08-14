export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { PeriodFilter } from "@/components/shell/PeriodFilter";
import { Metric, MiniMetric, Panel, PanelHeader, Progress, Badge, LinkCard } from "@/components/ui/primitives";
import { BarChart, SplitBar } from "@/components/charts/BarChart";
import { MetaPaceChart } from "@/components/charts/MetaPaceChart";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/format";
import { resolvePeriod, previousPeriod, daysUntil } from "@/lib/period";
import { computeDashboard, computeAttention, monthlySeries, buildMetaSerie, pctDelta } from "@/lib/metrics";
import {
  getEmpresas, getLancamentos, getVendas, getParcelasSituacao, getAssinaturas,
  getContasSaldos, getComprasCartao, getOportunidades, getMetaAtiva, getMetaConfirmado,
} from "@/lib/data";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = resolvePeriod(sp);

  const [empresas, lancamentos, vendas, parcelas, assinaturas, saldos, compras, oportunidades, meta, metaConfirmado] = await Promise.all([
    getEmpresas(), getLancamentos(), getVendas(), getParcelasSituacao(), getAssinaturas(),
    getContasSaldos(), getComprasCartao(), getOportunidades(), getMetaAtiva(), getMetaConfirmado(),
  ]);

  const m = computeDashboard({ empresas, lancamentos, vendas, parcelas, assinaturas, saldos, compras }, period);
  // Comparação com o período anterior de MESMA duração (mesmos dados, mesma lógica).
  const periodoAnterior = previousPeriod(period);
  const mAnt = computeDashboard({ empresas, lancamentos, vendas, parcelas, assinaturas, saldos, compras }, periodoAnterior);
  const attention = computeAttention({ parcelas, assinaturas, vendas, oportunidades });
  const chart = monthlySeries(vendas, lancamentos, new Date().getFullYear());
  const metaSerie = meta ? buildMetaSerie(lancamentos, meta) : [];

  const metaPct = meta ? Math.min(100, (metaConfirmado / Number(meta.valor_alvo)) * 100) : 0;
  const metaFalta = meta ? Math.max(0, Number(meta.valor_alvo) - metaConfirmado) : 0;
  const diasRestantes = meta ? Math.max(0, daysUntil(meta.data_fim)) : 0;
  const mediaMensal = diasRestantes > 0 ? metaFalta / Math.max(1, diasRestantes / 30) : 0;
  const mediaSemanal = diasRestantes > 0 ? metaFalta / Math.max(1, diasRestantes / 7) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel"
        title="Visão geral"
        subtitle="Situação financeira e gerencial consolidada"
        actions={<PeriodFilter period={period} />}
      />
      <p className="-mt-4 text-2xs text-ink-dim">Período: {period.label} · {formatDateBR(period.from)} — {formatDateBR(period.to)}</p>

      {/* Indicadores principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Faturamento dos negócios" value={formatBRL(m.faturamentoNegocios)} accent="neutral" size="lg" hint="Vision + Digital Smile" trend={{ pct: pctDelta(m.faturamentoNegocios, mAnt.faturamentoNegocios) }} />
        <Metric label="Total recebido" value={formatBRL(m.totalRecebido)} accent="positive" size="lg" hint="Negócios + extras" trend={{ pct: pctDelta(m.totalRecebido, mAnt.totalRecebido) }} />
        <Metric label="Investimento em aquisição" value={formatBRL(m.investimentoAquisicao)} accent="vision" size="lg" hint="Somente anúncios" trend={{ pct: pctDelta(m.investimentoAquisicao, mAnt.investimentoAquisicao) }} />
        <Metric label="Lucro dos negócios" value={formatBRL(m.lucroNegocios)} accent={m.lucroNegocios >= 0 ? "positive" : "negative"} size="lg" hint="Recebido − despesas empresariais" trend={{ pct: pctDelta(m.lucroNegocios, mAnt.lucroNegocios) }} />
      </div>

      {/* Meta + secundários */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Meta 10K 2026" description={meta ? `${formatDateBR(meta.data_inicio)} a ${formatDateBR(meta.data_fim)} · Vision + Digital Smile · somente recebido` : undefined} action={<Badge accent="vision">{formatPercent(metaPct, 1)}</Badge>} />
          <div className="mb-3 flex items-end justify-between">
            <span className="text-3xl font-semibold tnum text-ink">{formatBRL(metaConfirmado)}</span>
            <span className="text-sm text-ink-faint">de {formatBRL(meta?.valor_alvo)}</span>
          </div>
          <Progress value={metaPct} accent="vision" />
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniMetric label="Falta" value={formatBRL(metaFalta)} />
            <MiniMetric label="Dias restantes" value={String(diasRestantes)} />
            <MiniMetric label="Média/mês" value={formatBRL(mediaMensal, { compact: true })} />
            <MiniMetric label="Média/semana" value={formatBRL(mediaSemanal, { compact: true })} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Indicadores secundários" />
          <div className="space-y-3">
            <Row label="Despesas dos negócios" value={formatBRL(m.despesasNegocios)} />
            <Row label="Despesas pessoais" value={formatBRL(m.despesasPessoais)} />
            <Row label="Valor a receber" value={formatBRL(m.aReceber)} />
            <Row label="Inadimplência" value={formatBRL(m.inadimplencia)} tone={m.inadimplencia > 0 ? "negative" : undefined} />
            <Row label="Receitas extras" value={formatBRL(m.receitasExtras)} tone="extra" />
            <div className="border-t border-line pt-3">
              <Row label="Patrimônio líquido" value={formatBRL(m.patrimonioLiquido)} strong />
            </div>
          </div>
        </Panel>
      </div>

      {/* Gráficos */}
      {meta && metaSerie.length > 1 ? (
        <Panel>
          <PanelHeader
            title="Ritmo da meta"
            description="Recebido acumulado contra o ritmo necessário para fechar no prazo"
          />
          <MetaPaceChart serie={metaSerie} alvo={Number(meta.valor_alvo)} />
        </Panel>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Faturamento, despesas e lucro" description={`Mês a mês · ${new Date().getFullYear()}`} />
          <BarChart
            groups={chart}
            series={[
              { label: "Faturamento", color: "rgb(var(--vision))" },
              { label: "Despesas", color: "rgb(var(--negative))" },
              { label: "Lucro", color: "rgb(var(--positive))" },
            ]}
          />
        </Panel>
        <Panel>
          <PanelHeader title="Faturamento por empresa" />
          <SplitBar
            parts={[
              { label: "Vision", value: m.vision.faturamento, color: "rgb(var(--vision))" },
              { label: "Digital Smile", value: m.digitalSmile.faturamento, color: "rgb(var(--smile))" },
            ]}
          />
          <p className="mt-6 text-2xs text-ink-dim">Receitas extras não entram no faturamento das empresas.</p>
        </Panel>
      </div>

      {/* Por empresa */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LinkCard href="/vision">
          <PanelHeader title="Vision" description="Fotos, vídeos, combos e sites" action={<Badge accent="vision">Empresa</Badge>} />
          <div className="grid grid-cols-3 gap-4">
            <MiniMetric label="Faturamento" value={formatBRL(m.vision.faturamento, { compact: true })} />
            <MiniMetric label="Recebido" value={formatBRL(m.vision.recebido, { compact: true })} accent="positive" />
            <MiniMetric label="Investimento" value={formatBRL(m.vision.investimento, { compact: true })} accent="vision" />
            <MiniMetric label="Lucro" value={formatBRL(m.vision.lucro, { compact: true })} />
            <MiniMetric label="Clientes novos" value={String(m.vision.clientesNovos)} />
            <MiniMetric label="CAC" value={m.vision.cac === null ? "—" : formatBRL(m.vision.cac)} />
          </div>
        </LinkCard>

        <LinkCard href="/digital-smile">
          <PanelHeader title="Digital Smile" description="Gestão de tráfego, sites e GMN" action={<Badge accent="smile">Empresa</Badge>} />
          <div className="grid grid-cols-3 gap-4">
            <MiniMetric label="Faturamento" value={formatBRL(m.digitalSmile.faturamento, { compact: true })} />
            <MiniMetric label="Recebido" value={formatBRL(m.digitalSmile.recebido, { compact: true })} accent="positive" />
            <MiniMetric label="Receita mensal" value={formatBRL(m.digitalSmile.mrr, { compact: true })} accent="smile" />
            <MiniMetric label="Lucro" value={formatBRL(m.digitalSmile.lucro, { compact: true })} />
            <MiniMetric label="Clientes ativos" value={String(m.digitalSmile.clientesAtivos)} />
            <MiniMetric label="CAC" value={m.digitalSmile.cac === null ? "—" : formatBRL(m.digitalSmile.cac)} />
          </div>
        </LinkCard>
      </div>

      {/* Atenção */}
      {attention.length > 0 ? (
        <Panel className="border-warning/20 bg-warning/[0.02]">
          <PanelHeader title="Atenção" description="Pendências que exigem ação" />
          <div className="space-y-2.5">
            {attention.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.tone === "negative" ? "bg-negative" : item.tone === "warning" ? "bg-warning" : "bg-ink-dim"}`} />
                <span className="text-ink-soft">{item.label}</span>
                {item.detail ? <span className="text-ink-dim">· {item.detail}</span> : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel>
          <PanelHeader title="Atenção" />
          <p className="text-sm text-ink-faint">Nenhuma pendência no momento. Cobranças vencidas, follow-ups e onboardings aparecerão aqui.</p>
        </Panel>
      )}
    </div>
  );
}

function Row({ label, value, tone, strong }: { label: string; value: string; tone?: "negative" | "extra"; strong?: boolean }) {
  const color = tone === "negative" ? "text-negative" : tone === "extra" ? "text-extra" : strong ? "text-ink" : "text-ink-soft";
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-ink-faint">{label}</span>
      <span className={`tnum ${strong ? "text-base font-semibold" : ""} ${color}`}>{value}</span>
    </div>
  );
}
