"use client";

import { useState } from "react";
import { Field, TextInput, Textarea, Select, DateInput, MoneyInput, parseMoney } from "@/components/ui/fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { criarConta, criarTransferencia, criarCartao, criarCompraCartao, criarDespesaRecorrente } from "@/lib/actions";
import { categoriaOptions, contaOptions, hoje, type FormOptions } from "@/components/forms/options";

export function ContaForm({ options, onDone }: { options: FormOptions; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("bancaria");
  const [moeda, setMoeda] = useState("BRL");
  const [saldo, setSaldo] = useState("");
  const [data, setData] = useState(hoje());
  const [qtd, setQtd] = useState("");
  const [cotacao, setCotacao] = useState("");

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Nome *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Conta principal, Binance…" autoFocus />
        </Field>
        <Field label="Tipo">
          <Select
            value={tipo}
            onChange={(v) => {
              setTipo(v);
              setMoeda(v === "cripto" ? "USDT" : "BRL");
            }}
            options={[
              { value: "bancaria", label: "Bancária" },
              { value: "especie", label: "Dinheiro em espécie" },
              { value: "investimento", label: "Investimento" },
              { value: "cripto", label: "Cripto (Binance/USDT)" },
            ]}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Saldo inicial (R$)">
            <MoneyInput value={saldo} onChange={setSaldo} />
          </Field>
          <Field label="Data-base">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
        </div>
        {tipo === "cripto" ? (
          <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
            <Field label={`Quantidade (${moeda})`} hint="Ex.: R$950 guardados em USDT">
              <TextInput value={qtd} onChange={(e) => setQtd(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" />
            </Field>
            <Field label="Cotação manual (R$)">
              <MoneyInput value={cotacao} onChange={setCotacao} />
            </Field>
          </div>
        ) : null}
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Criar conta"
        onSubmit={() =>
          run(() =>
            criarConta({
              nome,
              tipo,
              moeda_ativo: moeda,
              saldo_inicial: parseMoney(saldo),
              data_base: data,
              quantidade_ativo: parseMoney(qtd),
              cotacao_manual_brl: parseMoney(cotacao),
            }),
          )
        }
      />
    </div>
  );
}

export function TransferenciaForm({ options, onDone }: { options: FormOptions; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [origem, setOrigem] = useState(options.contas[0]?.id ?? "");
  const [destino, setDestino] = useState(options.contas[1]?.id ?? "");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje());
  const [obs, setObs] = useState("");

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="De *">
          <Select value={origem} onChange={setOrigem} options={contaOptions(options)} placeholder="Conta de origem" />
        </Field>
        <Field label="Para *">
          <Select value={destino} onChange={setDestino} options={contaOptions(options)} placeholder="Conta de destino" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor *">
            <MoneyInput value={valor} onChange={setValor} />
          </Field>
          <Field label="Data">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
        </div>
        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
        <p className="text-2xs text-ink-dim">Transferência move saldo entre contas — nunca conta como receita ou despesa.</p>
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Transferir"
        onSubmit={() =>
          run(() =>
            criarTransferencia({ conta_id: origem, conta_destino_id: destino, valor: parseMoney(valor), data, observacao: obs }),
          )
        }
      />
    </div>
  );
}

export function CartaoForm({ onDone }: { onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [nome, setNome] = useState("");
  const [fech, setFech] = useState("");
  const [venc, setVenc] = useState("");
  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Nome do cartão *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dia de fechamento">
            <TextInput value={fech} onChange={(e) => setFech(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
          </Field>
          <Field label="Dia de vencimento">
            <TextInput value={venc} onChange={(e) => setVenc(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
          </Field>
        </div>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Criar cartão"
        onSubmit={() => run(() => criarCartao({ nome, dia_fechamento: Number(fech) || undefined, dia_vencimento: Number(venc) || undefined }))}
      />
    </div>
  );
}

export function CompraCartaoForm({ options, cartoes, onDone }: { options: FormOptions; cartoes: { id: string; nome: string }[]; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [cartao, setCartao] = useState(cartoes[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [conta, setConta] = useState(options.contas[0]?.id ?? "");
  const [mes, setMes] = useState(hoje().slice(0, 8) + "01");

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Cartão *">
          <Select value={cartao} onChange={setCartao} options={cartoes.map((c) => ({ value: c.id, label: c.nome }))} placeholder="Selecionar…" />
        </Field>
        <Field label="Descrição *">
          <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor total *">
            <MoneyInput value={valor} onChange={setValor} />
          </Field>
          <Field label="Nº parcelas *">
            <TextInput value={parcelas} onChange={(e) => setParcelas(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
          </Field>
        </div>
        <Field label="Categoria">
          <Select value={categoria} onChange={setCategoria} options={categoriaOptions(options, ["empresarial", "pessoal"])} placeholder="Selecionar…" />
        </Field>
        <Field label="Empresa" hint="Vazio = despesa pessoal">
          <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} placeholder="Pessoal" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Conta de pagamento *">
            <Select value={conta} onChange={setConta} options={contaOptions(options)} placeholder="Selecionar…" />
          </Field>
          <Field label="1ª fatura">
            <DateInput value={mes} onChange={(e) => setMes(e.target.value)} />
          </Field>
        </div>
        <p className="text-2xs text-ink-dim">As parcelas futuras são geradas no cadastro. Pagar a fatura só muda o status — nunca duplica a despesa.</p>
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Registrar compra"
        onSubmit={() =>
          run(() =>
            criarCompraCartao({
              cartao_id: cartao,
              descricao,
              valor_total: parseMoney(valor),
              numero_parcelas: Number(parcelas) || 1,
              categoria_id: categoria,
              empresa_id: empresa,
              conta_id: conta,
              mes_primeira_fatura: mes,
              data_compra: hoje(),
            }),
          )
        }
      />
    </div>
  );
}

export function DespesaRecorrenteForm({ options, onDone }: { options: FormOptions; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [periodicidade, setPeriodicidade] = useState("mensal");
  const [prox, setProx] = useState(hoje());
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Nome *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Magnific, domínio, ferramenta…" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor *">
            <MoneyInput value={valor} onChange={setValor} />
          </Field>
          <Field label="Periodicidade">
            <Select
              value={periodicidade}
              onChange={setPeriodicidade}
              options={[
                { value: "mensal", label: "Mensal" },
                { value: "anual", label: "Anual" },
              ]}
            />
          </Field>
        </div>
        <Field label="Próximo vencimento">
          <DateInput value={prox} onChange={(e) => setProx(e.target.value)} />
        </Field>
        <Field label="Categoria">
          <Select value={categoria} onChange={setCategoria} options={categoriaOptions(options, ["empresarial", "pessoal"])} placeholder="Selecionar…" />
        </Field>
        <Field label="Empresa" hint="Vazio = pessoal">
          <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} placeholder="Pessoal" />
        </Field>
        <p className="text-2xs text-ink-dim">Não gera meses futuros em massa — apenas a próxima data. Cada competência é lançada individualmente.</p>
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Criar recorrência"
        onSubmit={() =>
          run(() =>
            criarDespesaRecorrente({
              nome,
              valor: parseMoney(valor),
              periodicidade: periodicidade as "mensal" | "anual",
              proxima_data_vencimento: prox,
              categoria_id: categoria,
              empresa_id: empresa,
            }),
          )
        }
      />
    </div>
  );
}
