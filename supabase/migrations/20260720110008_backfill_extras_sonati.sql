-- ============================================================================
-- BACKFILL — Sonati (legado) -> lançamento de RECEITA EXTRA
-- ----------------------------------------------------------------------------
-- A venda de fonte "Sonati" (R$ 400) NÃO é venda de empresa: vira receita_extra
-- (empresa_id NULL, parcela_id NULL, categoria "Sonati/Sonate"). Assim NÃO
-- entra no faturamento das empresas nem na Meta 10K (que só conta
-- receita_empresarial). Trium não tem dados. Preserva a observação original.
-- Rollback: delete where idempotency_key like 'legado-sonati-%'.
-- ============================================================================

insert into public.lancamentos_financeiros (
  tipo, natureza, categoria_id, conta_id, valor,
  data_competencia, data_pagamento, status, observacao,
  idempotency_key, legado_tabela_origem, legado_id_origem, legado_observacao_original, migrado_em
)
select 'entrada', 'receita_extra',
  (select id from public.categorias_financeiras where nome = 'Sonati/Sonate' limit 1),
  (select id from public.contas where nome = 'Caixa'),
  v.valor, v.data, v.data, 'recebido',
  'Receita extra Sonati (migrado do legado)',
  'legado-sonati-' || v.id::text,
  'legado_vision_vendas', v.id, v.observacao, now()
from public.legado_vision_vendas v
join public.legado_fontes f on f.id = v.fonte_id and f.nome = 'Sonati'
where not exists (
  select 1 from public.lancamentos_financeiros l
  where l.idempotency_key = 'legado-sonati-' || v.id::text
);
