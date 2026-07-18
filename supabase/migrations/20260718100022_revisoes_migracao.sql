create table public.revisoes_migracao (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('duplicidade_valor', 'pipeline_sem_venda', 'cliente_duplicado', 'registro_teste_ambiguo')),
  tabela_referencia text not null,
  registro_id uuid not null,
  descricao text,
  valor_afetado numeric(10, 2),
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'rejeitado')),
  decisao_texto text,
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz
);

alter table public.revisoes_migracao enable row level security;
revoke all on public.revisoes_migracao from public;
revoke all on public.revisoes_migracao from anon;
grant select, insert, update on public.revisoes_migracao to authenticated;
