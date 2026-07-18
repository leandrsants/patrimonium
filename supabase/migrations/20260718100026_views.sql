-- Views derivadas. security_invoker garante que a RLS das tabelas de origem
-- e avaliada com o papel de quem consulta a view, nao do dono da view.

create or replace view public.parcelas_situacao
with (security_invoker = true) as
select
  p.*,
  coalesce(l.recebido_liquido, 0) as recebido_liquido,
  p.valor_devido - coalesce(l.recebido_liquido, 0) as saldo_pendente,
  case
    when p.status = 'cancelada' then 'cancelada'
    when p.data_vencimento < current_date and (p.valor_devido - coalesce(l.recebido_liquido, 0)) > 0 then 'atrasada'
    else p.status
  end as situacao_calculada
from public.parcelas p
left join (
  select parcela_id,
    sum(case when tipo = 'entrada' then valor else 0 end)
      - sum(case when estorno_de_id is not null then valor else 0 end) as recebido_liquido
  from public.lancamentos_financeiros
  group by parcela_id
) l on l.parcela_id = p.id;


create or replace view public.vendas_resumo_financeiro
with (security_invoker = true) as
select
  v.id as venda_id,
  v.empresa_id,
  v.valor_final as vendido,
  coalesce(sum(ps.recebido_liquido), 0) as recebido,
  v.valor_final - coalesce(sum(ps.recebido_liquido), 0) as pendente
from public.vendas v
left join public.parcelas_situacao ps on ps.venda_id = v.id
group by v.id, v.empresa_id, v.valor_final;


create or replace view public.assinaturas_situacao
with (security_invoker = true) as
select
  a.id as assinatura_id,
  a.status as status_comercial,
  count(*) filter (where ps.situacao_calculada = 'atrasada') as competencias_atrasadas,
  count(*) filter (where ps.situacao_calculada in ('prevista', 'parcial')) as competencias_em_aberto
from public.assinaturas a
left join public.parcelas_situacao ps on ps.assinatura_id = a.id
group by a.id, a.status;


create or replace view public.inadimplencia_resumo
with (security_invoker = true) as
select
  coalesce(v.empresa_id, a.empresa_id) as empresa_id,
  sum(ps.saldo_pendente) as total_vencido_pendente
from public.parcelas_situacao ps
left join public.vendas v on v.id = ps.venda_id
left join public.assinaturas a on a.id = ps.assinatura_id
where ps.situacao_calculada = 'atrasada'
group by coalesce(v.empresa_id, a.empresa_id);


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
    where lf.tipo = 'entrada'
      and lf.natureza = 'receita_empresarial'
      and lf.status = 'recebido'
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


create or replace view public.patrimonio_saldos
with (security_invoker = true) as
select
  c.id as conta_id,
  c.nome,
  c.saldo_inicial
    + coalesce((select sum(valor) from public.lancamentos_financeiros where conta_id = c.id and tipo = 'entrada'), 0)
    - coalesce((select sum(valor) from public.lancamentos_financeiros where conta_id = c.id and tipo = 'saida'), 0)
    - coalesce((select sum(valor) from public.lancamentos_financeiros where conta_id = c.id and tipo = 'transferencia'), 0)
    + coalesce((select sum(valor) from public.lancamentos_financeiros where conta_destino_id = c.id and tipo = 'transferencia'), 0)
    as saldo_calculado
from public.contas c
where c.ativa = true;


create or replace view public.cac_por_empresa
with (security_invoker = true) as
select
  e.id as empresa_id,
  e.nome,
  coalesce(sum(lf.valor) filter (where lf.entra_no_cac), 0) as investimento_aquisicao
from public.empresas e
left join public.lancamentos_financeiros lf on lf.empresa_id = e.id
group by e.id, e.nome;

grant select on public.parcelas_situacao to authenticated;
grant select on public.vendas_resumo_financeiro to authenticated;
grant select on public.assinaturas_situacao to authenticated;
grant select on public.inadimplencia_resumo to authenticated;
grant select on public.meta_10k_progresso to authenticated;
grant select on public.patrimonio_saldos to authenticated;
grant select on public.cac_por_empresa to authenticated;
