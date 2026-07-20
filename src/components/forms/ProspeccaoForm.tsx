"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Textarea, Select, DateInput } from "@/components/ui/fields";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { Button } from "@/components/ui/Button";
import { CompletarLeadForm, type LeadCandidate } from "@/components/digital-smile/CompletarLeadForm";
import { criarRegistroProspeccao, type PendenciaResumo } from "@/lib/actions";
import { canalOptions, hoje, type FormOptions } from "@/components/forms/options";
import { METODOS } from "@/lib/calc";
import { CANAIS_PROSPECCAO, PENDENCIA_TIPO_LABEL } from "@/lib/labels";

/**
 * Registro de PROSPECÇÃO ATIVA por NÚMEROS agregados (esforço + performance).
 * Sem "contratos" (esses derivam do Comercial real). Canal é obrigatório.
 * Depois de salvar, se houver eventos (reuniões/propostas), oferece identificar
 * os leads — opcional, sem obrigar. Vision mantém o formato anterior.
 */
export function ProspeccaoForm({ options, empresaId, variante, onDone, leadsExistentes = [] }: { options: FormOptions; empresaId: string; variante: "vision" | "smile"; onDone: () => void; leadsExistentes?: LeadCandidate[] }) {
  const router = useRouter();
  const { pending, error, run } = useFormSubmit();
  const [data, setData] = useState(hoje());
  const [metodo, setMetodo] = useState("prospeccao_ativa");
  const [canalContato, setCanalContato] = useState("");
  const [canal, setCanal] = useState("");
  const [f, setF] = useState<Record<string, string>>({});
  const [obs, setObs] = useState("");
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pendencias, setPendencias] = useState<PendenciaResumo[]>([]);
  const [resumo, setResumo] = useState<{ agendadas: number; realizadas: number; propostas: number } | null>(null);
  const [step, setStep] = useState<"form" | "salvo">("form");

  const num = (k: string) => Number(f[k] || "0") || 0;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((prev) => ({ ...prev, [k]: e.target.value.replace(/\D/g, "") }));

  if (variante === "smile") {
    if (step === "salvo") {
      return <RegistroSalvo pendencias={pendencias} resumo={resumo} options={options} empresaId={empresaId} leadsExistentes={leadsExistentes} onDone={onDone} />;
    }

    const abordagens = num("abordagens");
    const respostas = num("respostas");
    const positivas = num("respostas_positivas");
    const agendadas = num("reunioes_marcadas");
    const realizadas = num("reunioes_realizadas");
    const noShows = num("no_shows");

    const respostasInvalida = respostas > abordagens;
    const positivasInvalida = positivas > respostas;
    const realizadasInvalida = realizadas > agendadas;
    const noShowsInvalida = noShows > agendadas;
    const invalido = respostasInvalida || positivasInvalida || realizadasInvalida || noShowsInvalida;

    async function salvar() {
      if (!canalContato) { setErroLocal("Selecione o canal da prospecção."); return; }
      if (invalido) { setErroLocal("Corrija os números destacados antes de salvar."); return; }
      setErroLocal(null); setSalvando(true);
      const res = await criarRegistroProspeccao({
        empresa_id: empresaId, data, metodo_aquisicao: "prospeccao_ativa", fonte: canalContato,
        novos_prospectados: abordagens, respostas, respostas_positivas: positivas,
        reunioes_marcadas: agendadas, reunioes_realizadas: realizadas, no_shows: noShows,
        propostas_enviadas: num("propostas_enviadas"), observacao: obs,
      });
      setSalvando(false);
      if (!res.ok) { setErroLocal(res.error ?? "Erro ao salvar."); return; }
      router.refresh();
      const p = res.pendencias ?? [];
      if (p.length > 0) {
        setPendencias(p);
        setResumo({ agendadas, realizadas, propostas: num("propostas_enviadas") });
        setStep("salvo");
      } else {
        onDone();
      }
    }

    return (
      <div className="space-y-5">
        <FormFields>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data"><DateInput value={data} onChange={(e) => setData(e.target.value)} /></Field>
            <Field label="Canal da prospecção *" hint="Por onde abordei">
              <Select value={canalContato} onChange={setCanalContato} options={CANAIS_PROSPECCAO.map((x) => ({ value: x, label: x }))} placeholder="Selecionar…" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Abordagens / mensagens" hint="Enviadas neste canal"><TextInput value={f.abordagens ?? ""} onChange={set("abordagens")} inputMode="numeric" placeholder="0" /></Field>
            <Field label="Primeiras respostas"><TextInput value={f.respostas ?? ""} onChange={set("respostas")} inputMode="numeric" placeholder="0" /></Field>
            <Field label="Respostas positivas" hint="Interessados"><TextInput value={f.respostas_positivas ?? ""} onChange={set("respostas_positivas")} inputMode="numeric" placeholder="0" /></Field>
            <Field label="Reuniões agendadas"><TextInput value={f.reunioes_marcadas ?? ""} onChange={set("reunioes_marcadas")} inputMode="numeric" placeholder="0" /></Field>
            <Field label="Reuniões realizadas"><TextInput value={f.reunioes_realizadas ?? ""} onChange={set("reunioes_realizadas")} inputMode="numeric" placeholder="0" /></Field>
            <Field label="No-shows"><TextInput value={f.no_shows ?? ""} onChange={set("no_shows")} inputMode="numeric" placeholder="0" /></Field>
            <Field label="Propostas enviadas"><TextInput value={f.propostas_enviadas ?? ""} onChange={set("propostas_enviadas")} inputMode="numeric" placeholder="0" /></Field>
          </div>

          {respostasInvalida ? <p className="text-2xs text-negative">Primeiras respostas ({respostas}) não podem exceder as abordagens ({abordagens}).</p> : null}
          {positivasInvalida ? <p className="text-2xs text-negative">Respostas positivas ({positivas}) não podem exceder as primeiras respostas ({respostas}).</p> : null}
          {realizadasInvalida ? <p className="text-2xs text-negative">Reuniões realizadas ({realizadas}) não podem exceder as agendadas ({agendadas}).</p> : null}
          {noShowsInvalida ? <p className="text-2xs text-negative">No-shows ({noShows}) não podem exceder as reuniões agendadas ({agendadas}).</p> : null}

          <Field label="Observação"><Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} /></Field>
          <p className="text-2xs text-ink-dim">Contratos fechados não são digitados aqui — derivam das vendas/assinaturas reais do Comercial. Cadastrar leads é opcional e feito depois.</p>
        </FormFields>

        <FormFooter pending={salvando} error={erroLocal} submitLabel="Salvar registro" onSubmit={salvar} />
      </div>
    );
  }

  // -------- Vision (formato anterior, inalterado) --------
  const campos = [
    { key: "leads_encontrados", label: "Leads/perfis encontrados" },
    { key: "contatos_feitos", label: "Contatos feitos" },
    { key: "respostas", label: "Respostas" },
    { key: "qualificados", label: "Qualificados" },
    { key: "orcamentos_enviados", label: "Orçamentos enviados" },
  ];
  return (
    <div className="space-y-5">
      <FormFields>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><DateInput value={data} onChange={(e) => setData(e.target.value)} /></Field>
          <Field label="Método"><Select value={metodo} onChange={setMetodo} options={METODOS.map((m) => ({ value: m.value, label: m.label }))} /></Field>
        </div>
        <Field label="Canal (opcional)"><Select value={canal} onChange={setCanal} options={canalOptions(options)} placeholder="Selecionar…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          {campos.map((c) => (
            <Field key={c.key} label={c.label}><TextInput value={f[c.key] ?? ""} onChange={set(c.key)} inputMode="numeric" placeholder="0" /></Field>
          ))}
        </div>
        <Field label="Observação"><Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} /></Field>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Registrar atividade"
        onSubmit={() => run(() => criarRegistroProspeccao({
          empresa_id: empresaId, data, metodo_aquisicao: metodo, canal_id: canal,
          leads_encontrados: num("leads_encontrados"), contatos_feitos: num("contatos_feitos"),
          respostas: num("respostas"), qualificados: num("qualificados"), orcamentos_enviados: num("orcamentos_enviados"), observacao: obs,
        }).then((r) => { if (r.ok) onDone(); return r; }))}
      />
    </div>
  );
}

/** Passo 2 (Smile): registro salvo, identificação de leads opcional. */
function RegistroSalvo({ pendencias, resumo, options, empresaId, leadsExistentes, onDone }: {
  pendencias: PendenciaResumo[]; resumo: { agendadas: number; realizadas: number; propostas: number } | null;
  options: FormOptions; empresaId: string; leadsExistentes: LeadCandidate[]; onDone: () => void;
}) {
  const [sub, setSub] = useState<"oferta" | "lista">("oferta");
  const [restantes, setRestantes] = useState(pendencias);
  const [ativa, setAtiva] = useState<PendenciaResumo | null>(null);

  const resolver = (id: string) => {
    const next = restantes.filter((p) => p.id !== id);
    setRestantes(next);
    setAtiva(null);
    if (next.length === 0) onDone();
  };

  if (ativa) {
    return <CompletarLeadForm pendencia={ativa} options={options} empresaId={empresaId} leadsExistentes={leadsExistentes} onDone={() => resolver(ativa.id)} />;
  }

  if (sub === "lista") {
    return (
      <div className="space-y-4">
        <p className="text-xs text-ink-soft">Selecione uma pendência para completar. As demais continuam em <span className="text-ink">Comercial → Leads a cadastrar</span>.</p>
        <div className="space-y-2">
          {restantes.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg2 border border-line bg-surface-raised px-3 py-2">
              <div>
                <p className="text-sm text-ink">{PENDENCIA_TIPO_LABEL[p.tipo_evento] ?? p.tipo_evento}</p>
                <p className="text-2xs text-ink-faint">Prospecção ativa{p.canal ? ` · ${p.canal}` : ""}</p>
              </div>
              <Button variant="primary" type="button" onClick={() => setAtiva(p)}>Completar</Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end"><Button variant="ghost" type="button" onClick={onDone}>Concluir</Button></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl2 border border-positive/30 bg-positive-dim px-4 py-3">
        <p className="text-sm font-medium text-positive">Registro salvo com sucesso.</p>
        <p className="mt-1 text-xs text-ink-soft">Você registrou resultados que podem precisar de acompanhamento:</p>
        <ul className="mt-1.5 space-y-0.5 text-xs text-ink-soft">
          {resumo && resumo.agendadas > 0 ? <li>{resumo.agendadas} reuniã{resumo.agendadas > 1 ? "es" : "o"} agendada{resumo.agendadas > 1 ? "s" : ""}</li> : null}
          {resumo && resumo.propostas > 0 ? <li>{resumo.propostas} proposta{resumo.propostas > 1 ? "s" : ""} enviada{resumo.propostas > 1 ? "s" : ""}</li> : null}
        </ul>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onDone}>Fazer depois</Button>
        <Button variant="primary" type="button" onClick={() => setSub("lista")}>Identificar leads agora</Button>
      </div>
      <p className="text-2xs text-ink-dim">Você pode identificar 0, 1 ou todos — quando quiser. Os números agregados já foram salvos.</p>
    </div>
  );
}
