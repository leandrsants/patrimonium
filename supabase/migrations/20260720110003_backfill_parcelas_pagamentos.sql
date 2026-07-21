-- ============================================================================
-- BACKFILL — parcelas + pagamentos das vendas migradas
-- ----------------------------------------------------------------------------
-- Toda venda legada estava 'pago'. Para cada venda migrada cria-se:
--   1) 1 parcela (numero=1, valor_devido=valor_final, venc.=data_venda);
--   2) 1 lançamento de RECEITA EMPRESARIAL RECEBIDA (status='recebido',
--      data_pagamento=data_venda) ligado à parcela.
-- O trigger recalcular_status_parcela vira a parcela para 'paga' sozinho.
-- Assim "Recebido"/Faturamento reconciliam e a Meta 10K conta corretamente
-- (só o que caiu no caixa entre 22/06 e 31/12, receita_empresarial).
-- Rollback: delete lançamentos e parcelas com legado_tabela_origem correspondente.
-- ============================================================================

-- 1) Parcela paga (nasce 'prevista'; trigger promove a 'paga' após o lançamento)
insert into public.parcelas (
  venda_id, numero, valor_devido, data_vencimento, competencia_referencia, status,
  legado_tabela_origem, legado_id_origem, migrado_em
)
select v.id, 1, v.valor_final, v.data_venda, null, 'prevista',
  'legado_vision_vendas', v.legado_id_origem, now()
from public.vendas v
where v.legado_tabela_origem = 'legado_vision_vendas'
  and not exists (select 1 from public.parcelas p where p.venda_id = v.id and p.numero = 1);

-- 2) Pagamento (lançamento de entrada) vinculado à parcela recém-criada
insert into public.lancamentos_financeiros (
  tipo, natureza, empresa_id, conta_id, valor, data_competencia, data_pagamento,
  status, parcela_id, venda_id, cliente_id, metodo_aquisicao,
  idempotency_key, legado_tabela_origem, legado_id_origem, migrado_em
)
select 'entrada', 'receita_empresarial', v.empresa_id,
  (select id from public.contas where nome = 'Caixa'),
  v.valor_final, v.data_venda, v.data_venda, 'recebido',
  p.id, v.id, v.cliente_id, v.metodo_aquisicao,
  'legado-venda-' || v.id::text,
  'legado_vision_vendas', v.legado_id_origem, now()
from public.vendas v
join public.parcelas p on p.venda_id = v.id and p.numero = 1
where v.legado_tabela_origem = 'legado_vision_vendas'
  and not exists (
    select 1 from public.lancamentos_financeiros l
    where l.idempotency_key = 'legado-venda-' || v.id::text
  );
