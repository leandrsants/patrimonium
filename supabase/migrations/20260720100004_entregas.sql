-- ============================================================================
-- ENTREGAS — projetos/entregas da Vision (1:N por venda)
-- ----------------------------------------------------------------------------
-- Uma venda (fotos, vídeos, combos, sites) pode ter VÁRIAS entregas, revisões e
-- etapas. `vendas.status_entrega` continua como o resumo da venda; esta tabela
-- guarda as etapas/entregas detalhadas.
--
-- Relações: entregas N—1 vendas; N—1 clientes/empresas. venda_id/cliente_id
-- são nuláveis porque o legado tem entregas sem venda vinculada.
-- Impacto: aditivo. Rollback: drop table entregas.
-- ============================================================================

create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete restrict,
  venda_id uuid references public.vendas (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete restrict,
  descricao text,
  etapa text,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_producao', 'aguardando_aprovacao', 'revisao', 'entregue')),
  ordem integer,
  entregue_em timestamptz,
  drive_link text,
  observacao text,
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists entregas_venda_idx on public.entregas (venda_id);
create index if not exists entregas_empresa_status_idx on public.entregas (empresa_id, status);

alter table public.entregas enable row level security;
revoke all on public.entregas from public;
revoke all on public.entregas from anon;
grant select, insert, update on public.entregas to authenticated;
create policy select_authenticated on public.entregas for select to authenticated using (true);
create policy insert_authenticated on public.entregas for insert to authenticated with check (true);
create policy update_authenticated on public.entregas for update to authenticated using (true) with check (true);
-- service_role ignora RLS mas ainda precisa de GRANT explícito (padrão do projeto).
grant select, insert, update on public.entregas to service_role;
