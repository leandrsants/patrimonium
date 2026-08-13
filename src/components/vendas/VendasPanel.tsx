"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, EmptyState, KeyValue } from "@/components/ui/primitives";
import { Field, Select, Textarea } from "@/components/ui/fields";
import { PagamentoForm } from "@/components/forms/SmallForms";
import { FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { NovaVendaButton } from "@/components/actions/QuickButtons";
import { produtoOptions } from "@/components/forms/options";
import { atualizarStatusEntrega, atualizarVenda } from "@/lib/actions";
import { ENTREGA_LABEL, ENTREGA_STEPS, SITUACAO_ACCENT, SITUACAO_LABEL } from "@/lib/labels";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";
import type { ParcelaSituacao, Venda } from "@/lib/types";

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4L18 10l-4-4L4 16v4zM13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Placeholder que a migração colocou em observacao das vendas antigas.
const PLACEHOLDER_LEGADO = "Migrado do legado — revisar produto real.";

/**
 * Nota que descreve o trabalho: prioriza o texto ORIGINAL preservado do legado
 * (`legado_observacao_original`); senão a observação do usuário — ignorando o
 * placeholder de migração, que não é anotação de verdade.
 */
function notaVenda(v: Venda): string | null {
  const legado = v.legado_observacao_original?.trim();
  if (legado) return legado;
  const obs = v.observacao?.trim();
  return obs && obs !== PLACEHOLDER_LEGADO ? obs : null;
}

export function VendasPanel({
  vendas,
  parcelasPorVenda,
  options,
  empresaId,
  showEntrega = true,
}: {
  vendas: Venda[];
  parcelasPorVenda: Record<string, ParcelaSituacao[]>;
  options: FormOptions;
  empresaId: string;
  showEntrega?: boolean;
}) {
  const [selected, setSelected] = useState<Venda | null>(null);
  const [editing, setEditing] = useState<Venda | null>(null);
  const contaOpts = options.contas.map((c) => ({ value: c.id, label: c.nome }));

  function totals(vendaId: string) {
    const ps = parcelasPorVenda[vendaId] ?? [];
    const recebido = ps.reduce((s, p) => s + Number(p.recebido_liquido), 0);
    const pendente = ps.reduce((s, p) => s + Number(p.saldo_pendente), 0);
    const atrasada = ps.some((p) => p.situacao_calculada === "atrasada");
    return { recebido, pendente, atrasada };
  }

  if (vendas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma venda registrada"
        description="Registre uma venda — as parcelas são geradas automaticamente conforme a condição de pagamento do produto."
        cta={<NovaVendaButton options={options} empresaId={empresaId} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NovaVendaButton options={options} empresaId={empresaId} />
      </div>
      <div className="overflow-hidden rounded-xl2 border border-line">
        {vendas.map((v) => {
          const t = totals(v.id);
          return (
            <div key={v.id} className="flex w-full items-center justify-between gap-3 border-b border-line/70 transition-colors last:border-0 hover:bg-surface-hover">
              <button onClick={() => setSelected(v)} className="min-w-0 flex-1 py-3 pl-4 text-left">
                <p className="truncate text-sm font-medium text-ink">{v.cliente?.nome ?? "Sem cliente"}</p>
                <p className="truncate text-2xs text-ink-dim">{v.produto?.nome ?? "Venda avulsa"} · {formatDateBR(v.data_venda)}</p>
                {notaVenda(v) ? <p className="mt-0.5 truncate text-2xs text-ink-faint">{notaVenda(v)}</p> : null}
              </button>
              <div className="flex shrink-0 items-center gap-3 pr-3">
                <div className="hidden text-right sm:block">
                  <p className="text-2xs text-ink-dim">Recebido / Vendido</p>
                  <p className="text-xs tnum text-ink-soft">{formatBRL(t.recebido, { compact: true })} / {formatBRL(v.valor_final, { compact: true })}</p>
                </div>
                {t.atrasada ? <Badge accent="negative">Atrasada</Badge> : t.pendente > 0 ? <Badge accent="warning">Pendente</Badge> : <Badge accent="positive">Quitada</Badge>}
                <button
                  onClick={() => setEditing(v)}
                  title="Editar produto e descrição"
                  aria-label="Editar venda"
                  className="rounded-lg2 p-1.5 text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
                >
                  <PencilIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <VendaDrawer venda={selected} onClose={() => setSelected(null)} parcelas={selected ? parcelasPorVenda[selected.id] ?? [] : []} contaOpts={contaOpts} showEntrega={showEntrega} />
      {editing ? (
        <EditVendaDrawer key={editing.id} venda={editing} onClose={() => setEditing(null)} options={options} empresaId={empresaId} />
      ) : null}
    </div>
  );
}

/** Edição de catálogo da venda: produto (reclassifica em "Produtos") e descrição. */
function EditVendaDrawer({
  venda,
  onClose,
  options,
  empresaId,
}: {
  venda: Venda;
  onClose: () => void;
  options: FormOptions;
  empresaId: string;
}) {
  const { pending, error, run } = useFormSubmit(onClose);
  const [produto, setProduto] = useState(venda.produto_id ?? "");
  // Não pré-preenche com o placeholder de migração (não é anotação de verdade).
  const [obs, setObs] = useState(venda.observacao && venda.observacao !== PLACEHOLDER_LEGADO ? venda.observacao : "");
  const original = venda.legado_observacao_original?.trim();

  // Produtos ativos da empresa + o produto atual da venda (mesmo se inativo),
  // para não perder o vínculo ao editar vendas antigas.
  const base = produtoOptions(options, empresaId);
  const opts =
    venda.produto_id && !base.some((o) => o.value === venda.produto_id)
      ? [{ value: venda.produto_id, label: `${venda.produto?.nome ?? "Produto atual"} (inativo)` }, ...base]
      : base;

  return (
    <Drawer open onClose={onClose} title="Editar venda" description={venda.cliente?.nome ?? undefined}>
      <div className="space-y-5">
        {original ? (
          <div className="rounded-xl2 border border-line bg-surface-input p-3">
            <p className="mb-1 text-2xs font-semibold uppercase tracking-wide text-ink-faint">O que você escreveu (legado)</p>
            <p className="whitespace-pre-wrap text-sm text-ink-soft">{original}</p>
            <p className="mt-1.5 text-2xs text-ink-dim">Use como referência para escolher o produto certo abaixo.</p>
          </div>
        ) : null}
        <div className="space-y-4">
          <Field label="Produto / serviço" hint="Reclassifica qual trabalho foi — alimenta o faturamento por produto">
            <Select value={produto} onChange={setProduto} options={opts} placeholder="Venda avulsa (sem produto)" />
          </Field>
          <Field label="Minha anotação" hint="Texto livre seu — separado do original do legado">
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} />
          </Field>
        </div>
        <FormFooter
          pending={pending}
          error={error}
          submitLabel="Salvar alterações"
          onCancel={onClose}
          onSubmit={() => run(() => atualizarVenda(venda.id, { produto_id: produto || null, observacao: obs.trim() || null }))}
        />
      </div>
    </Drawer>
  );
}

function VendaDrawer({
  venda,
  onClose,
  parcelas,
  contaOpts,
  showEntrega,
}: {
  venda: Venda | null;
  onClose: () => void;
  parcelas: ParcelaSituacao[];
  contaOpts: { value: string; label: string }[];
  showEntrega: boolean;
}) {
  const { run } = useFormSubmit();
  const [pagarId, setPagarId] = useState<string | null>(null);

  if (!venda) return null;
  const recebido = parcelas.reduce((s, p) => s + Number(p.recebido_liquido), 0);
  const pendente = parcelas.reduce((s, p) => s + Number(p.saldo_pendente), 0);

  return (
    <Drawer open={!!venda} onClose={onClose} title={venda.cliente?.nome ?? "Venda"} description={venda.produto?.nome ?? "Venda avulsa"}>
      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface-input p-4">
          <KeyValue label="Valor vendido" value={<span className="tnum">{formatBRL(venda.valor_final)}</span>} />
          <KeyValue label="Recebido" value={<span className="tnum text-positive">{formatBRL(recebido)}</span>} />
          <KeyValue label="Pendente" value={<span className="tnum text-warning">{formatBRL(pendente)}</span>} />
          <KeyValue label="Data" value={formatDateBR(venda.data_venda)} />
          {venda.desconto_valor > 0 ? <KeyValue label="Desconto" value={formatBRL(venda.desconto_valor)} /> : null}
        </div>

        {notaVenda(venda) ? (
          <div>
            <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">
              Descrição{venda.legado_observacao_original ? " · texto original do legado" : ""}
            </h4>
            <p className="whitespace-pre-wrap text-sm text-ink-soft">{notaVenda(venda)}</p>
          </div>
        ) : null}

        {showEntrega ? (
          <div>
            <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Status de entrega</h4>
            <div className="flex flex-wrap gap-2">
              {ENTREGA_STEPS.map((s) => (
                <button
                  key={s}
                  onClick={() => run(() => atualizarStatusEntrega(venda.id, s))}
                  className={`rounded-full px-3 py-1 text-2xs font-medium transition-colors ${
                    venda.status_entrega === s ? "bg-ink text-canvas" : "border border-line text-ink-faint hover:border-line-strong hover:text-ink-soft"
                  }`}
                >
                  {ENTREGA_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Parcelas</h4>
          <div className="space-y-2">
            {parcelas.map((p) => (
              <div key={p.id} className="rounded-lg2 border border-line px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink">{p.descricao ?? `Parcela ${p.numero}`}</p>
                    <p className="text-2xs text-ink-dim">Vence {formatDateBR(p.data_vencimento)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tnum text-ink-soft">{formatBRL(p.recebido_liquido)} / {formatBRL(p.valor_devido)}</span>
                    <Badge accent={SITUACAO_ACCENT[p.situacao_calculada]}>{SITUACAO_LABEL[p.situacao_calculada]}</Badge>
                  </div>
                </div>
                {p.saldo_pendente > 0 && p.situacao_calculada !== "cancelada" ? (
                  pagarId === p.id ? (
                    <div className="mt-3 border-t border-line pt-3">
                      <PagamentoForm parcelaId={p.id} saldoPendente={Number(p.saldo_pendente)} contas={contaOpts} onDone={() => setPagarId(null)} />
                    </div>
                  ) : (
                    <button onClick={() => setPagarId(p.id)} className="mt-2 text-2xs font-medium text-positive hover:underline">
                      + Registrar pagamento
                    </button>
                  )
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
