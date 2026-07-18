create table public.cartoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  dia_fechamento integer,
  dia_vencimento integer,
  ativo boolean not null default true
);

alter table public.cartoes enable row level security;
revoke all on public.cartoes from public;
revoke all on public.cartoes from anon;
grant select, insert, update on public.cartoes to authenticated;
