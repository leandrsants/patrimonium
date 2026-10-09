-- Gera os lancamentos 'previsto' das fontes extras para uma competencia (mes).
--
-- Regras:
--   - So fontes com status 'ativa' e recorrencias ativas vigentes no mes.
--   - Dia ajustado ao fim do mes (dia 30 em fevereiro -> ultimo dia).
--   - Fonte 'fixa': valor da recorrencia.
--   - Fonte 'variavel' (Jiu-jitsu): soma das mensalidades dos alunos ativos
--     no dia do repasse; soma 0 -> nao gera.
--   - Idempotente: on conflict no indice (recorrencia, competencia).
--   - data_pagamento nulo: previsto nao entra em saldo, meta nem dashboard.
--
-- Impacto: funcao nova. Risco: baixo. Rollback: a funcao pode ser ignorada;
-- previstos gerados por engano viram 'cancelado' (nunca apagar).

create or replace function public.gerar_previstos_extras(p_competencia date)
returns integer
language plpgsql
as $$
declare
  v_mes date := date_trunc('month', p_competencia)::date;
  v_ultimo_dia integer := extract(day from (date_trunc('month', p_competencia) + interval '1 month - 1 day'))::integer;
  v_inseridos integer;
begin
  with base as (
    select
      r.id as recorrencia_id,
      f.id as fonte_id,
      f.nome as fonte_nome,
      f.tipo,
      coalesce(f.conta_padrao_id, (select c.id from public.contas c where c.nome = 'Inter' limit 1)) as conta_id,
      (v_mes + (least(r.dia_mes, v_ultimo_dia) - 1))::date as vencimento,
      r.valor,
      r.descricao
    from public.fontes_extras_recorrencias r
    join public.fontes_extras f on f.id = r.fonte_id
    where f.status = 'ativa'
      and r.ativa
      and r.data_inicio <= (v_mes + (v_ultimo_dia - 1))
      and (r.data_fim is null or r.data_fim >= v_mes)
  ),
  valores as (
    select
      b.*,
      case
        when b.tipo = 'variavel' then coalesce((
          select sum(a.mensalidade)
          from public.alunos_jiujitsu a
          where a.fonte_id = b.fonte_id
            and a.data_entrada <= b.vencimento
            and (a.data_saida is null or a.data_saida >= b.vencimento)
        ), 0)
        else b.valor
      end as valor_previsto
    from base b
  ),
  ins as (
    insert into public.lancamentos_financeiros (
      tipo, natureza, fonte_extra_id, fonte_extra_recorrencia_id, competencia_referencia,
      conta_id, valor, data_competencia, data_vencimento, status, idempotency_key, observacao
    )
    select
      'entrada', 'receita_extra', v.fonte_id, v.recorrencia_id, v_mes,
      v.conta_id, v.valor_previsto, v.vencimento, v.vencimento, 'previsto',
      'extra-' || v.recorrencia_id || '-' || to_char(v_mes, 'YYYY-MM'),
      coalesce(v.descricao, v.fonte_nome)
    from valores v
    where v.valor_previsto > 0 and v.conta_id is not null
    on conflict do nothing
    returning 1
  )
  select count(*) into v_inseridos from ins;

  return v_inseridos;
end;
$$;

grant execute on function public.gerar_previstos_extras(date) to authenticated, service_role;
