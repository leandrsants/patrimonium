/* Regras puras das fontes de renda extra (Sonati, Danilo, Jiu-jítsu…).
 * Sem acesso a banco: tudo testável em extras.test.ts. Datas sempre como
 * string ISO (YYYY-MM-DD), que ordena corretamente e evita fuso. */
import type { AlunoJiujitsu, FonteExtra, Lancamento } from "@/lib/types";

export type SituacaoExtra = "previsto" | "recebido" | "atrasado" | "cancelado";

/** Último dia do mês (mes 1–12). */
export function ultimoDia(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Data ISO do dia `dia` no mês, ajustada ao fim do mês (30 em fevereiro -> 28/29). */
export function diaNoMes(ano: number, mes: number, dia: number): string {
  const d = Math.min(dia, ultimoDia(ano, mes));
  return `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Intervalo [from, to] de uma competência "YYYY-MM". */
export function mesRange(competencia: string): { from: string; to: string } {
  const [ano, mes] = competencia.split("-").map(Number);
  return { from: diaNoMes(ano, mes, 1), to: diaNoMes(ano, mes, 31) };
}

/** Desloca uma competência "YYYY-MM" em `delta` meses. */
export function addMeses(competencia: string, delta: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Aluno ativo numa data: entrou até ela e não saiu antes dela. */
export function alunoAtivo(a: Pick<AlunoJiujitsu, "data_entrada" | "data_saida">, dataISO: string): boolean {
  return a.data_entrada <= dataISO && (a.data_saida === null || a.data_saida >= dataISO);
}

/** Previsão do repasse do Jiu-jítsu = soma das mensalidades dos alunos ativos na data. */
export function previsaoJiu(alunos: Pick<AlunoJiujitsu, "mensalidade" | "data_entrada" | "data_saida">[], dataISO: string): number {
  return alunos.filter((a) => alunoAtivo(a, dataISO)).reduce((s, a) => s + Number(a.mensalidade), 0);
}

/** Data que posiciona o lançamento no mês: pagamento se recebido; senão vencimento. */
export function dataRefExtra(l: Pick<Lancamento, "status" | "data_pagamento" | "data_vencimento" | "data_competencia">): string {
  if (l.status === "recebido" && l.data_pagamento) return l.data_pagamento;
  return l.data_vencimento ?? l.data_competencia;
}

/** Atrasado = previsto com vencimento antes de hoje (mesma convenção de status no banco). */
export function situacaoExtra(
  l: Pick<Lancamento, "status" | "data_pagamento" | "data_vencimento" | "data_competencia">,
  hojeISO: string,
): SituacaoExtra {
  if (l.status === "cancelado") return "cancelado";
  if (l.status === "recebido") return "recebido";
  return dataRefExtra(l) < hojeISO ? "atrasado" : "previsto";
}

/**
 * Entrada que conta na Meta 10K — espelha a view meta_10k_progresso
 * (20261009100006): receita empresarial, ou receita extra de fonte/categoria
 * marcada para a meta. Receita extra sem fonte (ex.: Presentes) fica fora.
 */
export function contaNaMeta(l: Pick<Lancamento, "tipo" | "natureza" | "fonte_extra" | "categoria">): boolean {
  if (l.tipo !== "entrada") return false;
  if (l.natureza === "receita_empresarial") return true;
  return l.natureza === "receita_extra" && (l.fonte_extra?.conta_na_meta === true || l.categoria?.conta_na_meta === true);
}

export type ResumoFonte = {
  fonte: Pick<FonteExtra, "id" | "nome" | "cor">;
  previsto: number;
  recebido: number;
  atrasado: number;
  itens: (Lancamento & { situacao: SituacaoExtra })[];
};

/** Lançamentos de cada fonte posicionados no intervalo, separados por situação. */
export function resumoPorFonte(
  lancamentos: Lancamento[],
  fontes: Pick<FonteExtra, "id" | "nome" | "cor">[],
  range: { from: string; to: string },
  hojeISO: string,
): ResumoFonte[] {
  return fontes.map((fonte) => {
    const itens = lancamentos
      .filter((l) => l.natureza === "receita_extra" && l.fonte_extra_id === fonte.id && l.status !== "cancelado")
      .filter((l) => {
        const d = dataRefExtra(l);
        return d >= range.from && d <= range.to;
      })
      .map((l) => ({ ...l, situacao: situacaoExtra(l, hojeISO) }))
      .sort((a, b) => dataRefExtra(a).localeCompare(dataRefExtra(b)));
    const soma = (s: SituacaoExtra) => itens.filter((i) => i.situacao === s).reduce((t, i) => t + Number(i.valor), 0);
    return { fonte, previsto: soma("previsto"), recebido: soma("recebido"), atrasado: soma("atrasado"), itens };
  });
}

/** Recebido por fonte no intervalo (pela data de pagamento) — base do "Faturamento por empresa". */
export function recebidoPorFonte(
  lancamentos: Lancamento[],
  fontes: Pick<FonteExtra, "id" | "nome" | "cor">[],
  range: { from: string; to: string },
): { id: string; nome: string; cor: string; valor: number }[] {
  return fontes.map((f) => ({
    id: f.id,
    nome: f.nome,
    cor: f.cor,
    valor: lancamentos
      .filter(
        (l) =>
          l.tipo === "entrada" &&
          l.natureza === "receita_extra" &&
          l.fonte_extra_id === f.id &&
          l.status === "recebido" &&
          l.data_pagamento !== null &&
          l.data_pagamento >= range.from &&
          l.data_pagamento <= range.to,
      )
      .reduce((s, l) => s + Number(l.valor), 0),
  }));
}
