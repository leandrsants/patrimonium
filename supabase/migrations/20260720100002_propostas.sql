-- ============================================================================
-- PROPOSTAS — proposta comercial como REGISTRO próprio (vinculada ao lead)
-- ----------------------------------------------------------------------------
-- Hoje "proposta" existe só como número no registro de prospecção e como campos
-- inline na oportunidade. Esta tabela torna a proposta um registro de 1ª classe
-- (valor, status, datas), permitindo N propostas por oportunidade e alimentando
-- o funil "Propostas" com dados reais.
--
-- Relações: propostas N—1 oportunidades; N—1 empresas/clientes/produtos.
-- Enum de status alinhado ao já usado em oportunidades.proposta_status.
-- Impacto: aditivo. Rollback: drop table propostas.
-- ============================================================================

create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  oportunidade_id uuid not null references public.oportunidades (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete restrict,
  produto_id uuid references public.produtos_servicos (id) on delete restrict,
  valor numeric(10, 2) not null check (valor >= 0),
  status text not null default 'enviada'
    check (status in ('enviada', 'negociacao', 'aceita', 'recusada', 'expirada')),
  data_envio date not null default current_date,
  data_resposta date,
  validade date,
  observacao text,
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists propostas_oportunidade_idx on public.propostas (oportunidade_id);
create index if not exists propostas_empresa_status_idx on public.propostas (empresa_id, status);

alter table public.propostas enable row level security;
revoke all on public.propostas from public;
revoke all on public.propostas from anon;
grant select, insert, update on public.propostas to authenticated;
create policy select_authenticated on public.propostas for select to authenticated using (true);
create policy insert_authenticated on public.propostas for insert to authenticated with check (true);
create policy update_authenticated on public.propostas for update to authenticated using (true) with check (true);
-- service_role ignora RLS mas ainda precisa de GRANT explícito (padrão do projeto).
grant select, insert, update on public.propostas to service_role;
