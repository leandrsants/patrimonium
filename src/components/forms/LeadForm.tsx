"use client";

import { useState } from "react";
import { Field, TextInput, Textarea, Select, DateInput, MoneyInput, parseMoney } from "@/components/ui/fields";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { criarOportunidade } from "@/lib/actions";
import { canalOptions, produtoOptions, type FormOptions } from "@/components/forms/options";
import { METODOS } from "@/lib/calc";
import { FONTES_CONTATO } from "@/lib/labels";

const ESTAGIOS_VISION = [
  { value: "interessado", label: "Interessado" },
  { value: "follow_up", label: "Follow-up" },
  { value: "orcamento_enviado", label: "Orçamento enviado" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];
const ESTAGIOS_SMILE = [
  { value: "interessado", label: "Interessado" },
  { value: "reuniao_agendada", label: "Reunião agendada" },
  { value: "reuniao_realizada", label: "Reunião realizada" },
  { value: "proposta_enviada", label: "Proposta enviada" },
  { value: "follow_up", label: "Follow-up" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

export function LeadForm({ options, onDone, empresaId, metodoInicial, fonteInicial, compacto }: { options: FormOptions; onDone: () => void; empresaId?: string; metodoInicial?: string; fonteInicial?: string; compacto?: boolean }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [empresa, setEmpresa] = useState(empresaId ?? options.empresas[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [canal, setCanal] = useState("");
  const [metodo, setMetodo] = useState(metodoInicial ?? "");
  const [fonte, setFonte] = useState(fonteInicial ?? "");
  const [estagio, setEstagio] = useState("interessado");
  const [followup, setFollowup] = useState("");
  const [proximaAcao, setProximaAcao] = useState("");
  const [obs, setObs] = useState("");
  const [more, setMore] = useState(false);
  const [abordagem, setAbordagem] = useState("");
  const [valorPot, setValorPot] = useState("");
  const [cidade, setCidade] = useState("");
  const [instagram, setInstagram] = useState("");

  const empresaSlug = options.empresas.find((e) => e.id === empresa)?.slug;
  const estagios = empresaSlug === "digital_smile" ? ESTAGIOS_SMILE : ESTAGIOS_VISION;

  const submit = () =>
    run(() =>
      criarOportunidade({
        empresa_id: empresa,
        nome_contato: nome,
        telefone_contato: telefone,
        instagram,
        servico_interesse_id: servico,
        canal_id: canal,
        metodo_aquisicao: metodo,
        fonte,
        abordagem,
        valor_potencial: parseMoney(valorPot) || undefined,
        cidade,
        estagio,
        proxima_acao: proximaAcao,
        proxima_acao_data: followup,
        observacao: obs,
      }),
    );

  // ---- Cadastro rápido (a partir da Prospecção Ativa): campos mínimos ----
  if (compacto) {
    return (
      <div className="space-y-5">
        <FormFields>
          <Field label="Nome do dentista / clínica *">
            <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do lead" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone"><TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} /></Field>
            <Field label="Instagram"><TextInput value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@perfil" /></Field>
          </div>
          <Field label="Canal / origem" hint="Pré-preenchido pela prospecção">
            <Select value={fonte} onChange={setFonte} options={FONTES_CONTATO.map((x) => ({ value: x, label: x }))} placeholder="Selecionar…" />
          </Field>
          <Field label="Estágio">
            <Select value={estagio} onChange={setEstagio} options={estagios} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Próxima ação"><TextInput value={proximaAcao} onChange={(e) => setProximaAcao(e.target.value)} placeholder="Ex.: enviar proposta" /></Field>
            <Field label="Data da próxima ação"><DateInput value={followup} onChange={(e) => setFollowup(e.target.value)} /></Field>
          </div>
          <Field label="Observação"><Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} /></Field>
        </FormFields>
        <FormFooter pending={pending} error={error} submitLabel="Cadastrar lead" onSubmit={submit} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Empresa *">
          <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} />
        </Field>
        <Field label="Nome / contato *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do lead" autoFocus />
        </Field>
        <Field label="Telefone">
          <TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </Field>
        <Field label="Serviço de interesse">
          <Select value={servico} onChange={setServico} options={produtoOptions(options, empresa)} placeholder="Selecionar…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Método">
            <Select value={metodo} onChange={setMetodo} options={METODOS.map((m) => ({ value: m.value, label: m.label }))} placeholder="Selecionar…" />
          </Field>
          <Field label="Fonte" hint="Onde encontrei">
            <Select value={fonte} onChange={setFonte} options={FONTES_CONTATO.map((x) => ({ value: x, label: x }))} placeholder="Selecionar…" />
          </Field>
        </div>
        <Field label="Canal / origem (opcional)">
          <Select value={canal} onChange={setCanal} options={canalOptions(options)} placeholder="Selecionar…" />
        </Field>
        <Field label="Estágio">
          <Select value={estagio} onChange={setEstagio} options={estagios} />
        </Field>
        <Field label="Próximo follow-up">
          <DateInput value={followup} onChange={(e) => setFollowup(e.target.value)} />
        </Field>

        <button type="button" onClick={() => setMore((v) => !v)} className="text-xs font-medium text-ink-faint hover:text-ink-soft">
          {more ? "− Menos" : "+ Mais informações"}
        </button>
        {more ? (
          <div className="space-y-4 border-t border-line pt-4">
            <Field label="Abordagem utilizada"><TextInput value={abordagem} onChange={(e) => setAbordagem(e.target.value)} placeholder="Ex.: script diagnóstico" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor potencial"><MoneyInput value={valorPot} onChange={setValorPot} /></Field>
              <Field label="Cidade"><TextInput value={cidade} onChange={(e) => setCidade(e.target.value)} /></Field>
            </div>
            <Field label="Instagram"><TextInput value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@perfil" /></Field>
          </div>
        ) : null}

        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
      </FormFields>

      <FormFooter pending={pending} error={error} submitLabel="Criar lead" onSubmit={submit} />
    </div>
  );
}
