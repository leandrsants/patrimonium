"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { SegmentedControl } from "@/components/ui/Tabs";
import { formatBRL, formatDateBR } from "@/lib/format";
import { cancelarLancamento, excluirLancamento, reativarLancamento } from "@/lib/actions";
import type { Lancamento } from "@/lib/types";

type FiltroEmpresa = "todos" | "vision" | "digital_smile" | "extra" | "pessoal";

const STATUS_ACCENT: Record<string, "positive" | "warning" | "neutral"> = {
  recebido: "positive",
  pago: "positive",
  previsto: "warning",
  cancelado: "neutral",
};

export function LancamentosTable({
  lancamentos,
  tipo,
  empresasMap,
  emptyLabel,
}: {
  lancamentos: Lancamento[];
  tipo: "entrada" | "saida";
  empresasMap: Record<string, { nome: string; slug: string }>;
  emptyLabel: string;
}) {
  const [filtro, setFiltro] = useState<FiltroEmpresa>("todos");
  const [fonte, setFonte] = useState("");

  const base = lancamentos.filter((l) => l.tipo === tipo);
  const filtradas = useMemo(() => {
    if (filtro === "todos") return base;
    if (filtro === "extra") {
      const extras = base.filter((l) => l.natureza === "receita_extra");
      if (fonte === "") return extras;
      return fonte === "sem" ? extras.filter((l) => !l.fonte_extra_id) : extras.filter((l) => l.fonte_extra_id === fonte);
    }
    if (filtro === "pessoal") return base.filter((l) => l.natureza === "despesa_pessoal");
    return base.filter((l) => l.empresa_id && empresasMap[l.empresa_id]?.slug === filtro);
  }, [base, filtro, fonte, empresasMap]);

  // Cancelado nao entra em nenhum calculo do metrics.ts -- o total da tabela
  // precisa concordar com isso, senao o rodape briga com o dashboard.
  // Fontes presentes nos lançamentos (nome + cor), para o subfiltro de extras.
  const fontes = useMemo(() => {
    const m = new Map<string, { nome: string; cor: string }>();
    for (const l of base) if (l.fonte_extra_id && l.fonte_extra) m.set(l.fonte_extra_id, l.fonte_extra);
    return [...m.entries()].map(([id, f]) => ({ id, ...f })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [base]);

  const total = filtradas.reduce((s, l) => (l.status === "cancelado" ? s : s + Number(l.valor)), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={filtro}
          onChange={(v) => {
            setFiltro(v as FiltroEmpresa);
            setFonte("");
          }}
          options={[
            { value: "todos", label: "Tudo" },
            { value: "vision", label: "Vision" },
            { value: "digital_smile", label: "Digital Smile" },
            ...(tipo === "entrada" ? [{ value: "extra", label: "Extra" }] : [{ value: "pessoal", label: "Pessoal" }]),
          ]}
        />
        {filtro === "extra" && fontes.length > 0 ? (
          <SegmentedControl
            value={fonte}
            onChange={setFonte}
            options={[{ value: "", label: "Todas" }, ...fontes.map((f) => ({ value: f.id, label: f.nome })), { value: "sem", label: "Sem fonte" }]}
          />
        ) : null}
        <span className="text-sm tnum text-ink-soft">Total: <span className="font-semibold text-ink">{formatBRL(total)}</span></span>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState title={emptyLabel} description="Use o botão Adicionar para registrar. Os lançamentos aparecerão aqui com filtro por empresa, extra e pessoal." />
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-line">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
                <th className="px-4 py-3 text-left font-semibold">Data</th>
                <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                <th className="px-4 py-3 text-left font-semibold">Classificação</th>
                <th className="px-4 py-3 text-left font-semibold">Conta</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
                <th className="w-10 px-2 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((l) => {
                const cancelado = l.status === "cancelado";
                return (
                  <tr key={l.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 text-ink-faint">{formatDateBR(l.data_pagamento ?? l.data_vencimento ?? l.data_competencia)}</td>
                    <td className={`px-4 py-3 ${cancelado ? "text-ink-faint line-through" : "text-ink-soft"}`}>{l.observacao ?? l.categoria?.nome ?? l.cliente?.nome ?? "—"}{l.entra_no_cac ? <span className="ml-2 text-2xs text-vision no-underline">CAC</span> : null}</td>
                    <td className="px-4 py-3 text-ink-faint">
                      {l.fonte_extra ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.fonte_extra.cor }} />
                          {l.fonte_extra.nome}
                        </span>
                      ) : (
                        classif(l, empresasMap)
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-faint">{l.conta?.nome ?? "—"}</td>
                    <td className={`px-4 py-3 text-right tnum ${cancelado ? "text-ink-faint line-through" : tipo === "entrada" ? "text-positive" : "text-negative"}`}>{formatBRL(l.valor)}</td>
                    <td className="px-4 py-3 text-right"><Badge accent={STATUS_ACCENT[l.status]}>{l.status}</Badge></td>
                    <td className="px-2 py-3 text-right"><RowActions lancamento={l} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Menu por linha. "Cancelar" e o caminho padrao (preserva o historico);
 * "Excluir" apaga de vez e por isso pede uma segunda confirmacao explicita.
 */
function RowActions({ lancamento }: { lancamento: Lancamento }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // A tabela vive dentro de um overflow-x-auto, que recorta qualquer filho
  // absoluto. Por isso o menu é `fixed`, com a posição medida a partir do botão.
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  const cancelado = lancamento.status === "cancelado";

  useEffect(() => {
    if (!aberto) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) fechar();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
    }
    // Rolar ou redimensionar deixaria o menu solto longe do botão.
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [aberto]);

  function abrir() {
    const r = botaoRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    setConfirmandoExclusao(false);
    setErro(null);
  }

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    setErro(null);
    const res = await fn();
    setPending(false);
    if (res.ok) {
      fechar();
      router.refresh();
    } else {
      setErro(res.error ?? "Não foi possível concluir.");
    }
  }

  return (
    <div ref={ref} className="inline-block text-left">
      <button
        ref={botaoRef}
        onClick={() => (aberto ? fechar() : abrir())}
        aria-label="Ações do lançamento"
        aria-expanded={aberto}
        className="flex h-7 w-7 items-center justify-center rounded-lg2 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="19" cy="12" r="1.9" />
        </svg>
      </button>

      {aberto && coords ? (
        <div
          style={{ top: coords.top, right: coords.right }}
          className="fixed z-50 w-60 overflow-hidden rounded-xl2 border border-line bg-surface-raised p-1 text-left shadow-lg"
        >
          {confirmandoExclusao ? (
            <div className="p-2">
              <p className="text-xs text-ink-soft">
                Excluir <span className="font-semibold text-ink">{formatBRL(lancamento.valor)}</span> definitivamente? A linha sai do banco — só o registro em auditoria permanece.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => run(() => excluirLancamento(lancamento.id))}
                  disabled={pending}
                  className="flex-1 rounded-lg2 border border-negative/30 bg-negative-dim px-2 py-1.5 text-xs font-medium text-negative transition-colors hover:bg-negative/20 disabled:opacity-50"
                >
                  {pending ? "Excluindo…" : "Excluir"}
                </button>
                <button
                  onClick={() => setConfirmandoExclusao(false)}
                  disabled={pending}
                  className="flex-1 rounded-lg2 border border-line-strong px-2 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <>
              {cancelado ? (
                <MenuItem onClick={() => run(() => reativarLancamento(lancamento.id))} disabled={pending}>
                  Reativar lançamento
                </MenuItem>
              ) : (
                <MenuItem onClick={() => run(() => cancelarLancamento(lancamento.id))} disabled={pending}>
                  Cancelar
                  <span className="block text-2xs text-ink-faint">Sai dos cálculos, fica no histórico</span>
                </MenuItem>
              )}
              <MenuItem onClick={() => setConfirmandoExclusao(true)} disabled={pending} danger>
                Excluir
                <span className="block text-2xs text-ink-faint">Apaga a linha do banco</span>
              </MenuItem>
            </>
          )}
          {erro ? <p className="px-2 pb-2 pt-1 text-2xs text-negative">{erro}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg2 px-2.5 py-2 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
        danger ? "text-negative hover:bg-negative-dim" : "text-ink-soft hover:bg-surface-hover hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function classif(l: Lancamento, empresasMap: Record<string, { nome: string; slug: string }>): string {
  if (l.natureza === "receita_extra") return "Extra";
  if (l.natureza === "despesa_pessoal") return "Pessoal";
  if (l.empresa_id && empresasMap[l.empresa_id]) return empresasMap[l.empresa_id].nome;
  return "—";
}
