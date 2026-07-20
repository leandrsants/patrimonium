-- Enriquece a oportunidade (Nível B) para funil comercial completo, propostas
-- mensuráveis, tempo até a venda e desempenho por abordagem/canal.
alter table public.oportunidades
  add column if not exists valor_potencial numeric(10, 2),
  add column if not exists abordagem text,
  add column if not exists cidade text,
  add column if not exists email text,
  add column if not exists proposta_valor numeric(10, 2),
  add column if not exists proposta_data date,
  add column if not exists proposta_status text,
  add column if not exists fechado_em timestamptz;

alter table public.oportunidades
  drop constraint if exists oportunidades_proposta_status_chk,
  add constraint oportunidades_proposta_status_chk
  check (proposta_status is null or proposta_status in ('enviada', 'negociacao', 'aceita', 'recusada', 'expirada'));

create index if not exists oportunidades_fechado_idx on public.oportunidades (fechado_em);
create index if not exists oportunidades_proposta_idx on public.oportunidades (proposta_status);
