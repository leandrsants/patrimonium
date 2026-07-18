-- Despesas empresariais/pessoais recorrentes SEM cliente associado
-- (Magnific, dominio, ferramentas etc.) -- separada de assinaturas,
-- que e sempre receita de cliente.
create table public.despesas_recorrentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(10, 2) not null check (valor >= 0),
  periodicidade text not null check (periodicidade in ('mensal', 'anual')),
  proxima_data_vencimento date not null,
  categoria_id uuid references public.categorias_financeiras (id) on delete restrict,
  empresa_id uuid references public.empresas (id) on delete restrict,
  despesa_compartilhada_grupo_id uuid,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.despesas_recorrentes enable row level security;
revoke all on public.despesas_recorrentes from public;
revoke all on public.despesas_recorrentes from anon;
grant select, insert, update on public.despesas_recorrentes to authenticated;
