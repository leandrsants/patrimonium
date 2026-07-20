"use client";

import { useState } from "react";
import { Field, TextInput, Textarea, Select, DateInput, MoneyInput, parseMoney } from "@/components/ui/fields";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { registrarPagamentoParcela, criarReuniao, criarCampanha, criarAssinatura } from "@/lib/actions";
import { contaOptions, clienteOptions, hoje, type FormOptions } from "@/components/forms/options";

export function PagamentoForm({
  parcelaId,
  saldoPendente,
  contas,
  onDone,
}: {
  parcelaId: string;
  saldoPendente: number;
  contas: { value: string; label: string }[];
  onDone: () => void;
}) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [valor, setValor] = useState(String(saldoPendente).replace(".", ","));
  const [conta, setConta] = useState(contas[0]?.value ?? "");
  const [data, setData] = useState(hoje());

  // Sem conta cadastrada não há onde registrar o recebimento — orienta o usuário.
  if (contas.length === 0) {
    return (
      <div className="rounded-lg2 border border-warning/30 bg-warning-dim px-3 py-2.5 text-xs text-ink-soft">
        Você ainda não tem nenhuma <span className="font-medium text-ink">conta</span> cadastrada. Crie uma em <span className="font-medium text-ink">Financeiro → Contas</span> para registrar o recebimento desta mensalidade.
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Valor recebido *" hint={`Saldo pendente: ${saldoPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}>
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Conta *">
            <Select value={conta} onChange={setConta} options={contas} placeholder="Selecionar…" />
          </Field>
          <Field label="Data">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
        </div>
        <p className="text-2xs text-ink-dim">Pagamentos parciais são permitidos — cada registro é um lançamento independente na mesma parcela.</p>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Registrar pagamento"
        onSubmit={() => run(() => registrarPagamentoParcela({ parcela_id: parcelaId, valor: parseMoney(valor), conta_id: conta, data_pagamento: data }))}
      />
    </div>
  );
}

export function ReuniaoForm({ oportunidadeId, onDone }: { oportunidadeId: string; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [data, setData] = useState(hoje());
  const [horario, setHorario] = useState("");
  const [status, setStatus] = useState("agendada");
  const [obs, setObs] = useState("");
  return (
    <div className="space-y-5">
      <FormFields>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data *">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Horário">
            <TextInput type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
          </Field>
        </div>
        <Field label="Status">
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "agendada", label: "Agendada" },
              { value: "realizada", label: "Realizada" },
              { value: "no_show", label: "No-show" },
              { value: "cancelada", label: "Cancelada" },
            ]}
          />
        </Field>
        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
        <p className="text-2xs text-ink-dim">O status da reunião não altera o estágio do lead automaticamente.</p>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Registrar reunião"
        onSubmit={() => run(() => criarReuniao({ oportunidade_id: oportunidadeId, data, horario, status, observacao: obs }))}
      />
    </div>
  );
}

export function CampanhaForm({ options, onDone, empresaId }: { options: FormOptions; onDone: () => void; empresaId?: string }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [empresa, setEmpresa] = useState(empresaId ?? options.empresas[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [inicio, setInicio] = useState(hoje());
  const [fim, setFim] = useState("");
  const [obs, setObs] = useState("");
  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Empresa *">
          <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} />
        </Field>
        <Field label="Nome da campanha *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início">
            <DateInput value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Field>
          <Field label="Fim">
            <DateInput value={fim} onChange={(e) => setFim(e.target.value)} />
          </Field>
        </div>
        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Criar campanha"
        onSubmit={() => run(() => criarCampanha({ empresa_id: empresa, nome, data_inicio: inicio, data_fim: fim, observacao: obs }))}
      />
    </div>
  );
}

const METODOS_ASSIN = [
  { value: "prospeccao_ativa", label: "Prospecção ativa" },
  { value: "trafego_pago", label: "Tráfego pago" },
  { value: "organico", label: "Orgânico" },
  { value: "indicacao", label: "Indicação" },
  { value: "outros", label: "Outros" },
];

export function AssinaturaForm({ options, onDone, empresaId, oportunidadeId, metodoInicial, clienteInicial }: { options: FormOptions; onDone: () => void; empresaId?: string; oportunidadeId?: string; metodoInicial?: string; clienteInicial?: string }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const dsId = empresaId ?? options.empresas.find((e) => e.slug === "digital_smile")?.id ?? "";
  const [empresa] = useState(dsId);
  const [cliente, setCliente] = useState(clienteInicial ?? "");
  const [produto, setProduto] = useState("");
  const [valor, setValor] = useState("500,00");
  const [referencia, setReferencia] = useState("1.000,00");
  const [dia, setDia] = useState("10");
  const [inicio, setInicio] = useState(hoje());
  const [metodo, setMetodo] = useState(metodoInicial ?? "");
  const [verba, setVerba] = useState("");
  const [more, setMore] = useState(false);
  const [desconto, setDesconto] = useState("");
  const [motivoDesc, setMotivoDesc] = useState("");
  const [cacAtrib, setCacAtrib] = useState("");

  const produtosRecorrentes = options.produtos.filter((p) => p.empresa_id === empresa && p.ativo && p.tipo_cobranca === "recorrente_mensal");

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Cliente *">
          <Select value={cliente} onChange={setCliente} options={clienteOptions(options)} placeholder="Selecionar…" />
        </Field>
        <Field label="Serviço *">
          <Select value={produto} onChange={setProduto} options={produtosRecorrentes.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Selecionar…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mensalidade *" hint="Valor contratado">
            <MoneyInput value={valor} onChange={setValor} />
          </Field>
          <Field label="Preço de referência" hint="Snapshot na contratação">
            <MoneyInput value={referencia} onChange={setReferencia} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dia de vencimento">
            <TextInput value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
          </Field>
          <Field label="Início do contrato">
            <DateInput value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Field>
        </div>
        <Field label="Método de aquisição">
          <Select value={metodo} onChange={setMetodo} options={METODOS_ASSIN} placeholder="Selecionar…" />
        </Field>

        <button type="button" onClick={() => setMore((v) => !v)} className="text-xs font-medium text-ink-faint hover:text-ink-soft">
          {more ? "− Menos" : "+ Desconto, CAC e verba"}
        </button>
        {more ? (
          <div className="space-y-4 border-t border-line pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desconto"><MoneyInput value={desconto} onChange={setDesconto} /></Field>
              <Field label="CAC atribuído" hint="Custo de aquisição deste cliente"><MoneyInput value={cacAtrib} onChange={setCacAtrib} /></Field>
            </div>
            <Field label="Motivo do desconto"><TextInput value={motivoDesc} onChange={(e) => setMotivoDesc(e.target.value)} /></Field>
            <Field label="Verba de anúncio do dentista (informativo)" hint="Não entra em receita, despesa ou CAC da Digital Smile">
              <MoneyInput value={verba} onChange={setVerba} />
            </Field>
          </div>
        ) : null}
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Criar assinatura"
        onSubmit={() =>
          run(() =>
            criarAssinatura({
              empresa_id: empresa,
              cliente_id: cliente,
              produto_id: produto,
              valor_mensal: parseMoney(valor),
              preco_referencia: parseMoney(referencia) || undefined,
              desconto_valor: parseMoney(desconto) || undefined,
              motivo_desconto: motivoDesc,
              dia_vencimento: Number(dia) || 10,
              data_inicio: inicio,
              metodo_aquisicao: metodo || undefined,
              cac_atribuido: parseMoney(cacAtrib) || undefined,
              verba_anuncios_dentista_estimada: parseMoney(verba) || undefined,
              oportunidade_id: oportunidadeId,
            }),
          )
        }
      />
    </div>
  );
}
