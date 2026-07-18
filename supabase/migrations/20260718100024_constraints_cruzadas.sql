-- Validacoes de lancamentos_financeiros que dependem de consulta a outra
-- linha/tabela e por isso nao podem ser um CHECK puro.

create or replace function public.validar_estorno()
returns trigger
language plpgsql
as $$
declare
  v_original record;
  v_soma_estornos numeric(10, 2);
begin
  if new.estorno_de_id is null then
    return new;
  end if;

  select * into v_original from public.lancamentos_financeiros where id = new.estorno_de_id;
  if not found then
    raise exception 'estorno_de_id % nao aponta para um lancamento existente', new.estorno_de_id;
  end if;

  if v_original.estorno_de_id is not null then
    raise exception 'nao e permitido estornar um lancamento que ja e, ele mesmo, um estorno';
  end if;

  if new.natureza <> v_original.natureza then
    raise exception 'estorno deve preservar a natureza do lancamento original (%), recebido %', v_original.natureza, new.natureza;
  end if;

  if new.parcela_id is distinct from v_original.parcela_id then
    raise exception 'estorno deve referenciar a mesma parcela do lancamento original';
  end if;

  select coalesce(sum(valor), 0) into v_soma_estornos
  from public.lancamentos_financeiros
  where estorno_de_id = v_original.id;

  if v_soma_estornos + new.valor > v_original.valor then
    raise exception 'soma dos estornos (%) ultrapassaria o valor original (%)', v_soma_estornos + new.valor, v_original.valor;
  end if;

  return new;
end;
$$;

create trigger trg_validar_estorno
  before insert on public.lancamentos_financeiros
  for each row execute function public.validar_estorno();


create or replace function public.validar_natureza_empresa()
returns trigger
language plpgsql
as $$
declare
  v_empresa_venda uuid;
  v_empresa_assinatura uuid;
begin
  if new.parcela_id is null then
    return new;
  end if;

  select v.empresa_id, a.empresa_id
    into v_empresa_venda, v_empresa_assinatura
  from public.parcelas p
  left join public.vendas v on v.id = p.venda_id
  left join public.assinaturas a on a.id = p.assinatura_id
  where p.id = new.parcela_id;

  if v_empresa_venda is not null and new.empresa_id is not null and v_empresa_venda <> new.empresa_id then
    raise exception 'empresa_id do lancamento (%) nao bate com a empresa da venda vinculada (%)', new.empresa_id, v_empresa_venda;
  end if;

  if v_empresa_assinatura is not null and new.empresa_id is not null and v_empresa_assinatura <> new.empresa_id then
    raise exception 'empresa_id do lancamento (%) nao bate com a empresa da assinatura vinculada (%)', new.empresa_id, v_empresa_assinatura;
  end if;

  return new;
end;
$$;

create trigger trg_validar_natureza_empresa
  before insert on public.lancamentos_financeiros
  for each row execute function public.validar_natureza_empresa();
