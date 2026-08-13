-- Permite que uma categoria de receita extra conte na Meta 10K.
--
-- Ate aqui meta_10k_progresso so somava natureza = 'receita_empresarial'.
-- Existe receita extra que nao e faturamento de empresa (nao tem CAC, nao tem
-- funil, pode acabar a qualquer momento) mas que foi contada no planejamento
-- dos 10k. Marcar isso lancamento a lancamento exigiria intervencao manual a
-- cada entrada nova; o flag fica na categoria para que o comportamento seja
-- automatico e reversivel em uma linha.
--
-- Impacto: adiciona coluna em public.categorias_financeiras (default false, ou
--          seja, nenhuma categoria muda de comportamento por esta migration) e
--          recria a view public.meta_10k_progresso. Nenhum lancamento e
--          alterado. As colunas da view seguem identicas -- o app nao muda.
-- Risco: baixo -- sem esta migration + a que marca a categoria, valor_confirmado
--        continua exatamente igual.
-- Rollback: alter table public.categorias_financeiras drop column conta_na_meta;
--           e recriar a view com o filtro antigo (natureza = 'receita_empresarial').

alter table public.categorias_financeiras
  add column if not exists conta_na_meta boolean not null default false;

comment on column public.categorias_financeiras.conta_na_meta is
  'true = receitas extras desta categoria entram na Meta 10K. '
  'Nao afeta faturamento das empresas nem CAC -- extra continua extra.';

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
    where lf.tipo = 'entrada'
      and lf.status = 'recebido'
      and (
        lf.natureza = 'receita_empresarial'
        or (lf.natureza = 'receita_extra' and coalesce(cf.conta_na_meta, false))
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
