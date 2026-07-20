"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { CompletarLeadForm, type LeadCandidate, type PendenciaView } from "@/components/digital-smile/CompletarLeadForm";
import { PENDENCIA_TIPO_LABEL } from "@/lib/labels";
import { formatDateBR } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";

/**
 * Banner discreto de oportunidades para acompanhar: reuniões/propostas registradas
 * na prospecção que ainda não têm lead individual identificado. Não obriga cadastro.
 */
export function LeadsPendentesBanner({
  pendencias, options, empresaId, leadsExistentes,
}: {
  pendencias: PendenciaView[]; options: FormOptions; empresaId: string; leadsExistentes: LeadCandidate[];
}) {
  const [aberto, setAberto] = useState(false);
  const [ativa, setAtiva] = useState<PendenciaView | null>(null);
  const [restantes, setRestantes] = useState(pendencias);

  if (pendencias.length === 0) return null;

  const reunioes = restantes.filter((p) => p.tipo_evento === "reuniao_agendada" || p.tipo_evento === "reuniao_realizada").length;
  const propostas = restantes.filter((p) => p.tipo_evento === "proposta_enviada").length;
  const partes = [reunioes > 0 ? `${reunioes} reuniã${reunioes > 1 ? "es" : "o"}` : null, propostas > 0 ? `${propostas} proposta${propostas > 1 ? "s" : ""}` : null].filter(Boolean).join(" · ");

  const resolver = (id: string) => {
    const next = restantes.filter((p) => p.id !== id);
    setRestantes(next);
    setAtiva(null);
    if (next.length === 0) setAberto(false);
  };

  if (restantes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl2 border border-warning/25 bg-warning/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-soft">
        <span className="font-medium text-ink">{partes || `${restantes.length} evento(s)`}</span> ainda sem lead identificado.
        <span className="ml-1 text-2xs text-ink-dim">Identifique só quem vale acompanhar.</span>
      </p>
      <Button variant="secondary" type="button" onClick={() => setAberto(true)}>Identificar leads</Button>

      <Drawer open={aberto} onClose={() => setAberto(false)} title="Identificar leads" description="Oportunidades da prospecção para acompanhar">
        {ativa ? (
          <CompletarLeadForm pendencia={ativa} options={options} empresaId={empresaId} leadsExistentes={leadsExistentes} onDone={() => resolver(ativa.id)} />
        ) : (
          <div className="space-y-2">
            {restantes.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg2 border border-line bg-surface-raised px-3 py-2">
                <div>
                  <p className="text-sm text-ink">{PENDENCIA_TIPO_LABEL[p.tipo_evento] ?? p.tipo_evento}</p>
                  <p className="text-2xs text-ink-faint">Prospecção ativa{p.canal ? ` · ${p.canal}` : ""} · {formatDateBR(p.data_origem)}</p>
                </div>
                <Button variant="primary" type="button" onClick={() => setAtiva(p)}>Completar</Button>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
