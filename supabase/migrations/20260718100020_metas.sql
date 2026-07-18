create table public.metas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor_alvo numeric(10, 2) not null,
  data_inicio date not null,
  data_fim date not null,
  empresas_incluidas jsonb not null default '[]'::jsonb,
  inclui_extras boolean not null default false,
  ativa boolean not null default true,
  observacao text
);

alter table public.metas enable row level security;
revoke all on public.metas from public;
revoke all on public.metas from anon;
grant select, insert, update on public.metas to authenticated;
