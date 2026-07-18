create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  cor_tema text,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.empresas enable row level security;
revoke all on public.empresas from public;
revoke all on public.empresas from anon;
grant select, insert, update on public.empresas to authenticated;
