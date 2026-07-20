"use client";

import { useMemo, useState } from "react";
import { Field, TextInput, Textarea, Select, DateInput, MoneyInput, parseMoney } from "@/components/ui/fields";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { Button } from "@/components/ui/Button";
import { completarPendenciaLead, vincularPendenciaAExistente } from "@/lib/actions";
import { produtoOptions, type FormOptions } from "@/components/forms/options";
import { ESTAGIOS_SMILE, PENDENCIA_TIPO_ESTAGIO, PENDENCIA_TIPO_LABEL, CANAIS_PROSPECCAO } from "@/lib/labels";

export type LeadCandidate = { id: string; nome: string; telefone: string | null; instagram: string | null };
export type PendenciaView = { id: string; tipo_evento: string; canal: string | null; data_origem: string };

const ESTAGIO_LABEL: Record<string, string> = {
  interessado: "Interessado", primeiro_contato: "Primeiro contato", respondeu: "Respondeu", qualificado: "Qualificado",
  convite_reuniao: "Convite p/ reunião", reuniao_agendada: "Reunião agendada", reuniao_realizada: "Reunião realizada",
  diagnostico: "Diagnóstico", proposta_enviada: "Proposta enviada", negociacao: "Negociação", fechado: "Fechado", perdido: "Perdido",
};

const soDigitos = (s: string) => s.replace(/\D/g, "");
const normIg = (s: string) => s.trim().toLowerCase().replace(/^@/, "");

export function CompletarLeadForm({
  pendencia, options, empresaId, leadsExistentes, onDone,
}: {
  pendencia: PendenciaView; options: FormOptions; empresaId: string; leadsExistentes: LeadCandidate[]; onDone: () => void;
}) {
  const { pending, error, run } = useFormSubmit(onDone);
  const ehReuniao = pendencia.tipo_evento === "reuniao_agendada" || pendencia.tipo_evento === "reuniao_realizada";
  const ehProposta = pendencia.tipo_evento === "proposta_enviada";

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [servico, setServico] = useState("");
  const [estagio, setEstagio] = useState(PENDENCIA_TIPO_ESTAGIO[pendencia.tipo_evento] ?? "interessado");
  const [proximaAcao, setProximaAcao] = useState("");
  const [proximaData, setProximaData] = useState("");
  const [obs, setObs] = useState("");
  // Reunião
  const [reuniaoData, setReuniaoData] = useState(ehReuniao ? pendencia.data_origem : "");
  const [reuniaoHora, setReuniaoHora] = useState("");
  // Proposta
  const [propValor, setPropValor] = useState("");
  const [propData, setPropData] = useState(ehProposta ? pendencia.data_origem : "");
  const [propStatus, setPropStatus] = useState("enviada");

  // ---- Dedupe (§11): possíveis correspondências por telefone/nome/instagram ----
  const matches = useMemo(() => {
    const tel = soDigitos(telefone);
    const nm = nome.trim().toLowerCase();
    const ig = normIg(instagram);
    if (!tel && nm.length < 3 && !ig) return [];
    return leadsExistentes.filter((l) => {
      const lt = l.telefone ? soDigitos(l.telefone) : "";
      const ln = l.nome.trim().toLowerCase();
      const li = l.instagram ? normIg(l.instagram) : "";
      if (tel && lt && tel === lt) return true;
      if (ig && li && ig === li) return true;
      if (nm.length >= 3 && ln && (ln.includes(nm) || nm.includes(ln))) return true;
      return false;
    }).slice(0, 5);
  }, [telefone, nome, instagram, leadsExistentes]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg2 border border-line bg-surface-input px-3 py-2 text-xs text-ink-soft">
        Origem: <span className="text-ink">{PENDENCIA_TIPO_LABEL[pendencia.tipo_evento]}</span> · Prospecção ativa
        {pendencia.canal ? <> · {pendencia.canal}</> : null} · {pendencia.data_origem}
      </div>

      {matches.length > 0 ? (
        <div className="space-y-2 rounded-lg2 border border-warning/30 bg-warning-dim px-3 py-2.5">
          <p className="text-xs font-medium text-warning">Possível registro existente</p>
          {matches.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-ink-soft">{m.nome || "Sem nome"}{m.telefone ? ` · ${m.telefone}` : ""}</span>
              <Button variant="ghost" type="button" onClick={() => run(() => vincularPendenciaAExistente(pendencia.id, m.id))}>Vincular ao existente</Button>
            </div>
          ))}
          <p className="text-2xs text-ink-dim">Ou preencha abaixo e clique em “Criar novo”.</p>
        </div>
      ) : null}

      <FormFields>
        <Field label="Nome do dentista / clínica *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Dr. João — Clínica X" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone"><TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} /></Field>
          <Field label="Instagram"><TextInput value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@perfil" /></Field>
        </div>
        <Field label="Serviço de interesse">
          <Select value={servico} onChange={setServico} options={produtoOptions(options, empresaId)} placeholder="Selecionar…" />
        </Field>
        <Field label="Etapa" hint="Sugerida pela origem — pode ajustar">
          <Select value={estagio} onChange={setEstagio} options={ESTAGIOS_SMILE.map((e) => ({ value: e, label: ESTAGIO_LABEL[e] ?? e }))} />
        </Field>

        {ehReuniao ? (
          <div className="rounded-lg2 border border-line bg-surface-input p-3">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Reunião</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data da reunião"><DateInput value={reuniaoData} onChange={(e) => setReuniaoData(e.target.value)} /></Field>
              <Field label="Horário"><TextInput type="time" value={reuniaoHora} onChange={(e) => setReuniaoHora(e.target.value)} /></Field>
            </div>
            <p className="mt-2 text-2xs text-ink-dim">Cria a reunião real (status {pendencia.tipo_evento === "reuniao_realizada" ? "realizada" : "agendada"}) vinculada ao lead.</p>
          </div>
        ) : null}

        {ehProposta ? (
          <div className="rounded-lg2 border border-line bg-surface-input p-3">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Proposta</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor proposto"><MoneyInput value={propValor} onChange={setPropValor} /></Field>
              <Field label="Data"><DateInput value={propData} onChange={(e) => setPropData(e.target.value)} /></Field>
            </div>
            <Field label="Status">
              <Select value={propStatus} onChange={setPropStatus} options={[{ value: "enviada", label: "Enviada" }, { value: "negociacao", label: "Negociação" }, { value: "aceita", label: "Aceita" }, { value: "recusada", label: "Recusada" }]} />
            </Field>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Próxima ação"><TextInput value={proximaAcao} onChange={(e) => setProximaAcao(e.target.value)} placeholder="Ex.: enviar proposta" /></Field>
          <Field label="Data da próxima ação"><DateInput value={proximaData} onChange={(e) => setProximaData(e.target.value)} /></Field>
        </div>
        <Field label="Observação"><Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} /></Field>
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel={matches.length > 0 ? "Criar novo" : "Cadastrar lead"}
        onSubmit={() => run(() => completarPendenciaLead(pendencia.id, {
          nome_contato: nome, telefone_contato: telefone, instagram, servico_interesse_id: servico,
          estagio, proxima_acao: proximaAcao, proxima_acao_data: proximaData, observacao: obs,
          reuniao_data: ehReuniao ? reuniaoData : undefined, reuniao_horario: ehReuniao ? reuniaoHora : undefined,
          proposta_valor: ehProposta && propValor ? parseMoney(propValor) : undefined,
          proposta_data: ehProposta ? propData : undefined, proposta_status: ehProposta ? propStatus : undefined,
        }))}
      />
    </div>
  );
}
