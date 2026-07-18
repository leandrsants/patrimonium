create table public.fechamentos_mensais (
  id uuid primary key default gen_random_uuid(),
  competencia date not null unique,
  faturamento_vision numeric(10, 2),
  faturamento_digital_smile numeric(10, 2),
  recebido_vision numeric(10, 2),
  recebido_digital_smile numeric(10, 2),
  receitas_extras numeric(10, 2),
  despesas_vision numeric(10, 2),
  despesas_digital_smile numeric(10, 2),
  despesas_compartilhadas numeric(10, 2),
  despesas_pessoais numeric(10, 2),
  investimento_vision numeric(10, 2),
  investimento_digital_smile numeric(10, 2),
  lucro_vision numeric(10, 2),
  lucro_digital_smile numeric(10, 2),
  clientes_novos_vision integer,
  clientes_novos_digital_smile integer,
  cac_vision numeric(10, 2),
  cac_digital_smile numeric(10, 2),
  inadimplencia numeric(10, 2),
  patrimonio_fim_mes numeric(14, 2),
  gerado_em timestamptz not null default now(),
  reaberto_em timestamptz
);

alter table public.fechamentos_mensais enable row level security;
revoke all on public.fechamentos_mensais from public;
revoke all on public.fechamentos_mensais from anon;
grant select, insert, update on public.fechamentos_mensais to authenticated;
