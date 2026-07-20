"use client";

import { useState } from "react";
import { Field, Textarea, Select, DateInput, MoneyInput, parseMoney } from "@/components/ui/fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { criarReceita, criarDespesa } from "@/lib/actions";
import { canalOptions, categoriaOptions, clienteOptions, contaOptions, hoje, type FormOptions } from "@/components/forms/options";

export function ReceitaForm({ options, onDone, empresaId }: { options: FormOptions; onDone: () => void; empresaId?: string }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [natureza, setNatureza] = useState<"receita_empresarial" | "receita_extra">(empresaId ? "receita_empresarial" : "receita_empresarial");
  const [empresa, setEmpresa] = useState(empresaId ?? options.empresas[0]?.id ?? "");
  const [categoria, setCategoria] = useState("");
  const [conta, setConta] = useState(options.contas[0]?.id ?? "");
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje());
  const [recebido, setRecebido] = useState("recebido");
  const [obs, setObs] = useState("");

  return (
    <div className="space-y-5">
      <FormFields>
        <SegmentedControl
          value={natureza}
          onChange={(v) => setNatureza(v as "receita_empresarial" | "receita_extra")}
          options={[
            { value: "receita_empresarial", label: "Empresarial" },
            { value: "receita_extra", label: "Extra" },
          ]}
        />
        {natureza === "receita_empresarial" ? (
          <Field label="Empresa *">
            <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} />
          </Field>
        ) : (
          <Field label="Categoria (extra)">
            <Select value={categoria} onChange={setCategoria} options={categoriaOptions(options, ["extra"])} placeholder="Selecionar…" />
          </Field>
        )}
        <Field label="Cliente">
          <Select value={cliente} onChange={setCliente} options={clienteOptions(options)} placeholder="Opcional" />
        </Field>
        <Field label="Valor *">
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Conta *">
            <Select value={conta} onChange={setConta} options={contaOptions(options)} placeholder="Selecionar…" />
          </Field>
        </div>
        <Field label="Situação">
          <SegmentedControl
            value={recebido}
            onChange={setRecebido}
            options={[
              { value: "recebido", label: "Recebido" },
              { value: "previsto", label: "Previsto" },
            ]}
          />
        </Field>
        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
        {natureza === "receita_extra" ? (
          <p className="text-2xs text-ink-dim">Receitas extras entram no total recebido e no patrimônio, mas nunca no faturamento, CAC, ticket ou Meta 10K.</p>
        ) : null}
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Registrar receita"
        onSubmit={() =>
          run(() =>
            criarReceita({
              natureza,
              empresa_id: empresa,
              categoria_id: categoria,
              conta_id: conta,
              cliente_id: cliente,
              valor: parseMoney(valor),
              data,
              status: recebido as "recebido" | "previsto",
              observacao: obs,
            }),
          )
        }
      />
    </div>
  );
}

export function DespesaForm({ options, onDone, empresaId }: { options: FormOptions; onDone: () => void; empresaId?: string }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [natureza, setNatureza] = useState<"despesa_empresarial" | "despesa_pessoal">(empresaId ? "despesa_empresarial" : "despesa_pessoal");
  const [empresa, setEmpresa] = useState(empresaId ?? options.empresas[0]?.id ?? "");
  const [categoria, setCategoria] = useState("");
  const [conta, setConta] = useState(options.contas[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje());
  const [status, setStatus] = useState("pago");
  const [obs, setObs] = useState("");

  const grupo = natureza === "despesa_empresarial" ? (["empresarial"] as const) : (["pessoal"] as const);
  const catAtual = options.categorias.find((c) => c.id === categoria);

  return (
    <div className="space-y-5">
      <FormFields>
        <SegmentedControl
          value={natureza}
          onChange={(v) => {
            setNatureza(v as "despesa_empresarial" | "despesa_pessoal");
            setCategoria("");
          }}
          options={[
            { value: "despesa_empresarial", label: "Empresarial" },
            { value: "despesa_pessoal", label: "Pessoal" },
          ]}
        />
        {natureza === "despesa_empresarial" ? (
          <Field label="Empresa *">
            <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} />
          </Field>
        ) : null}
        <Field label="Categoria">
          <Select value={categoria} onChange={setCategoria} options={categoriaOptions(options, [...grupo])} placeholder="Selecionar…" />
        </Field>
        <Field label="Valor *">
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Conta *">
            <Select value={conta} onChange={setConta} options={contaOptions(options)} placeholder="Selecionar…" />
          </Field>
        </div>
        <Field label="Situação">
          <SegmentedControl
            value={status}
            onChange={setStatus}
            options={[
              { value: "pago", label: "Pago" },
              { value: "previsto", label: "Previsto" },
            ]}
          />
        </Field>
        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
        {catAtual?.entra_no_cac ? (
          <p className="text-2xs text-vision">Esta categoria é de aquisição — entra no cálculo de CAC da empresa.</p>
        ) : natureza === "despesa_empresarial" ? (
          <p className="text-2xs text-ink-dim">Ferramentas e assinaturas não entram no CAC.</p>
        ) : null}
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Registrar despesa"
        onSubmit={() =>
          run(() =>
            criarDespesa({
              natureza,
              empresa_id: empresa,
              categoria_id: categoria,
              conta_id: conta,
              valor: parseMoney(valor),
              data,
              status: status as "pago" | "previsto",
              observacao: obs,
            }),
          )
        }
      />
    </div>
  );
}

export function InvestimentoForm({ options, onDone, empresaId, metodoInicial }: { options: FormOptions; onDone: () => void; empresaId?: string; metodoInicial?: string }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [empresa, setEmpresa] = useState(empresaId ?? options.empresas.find((e) => e.slug === "vision")?.id ?? "");
  const [conta, setConta] = useState(options.contas[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje());
  const [metodo, setMetodo] = useState(metodoInicial ?? "trafego_pago");
  const [obs, setObs] = useState("");

  const trafego = options.categorias.find((c) => c.entra_no_cac);

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Empresa *">
          <Select value={empresa} onChange={setEmpresa} options={options.empresas.map((e) => ({ value: e.id, label: e.nome }))} />
        </Field>
        <Field label="Método de aquisição" hint="Atribui o custo ao CAC do método (tráfego pago, prospecção ativa…)">
          <Select value={metodo} onChange={setMetodo} options={[
            { value: "trafego_pago", label: "Tráfego pago" },
            { value: "prospeccao_ativa", label: "Prospecção ativa" },
            { value: "outros", label: "Outros" },
          ]} />
        </Field>
        <Field label="Investimento *">
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Conta *">
            <Select value={conta} onChange={setConta} options={contaOptions(options)} placeholder="Selecionar…" />
          </Field>
        </div>
        <Field label="Observação">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
        <p className="text-2xs text-vision">Registrado como aquisição — entra no CAC da empresa selecionada.</p>
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Registrar investimento"
        onSubmit={() =>
          run(() =>
            criarDespesa({
              natureza: "despesa_empresarial",
              empresa_id: empresa,
              categoria_id: trafego?.id,
              metodo_aquisicao: metodo,
              conta_id: conta,
              valor: parseMoney(valor),
              data,
              status: "pago",
              observacao: obs || "Investimento de aquisição",
            }),
          )
        }
      />
    </div>
  );
}
