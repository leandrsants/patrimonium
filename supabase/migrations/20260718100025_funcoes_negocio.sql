-- Gera a parcela da competencia corrente de uma assinatura e avanca
-- proxima_data_cobranca na MESMA operacao -- o avanco depende so da criacao
-- da parcela, nunca do pagamento dela. Nunca gera competencia futura antes
-- da hora.
create or replace function public.gerar_competencia_assinatura(p_assinatura_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_assinatura record;
  v_parcela_id uuid;
  v_ultimo_dia_mes integer;
  v_dia_efetivo integer;
  v_vencimento date;
begin
  select * into v_assinatura from public.assinaturas where id = p_assinatura_id for update;
  if not found then
    raise exception 'assinatura % nao encontrada', p_assinatura_id;
  end if;

  if v_assinatura.proxima_data_cobranca > current_date then
    raise exception 'competencia de % ainda nao venceu (proxima_data_cobranca=%)', p_assinatura_id, v_assinatura.proxima_data_cobranca;
  end if;

  v_ultimo_dia_mes := extract(day from (date_trunc('month', v_assinatura.proxima_data_cobranca) + interval '1 month - 1 day'))::int;
  v_dia_efetivo := least(v_assinatura.dia_vencimento, v_ultimo_dia_mes);
  v_vencimento := date_trunc('month', v_assinatura.proxima_data_cobranca)::date + (v_dia_efetivo - 1) * interval '1 day';

  insert into public.parcelas (assinatura_id, competencia_referencia, descricao, valor_devido, data_vencimento)
  values (
    p_assinatura_id,
    date_trunc('month', v_assinatura.proxima_data_cobranca)::date,
    'mensalidade ' || to_char(v_assinatura.proxima_data_cobranca, 'MM/YYYY'),
    v_assinatura.valor_mensal,
    v_vencimento
  )
  returning id into v_parcela_id;

  update public.assinaturas
    set proxima_data_cobranca = (date_trunc('month', proxima_data_cobranca) + interval '1 month')::date,
        atualizado_em = now()
    where id = p_assinatura_id;

  return v_parcela_id;
end;
$$;


-- Gera o lancamento da competencia corrente de uma despesa recorrente e
-- avanca proxima_data_vencimento. Nunca gera meses futuros em massa.
create or replace function public.gerar_despesa_recorrente(
  p_despesa_recorrente_id uuid,
  p_conta_id uuid,
  p_idempotency_key text
)
returns uuid
language plpgsql
as $$
declare
  v_despesa record;
  v_lancamento_id uuid;
begin
  select * into v_despesa from public.despesas_recorrentes where id = p_despesa_recorrente_id for update;
  if not found then
    raise exception 'despesa recorrente % nao encontrada', p_despesa_recorrente_id;
  end if;

  if v_despesa.status <> 'ativo' then
    raise exception 'despesa recorrente % nao esta ativa', p_despesa_recorrente_id;
  end if;

  if v_despesa.proxima_data_vencimento > current_date then
    raise exception 'competencia de % ainda nao venceu (proxima_data_vencimento=%)', p_despesa_recorrente_id, v_despesa.proxima_data_vencimento;
  end if;

  insert into public.lancamentos_financeiros (
    tipo, natureza, empresa_id, categoria_id, despesa_recorrente_id,
    competencia_referencia, conta_id, valor, data_competencia, data_vencimento,
    status, idempotency_key, observacao
  ) values (
    'saida',
    case when v_despesa.empresa_id is null then 'despesa_pessoal' else 'despesa_empresarial' end,
    v_despesa.empresa_id, v_despesa.categoria_id, p_despesa_recorrente_id,
    date_trunc('month', v_despesa.proxima_data_vencimento)::date, p_conta_id, v_despesa.valor,
    v_despesa.proxima_data_vencimento, v_despesa.proxima_data_vencimento,
    'previsto', p_idempotency_key, v_despesa.nome
  )
  returning id into v_lancamento_id;

  update public.despesas_recorrentes
    set proxima_data_vencimento = case v_despesa.periodicidade
          when 'mensal' then (date_trunc('month', proxima_data_vencimento) + interval '1 month')::date
          when 'anual' then (proxima_data_vencimento + interval '1 year')::date
        end,
        atualizado_em = now()
    where id = p_despesa_recorrente_id;

  return v_lancamento_id;
end;
$$;


-- Cria N linhas rateadas de uma despesa compartilhada, todas com o mesmo
-- despesa_compartilhada_grupo_id, dentro de uma unica transacao (a funcao
-- inteira roda atomicamente -- ou tudo e inserido, ou nada e).
create or replace function public.criar_despesa_compartilhada(
  p_descricao text,
  p_categoria_id uuid,
  p_conta_id uuid,
  p_data_competencia date,
  p_rateio jsonb -- [{"empresa_id": "...", "valor": 50.00}, {"empresa_id": "...", "valor": 50.00}]
)
returns uuid
language plpgsql
as $$
declare
  v_grupo_id uuid := gen_random_uuid();
  v_item jsonb;
  v_seq integer := 0;
begin
  if jsonb_array_length(p_rateio) < 2 then
    raise exception 'despesa compartilhada precisa de pelo menos 2 linhas de rateio';
  end if;

  for v_item in select * from jsonb_array_elements(p_rateio)
  loop
    v_seq := v_seq + 1;
    insert into public.lancamentos_financeiros (
      tipo, natureza, empresa_id, categoria_id, conta_id,
      valor, data_competencia, status, idempotency_key,
      despesa_compartilhada_grupo_id, observacao
    ) values (
      'saida', 'despesa_empresarial',
      (v_item ->> 'empresa_id')::uuid, p_categoria_id, p_conta_id,
      (v_item ->> 'valor')::numeric, p_data_competencia, 'previsto',
      v_grupo_id::text || '-' || v_seq,
      v_grupo_id, p_descricao
    );
  end loop;

  return v_grupo_id;
end;
$$;
