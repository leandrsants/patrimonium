"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { CompletarLeadForm, type LeadCandidate, type PendenciaView } from "@/components/digital-smile/CompletarLeadForm";
import { dispensarPendencia } from "@/lib/actions";
import { useFormSubmit } from "@/components/forms/FormShell";
import { PENDENCIA_TIPO_LABEL } from "@/lib/labels";
import { formatDateBR } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";

export function LeadsACadastrar({
  pendencias, options, empresaId, leadsExistentes,
}: {
  pendencias: PendenciaView[]; options: FormOptions; empresaId: string; leadsExistentes: LeadCandidate[];
}) {
  const [ativa, setAtiva] = useState<PendenciaView | null>(null);

  if (pendencias.length === 0) return null;

  return (
    <Panel>
      <PanelHeader
        title={`Leads a cadastrar — ${pendencias.length}`}
        description="Pendências originadas da prospecção ativa · ainda não são leads reais"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pendencias.map((p) => (
          <PendenciaCard key={p.id} pendencia={p} onCompletar={() => setAtiva(p)} />
        ))}
      </div>

      <Drawer open={ativa !== null} onClose={() => setAtiva(null)} title="Completar lead" description="Cadastro rápido a partir da prospecção">
        {ativa ? (
          <CompletarLeadForm pendencia={ativa} options={options} empresaId={empresaId} leadsExistentes={leadsExistentes} onDone={() => setAtiva(null)} />
        ) : null}
      </Drawer>
    </Panel>
  );
}

function PendenciaCard({ pendencia, onCompletar }: { pendencia: PendenciaView; onCompletar: () => void }) {
  const { pending, run } = useFormSubmit();
  return (
    <div className="flex flex-col gap-2 rounded-xl2 border border-line bg-surface-raised p-3">
      <div>
        <p className="text-sm font-medium text-ink">{PENDENCIA_TIPO_LABEL[pendencia.tipo_evento] ?? pendencia.tipo_evento}</p>
        <p className="text-2xs text-ink-faint">Prospecção ativa{pendencia.canal ? ` · ${pendencia.canal}` : ""} · {formatDateBR(pendencia.data_origem)}</p>
      </div>
      <p className="text-xs italic text-ink-dim">Nome ainda não informado</p>
      <div className="flex items-center gap-2">
        <Button variant="primary" type="button" onClick={onCompletar}>Completar lead</Button>
        <Button variant="ghost" type="button" disabled={pending} onClick={() => run(() => dispensarPendencia(pendencia.id))}>Dispensar</Button>
      </div>
    </div>
  );
}
