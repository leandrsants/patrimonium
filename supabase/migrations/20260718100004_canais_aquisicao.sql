create table public.canais_aquisicao (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true
);

alter table public.canais_aquisicao enable row level security;
revoke all on public.canais_aquisicao from public;
revoke all on public.canais_aquisicao from anon;
grant select, insert, update on public.canais_aquisicao to authenticated;
