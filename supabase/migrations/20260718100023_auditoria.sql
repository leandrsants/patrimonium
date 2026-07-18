create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  registro_id uuid,
  acao text not null check (acao in ('insert', 'update', 'delete_logico', 'estorno')),
  dados_antes jsonb,
  dados_depois jsonb,
  origem text not null default 'app' check (origem in ('app', 'migracao')),
  criado_em timestamptz not null default now()
);

alter table public.auditoria enable row level security;
revoke all on public.auditoria from public;
revoke all on public.auditoria from anon;
-- Tabela somente de acrescimo: sem update/delete concedido, nem para authenticated.
grant select, insert on public.auditoria to authenticated;
