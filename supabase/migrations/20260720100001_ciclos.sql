-- ============================================================================
-- CICLOS + vínculo com METAS
-- ----------------------------------------------------------------------------
-- Cria `ciclos` (períodos de meta, ex.: 22/06/2026–31/12/2026; próximo
-- 01/01/2027–…) e liga `metas` a um ciclo via `metas.ciclo_id`. A "média mensal
-- simulada" é métrica CALCULADA no dashboard (faturamento/recebido ÷ meses do
-- ciclo), não é coluna.
--
-- Relações: ciclos 1—N metas (metas.ciclo_id -> ciclos.id).
-- Impacto: aditivo. Rollback: drop table ciclos; drop column metas.ciclo_id.
-- ============================================================================

create table if not exists public.ciclos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inicio date not null,
  data_fim date not null,
  ativo boolean not null default true,
  observacao text,
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  check (data_fim >= data_inicio)
);

alter table public.metas
  add column if not exists ciclo_id uuid references public.ciclos (id) on delete set null;

create index if not exists metas_ciclo_idx on public.metas (ciclo_id);

alter table public.ciclos enable row level security;
revoke all on public.ciclos from public;
revoke all on public.ciclos from anon;
grant select, insert, update on public.ciclos to authenticated;
create policy select_authenticated on public.ciclos for select to authenticated using (true);
create policy insert_authenticated on public.ciclos for insert to authenticated with check (true);
create policy update_authenticated on public.ciclos for update to authenticated using (true) with check (true);
-- service_role ignora RLS mas ainda precisa de GRANT explícito (padrão do projeto).
grant select, insert, update on public.ciclos to service_role;
