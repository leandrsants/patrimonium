/* Testes das fórmulas de gestão. Rodar: node --loader ... ou via tsc + node (ver scripts/test-calc). */
import assert from "node:assert/strict";
import {
  ratio, pct, cac, custoPorVenda, ticketMedio, cpl, roas, margem,
  custoPorReuniaoMarcada, custoPorReuniaoRealizada, custoPorNoShow, custoPorProposta,
  taxaComparecimento, taxaNoShow, taxaProposta, taxaFechamento, conversaoTotal,
  mrr, churn, retencao, ltvCac, payback, margemPorCliente,
  buildFunnel, somarProspeccao, funnelVision, funnelSmile, PROSPECCAO_ZERO,
  acoesComerciais, taxaResposta, taxaQualificacao, taxaReuniao,
  resultadoPrimeiroMes, resultadoAcumulado, ltvMedio, inadimplenciaPct, tempoMedio,
  taxaInteresse, taxaAgendamento, acoesPorAbordado, funnelProspeccaoNumeros,
} from "./calc";

let passed = 0;
function t(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  PASS ${name}`);
}

// Denominador zero -> null (nunca NaN/Infinity)
t("ratio denominador zero => null", () => {
  assert.equal(ratio(10, 0), null);
  assert.equal(ratio(0, 0), null);
  assert.equal(ratio(10, 2), 5);
});
t("pct denominador zero => null", () => {
  assert.equal(pct(1, 0), null);
  assert.equal(pct(3, 12), 25);
});

// Aquisição
t("cac básico e zero clientes", () => {
  assert.equal(cac(300, 6), 50);
  assert.equal(cac(300, 0), null);
});
t("custoPorVenda distinto de cac", () => {
  // 1 cliente que comprou 3x, investimento 300 => CAC 300, custo/venda 100
  assert.equal(cac(300, 1), 300);
  assert.equal(custoPorVenda(300, 3), 100);
});
t("ticketMedio", () => {
  assert.equal(ticketMedio(900, 3), 300);
  assert.equal(ticketMedio(900, 0), null);
});
t("cpl e roas", () => {
  assert.equal(cpl(500, 25), 20);
  assert.equal(roas(1000, 250), 4);
  assert.equal(roas(1000, 0), null);
});
t("margem", () => {
  assert.equal(margem(400, 1000), 0.4);
  assert.equal(margem(400, 0), null);
});

// Digital Smile SaaS
t("custos por reunião / no-show / proposta", () => {
  assert.equal(custoPorReuniaoMarcada(1000, 10), 100);
  assert.equal(custoPorReuniaoRealizada(1000, 8), 125);
  assert.equal(custoPorNoShow(1000, 2), 500);
  assert.equal(custoPorNoShow(1000, 0), null);
  assert.equal(custoPorProposta(1000, 5), 200);
});
t("taxas de funil DS", () => {
  assert.equal(taxaComparecimento(8, 10), 80);
  assert.equal(taxaNoShow(2, 10), 20);
  assert.equal(taxaProposta(5, 8), 62.5);
  assert.equal(taxaFechamento(2, 5), 40);
  assert.equal(conversaoTotal(2, 100), 2);
  assert.equal(taxaComparecimento(1, 0), null);
});
t("mrr soma", () => {
  assert.equal(mrr([500, 500, 1000]), 2000);
  assert.equal(mrr([]), 0);
});
t("churn e retenção", () => {
  assert.equal(churn(1, 10), 0.1);
  assert.equal(churn(1, 0), null);
  assert.equal(retencao(9, 10), 0.9);
});
t("ltvCac e payback", () => {
  assert.equal(ltvCac(1500, 500), 3);
  assert.equal(ltvCac(1500, null), null); // CAC indefinido
  assert.equal(payback(500, 250), 2);
  assert.equal(payback(500, 0), null); // sem margem positiva
  assert.equal(payback(null, 250), null);
});
t("margemPorCliente sem overhead arbitrário", () => {
  assert.equal(margemPorCliente(1000, 300), 700);
});

// Funil
t("buildFunnel topo 100% e conversões", () => {
  const f = buildFunnel([
    { key: "a", label: "Contatados", valor: 100 },
    { key: "b", label: "Respostas", valor: 30 },
    { key: "c", label: "Qualificados", valor: 15 },
    { key: "d", label: "Vendas", valor: 3 },
  ]);
  assert.equal(f[0].pctAnterior, 100);
  assert.equal(f[0].pctTopo, 100);
  assert.equal(f[1].pctAnterior, 30); // 30/100
  assert.equal(f[2].pctAnterior, 50); // 15/30
  assert.equal(f[2].pctTopo, 15); // 15/100
  assert.equal(f[3].pctTopo, 3); // 3/100
});
t("buildFunnel topo zero => null nas conversões", () => {
  const f = buildFunnel([
    { key: "a", label: "Contatados", valor: 0 },
    { key: "b", label: "Respostas", valor: 0 },
  ]);
  assert.equal(f[1].pctAnterior, null);
  assert.equal(f[1].pctTopo, null);
});

// Prospecção agregada
t("somarProspeccao acumula e ignora undefined", () => {
  const s = somarProspeccao([
    { contatos_feitos: 80, respostas: 12, orcamentos_enviados: 5 },
    { contatos_feitos: 20, respostas: 3 },
  ]);
  assert.equal(s.contatos_feitos, 100);
  assert.equal(s.respostas, 15);
  assert.equal(s.orcamentos_enviados, 5);
  assert.equal(s.leads_encontrados, 0);
});
t("funnelVision deriva vendas separadamente (sem dupla contagem)", () => {
  const p = { ...PROSPECCAO_ZERO, leads_encontrados: 200, contatos_feitos: 100, respostas: 30, qualificados: 15, orcamentos_enviados: 8 };
  const f = funnelVision(p, 2); // vendas vem de vendas reais, não digitado na prospecção
  assert.equal(f.length, 6);
  assert.equal(f[5].label, "Vendas");
  assert.equal(f[5].valor, 2);
  assert.equal(f[5].pctTopo, 1); // 2/200
});
t("funnelSmile inclui reuniões e propostas", () => {
  const p = { ...PROSPECCAO_ZERO, leads_encontrados: 100, contatos_feitos: 80, respostas: 20, qualificados: 12, reunioes_marcadas: 10, reunioes_realizadas: 8, propostas_enviadas: 5 };
  const f = funnelSmile(p, 2);
  assert.equal(f.length, 8);
  assert.equal(f.find((s) => s.key === "reunioes_marcadas")?.valor, 10);
  assert.equal(f.find((s) => s.key === "propostas")?.valor, 5);
});

// Ações comerciais != novos prospectados
t("acoesComerciais soma canais (distinto de prospectados)", () => {
  const p = { ...PROSPECCAO_ZERO, novos_prospectados: 1, acoes_instagram: 1, acoes_whatsapp: 1, acoes_ligacao: 1 };
  assert.equal(acoesComerciais(p), 3);
  assert.equal(p.novos_prospectados, 1); // 1 dentista, 3 ações
});
t("somarProspeccao acumula novos campos", () => {
  const s = somarProspeccao([
    { novos_prospectados: 80, acoes_instagram: 50, acoes_whatsapp: 25, acoes_ligacao: 10, respostas: 24, respostas_positivas: 12 },
    { novos_prospectados: 5, acoes_instagram: 10 },
  ]);
  assert.equal(s.novos_prospectados, 85);
  assert.equal(s.acoes_instagram, 60);
  assert.equal(acoesComerciais(s), 60 + 25 + 10);
});
t("taxas de prospecção", () => {
  assert.equal(taxaResposta(24, 120), 20);
  assert.equal(taxaQualificacao(10, 24), (10 / 24) * 100);
  assert.equal(taxaReuniao(6, 10), 60);
  assert.equal(taxaResposta(1, 0), null);
});

// Unit economics
t("resultado primeiro mês desconta CAC uma vez", () => {
  // receita 500, CAC 300, custo direto 50 => 150
  assert.equal(resultadoPrimeiroMes(500, 300, 50), 150);
});
t("resultado acumulado desconta CAC uma única vez", () => {
  // recebido 1500 (3 meses), CAC 300 (uma vez), custos diretos 150 => 1050
  assert.equal(resultadoAcumulado(1500, 300, 150), 1050);
  // NÃO deve descontar CAC por mês: 1500 - 3*300 estaria errado (600)
  assert.notEqual(resultadoAcumulado(1500, 300, 150), 1500 - 3 * 300 - 150);
});
t("ltvMedio", () => {
  assert.equal(ltvMedio([1000, 2000, 3000]), 2000);
  assert.equal(ltvMedio([]), null);
});
t("inadimplenciaPct", () => {
  assert.equal(inadimplenciaPct(300, 1000), 30);
  assert.equal(inadimplenciaPct(0, 0), null);
});
t("tempoMedio media e mediana", () => {
  assert.deepEqual(tempoMedio([10, 20, 30]), { media: 20, mediana: 20 });
  assert.deepEqual(tempoMedio([10, 20, 30, 40]), { media: 25, mediana: 25 });
  assert.deepEqual(tempoMedio([]), { media: null, mediana: null });
});

// Cenário da Prospecção Ativa por NÚMEROS agregados (§7/§8/§13 do pedido)
t("taxas da prospecção por números: cenário do exemplo", () => {
  // 100 abordagens → 20 respostas → 8 positivas → 3 agendadas → 2 realizadas
  //   (1 no-show) → 2 propostas → 1 contrato
  const c = { abordagens: 100, respostas: 20, positivas: 8, reunioes_agendadas: 3, reunioes_realizadas: 2, no_shows: 1, propostas: 2, contratos: 1 };
  assert.equal(taxaResposta(c.respostas, c.abordagens), 20);                 // 20%
  assert.equal(taxaInteresse(c.positivas, c.respostas), 40);                 // 40%
  assert.equal(taxaAgendamento(c.reunioes_agendadas, c.positivas), 37.5);    // 37,5%
  assert.equal(Math.round(taxaComparecimento(c.reunioes_realizadas, c.reunioes_agendadas)! * 100) / 100, 66.67); // 66,67%
  assert.equal(Math.round(taxaNoShow(c.no_shows, c.reunioes_agendadas)! * 100) / 100, 33.33); // 33,33%
  assert.equal(taxaProposta(c.propostas, c.reunioes_realizadas), 100);       // 100%
  assert.equal(taxaFechamento(c.contratos, c.propostas), 50);                // 50%
  assert.equal(conversaoTotal(c.contratos, c.abordagens), 1);                // 1%
});
t("funnelProspeccaoNumeros monta 7 etapas e conversões", () => {
  const f = funnelProspeccaoNumeros({ abordagens: 100, respostas: 20, positivas: 8, reunioes_agendadas: 3, reunioes_realizadas: 2, no_shows: 1, propostas: 2, contratos: 1 });
  assert.equal(f.length, 7);
  assert.equal(f[0].valor, 100);
  assert.equal(f[1].pctAnterior, 20);   // 20/100
  assert.equal(f[2].pctAnterior, 40);   // 8/20
  assert.equal(f[6].pctTopo, 1);        // contratos / abordagens
});
t("taxas com denominador zero => null", () => {
  assert.equal(taxaInteresse(1, 0), null);
  assert.equal(taxaAgendamento(1, 0), null);
  assert.equal(acoesPorAbordado(1, 0), null);
});

console.log(`\n${passed} testes OK.`);
