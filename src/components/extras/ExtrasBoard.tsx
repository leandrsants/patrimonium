"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, EmptyState, Panel } from "@/components/ui/primitives";
import { SegmentedControl } from "@/components/ui/Tabs";
import { formatBRL, formatDateBR } from "@/lib/format";
import { dataRefExtra, type ResumoFonte, type SituacaoExtra } from "@/lib/extras";
import type { AlunoJiujitsu, FonteExtra, FonteExtraRecorrencia } from "@/lib/types";
import { RecebimentoExtraForm } from "@/components/extras/ExtrasForms";
import { FonteDetalhe } from "@/components/extras/FonteDetalhe";

type Opt = { value: string; label: string };
type Item = ResumoFonte["itens"][number];

const COLUNAS: { key: Exclude<SituacaoExtra, "cancelado">; label: string; tone: string }[] = [
  { key: "previsto", label: "Previsto", tone: "text-warning" },
  { key: "recebido", label: "Recebido", tone: "text-positive" },
  { key: "atrasado", label: "Atrasado", tone: "text-negative" },
];

const SITUACAO_ACCENT: Record<SituacaoExtra, "warning" | "positive" | "negative" | "neutral"> = {
  previsto: "warning",
  recebido: "positive",
  atrasado: "negative",
  cancelado: "neutral",
};

export function ExtrasBoard({
  resumos,
  fontes,
  recorrencias,
  alunos,
  contas,
  dataRepasseRef,
}: {
  resumos: ResumoFonte[];
  fontes: FonteExtra[];
  recorrencias: FonteExtraRecorrencia[];
  alunos: AlunoJiujitsu[];
  contas: Opt[];
  /** Data usada para calcular a previsão do Jiu-jítsu (alunos ativos). */
  dataRepasseRef: string;
}) {
  const [modo, setModo] = useState<"board" | "lista">("board");
  const [receber, setReceber] = useState<Item | null>(null);
  const [fonteAberta, setFonteAberta] = useState<string | null>(null);

  const fonteDetalhe = fontes.find((f) => f.id === fonteAberta) ?? null;

  if (fontes.length === 0) {
    return <EmptyState title="Nenhuma fonte de renda extra" description="Cadastre fontes como Sonati, Danilo ou Jiu-jítsu para acompanhar previstos e recebidos do mês." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SegmentedControl value={modo} onChange={(v) => setModo(v as "board" | "lista")} options={[{ value: "board", label: "Board" }, { value: "lista", label: "Lista" }]} />
        <span className="text-2xs text-ink-dim">Clique no nome da fonte para editar recorrências{fontes.some((f) => f.tipo === "variavel") ? " e alunos" : ""}.</span>
      </div>

      {modo === "board" ? (
        <div className="space-y-4">
          {resumos.map((r) => {
            const fonte = fontes.find((f) => f.id === r.fonte.id)!;
            return (
              <Panel key={r.fonte.id} padded={false} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4" style={{ boxShadow: `inset 3px 0 0 ${r.fonte.cor}` }}>
                  <button onClick={() => setFonteAberta(r.fonte.id)} className="flex items-center gap-2.5 text-left">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.fonte.cor }} />
                    <span className="text-sm font-semibold text-ink hover:underline">{r.fonte.nome}</span>
                    {fonte.contato ? <span className="text-2xs text-ink-faint">{fonte.contato}</span> : null}
                    <Badge>{fonte.tipo === "fixa" ? "Fixa" : "Variável"}</Badge>
                    {fonte.status !== "ativa" ? <Badge accent="warning">{fonte.status}</Badge> : null}
                  </button>
                  <div className="flex gap-4 text-2xs tnum">
                    <span className="text-ink-faint">Recebido <span className="font-semibold text-positive">{formatBRL(r.recebido)}</span></span>
                    <span className="text-ink-faint">Falta <span className="font-semibold text-ink">{formatBRL(r.previsto + r.atrasado)}</span></span>
                  </div>
                </div>
                <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {COLUNAS.map((col) => {
                    const itens = r.itens.filter((i) => i.situacao === col.key);
                    return (
                      <div key={col.key} className="min-h-[88px] p-4">
                        <p className={`mb-2 text-2xs font-medium uppercase tracking-wide ${col.tone}`}>
                          {col.label} <span className="text-ink-dim">· {itens.length}</span>
                        </p>
                        {itens.length === 0 ? (
                          <p className="text-2xs text-ink-dim">—</p>
                        ) : (
                          <div className="space-y-2">
                            {itens.map((i) => (
                              <ItemCard key={i.id} item={i} onReceber={() => setReceber(i)} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Lista resumos={resumos} onReceber={setReceber} onFonte={setFonteAberta} />
      )}

      <Drawer open={receber !== null} onClose={() => setReceber(null)} title="Marcar como recebido" description={receber ? `${receber.fonte_extra?.nome ?? ""} · previsto para ${formatDateBR(dataRefExtra(receber))}` : undefined}>
        {receber ? (
          <RecebimentoExtraForm
            key={receber.id}
            lancamentoId={receber.id}
            valorPrevisto={Number(receber.valor)}
            contaId={receber.conta_id}
            contas={contas}
            onDone={() => setReceber(null)}
          />
        ) : null}
      </Drawer>

      <Drawer open={fonteDetalhe !== null} onClose={() => setFonteAberta(null)} title={fonteDetalhe?.nome ?? ""} description="Dados, recorrências e alunos">
        {fonteDetalhe ? (
          <FonteDetalhe
            key={fonteDetalhe.id}
            fonte={fonteDetalhe}
            recorrencias={recorrencias.filter((r) => r.fonte_id === fonteDetalhe.id)}
            alunos={alunos.filter((a) => a.fonte_id === fonteDetalhe.id)}
            contas={contas}
            dataRepasseRef={dataRepasseRef}
          />
        ) : null}
      </Drawer>
    </div>
  );
}

function ItemCard({ item, onReceber }: { item: Item; onReceber: () => void }) {
  const aberto = item.situacao === "previsto" || item.situacao === "atrasado";
  return (
    <div className="rounded-lg2 border border-line bg-surface-input/40 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tnum text-ink">{formatBRL(item.valor)}</span>
        <span className="text-2xs tnum text-ink-faint">{formatDateBR(dataRefExtra(item))}</span>
      </div>
      {item.observacao ? <p className="mt-0.5 truncate text-2xs text-ink-faint">{item.observacao}</p> : null}
      {aberto ? (
        <button onClick={onReceber} className="mt-2 w-full rounded-lg2 border border-line-strong py-1 text-2xs font-medium text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink">
          Recebi
        </button>
      ) : null}
    </div>
  );
}

function Lista({ resumos, onReceber, onFonte }: { resumos: ResumoFonte[]; onReceber: (i: Item) => void; onFonte: (id: string) => void }) {
  const linhas = resumos
    .flatMap((r) => r.itens.map((i) => ({ ...i, fonteNome: r.fonte.nome, fonteCor: r.fonte.cor, fonteId: r.fonte.id })))
    .sort((a, b) => dataRefExtra(a).localeCompare(dataRefExtra(b)));
  if (linhas.length === 0) {
    return <EmptyState title="Nada neste mês" description="Nenhum previsto ou recebido das fontes extras neste mês." />;
  }
  return (
    <div className="overflow-x-auto rounded-xl2 border border-line">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
            <th className="px-4 py-3 text-left font-semibold">Fonte</th>
            <th className="px-4 py-3 text-left font-semibold">Data</th>
            <th className="px-4 py-3 text-left font-semibold">Descrição</th>
            <th className="px-4 py-3 text-right font-semibold">Valor</th>
            <th className="px-4 py-3 text-right font-semibold">Situação</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.id} className="border-b border-line/70 last:border-0">
              <td className="px-4 py-3">
                <button onClick={() => onFonte(l.fonteId)} className="inline-flex items-center gap-2 text-ink-soft hover:text-ink">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.fonteCor }} />
                  {l.fonteNome}
                </button>
              </td>
              <td className="px-4 py-3 tnum text-ink-faint">{formatDateBR(dataRefExtra(l))}</td>
              <td className="px-4 py-3 text-ink-faint">{l.observacao ?? "—"}</td>
              <td className="px-4 py-3 text-right tnum text-ink">{formatBRL(l.valor)}</td>
              <td className="px-4 py-3 text-right"><Badge accent={SITUACAO_ACCENT[l.situacao]}>{l.situacao}</Badge></td>
              <td className="px-4 py-3 text-right">
                {l.situacao === "previsto" || l.situacao === "atrasado" ? (
                  <button onClick={() => onReceber(l)} className="text-2xs font-medium text-ink-soft hover:text-ink">Recebi</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
