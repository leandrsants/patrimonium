"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Panel, PanelHeader, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, TextInput, Select, MoneyInput, parseMoney } from "@/components/ui/fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { criarProduto, alternarAtivoProduto, criarCategoria, criarCanal } from "@/lib/actions";
import { formatBRL } from "@/lib/format";
import type { CanalAquisicao, CategoriaFinanceira, Empresa, ProdutoServico } from "@/lib/types";

export function ConfigWorkspace({
  empresas,
  produtos,
  categorias,
  canais,
}: {
  empresas: Empresa[];
  produtos: ProdutoServico[];
  categorias: CategoriaFinanceira[];
  canais: CanalAquisicao[];
}) {
  return (
    <Tabs
      tabs={[
        { label: "Produtos e serviços", content: <ProdutosConfig empresas={empresas} produtos={produtos} /> },
        { label: "Categorias", content: <CategoriasConfig categorias={categorias} /> },
        { label: "Origens", content: <CanaisConfig canais={canais} /> },
      ]}
    />
  );
}

function ProdutosConfig({ empresas, produtos }: { empresas: Empresa[]; produtos: ProdutoServico[] }) {
  const { run } = useFormSubmit();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setOpen(true)}>+ Novo produto</Button>
      </div>
      {empresas.map((e) => (
        <Panel key={e.id}>
          <PanelHeader title={e.nome} description="Produtos inativos não aparecem na operação diária" />
          <div className="divide-y divide-line">
            {produtos.filter((p) => p.empresa_id === e.id).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="text-ink-soft">{p.nome}</span>
                  <span className="ml-2 text-2xs text-ink-dim">{p.tipo_cobranca === "recorrente_mensal" ? "recorrente" : "único"}{p.preco_tabela ? ` · ${formatBRL(p.preco_tabela)}` : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge accent={p.ativo ? "positive" : "neutral"}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
                  <button onClick={() => run(() => alternarAtivoProduto(p.id, !p.ativo))} className="text-2xs text-ink-faint hover:text-ink-soft">
                    {p.ativo ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
      <NovoProdutoDrawer open={open} onClose={() => setOpen(false)} empresas={empresas} />
    </div>
  );
}

function NovoProdutoDrawer({ open, onClose, empresas }: { open: boolean; onClose: () => void; empresas: Empresa[] }) {
  const { pending, error, run } = useFormSubmit(onClose);
  const [empresa, setEmpresa] = useState(empresas[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("unico");
  const [preco, setPreco] = useState("");
  const [ref, setRef] = useState("");
  const [ativo, setAtivo] = useState("true");
  return (
    <Drawer open={open} onClose={onClose} title="Novo produto / serviço">
      <div className="space-y-5">
        <Field label="Empresa *"><Select value={empresa} onChange={setEmpresa} options={empresas.map((e) => ({ value: e.id, label: e.nome }))} /></Field>
        <Field label="Nome *"><TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></Field>
        <Field label="Tipo de cobrança">
          <Select value={tipo} onChange={setTipo} options={[{ value: "unico", label: "Único" }, { value: "recorrente_mensal", label: "Recorrente mensal" }]} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preço de tabela"><MoneyInput value={preco} onChange={setPreco} /></Field>
          <Field label="Preço de referência"><MoneyInput value={ref} onChange={setRef} /></Field>
        </div>
        <Field label="Situação">
          <SegmentedControl value={ativo} onChange={setAtivo} options={[{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }]} />
        </Field>
        <FormFooter pending={pending} error={error} submitLabel="Criar produto" onSubmit={() => run(() => criarProduto({ empresa_id: empresa, nome, tipo_cobranca: tipo, preco_tabela: parseMoney(preco) || undefined, preco_referencia: parseMoney(ref) || undefined, ativo: ativo === "true" }))} />
      </div>
    </Drawer>
  );
}

function CategoriasConfig({ categorias }: { categorias: CategoriaFinanceira[] }) {
  const { pending, error, run } = useFormSubmit();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState("empresarial");
  const [cac, setCac] = useState("false");
  const grupos: CategoriaFinanceira["grupo"][] = ["empresarial", "pessoal", "extra"];
  const label = { empresarial: "Empresariais", pessoal: "Pessoais", extra: "Extras" };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="primary" onClick={() => setOpen(true)}>+ Nova categoria</Button></div>
      {grupos.map((g) => (
        <Panel key={g}>
          <PanelHeader title={label[g]} />
          <div className="flex flex-wrap gap-2">
            {categorias.filter((c) => c.grupo === g).map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-ink-soft">
                {c.nome}
                {c.entra_no_cac ? <span className="text-2xs text-vision">CAC</span> : null}
              </span>
            ))}
          </div>
        </Panel>
      ))}
      <Drawer open={open} onClose={() => setOpen(false)} title="Nova categoria">
        <div className="space-y-5">
          <Field label="Nome *"><TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></Field>
          <Field label="Grupo"><Select value={grupo} onChange={setGrupo} options={grupos.map((g) => ({ value: g, label: label[g] }))} /></Field>
          {grupo === "empresarial" ? (
            <Field label="Entra no CAC?" hint="Apenas categorias de aquisição (ex.: tráfego pago)">
              <SegmentedControl value={cac} onChange={setCac} options={[{ value: "false", label: "Não" }, { value: "true", label: "Sim" }]} />
            </Field>
          ) : null}
          <FormFooter pending={pending} error={error} submitLabel="Criar categoria" onSubmit={async () => { const ok = await run(() => criarCategoria({ nome, grupo, entra_no_cac: grupo === "empresarial" && cac === "true" })); if (ok) setOpen(false); }} />
        </div>
      </Drawer>
    </div>
  );
}

function CanaisConfig({ canais }: { canais: CanalAquisicao[] }) {
  const { pending, error, run } = useFormSubmit();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="primary" onClick={() => setOpen(true)}>+ Nova origem</Button></div>
      <Panel>
        <PanelHeader title="Origens / canais de aquisição" />
        <div className="flex flex-wrap gap-2">
          {canais.map((c) => (
            <span key={c.id} className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">{c.nome}</span>
          ))}
        </div>
      </Panel>
      <Drawer open={open} onClose={() => setOpen(false)} title="Nova origem">
        <div className="space-y-5">
          <Field label="Nome *"><TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></Field>
          <FormFooter pending={pending} error={error} submitLabel="Criar origem" onSubmit={async () => { const ok = await run(() => criarCanal(nome)); if (ok) setOpen(false); }} />
        </div>
      </Drawer>
    </div>
  );
}
