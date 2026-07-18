-- Tabela unica de "o que e devido e quando" -- serve vendas e assinaturas,
-- exatamente uma origem por linha, nunca as duas, nunca nenhuma.
create table public.parcelas (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references public.vendas (id) on delete restrict,
  assinatura_id uuid references public.assinaturas (id) on delete restrict,
  competencia_referencia date,
  numero integer,
  descricao text,
  valor_devido numeric(10, 2) not null check (valor_devido >= 0),
  data_vencimento date not null,
  status text not null default 'prevista' check (status in ('prevista', 'parcial', 'paga', 'cancelada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,

  check (
    (venda_id is not null and assinatura_id is null)
    or (venda_id is null and assinatura_id is not null)
  ),
  check (assinatura_id is null or competencia_referencia is not null),
  check (venda_id is null or competencia_referencia is null),
  check (venda_id is null or numero is not null)
);

comment on column public.parcelas.status is
  'Somente estados persistentes: prevista/parcial/paga/cancelada. "atrasada" NUNCA e gravado aqui -- e sempre derivado (ver view parcelas_situacao).';

create unique index parcelas_competencia_unica
  on public.parcelas (assinatura_id, competencia_referencia)
  where assinatura_id is not null;

create unique index parcelas_numero_unico
  on public.parcelas (venda_id, numero)
  where venda_id is not null;

create index parcelas_status_idx on public.parcelas (status);
create index parcelas_vencimento_idx on public.parcelas (data_vencimento);

alter table public.parcelas enable row level security;
revoke all on public.parcelas from public;
revoke all on public.parcelas from anon;
grant select, insert, update on public.parcelas to authenticated;
