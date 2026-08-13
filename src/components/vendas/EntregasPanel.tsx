"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge, EmptyState, Metric } from "@/components/ui/primitives";
import { useFormSubmit } from "@/components/forms/FormShell";
import { atualizarStatusEntrega } from "@/lib/actions";
import { ENTREGA_LABEL, ENTREGA_STEPS } from "@/lib/labels";
import { formatBRL } from "@/lib/format";
import type { Venda } from "@/lib/types";

type Accent = "neutral" | "vision" | "smile" | "extra" | "positive" | "negative" | "warning";

const EM_ABERTO = ["aguardando_pagamento", "aguardando_material", "em_producao", "aguardando_aprovacao"];
const CONCLUIDAS = ["entregue", "finalizado"];

// Cor semântica de cada etapa da entrega.
const ENTREGA_ACCENT: Record<string, Accent> = {
  aguardando_pagamento: "negative",
  aguardando_material: "warning",
  em_producao: "smile",
  aguardando_aprovacao: "vision",
  entregue: "positive",
  finalizado: "neutral",
};
const PILL: Record<Accent, string> = {
  neutral: "bg-line-strong text-ink-soft",
  vision: "bg-vision-dim text-vision",
  smile: "bg-smile-dim text-smile",
  extra: "bg-extra-dim text-extra",
  positive: "bg-positive-dim text-positive",
  negative: "bg-negative-dim text-negative",
  warning: "bg-warning-dim text-warning",
};
const DOT: Record<Accent, string> = {
  neutral: "bg-ink-dim", vision: "bg-vision", smile: "bg-smile", extra: "bg-extra",
  positive: "bg-positive", negative: "bg-negative", warning: "bg-warning",
};

/** Seletor de status em etiqueta: pílula colorida + mini-menu de etapas (via portal). */
function StatusPicker({ current, onSelect }: { current: string; onSelect: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const acc = ENTREGA_ACCENT[current] ?? "neutral";

  const MENU_W = 192; // w-48

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current!.getBoundingClientRect();
    // Alinha a borda direita do menu à borda direita do botão, sem usar
    // `-translate-x-full` (que conflitaria com o transform do animate-scale-in).
    setPos({ top: r.bottom + 6, left: Math.max(8, r.right - MENU_W) });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium transition-opacity hover:opacity-80 ${PILL[acc]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${DOT[acc]}`} />
        {ENTREGA_LABEL[current]}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="opacity-60">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-50 w-48 rounded-xl2 border border-line bg-surface-raised p-1 shadow-pop animate-scale-in"
            >
              {ENTREGA_STEPS.map((s) => {
                const a = ENTREGA_ACCENT[s] ?? "neutral";
                const sel = s === current;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setOpen(false);
                      if (s !== current) onSelect(s);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg2 px-2.5 py-1.5 text-2xs transition-colors ${
                      sel ? "bg-surface-hover text-ink" : "text-ink-soft hover:bg-surface-hover hover:text-ink"
                    }`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[a]}`} />
                    {ENTREGA_LABEL[s]}
                    {sel ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="ml-auto text-vision">
                        <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** Dias corridos desde a data da venda (proxy de "há quanto tempo está parada"). */
function diasDesde(dateStr: string): number {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoje.getTime() - d.getTime()) / 86400000));
}

/** Cor do tempo parado: discreto até 7d, atenção até 21d, alerta acima. */
function agingTone(dias: number): string {
  if (dias > 21) return "text-negative";
  if (dias > 7) return "text-warning";
  return "text-ink-dim";
}

export function EntregasPanel({ vendas }: { vendas: Venda[] }) {
  const { run } = useFormSubmit();
  const abertas = vendas.filter((v) => v.status_entrega && v.status_entrega !== "entregue" && v.status_entrega !== "finalizado");
  const entregues = vendas.filter((v) => v.status_entrega && CONCLUIDAS.includes(v.status_entrega)).length;

  const porStatus = (s: string) => abertas.filter((v) => v.status_entrega === s);

  if (abertas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma entrega em aberto"
        description={`Vendas com entrega pendente aparecem aqui, por etapa: aguardando material, em produção, aguardando aprovação.${entregues > 0 ? ` Você já concluiu ${entregues} entrega(s).` : ""}`}
      />
    );
  }

  const valorAberto = abertas.reduce((s, v) => s + Number(v.valor_final), 0);
  const maisParada = Math.max(...abertas.map((v) => diasDesde(v.data_venda)));

  return (
    <div className="space-y-5">
      {/* Resumo rápido — bater o olho */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-faint">
        <span><span className="text-sm font-semibold text-ink">{abertas.length}</span> em aberto</span>
        <span className="text-ink-dim">·</span>
        <span className="tnum text-ink-soft">{formatBRL(valorAberto)}</span> em valor
        <span className="text-ink-dim">·</span>
        <span><span className="font-medium text-positive">{entregues}</span> já entregues</span>
        <span className="text-ink-dim">·</span>
        <span>mais parada <span className={`font-medium ${agingTone(maisParada)}`}>há {maisParada}d</span></span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Aguardando material" value={String(porStatus("aguardando_material").length)} accent="warning" />
        <Metric label="Em produção" value={String(porStatus("em_producao").length)} accent="smile" />
        <Metric label="Aguardando aprovação" value={String(porStatus("aguardando_aprovacao").length)} accent="vision" />
        <Metric label="Aguardando pagamento" value={String(porStatus("aguardando_pagamento").length)} accent="negative" />
      </div>

      {EM_ABERTO.map((status) => {
        const itens = porStatus(status).slice().sort((a, b) => diasDesde(b.data_venda) - diasDesde(a.data_venda));
        if (itens.length === 0) return null;
        return (
          <div key={status}>
            <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">{ENTREGA_LABEL[status]} · {itens.length}</h4>
            <div className="overflow-hidden rounded-xl2 border border-line">
              {itens.map((v) => {
                const dias = diasDesde(v.data_venda);
                return (
                  <div key={v.id} className="flex items-center justify-between gap-4 border-b border-line/70 px-4 py-3 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{v.cliente?.nome ?? "Sem cliente"}</p>
                      <p className="truncate text-2xs text-ink-dim">
                        {v.produto?.nome ?? "Venda avulsa"} · <span className={agingTone(dias)}>há {dias}d parada</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-xs tnum text-ink-soft sm:inline">{formatBRL(v.valor_final, { compact: true })}</span>
                      {dias > 21 ? <Badge accent="negative">Atrasada</Badge> : null}
                      <StatusPicker current={status} onSelect={(s) => run(() => atualizarStatusEntrega(v.id, s))} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
