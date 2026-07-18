create table public.categorias_financeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  grupo text not null check (grupo in ('empresarial', 'pessoal', 'extra')),
  entra_no_cac boolean not null default false,
  ativo boolean not null default true
);

alter table public.categorias_financeiras enable row level security;
revoke all on public.categorias_financeiras from public;
revoke all on public.categorias_financeiras from anon;
grant select, insert, update on public.categorias_financeiras to authenticated;
