-- Razao unico de todo movimento de dinheiro.
create table public.lancamentos_financeiros (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida', 'transferencia')),
  natureza text not null check (
    natureza in ('receita_empresarial', 'receita_extra', 'despesa_empresarial', 'despesa_pessoal', 'transferencia')
  ),
  empresa_id uuid references public.empresas (id) on delete restrict,
  categoria_id uuid references public.categorias_financeiras (id) on delete restrict,
  cliente_id uuid references public.clientes (id) on delete restrict,
  venda_id uuid references public.vendas (id) on delete restrict,
  parcela_id uuid references public.parcelas (id) on delete restrict,
  campanha_id uuid references public.campanhas (id) on delete restrict,
  compra_cartao_id uuid references public.compras_cartao (id) on delete restrict,
  numero_parcela_cartao integer,
  despesa_recorrente_id uuid references public.despesas_recorrentes (id) on delete restrict,
  competencia_referencia date,
  despesa_compartilhada_grupo_id uuid,
  conta_id uuid not null references public.contas (id) on delete restrict,
  conta_destino_id uuid references public.contas (id) on delete restrict,
  valor numeric(10, 2) not null check (valor >= 0),
  data_competencia date not null default current_date,
  data_vencimento date,
  data_pagamento date,
  status text not null default 'previsto' check (status in ('previsto', 'recebido', 'pago', 'cancelado')),
  estorno_de_id uuid references public.lancamentos_financeiros (id) on delete restrict,
  motivo_estorno text check (
    motivo_estorno in ('devolucao_total', 'devolucao_parcial', 'chargeback', 'cobranca_perdoada', 'desconto_posterior')
  ),
  idempotency_key text not null unique,
  entra_no_cac boolean not null default false,
  legado_tabela_origem text,
  legado_id_origem uuid,
  legado_observacao_original text,
  migrado_em timestamptz,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  check (
    estorno_de_id is not null or natureza <> 'receita_empresarial'
    or (tipo = 'entrada' and empresa_id is not null)
  ),
  check (
    estorno_de_id is not null or natureza <> 'despesa_empresarial'
    or (tipo = 'saida' and empresa_id is not null)
  ),
  check (
    estorno_de_id is not null or natureza <> 'receita_extra'
    or (tipo = 'entrada' and empresa_id is null and parcela_id is null)
  ),
  check (
    estorno_de_id is not null or natureza <> 'despesa_pessoal'
    or (tipo = 'saida' and empresa_id is null)
  ),
  check (
    natureza <> 'transferencia'
    or (tipo = 'transferencia' and empresa_id is null and categoria_id is null
        and conta_destino_id is not null and conta_destino_id <> conta_id)
  ),
  check ((tipo = 'transferencia') = (natureza = 'transferencia')),
  check (not entra_no_cac or (natureza = 'despesa_empresarial' and empresa_id is not null)),
  check (compra_cartao_id is null or numero_parcela_cartao is not null)
);

comment on column public.lancamentos_financeiros.status is
  'Sem "atrasado" -- derivado por data_vencimento < hoje AND status=''previsto''.';
comment on column public.lancamentos_financeiros.natureza is
  'Classificacao de negocio, ortogonal a empresa_id. Nao existe mais coluna classificacao.';

create unique index lancamentos_parcela_cartao_unico
  on public.lancamentos_financeiros (compra_cartao_id, numero_parcela_cartao)
  where compra_cartao_id is not null;

create unique index lancamentos_despesa_recorrente_competencia_unica
  on public.lancamentos_financeiros (despesa_recorrente_id, competencia_referencia)
  where despesa_recorrente_id is not null;

create index lancamentos_natureza_competencia_idx on public.lancamentos_financeiros (natureza, data_competencia);
create index lancamentos_empresa_idx on public.lancamentos_financeiros (empresa_id);
create index lancamentos_status_idx on public.lancamentos_financeiros (status);
create index lancamentos_cliente_idx on public.lancamentos_financeiros (cliente_id);
create index lancamentos_parcela_idx on public.lancamentos_financeiros (parcela_id);
create index lancamentos_grupo_compartilhado_idx on public.lancamentos_financeiros (despesa_compartilhada_grupo_id);

-- Copia entra_no_cac da categoria no momento da insercao, para permitir a
-- CHECK acima sem depender de JOIN na propria constraint.
create or replace function public.lancamentos_definir_entra_no_cac()
returns trigger
language plpgsql
as $$
begin
  if new.categoria_id is not null then
    select c.entra_no_cac into new.entra_no_cac
    from public.categorias_financeiras c
    where c.id = new.categoria_id;
  else
    new.entra_no_cac := false;
  end if;
  return new;
end;
$$;

create trigger trg_lancamentos_entra_no_cac
  before insert on public.lancamentos_financeiros
  for each row execute function public.lancamentos_definir_entra_no_cac();

-- Mantem parcelas.status a partir da soma liquida de lancamentos vinculados.
-- Nunca sobrescreve 'cancelada'. Nunca seta 'atrasada' (isso e sempre view).
create or replace function public.recalcular_status_parcela(p_parcela_id uuid)
returns void
language plpgsql
as $$
declare
  v_valor_devido numeric(10, 2);
  v_status_atual text;
  v_recebido_liquido numeric(10, 2);
begin
  if p_parcela_id is null then
    return;
  end if;

  select valor_devido, status into v_valor_devido, v_status_atual
  from public.parcelas where id = p_parcela_id;

  if not found or v_status_atual = 'cancelada' then
    return;
  end if;

  select coalesce(sum(case when tipo = 'entrada' then valor else 0 end), 0)
       - coalesce(sum(case when estorno_de_id is not null then valor else 0 end), 0)
    into v_recebido_liquido
  from public.lancamentos_financeiros
  where parcela_id = p_parcela_id;

  update public.parcelas
    set status = case
        when v_recebido_liquido >= v_valor_devido and v_valor_devido > 0 then 'paga'
        when v_recebido_liquido > 0 then 'parcial'
        else 'prevista'
      end,
      atualizado_em = now()
    where id = p_parcela_id;
end;
$$;

create or replace function public.trg_atualizar_status_parcela_fn()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_status_parcela(old.parcela_id);
    return old;
  end if;

  perform public.recalcular_status_parcela(new.parcela_id);
  if tg_op = 'UPDATE' and old.parcela_id is distinct from new.parcela_id then
    perform public.recalcular_status_parcela(old.parcela_id);
  end if;
  return new;
end;
$$;

create trigger trg_atualizar_status_parcela
  after insert or update or delete on public.lancamentos_financeiros
  for each row execute function public.trg_atualizar_status_parcela_fn();

alter table public.lancamentos_financeiros enable row level security;
revoke all on public.lancamentos_financeiros from public;
revoke all on public.lancamentos_financeiros from anon;
grant select, insert, update on public.lancamentos_financeiros to authenticated;
