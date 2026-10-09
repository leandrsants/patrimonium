-- Meta 10K = Vision + Digital Smile + fontes extras (Sonati, Danilo, Jiu-jitsu).
--
-- Passa a contar receita_extra ligada a uma fonte com conta_na_meta = true.
-- O flag da categoria (20260812110000) continua valendo por compatibilidade.
-- Receita extra sem fonte (ex.: Presentes) segue FORA da meta.
--
-- Impacto: recria a view; colunas identicas. Hoje o valor nao muda
--          (3272,90): as 4 entradas da Sonati ja contavam via categoria.
-- Risco: baixo -- view, sem perda de dado.
-- Rollback: recriar a view de 20260812110000_meta_conta_extras.sql.

create or replace view public.meta_10k_progresso
with (security_invoker = true) as
select
  m.id as meta_id,
  m.nome,
  m.valor_alvo,
  m.data_inicio,
  m.data_fim,
  coalesce((
    select sum(lf.valor)
    from public.lancamentos_financeiros lf
    left join public.categorias_financeiras cf on cf.id = lf.categoria_id
    left join public.fontes_extras fe on fe.id = lf.fonte_extra_id
    where lf.tipo = 'entrada'
      and lf.status = 'recebido'
      and (
        lf.natureza = 'receita_empresarial'
        or (
          lf.natureza = 'receita_extra'
          and (coalesce(fe.conta_na_meta, false) or coalesce(cf.conta_na_meta, false))
        )
      )
      and lf.data_pagamento between m.data_inicio and m.data_fim
      and not exists (
        select 1 from public.revisoes_migracao rm
        where rm.status = 'pendente'
          and rm.tabela_referencia in ('lancamentos_financeiros', 'parcelas', 'vendas')
          and rm.registro_id in (lf.id, lf.parcela_id, lf.venda_id)
      )
  ), 0) as valor_confirmado
from public.metas m
where m.ativa = true;
