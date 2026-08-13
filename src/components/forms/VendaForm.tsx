"use client";

import { useMemo, useState } from "react";
import { Field, TextInput, Textarea, Select, DateInput, MoneyInput, parseMoney } from "@/components/ui/fields";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { criarVenda, converterOportunidadeEmVenda, converterOportunidadeEmAssinatura } from "@/lib/actions";
import { canalOptions, clienteOptions, contaOptions, hoje, type FormOptions } from "@/components/forms/options";
import { METODOS } from "@/lib/calc";
import { ENTREGA_LABEL } from "@/lib/labels";
import type { RegraPagamento, Oportunidade } from "@/lib/types";

const REGRAS = [
  { value: "100_antes", label: "100% antecipado" },
  { value: "50_50", label: "50% antes / 50% na entrega" },
  { value: "personalizado", label: "Personalizado" },
];

// O caso normal é a venda já efetuada: dinheiro na conta e trabalho entregue.
// Cobrança em aberto e entrega em andamento são a exceção, escolhida à mão.
const PAGAMENTOS = [
  { value: "recebido", label: "Recebido — venda quitada" },
  { value: "a_receber", label: "A receber — gerar cobrança" },
];

const ENTREGAS = ["entregue", "finalizado", "aguardando_material", "em_producao", "aguardando_aprovacao"]
  .map((v) => ({ value: v, label: ENTREGA_LABEL[v] }));

export function VendaForm({
  options,
  onDone,
  empresaId,
  initialClienteId,
  oportunidadeId,
  oportunidade,
}: {
  options: FormOptions;
  onDone: () => void;
  empresaId?: string;
  initialClienteId?: string;
  oportunidadeId?: string;
  /** Quando presente, é uma CONVERSÃO de lead: origem e cliente vêm do lead. */
  oportunidade?: Oportunidade;
}) {
  const { pending, error, run } = useFormSubmit(onDone);
  const conversao = !!oportunidade;
  const oppId = oportunidade?.id ?? oportunidadeId;

  const [empresa, setEmpresa] = useState(oportunidade?.empresa_id ?? empresaId ?? options.empresas.find((e) => e.slug === "vision")?.id ?? "");
  const [produto, setProduto] = useState(oportunidade?.servico_interesse_id ?? "");
  const [cliente, setCliente] = useState(oportunidade?.cliente_id ?? initialClienteId ?? "");
  const [valor, setValor] = useState(oportunidade?.proposta_valor != null ? String(oportunidade.proposta_valor).replace(".", ",") : "");
  const [desconto, setDesconto] = useState("");
  const [data, setData] = useState(hoje());
  const [regra, setRegra] = useState("100_antes");
  const [antesPct, setAntesPct] = useState("50");
  const [canal, setCanal] = useState(oportunidade?.canal_id ?? "");
  const [fonte, setFonte] = useState(oportunidade?.fonte ?? "");
  const [metodo, setMetodo] = useState(oportunidade?.metodo_aquisicao ?? "");
  const [dia, setDia] = useState("10");
  const [obs, setObs] = useState("");
  const [pagamento, setPagamento] = useState<"recebido" | "a_receber">("recebido");
  const [conta, setConta] = useState(options.contas.find((c) => c.ativa)?.id ?? options.contas[0]?.id ?? "");
  const [entrega, setEntrega] = useState("entregue");

  // Serviço recorrente (modelo da Digital Smile) fecha como ASSINATURA/contrato,
  // não como venda avulsa — é o que alimenta Clientes e Contratos, Operação e MRR.
  const produtoSel = options.produtos.find((p) => p.id === produto);
  const ehContrato = conversao && produtoSel?.tipo_cobranca === "recorrente_mensal";

  // Não-conversão (ex.: Vision): produtos avulsos ativos.
  // Conversão: qualquer serviço ativo da empresa (Digital Smile vende recorrente),
  // garantindo que o serviço de interesse do lead apareça mesmo se estiver inativo
  // — prefill do que já foi escolhido, sem impedir trocar por outro no fechamento.
  const produtosEmpresa = useMemo(() => {
    if (!conversao) return options.produtos.filter((p) => p.empresa_id === empresa && p.ativo && p.tipo_cobranca === "unico");
    const base = options.produtos.filter((p) => p.empresa_id === empresa && p.ativo);
    const svcId = oportunidade?.servico_interesse_id;
    const svc = svcId ? options.produtos.find((p) => p.id === svcId) : undefined;
    return svc && !base.some((p) => p.id === svc.id) ? [svc, ...base] : base;
  }, [options.produtos, empresa, conversao, oportunidade?.servico_interesse_id]);

  // Nome do cliente vinculado ao lead (para exibir, não "Sem cliente vinculado").
  const clienteDoLead = conversao
    ? (options.clientes.find((c) => c.id === oportunidade!.cliente_id)?.nome ?? oportunidade!.nome_contato ?? "Contato do lead")
    : "";
  const semClienteGlobal = conversao && !oportunidade!.cliente_id;

  function onProduto(id: string) {
    setProduto(id);
    const p = options.produtos.find((x) => x.id === id);
    if (p?.preco_tabela) setValor(String(p.preco_tabela).replace(".", ","));
    if (p?.regra_pagamento_padrao?.tipo) setRegra(p.regra_pagamento_padrao.tipo);
  }

  const valorFinal = parseMoney(valor) - parseMoney(desconto);

  function condicao(): RegraPagamento {
    if (pagamento === "recebido" || regra === "100_antes") return { tipo: "100_antes" };
    if (regra === "50_50") return { tipo: "50_50" };
    return { tipo: "personalizado", antes_pct: Number(antesPct) || 50, entrega_pct: 100 - (Number(antesPct) || 50) };
  }

  function submit() {
    if (conversao && oppId && ehContrato) {
      return run(() => converterOportunidadeEmAssinatura(oppId, {
        produto_id: produto,
        valor_mensal: parseMoney(valor),
        preco_referencia: produtoSel?.preco_tabela ?? (parseMoney(valor) || undefined),
        desconto_valor: parseMoney(desconto) || undefined,
        dia_vencimento: Number(dia) || 10,
        data_inicio: data,
        metodo_aquisicao: metodo || undefined,
        canal_id: canal || undefined,
        fonte: fonte || undefined,
      }));
    }
    if (conversao && oppId) {
      return run(() => converterOportunidadeEmVenda(oppId, {
        produto_id: produto,
        valor_final: valorFinal,
        desconto_valor: parseMoney(desconto),
        data_venda: data,
        condicao_pagamento: condicao(),
        metodo_aquisicao: metodo || undefined,
        canal_id: canal || undefined,
        fonte: fonte || undefined,
        observacao: obs,
        pagamento,
        conta_id: pagamento === "recebido" ? conta || undefined : undefined,
        status_entrega: entrega,
      }));
    }
    return run(() => criarVenda({
      empresa_id: empresa,
      produto_id: produto,
      cliente_id: cliente,
      valor_final: valorFinal,
      desconto_valor: parseMoney(desconto),
      data_venda: data,
      condicao_pagamento: condicao(),
      canal_id: canal,
      metodo_aquisicao: metodo,
      oportunidade_id: oppId,
      observacao: obs,
      pagamento,
      conta_id: pagamento === "recebido" ? conta || undefined : undefined,
      status_entrega: entrega,
    }));
  }

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Empresa *">
          <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} />
        </Field>
        <Field label="Produto / serviço *" hint={conversao ? "Interesse do lead pré-selecionado — pode trocar pelo que foi fechado" : undefined}>
          <Select value={produto} onChange={onProduto} options={produtosEmpresa.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Selecionar…" />
        </Field>

        {conversao ? (
          <Field label="Cliente" hint="Vinculado ao lead">
            <div className="flex items-center gap-2 rounded-lg2 border border-line bg-surface-input px-3 py-2 text-sm text-ink">
              {clienteDoLead}
              {semClienteGlobal ? <span className="text-2xs text-ink-dim">· cliente global criado/vinculado ao salvar</span> : null}
            </div>
          </Field>
        ) : (
          <Field label="Cliente">
            <Select value={cliente} onChange={setCliente} options={clienteOptions(options)} placeholder="Sem cliente vinculado" />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={ehContrato ? "Mensalidade *" : "Valor *"}>
            <MoneyInput value={valor} onChange={setValor} />
          </Field>
          <Field label="Desconto">
            <MoneyInput value={desconto} onChange={setDesconto} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={ehContrato ? "Início do contrato" : "Data da venda"}>
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          {ehContrato ? (
            <Field label="Dia de vencimento">
              <TextInput value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
            </Field>
          ) : null}
        </div>
        {ehContrato ? null : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pagamento">
                <Select value={pagamento} onChange={(v) => setPagamento(v as "recebido" | "a_receber")} options={PAGAMENTOS} />
              </Field>
              <Field label="Entrega">
                <Select value={entrega} onChange={setEntrega} options={ENTREGAS} />
              </Field>
            </div>
            {pagamento === "recebido" ? (
              options.contas.length ? (
                <Field label="Conta que recebeu *">
                  <Select value={conta} onChange={setConta} options={contaOptions(options)} placeholder="Selecionar…" />
                </Field>
              ) : (
                <div className="rounded-lg2 border border-warning/30 bg-warning-dim px-3 py-2.5 text-xs text-ink-soft">
                  Nenhuma <span className="font-medium text-ink">conta</span> cadastrada. Crie uma em <span className="font-medium text-ink">Financeiro → Contas</span> ou registre a venda como <span className="font-medium text-ink">a receber</span>.
                </div>
              )
            ) : (
              <>
                <Field label="Condição de pagamento" hint="Fotos: 100% antes · Vídeo/Site: 50/50 · Combo: personalizado">
                  <Select value={regra} onChange={setRegra} options={REGRAS} />
                </Field>
                {regra === "personalizado" ? (
                  <Field label="% pago antes da entrega">
                    <TextInput value={antesPct} onChange={(e) => setAntesPct(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
                  </Field>
                ) : null}
              </>
            )}
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Método de aquisição" hint={conversao ? "Do lead — ajuste só se necessário" : undefined}>
            <Select value={metodo} onChange={setMetodo} options={METODOS.map((m) => ({ value: m.value, label: m.label }))} placeholder="Selecionar…" />
          </Field>
          {conversao ? (
            <Field label="Canal / origem" hint="Do lead — ajuste só se necessário">
              <TextInput value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Ex.: Instagram" />
            </Field>
          ) : (
            <Field label="Canal / origem">
              <Select value={canal} onChange={setCanal} options={canalOptions(options)} placeholder="Selecionar…" />
            </Field>
          )}
        </div>
        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>

        <div className="rounded-lg2 border border-line bg-surface-input px-3 py-2 text-xs text-ink-faint">
          {ehContrato ? "Mensalidade" : "Valor final"}: <span className="tnum font-medium text-ink">{valorFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          {ehContrato
            ? " · cria a assinatura (contrato) e entra em onboarding."
            : pagamento === "recebido"
              ? " · entra como recebido na conta escolhida, sem cobrança em aberto."
              : " · as parcelas da condição escolhida ficam em aberto para cobrar depois."}
        </div>
      </FormFields>

      <FormFooter pending={pending} error={error} submitLabel={ehContrato ? "Fechar contrato" : "Registrar venda"} onSubmit={submit} />
    </div>
  );
}
