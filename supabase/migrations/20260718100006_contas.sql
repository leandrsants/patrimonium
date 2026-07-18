create table public.contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('bancaria', 'cripto', 'especie', 'investimento')),
  moeda_ativo text not null default 'BRL',
  saldo_inicial numeric(14, 2) not null default 0,
  data_base date not null default current_date,
  quantidade_ativo numeric(18, 8),
  cotacao_manual_brl numeric(10, 2),
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  check (tipo = 'cripto' or (quantidade_ativo is null and cotacao_manual_brl is null))
);

alter table public.contas enable row level security;
revoke all on public.contas from public;
revoke all on public.contas from anon;
grant select, insert, update on public.contas to authenticated;
