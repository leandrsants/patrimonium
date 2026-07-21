-- ============================================================================
-- BACKFILL — gastos_ads (legado) -> lancamentos_financeiros (investimento/CAC)
-- ----------------------------------------------------------------------------
-- Cada gasto vira despesa empresarial com categoria "Tráfego pago"
-- (entra_no_cac é setado pelo trigger a partir da categoria) e
-- metodo_aquisicao='trafego_pago'. Atribuição por fonte: gastos da fonte
-- "Digital Smile" -> empresa DS; o resto -> Vision.
-- Esperado: Vision R$ 974,89 (35) + Digital Smile R$ 49,92 (1).
-- Rollback: delete where legado_tabela_origem='legado_vision_gastos_ads'.
-- ============================================================================

insert into public.lancamentos_financeiros (
  tipo, natureza, empresa_id, categoria_id, conta_id, valor,
  data_competencia, data_pagamento, status, metodo_aquisicao, observacao,
  idempotency_key, legado_tabela_origem, legado_id_origem, migrado_em
)
select 'saida', 'despesa_empresarial',
  case when f.nome = 'Digital Smile'
       then (select id from public.empresas where slug = 'digital_smile')
       else (select id from public.empresas where slug = 'vision') end,
  (select id from public.categorias_financeiras where nome = 'Tráfego pago' limit 1),
  (select id from public.contas where nome = 'Caixa'),
  g.valor, g.data, g.data, 'pago', 'trafego_pago', g.descricao,
  'legado-gasto-' || g.id::text,
  'legado_vision_gastos_ads', g.id, now()
from public.legado_vision_gastos_ads g
left join public.legado_fontes f on f.id = g.fonte_id
where not exists (
  select 1 from public.lancamentos_financeiros l
  where l.idempotency_key = 'legado-gasto-' || g.id::text
);
