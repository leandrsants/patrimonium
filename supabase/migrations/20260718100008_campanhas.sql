create table public.campanhas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  nome text not null,
  data_inicio date,
  data_fim date,
  observacao text,
  ativa boolean not null default true
);

alter table public.campanhas enable row level security;
revoke all on public.campanhas from public;
revoke all on public.campanhas from anon;
grant select, insert, update on public.campanhas to authenticated;
