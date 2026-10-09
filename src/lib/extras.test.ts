/* Testes das regras de fontes extras. Rodar via tsc + node, como calc.test.ts. */
import assert from "node:assert/strict";
import type { Lancamento } from "@/lib/types";
import {
  ultimoDia, diaNoMes, mesRange, addMeses, previsaoJiu, situacaoExtra, contaNaMeta, resumoPorFonte, recebidoPorFonte,
} from "./extras";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  PASS ${name}`);
}

function lanc(p: Partial<Lancamento>): Lancamento {
  return {
    id: "x", tipo: "entrada", natureza: "receita_extra", empresa_id: null, categoria_id: null, cliente_id: null,
    venda_id: null, parcela_id: null, campanha_id: null, compra_cartao_id: null, numero_parcela_cartao: null,
    despesa_recorrente_id: null, conta_id: "c", conta_destino_id: null, valor: 100, data_competencia: "2026-10-15",
    data_vencimento: "2026-10-15", data_pagamento: null, status: "previsto", estorno_de_id: null, entra_no_cac: false,
    metodo_aquisicao: null, observacao: null, fonte_extra_id: "danilo", ...p,
  };
}

t("dia 30 em fevereiro vira o último dia do mês", () => {
  assert.equal(ultimoDia(2026, 2), 28);
  assert.equal(ultimoDia(2028, 2), 29);
  assert.equal(diaNoMes(2026, 2, 30), "2026-02-28");
  assert.equal(diaNoMes(2026, 10, 30), "2026-10-30");
  assert.equal(diaNoMes(2026, 11, 31), "2026-11-30");
});

t("mesRange e addMeses", () => {
  assert.deepEqual(mesRange("2026-10"), { from: "2026-10-01", to: "2026-10-31" });
  assert.equal(addMeses("2026-12", 1), "2027-01");
  assert.equal(addMeses("2026-01", -1), "2025-12");
});

t("previsão do Jiu = soma dos alunos ativos na data", () => {
  const alunos = [
    { mensalidade: 120, data_entrada: "2026-09-01", data_saida: null },
    { mensalidade: 100, data_entrada: "2026-10-20", data_saida: null }, // entra depois do repasse
    { mensalidade: 80, data_entrada: "2026-01-01", data_saida: "2026-09-30" }, // saiu antes
    { mensalidade: 90, data_entrada: "2026-01-01", data_saida: "2026-10-10" }, // sai no dia do repasse: ainda conta
  ];
  assert.equal(previsaoJiu(alunos, "2026-10-10"), 210);
  assert.equal(previsaoJiu([], "2026-10-10"), 0);
});

t("situação: atrasado = previsto vencido; recebido e cancelado prevalecem", () => {
  assert.equal(situacaoExtra(lanc({ data_vencimento: "2026-10-08" }), "2026-10-09"), "atrasado");
  assert.equal(situacaoExtra(lanc({ data_vencimento: "2026-10-09" }), "2026-10-09"), "previsto");
  assert.equal(situacaoExtra(lanc({ status: "recebido", data_pagamento: "2026-10-01", data_vencimento: "2026-09-01" }), "2026-10-09"), "recebido");
  assert.equal(situacaoExtra(lanc({ status: "cancelado" }), "2026-10-09"), "cancelado");
});

t("Meta 10K: empresas + fontes extras; extra sem fonte (Presentes) fica fora", () => {
  assert.equal(contaNaMeta(lanc({ natureza: "receita_empresarial" })), true);
  assert.equal(contaNaMeta(lanc({ fonte_extra: { nome: "Danilo", cor: "#000", conta_na_meta: true } })), true);
  assert.equal(contaNaMeta(lanc({ fonte_extra: null, categoria: { nome: "Sonati/Sonate", conta_na_meta: true } })), true);
  assert.equal(contaNaMeta(lanc({ fonte_extra: null, categoria: { nome: "Presentes", conta_na_meta: false } })), false);
  assert.equal(contaNaMeta(lanc({ tipo: "saida", natureza: "despesa_pessoal" })), false);
});

t("resumo por fonte separa previsto, recebido e atrasado no mês", () => {
  const fontes = [{ id: "danilo", nome: "Danilo", cor: "#000" }];
  const ls = [
    lanc({ id: "a", valor: 1000, data_vencimento: "2026-10-15" }),
    lanc({ id: "b", valor: 1000, data_vencimento: "2026-10-30" }),
    lanc({ id: "c", valor: 1000, data_vencimento: "2026-10-05" }),
    lanc({ id: "d", valor: 500, status: "recebido", data_pagamento: "2026-10-02", data_vencimento: "2026-10-01" }),
    lanc({ id: "e", valor: 999, status: "cancelado" }),
    lanc({ id: "f", valor: 777, data_vencimento: "2026-11-15" }),
  ];
  const [r] = resumoPorFonte(ls, fontes, mesRange("2026-10"), "2026-10-09");
  assert.equal(r.previsto, 2000);
  assert.equal(r.atrasado, 1000);
  assert.equal(r.recebido, 500);
  assert.deepEqual(r.itens.map((i) => i.id), ["d", "c", "a", "b"]);
});

t("recebido por fonte usa só recebidos pela data de pagamento", () => {
  const fontes = [{ id: "danilo", nome: "Danilo", cor: "#000" }];
  const ls = [
    lanc({ valor: 1000, status: "recebido", data_pagamento: "2026-10-16" }),
    lanc({ valor: 1000 }),
    lanc({ valor: 300, status: "recebido", data_pagamento: "2026-09-30" }),
  ];
  assert.equal(recebidoPorFonte(ls, fontes, mesRange("2026-10"))[0].valor, 1000);
});

console.log(`\n${passed} testes OK.`);
