"use client";

import { Metric, EmptyState, Badge } from "@/components/ui/primitives";
import { NovaCampanhaButton } from "@/components/actions/QuickButtons";
import { InvestimentoQuick } from "@/components/comercial/InvestimentoQuick";
import { formatBRL, formatDateBR, safeRatio } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";
import type { Campanha } from "@/lib/types";

export type CampanhaRow = Campanha & {
  investimento: number;
  clientesConquistados: number;
  receitaAtribuida: number;
};

export function TrafegoPagoPanel({
  campanhas,
  investimentoTotal,
  clientesNovos,
  cac,
  receita,
  options,
  empresaId,
  variante,
}: {
  campanhas: CampanhaRow[];
  investimentoTotal: number;
  clientesNovos: number;
  cac: number | null;
  /** Receita do período para o ROAS (faturamento ÷ investimento). */
  receita: number;
  options: FormOptions;
  empresaId: string;
  variante: "vision" | "smile";
}) {
  const roas = safeRatio(receita, investimentoTotal);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Investimento (período)" value={formatBRL(investimentoTotal)} accent={variante} />
        <Metric label="Clientes conquistados" value={String(clientesNovos)} />
        <Metric label="CAC" value={cac === null ? "—" : formatBRL(cac)} />
        <Metric label="ROAS" value={roas === null ? "—" : `${roas.toFixed(2)}x`} hint="Faturamento ÷ investimento" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-2xs font-semibold uppercase tracking-wide text-ink-faint">Campanhas</h3>
        <div className="flex gap-2">
          <InvestimentoQuick options={options} empresaId={empresaId} />
          <NovaCampanhaButton options={options} empresaId={empresaId} />
        </div>
      </div>

      {campanhas.length === 0 ? (
        <EmptyState
          title="Nenhuma campanha registrada"
          description="Registre campanhas e seus investimentos para acompanhar CPL, CAC e ROAS. Ferramentas (ex.: Magnific) não entram no CAC."
          cta={<NovaCampanhaButton options={options} empresaId={empresaId} variant="primary" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-line">
          {campanhas.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 border-b border-line/70 px-4 py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{c.nome}</p>
                <p className="text-2xs text-ink-dim">
                  {c.data_inicio ? formatDateBR(c.data_inicio) : "—"} {c.data_fim ? `— ${formatDateBR(c.data_fim)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xs text-ink-dim">Investido</p>
                  <p className="text-xs tnum text-ink-soft">{formatBRL(c.investimento, { compact: true })}</p>
                </div>
                <Badge accent={c.ativa ? variante : "neutral"}>{c.ativa ? "Ativa" : "Encerrada"}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {variante === "smile" ? (
        <p className="text-2xs text-ink-dim">
          A verba de anúncios paga diretamente pelo dentista é apenas informativa — não é receita, despesa, investimento ou CAC da Digital Smile.
        </p>
      ) : null}
    </div>
  );
}
