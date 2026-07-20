-- NÍVEL 1 — atividade agregada de prospecção (esforço comercial por dia/método),
-- sem exigir cadastrar cada contato frio como lead individual.
-- NÍVEL 2 (oportunidades) continua para leads relevantes com acompanhamento.
-- Vendas e clientes conquistados NÃO são digitados aqui — são derivados de
-- vendas/oportunidades reais para evitar dupla contagem.
create table public.registros_prospeccao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  data date not null default current_date,
  metodo_aquisicao text not null default 'prospeccao_ativa'
    check (metodo_aquisicao in ('prospeccao_ativa', 'trafego_pago', 'organico', 'indicacao', 'outros')),
  canal_id uuid references public.canais_aquisicao (id) on delete restrict,
  leads_encontrados integer not null default 0 check (leads_encontrados >= 0),
  contatos_feitos integer not null default 0 check (contatos_feitos >= 0),
  respostas integer not null default 0 check (respostas >= 0),
  qualificados integer not null default 0 check (qualificados >= 0),
  orcamentos_enviados integer not null default 0 check (orcamentos_enviados >= 0),
  reunioes_marcadas integer not null default 0 check (reunioes_marcadas >= 0),
  reunioes_realizadas integer not null default 0 check (reunioes_realizadas >= 0),
  no_shows integer not null default 0 check (no_shows >= 0),
  propostas_enviadas integer not null default 0 check (propostas_enviadas >= 0),
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index registros_prospeccao_empresa_data_idx on public.registros_prospeccao (empresa_id, data);
create index registros_prospeccao_metodo_idx on public.registros_prospeccao (metodo_aquisicao);

alter table public.registros_prospeccao enable row level security;
revoke all on public.registros_prospeccao from public;
revoke all on public.registros_prospeccao from anon;
grant select, insert, update on public.registros_prospeccao to authenticated;
grant select, insert, update on public.registros_prospeccao to service_role;

create policy select_authenticated on public.registros_prospeccao for select to authenticated using (true);
create policy insert_authenticated on public.registros_prospeccao for insert to authenticated with check (true);
create policy update_authenticated on public.registros_prospeccao for update to authenticated using (true) with check (true);
