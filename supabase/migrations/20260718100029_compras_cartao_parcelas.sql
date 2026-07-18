-- Corrigido durante a implementacao local: para evitar dupla contagem entre
-- reconhecimento da despesa do cartao e pagamento da fatura, compras_cartao
-- precisa saber de qual conta a fatura sera paga (conta_id), e as N parcelas
-- futuras sao geradas UMA UNICA VEZ no cadastro. "Pagar a fatura" depois so
-- atualiza o status dessas linhas (previsto -> pago); nunca insere uma
-- segunda linha de despesa para a mesma parcela.

alter table public.compras_cartao
  add column conta_id uuid references public.contas (id) on delete restrict;

create or replace function public.compras_cartao_gerar_parcelas()
returns trigger
language plpgsql
as $$
declare
  v_valor_parcela numeric(10, 2);
  v_natureza text;
  v_i integer;
  v_data_vencimento date;
begin
  if new.conta_id is null then
    raise exception 'compras_cartao.conta_id e obrigatorio para gerar as parcelas futuras';
  end if;

  v_valor_parcela := round(new.valor_total / new.numero_parcelas, 2);
  v_natureza := case when new.empresa_id is null then 'despesa_pessoal' else 'despesa_empresarial' end;

  for v_i in 1..new.numero_parcelas loop
    v_data_vencimento := (date_trunc('month', new.mes_primeira_fatura) + ((v_i - 1) * interval '1 month'))::date;
    insert into public.lancamentos_financeiros (
      tipo, natureza, empresa_id, categoria_id, conta_id, compra_cartao_id, numero_parcela_cartao,
      valor, data_competencia, data_vencimento, status, idempotency_key, observacao,
      despesa_compartilhada_grupo_id
    ) values (
      'saida', v_natureza, new.empresa_id, new.categoria_id, new.conta_id,
      new.id, v_i,
      v_valor_parcela, v_data_vencimento, v_data_vencimento, 'previsto',
      new.id::text || '-parcela-' || v_i, new.descricao,
      new.despesa_compartilhada_grupo_id
    );
  end loop;
  return new;
end;
$$;

create trigger trg_compras_cartao_gerar_parcelas
  after insert on public.compras_cartao
  for each row execute function public.compras_cartao_gerar_parcelas();
