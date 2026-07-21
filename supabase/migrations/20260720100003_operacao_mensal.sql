-- ============================================================================
-- OPERAÇÃO MENSAL — operação recorrente da Digital Smile (mês a mês)
-- ----------------------------------------------------------------------------
-- Processo DIFERENTE da entrega pontual da Vision: aqui é a gestão de tráfego
-- recorrente por cliente, acompanhada por competência (mês). 1 registro por
-- assinatura por mês.
--
-- Relações: operacao_mensal N—1 assinaturas (-> cliente/empresa). O onboarding
-- inicial continua nos checklists da própria assinatura; esta tabela é o
-- acompanhamento MENSAL da entrega.
-- Impacto: aditivo. Rollback: drop table operacao_mensal.
-- ============================================================================

create table if not exists public.operacao_mensal (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.assinaturas (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete restrict,
  empresa_id uuid references public.empresas (id) on delete restrict,
  competencia date not null,               -- sempre dia 1 do mês de referência
  status text not null default 'pendente'
    check (status in ('pendente', 'em_andamento', 'entregue', 'atrasado')),
  checklist jsonb not null default '{}'::jsonb,
  relatorio_enviado boolean not null default false,
  reuniao_mensal_realizada boolean not null default false,
  observacao text,
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists operacao_mensal_assinatura_competencia_unica
  on public.operacao_mensal (assinatura_id, competencia);
create index if not exists operacao_mensal_competencia_idx on public.operacao_mensal (competencia);

alter table public.operacao_mensal enable row level security;
revoke all on public.operacao_mensal from public;
revoke all on public.operacao_mensal from anon;
grant select, insert, update on public.operacao_mensal to authenticated;
create policy select_authenticated on public.operacao_mensal for select to authenticated using (true);
create policy insert_authenticated on public.operacao_mensal for insert to authenticated with check (true);
create policy update_authenticated on public.operacao_mensal for update to authenticated using (true) with check (true);
-- service_role ignora RLS mas ainda precisa de GRANT explícito (padrão do projeto).
grant select, insert, update on public.operacao_mensal to service_role;
