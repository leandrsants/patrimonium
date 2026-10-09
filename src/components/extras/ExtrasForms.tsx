"use client";

import { useState } from "react";
import { Field, TextInput, Textarea, Select, DateInput, MoneyInput, parseMoney } from "@/components/ui/fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { criarFonteExtra, atualizarFonteExtra, salvarRecorrenciaExtra, salvarAlunoJiujitsu, marcarExtraRecebido } from "@/lib/actions";
import { hoje } from "@/components/forms/options";
import { formatBRL } from "@/lib/format";
import type { AlunoJiujitsu, FonteExtra, FonteExtraRecorrencia } from "@/lib/types";

type Opt = { value: string; label: string };

const moneyStr = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

// -------------------------------------------------------------- FONTE
export function FonteExtraForm({ fonte, contas, onDone }: { fonte?: FonteExtra; contas: Opt[]; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [nome, setNome] = useState(fonte?.nome ?? "");
  const [contato, setContato] = useState(fonte?.contato ?? "");
  const [tipo, setTipo] = useState<FonteExtra["tipo"]>(fonte?.tipo ?? "fixa");
  const [cor, setCor] = useState(fonte?.cor ?? "#8a919c");
  const [status, setStatus] = useState<FonteExtra["status"]>(fonte?.status ?? "ativa");
  const [conta, setConta] = useState(fonte?.conta_padrao_id ?? contas[0]?.value ?? "");
  const [obs, setObs] = useState(fonte?.observacao ?? "");

  const input = { nome, contato, tipo, cor, status, conta_padrao_id: conta, observacao: obs };
  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Nome *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Danilo" />
        </Field>
        <Field label="Cliente / contato">
          <TextInput value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Ex.: Cosmus Digital" />
        </Field>
        <Field label="Tipo" hint={tipo === "variavel" ? "Variável: a previsão do mês é a soma dos alunos ativos." : "Fixa: valor e dia definidos na recorrência."}>
          <SegmentedControl value={tipo} onChange={(v) => setTipo(v as FonteExtra["tipo"])} options={[{ value: "fixa", label: "Fixa" }, { value: "variavel", label: "Variável" }]} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cor">
            <div className="flex items-center gap-2">
              <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg2 border border-line bg-surface-input p-1" aria-label="Cor da fonte" />
              <span className="text-xs tnum text-ink-faint">{cor}</span>
            </div>
          </Field>
          <Field label="Conta padrão">
            <Select value={conta} onChange={setConta} options={contas} placeholder="Selecionar…" />
          </Field>
        </div>
        <Field label="Status">
          <SegmentedControl
            value={status}
            onChange={(v) => setStatus(v as FonteExtra["status"])}
            options={[{ value: "ativa", label: "Ativa" }, { value: "pausada", label: "Pausada" }, { value: "encerrada", label: "Encerrada" }]}
          />
        </Field>
        <Field label="Observações">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
        </Field>
        <p className="text-2xs text-ink-dim">Recebimentos desta fonte entram no faturamento total e na Meta 10K — nunca no CAC ou no lucro das empresas.</p>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel={fonte ? "Salvar fonte" : "Criar fonte"}
        onSubmit={() => run(() => (fonte ? atualizarFonteExtra(fonte.id, input) : criarFonteExtra(input)))}
      />
    </div>
  );
}

// -------------------------------------------------------------- RECORRÊNCIA
export function RecorrenciaExtraForm({
  fonteId,
  variavel,
  recorrencia,
  onDone,
}: {
  fonteId: string;
  variavel: boolean;
  recorrencia?: FonteExtraRecorrencia;
  onDone: () => void;
}) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [descricao, setDescricao] = useState(recorrencia?.descricao ?? "");
  const [valor, setValor] = useState(moneyStr(recorrencia?.valor));
  const [dia, setDia] = useState(String(recorrencia?.dia_mes ?? ""));
  const [inicio, setInicio] = useState(recorrencia?.data_inicio ?? `${hoje().slice(0, 7)}-01`);
  const [fim, setFim] = useState(recorrencia?.data_fim ?? "");

  return (
    <div className="space-y-4 rounded-lg2 border border-line bg-surface-input/40 p-4">
      <FormFields>
        <Field label="Descrição">
          <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={variavel ? "Ex.: Repasse mensal" : "Ex.: 1ª metade"} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {variavel ? (
            <div className="text-2xs text-ink-dim">Valor = soma das mensalidades dos alunos ativos no dia do repasse.</div>
          ) : (
            <Field label="Valor *">
              <MoneyInput value={valor} onChange={setValor} />
            </Field>
          )}
          <Field label={variavel ? "Dia do repasse *" : "Dia do mês *"} hint="Dia 30/31 se ajusta ao fim do mês.">
            <TextInput inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="15" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início">
            <DateInput value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Field>
          <Field label="Fim (opcional)">
            <DateInput value={fim} onChange={(e) => setFim(e.target.value)} />
          </Field>
        </div>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel={recorrencia ? "Salvar recorrência" : "Adicionar recorrência"}
        onCancel={onDone}
        onSubmit={() =>
          run(() =>
            salvarRecorrenciaExtra({
              id: recorrencia?.id,
              fonte_id: fonteId,
              descricao,
              valor: variavel ? 0 : parseMoney(valor),
              dia_mes: Number(dia),
              data_inicio: inicio,
              data_fim: fim,
            }),
          )
        }
      />
    </div>
  );
}

// -------------------------------------------------------------- ALUNO
export function AlunoForm({ fonteId, aluno, onDone }: { fonteId: string; aluno?: AlunoJiujitsu; onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [nome, setNome] = useState(aluno?.nome ?? "");
  const [mensalidade, setMensalidade] = useState(moneyStr(aluno?.mensalidade));
  const [entrada, setEntrada] = useState(aluno?.data_entrada ?? hoje());
  const [saida, setSaida] = useState(aluno?.data_saida ?? "");

  return (
    <div className="space-y-4 rounded-lg2 border border-line bg-surface-input/40 p-4">
      <FormFields>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome *">
            <TextInput value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Mensalidade *">
            <MoneyInput value={mensalidade} onChange={setMensalidade} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entrada">
            <DateInput value={entrada} onChange={(e) => setEntrada(e.target.value)} />
          </Field>
          <Field label="Saída">
            <DateInput value={saida} onChange={(e) => setSaida(e.target.value)} />
          </Field>
        </div>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel={aluno ? "Salvar aluno" : "Adicionar aluno"}
        onCancel={onDone}
        onSubmit={() =>
          run(() =>
            salvarAlunoJiujitsu({ id: aluno?.id, fonte_id: fonteId, nome, mensalidade: parseMoney(mensalidade), data_entrada: entrada, data_saida: saida }),
          )
        }
      />
    </div>
  );
}

// -------------------------------------------------------------- RECEBIMENTO
export function RecebimentoExtraForm({
  lancamentoId,
  valorPrevisto,
  contaId,
  contas,
  onDone,
}: {
  lancamentoId: string;
  valorPrevisto: number;
  contaId: string;
  contas: Opt[];
  onDone: () => void;
}) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [valor, setValor] = useState(moneyStr(valorPrevisto));
  const [data, setData] = useState(hoje());
  const [conta, setConta] = useState(contaId);

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Valor recebido *" hint={`Previsto: ${formatBRL(valorPrevisto)}`}>
          <MoneyInput value={valor} onChange={setValor} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <DateInput value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Conta *">
            <Select value={conta} onChange={setConta} options={contas} />
          </Field>
        </div>
      </FormFields>
      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Marcar recebido"
        onSubmit={() => run(() => marcarExtraRecebido(lancamentoId, { valor: parseMoney(valor), data, conta_id: conta }))}
      />
    </div>
  );
}
