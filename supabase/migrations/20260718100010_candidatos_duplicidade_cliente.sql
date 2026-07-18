create table public.candidatos_duplicidade_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id_a uuid not null references public.clientes (id) on delete restrict,
  cliente_id_b uuid not null references public.clientes (id) on delete restrict,
  motivo text not null check (motivo in ('telefone_identico', 'nome_similar', 'sufixo_edited', 'email_igual', 'cadastro_proximo')),
  status text not null default 'pendente' check (status in ('pendente', 'mesclado', 'rejeitado')),
  decidido_em timestamptz,
  observacao text,
  criado_em timestamptz not null default now(),
  check (cliente_id_a <> cliente_id_b),
  unique (cliente_id_a, cliente_id_b)
);

alter table public.candidatos_duplicidade_cliente enable row level security;
revoke all on public.candidatos_duplicidade_cliente from public;
revoke all on public.candidatos_duplicidade_cliente from anon;
grant select, insert, update on public.candidatos_duplicidade_cliente to authenticated;
