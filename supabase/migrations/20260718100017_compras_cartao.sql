create table public.compras_cartao (
  id uuid primary key default gen_random_uuid(),
  cartao_id uuid not null references public.cartoes (id) on delete restrict,
  descricao text,
  valor_total numeric(10, 2) not null check (valor_total >= 0),
  data_compra date not null default current_date,
  numero_parcelas integer not null check (numero_parcelas >= 1),
  categoria_id uuid references public.categorias_financeiras (id) on delete restrict,
  empresa_id uuid references public.empresas (id) on delete restrict,
  despesa_compartilhada_grupo_id uuid,
  mes_primeira_fatura date not null,
  criado_em timestamptz not null default now()
);

comment on column public.compras_cartao.empresa_id is
  'NULL = despesa pessoal. Preenchido = despesa daquela empresa.';

alter table public.compras_cartao enable row level security;
revoke all on public.compras_cartao from public;
revoke all on public.compras_cartao from anon;
grant select, insert, update on public.compras_cartao to authenticated;
