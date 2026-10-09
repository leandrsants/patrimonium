"use client";

import { useState } from "react";
import { Badge, SectionTitle } from "@/components/ui/primitives";
import { useFormSubmit } from "@/components/forms/FormShell";
import { encerrarRecorrenciaExtra } from "@/lib/actions";
import { formatBRL, formatDateBR } from "@/lib/format";
import { alunoAtivo, previsaoJiu } from "@/lib/extras";
import type { AlunoJiujitsu, FonteExtra, FonteExtraRecorrencia } from "@/lib/types";
import { AlunoForm, FonteExtraForm, RecorrenciaExtraForm } from "@/components/extras/ExtrasForms";

type Opt = { value: string; label: string };

export function FonteDetalhe({
  fonte,
  recorrencias,
  alunos,
  contas,
  dataRepasseRef,
}: {
  fonte: FonteExtra;
  recorrencias: FonteExtraRecorrencia[];
  alunos: AlunoJiujitsu[];
  contas: Opt[];
  dataRepasseRef: string;
}) {
  const variavel = fonte.tipo === "variavel";
  const [editandoFonte, setEditandoFonte] = useState(false);
  // "nova" = formulário de inclusão aberto; id = edição daquele item.
  const [recEdit, setRecEdit] = useState<string | null>(null);
  const [alunoEdit, setAlunoEdit] = useState<string | null>(null);
  const encerrar = useFormSubmit();

  const ativas = recorrencias.filter((r) => r.ativa);
  const encerradas = recorrencias.filter((r) => !r.ativa);
  const previsao = previsaoJiu(alunos, dataRepasseRef);
  const contaNome = contas.find((c) => c.value === fonte.conta_padrao_id)?.label ?? "—";

  return (
    <div className="space-y-8">
      {/* Dados */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Dados</SectionTitle>
          <button onClick={() => setEditandoFonte((v) => !v)} className="text-2xs font-medium text-ink-faint hover:text-ink-soft">
            {editandoFonte ? "Fechar" : "Editar"}
          </button>
        </div>
        {editandoFonte ? (
          <FonteExtraForm fonte={fonte} contas={contas} onDone={() => setEditandoFonte(false)} />
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink-faint">Contato</dt>
            <dd className="text-ink-soft">{fonte.contato ?? "—"}</dd>
            <dt className="text-ink-faint">Tipo</dt>
            <dd className="text-ink-soft">{variavel ? "Variável" : "Fixa"}</dd>
            <dt className="text-ink-faint">Status</dt>
            <dd className="text-ink-soft capitalize">{fonte.status}</dd>
            <dt className="text-ink-faint">Conta padrão</dt>
            <dd className="text-ink-soft">{contaNome}</dd>
            {fonte.observacao ? (
              <>
                <dt className="text-ink-faint">Observações</dt>
                <dd className="text-ink-soft">{fonte.observacao}</dd>
              </>
            ) : null}
          </dl>
        )}
      </section>

      {/* Recorrências */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>{variavel ? "Repasse mensal" : "Recorrências"}</SectionTitle>
          {recEdit === null ? (
            <button onClick={() => setRecEdit("nova")} className="text-2xs font-medium text-ink-faint hover:text-ink-soft">+ Adicionar</button>
          ) : null}
        </div>
        {recEdit === "nova" ? <RecorrenciaExtraForm fonteId={fonte.id} variavel={variavel} onDone={() => setRecEdit(null)} /> : null}
        {ativas.length === 0 && recEdit !== "nova" ? (
          <p className="text-xs text-ink-faint">
            {variavel ? "Defina o dia do repasse para gerar o previsto do mês." : "Nenhuma recorrência ativa — esta fonte não gera previstos."}
          </p>
        ) : null}
        <div className="space-y-2">
          {ativas.map((r) =>
            recEdit === r.id ? (
              <RecorrenciaExtraForm key={r.id} fonteId={fonte.id} variavel={variavel} recorrencia={r} onDone={() => setRecEdit(null)} />
            ) : (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg2 border border-line px-3 py-2.5">
                <div>
                  <p className="text-sm text-ink">
                    {variavel ? formatBRL(previsao) : formatBRL(r.valor)} <span className="text-ink-faint">· dia {r.dia_mes}</span>
                  </p>
                  <p className="text-2xs text-ink-dim">
                    {r.descricao ?? "—"} · desde {formatDateBR(r.data_inicio)}
                    {r.data_fim ? ` até ${formatDateBR(r.data_fim)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button onClick={() => setRecEdit(r.id)} className="text-2xs font-medium text-ink-faint hover:text-ink-soft">Editar</button>
                  <button
                    disabled={encerrar.pending}
                    onClick={() => encerrar.run(() => encerrarRecorrenciaExtra(r.id))}
                    className="text-2xs font-medium text-ink-faint hover:text-negative disabled:opacity-50"
                  >
                    Encerrar
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
        {encerrar.error ? <p className="text-2xs text-negative">{encerrar.error}</p> : null}
        {encerradas.length > 0 ? <p className="text-2xs text-ink-dim">{encerradas.length} recorrência(s) encerrada(s) preservada(s) no histórico.</p> : null}
        <p className="text-2xs text-ink-dim">Mudanças valem para os próximos previstos; os já gerados mantêm o valor (edite ao marcar recebido).</p>
      </section>

      {/* Alunos (fonte variável) */}
      {variavel ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Alunos</SectionTitle>
            {alunoEdit === null ? (
              <button onClick={() => setAlunoEdit("novo")} className="text-2xs font-medium text-ink-faint hover:text-ink-soft">+ Aluno</button>
            ) : null}
          </div>
          <div className="flex items-baseline justify-between rounded-lg2 border border-line bg-surface-input/40 px-3 py-2.5">
            <span className="text-2xs uppercase tracking-wide text-ink-faint">Previsão do mês</span>
            <span className="text-base font-semibold tnum text-ink">{formatBRL(previsao)}</span>
          </div>
          {alunoEdit === "novo" ? <AlunoForm fonteId={fonte.id} onDone={() => setAlunoEdit(null)} /> : null}
          {alunos.length === 0 && alunoEdit !== "novo" ? <p className="text-xs text-ink-faint">Nenhum aluno cadastrado.</p> : null}
          <div className="divide-y divide-line">
            {alunos.map((a) =>
              alunoEdit === a.id ? (
                <div key={a.id} className="py-2">
                  <AlunoForm fonteId={fonte.id} aluno={a} onDone={() => setAlunoEdit(null)} />
                </div>
              ) : (
                <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm text-ink">{a.nome}</p>
                    <p className="text-2xs text-ink-dim">
                      desde {formatDateBR(a.data_entrada)}
                      {a.data_saida ? ` · saída ${formatDateBR(a.data_saida)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {alunoAtivo(a, dataRepasseRef) ? null : <Badge>inativo</Badge>}
                    <span className="text-sm tnum text-ink-soft">{formatBRL(a.mensalidade)}</span>
                    <button onClick={() => setAlunoEdit(a.id)} className="text-2xs font-medium text-ink-faint hover:text-ink-soft">Editar</button>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
