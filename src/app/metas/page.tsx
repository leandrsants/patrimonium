export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { Metric, Panel, PanelHeader, Progress, Badge, MiniMetric } from "@/components/ui/primitives";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/format";
import { daysUntil } from "@/lib/period";
import { getMetaAtiva, getMetaConfirmado, getValorEmRevisao, getLancamentos } from "@/lib/data";

export default async function MetasPage() {
  const [meta, confirmado, emRevisao, lancamentos] = await Promise.all([
    getMetaAtiva(), getMetaConfirmado(), getValorEmRevisao(), getLancamentos(),
  ]);

  const alvo = meta ? Number(meta.valor_alvo) : 10000;
  const pct = Math.min(100, (confirmado / alvo) * 100);
  const falta = Math.max(0, alvo - confirmado);
  const dias = meta ? Math.max(0, daysUntil(meta.data_fim)) : 0;
  const decorrido = meta ? Math.max(1, daysUntil(meta.data_inicio) * -1) : 1;
  const mediaMensal = dias > 0 ? falta / Math.max(1, dias / 30) : 0;
  const mediaSemanal = dias > 0 ? falta / Math.max(1, dias / 7) : 0;
  const ritmoDiario = decorrido > 0 ? confirmado / decorrido : 0;
  const projecao = confirmado + ritmoDiario * dias;

  // Evolução mensal do recebido elegível (Vision + Digital Smile)
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const ano = meta ? Number(meta.data_inicio.slice(0, 4)) : new Date().getFullYear();
  const evolucao = meses.map((label, m) => {
    const valor = lancamentos
      .filter((l) => l.tipo === "entrada" && l.natureza === "receita_empresarial" && l.status === "recebido" && (l.data_pagamento ?? "").startsWith(`${ano}-${String(m + 1).padStart(2, "0")}`) && (!meta || ((l.data_pagamento ?? "") >= meta.data_inicio && (l.data_pagamento ?? "") <= meta.data_fim)))
      .reduce((s, l) => s + Number(l.valor), 0);
    return { label, valor };
  });
  const maxMes = Math.max(1, ...evolucao.map((e) => e.valor));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Metas" title="Metas" subtitle="Objetivos de recebimento das empresas" accent="vision" />

      <Panel>
        <PanelHeader
          title={meta?.nome ?? "Meta 10K 2026"}
          description={meta ? `${formatDateBR(meta.data_inicio)} a ${formatDateBR(meta.data_fim)} · Vision + Digital Smile · somente dinheiro efetivamente recebido · extras não contam` : undefined}
          action={<Badge accent="vision">{formatPercent(pct, 1)}</Badge>}
        />
        <div className="mb-3 flex items-end justify-between">
          <span className="text-3xl font-semibold tnum text-ink">{formatBRL(confirmado)}</span>
          <span className="text-sm text-ink-faint">de {formatBRL(alvo)}</span>
        </div>
        <Progress value={pct} accent="vision" />
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <MiniMetric label="Confirmado" value={formatBRL(confirmado, { compact: true })} accent="positive" />
          <MiniMetric label="Em revisão" value={formatBRL(emRevisao, { compact: true })} accent="warning" />
          <MiniMetric label="Falta" value={formatBRL(falta, { compact: true })} />
          <MiniMetric label="Dias restantes" value={String(dias)} />
          <MiniMetric label="Média/mês nec." value={formatBRL(mediaMensal, { compact: true })} />
          <MiniMetric label="Projeção" value={formatBRL(projecao, { compact: true })} accent={projecao >= alvo ? "positive" : "neutral"} />
        </div>
        <p className="mt-4 text-2xs text-ink-dim">Média semanal necessária: {formatBRL(mediaSemanal, { compact: true })}. Valores em revisão (possíveis duplicidades, pipeline sem venda confirmada) nunca entram no confirmado.</p>
      </Panel>

      <Panel>
        <PanelHeader title="Evolução mensal (recebido elegível)" description={`Ano ${ano} · dentro do período da meta`} />
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {evolucao.map((e, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-end justify-center" style={{ height: 130 }}>
                <div className="w-full max-w-[22px] rounded-sm bg-gradient-to-t from-vision to-vision-soft" style={{ height: Math.max(2, (e.valor / maxMes) * 128) }} title={formatBRL(e.valor)} />
              </div>
              <span className="text-2xs text-ink-dim">{e.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Regras da meta" />
        <ul className="space-y-1.5 text-sm text-ink-faint">
          <li>• Base: dinheiro efetivamente recebido (não vendido).</li>
          <li>• Empresas: Vision + Digital Smile. Extras (Sonati, Trium…) não contam.</li>
          <li>• Pipeline sem venda/pagamento confirmado não conta.</li>
          <li>• Valores em revisão são exibidos à parte até confirmação humana.</li>
          <li>• Metas futuras (2027+) podem ser criadas sem alterar o sistema.</li>
        </ul>
      </Panel>
    </div>
  );
}
