"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, TextInput, Textarea, Select, DateInput } from "@/components/ui/fields";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { atualizarRegistroProspeccao } from "@/lib/actions";
import { CANAIS_PROSPECCAO } from "@/lib/labels";

export type RegistroEditavel = {
  id: string; data: string; canal: string | null;
  abordagens: number; respostas: number; positivas: number;
  agendadas: number; realizadas: number; noShows: number; propostas: number;
  observacao: string | null;
};

export function EditarProspeccaoButton({ registro }: { registro: RegistroEditavel }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} title="Editar registro" className="rounded-md p-1 text-ink-dim transition-colors hover:bg-surface-hover hover:text-ink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Editar registro de prospecção" description="Corrigir números digitados">
        <EditForm registro={registro} onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

function EditForm({ registro, onDone }: { registro: RegistroEditavel; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [data, setData] = useState(registro.data);
  const [canal, setCanal] = useState(registro.canal ?? "");
  const [obs, setObs] = useState(registro.observacao ?? "");
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, string>>({
    abordagens: String(registro.abordagens), respostas: String(registro.respostas), respostas_positivas: String(registro.positivas),
    reunioes_marcadas: String(registro.agendadas), reunioes_realizadas: String(registro.realizadas), no_shows: String(registro.noShows),
    propostas_enviadas: String(registro.propostas),
  });
  const num = (k: string) => Number(f[k] || "0") || 0;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((prev) => ({ ...prev, [k]: e.target.value.replace(/\D/g, "") }));

  const invalido = num("respostas") > num("abordagens") || num("respostas_positivas") > num("respostas")
    || num("reunioes_realizadas") > num("reunioes_marcadas") || num("no_shows") > num("reunioes_marcadas");

  return (
    <div className="space-y-5">
      <FormFields>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><DateInput value={data} onChange={(e) => setData(e.target.value)} /></Field>
          <Field label="Canal"><Select value={canal} onChange={setCanal} options={CANAIS_PROSPECCAO.map((x) => ({ value: x, label: x }))} placeholder="Selecionar…" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Abordagens / mensagens"><TextInput value={f.abordagens} onChange={set("abordagens")} inputMode="numeric" /></Field>
          <Field label="Primeiras respostas"><TextInput value={f.respostas} onChange={set("respostas")} inputMode="numeric" /></Field>
          <Field label="Respostas positivas"><TextInput value={f.respostas_positivas} onChange={set("respostas_positivas")} inputMode="numeric" /></Field>
          <Field label="Reuniões agendadas"><TextInput value={f.reunioes_marcadas} onChange={set("reunioes_marcadas")} inputMode="numeric" /></Field>
          <Field label="Reuniões realizadas"><TextInput value={f.reunioes_realizadas} onChange={set("reunioes_realizadas")} inputMode="numeric" /></Field>
          <Field label="No-shows"><TextInput value={f.no_shows} onChange={set("no_shows")} inputMode="numeric" /></Field>
          <Field label="Propostas enviadas"><TextInput value={f.propostas_enviadas} onChange={set("propostas_enviadas")} inputMode="numeric" /></Field>
        </div>
        <p className="text-2xs text-ink-dim">Contratos não são digitados aqui — derivam dos contratos reais vinculados à origem.</p>
        {invalido ? <p className="text-2xs text-negative">Há números inconsistentes (respostas &gt; abordagens, realizadas &gt; agendadas, etc.).</p> : null}
        <Field label="Observação"><Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} /></Field>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error ?? erroLocal}
        submitLabel="Salvar alterações"
        onSubmit={() => {
          if (invalido) { setErroLocal("Corrija os números inconsistentes antes de salvar."); return; }
          setErroLocal(null);
          run(() => atualizarRegistroProspeccao(registro.id, {
            data, fonte: canal, novos_prospectados: num("abordagens"), respostas: num("respostas"), respostas_positivas: num("respostas_positivas"),
            reunioes_marcadas: num("reunioes_marcadas"), reunioes_realizadas: num("reunioes_realizadas"), no_shows: num("no_shows"),
            propostas_enviadas: num("propostas_enviadas"), observacao: obs,
          }));
        }}
      />
    </div>
  );
}
