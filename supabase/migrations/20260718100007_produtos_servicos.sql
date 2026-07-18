create table public.produtos_servicos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  nome text not null,
  tipo_cobranca text not null check (tipo_cobranca in ('unico', 'recorrente_mensal')),
  preco_tabela numeric(10, 2),
  preco_referencia numeric(10, 2),
  regra_pagamento_padrao jsonb,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, nome)
);

create index produtos_servicos_empresa_ativo_idx on public.produtos_servicos (empresa_id, ativo);

alter table public.produtos_servicos enable row level security;
revoke all on public.produtos_servicos from public;
revoke all on public.produtos_servicos from anon;
grant select, insert, update on public.produtos_servicos to authenticated;
