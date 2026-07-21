-- ============================================================================
-- BACKFILL — ciclos (legado) -> ciclos ; vincula a Meta 10K ao ciclo
-- ----------------------------------------------------------------------------
-- Migra o ciclo "Jun-Dez 2026" alinhando o INÍCIO à regra oficial da Meta 10K:
-- 22/06/2026 (o legado registra 21/06 — 1 dia a menos). O legado permanece
-- intacto em legado_ciclos; só o ciclo NOVO passa a começar em 22/06.
-- Depois vincula a Meta 10K (criada no seed das 43) ao ciclo por período.
-- Rollback: delete ciclos where legado_tabela_origem='legado_ciclos';
--           update metas set ciclo_id=null.
-- ============================================================================

insert into public.ciclos (
  id, nome, data_inicio, data_fim, ativo,
  legado_tabela_origem, legado_id_origem, migrado_em, criado_em
)
select c.id, c.nome,
  case when c.inicio = date '2026-06-21' then date '2026-06-22' else c.inicio end,
  c.fim, c.ativo,
  'legado_ciclos', c.id, now(), c.criado_em
from public.legado_ciclos c
on conflict (id) do nothing;

update public.metas m
set ciclo_id = c.id
from public.ciclos c
where m.ciclo_id is null
  and c.data_inicio <= m.data_fim
  and c.data_fim   >= m.data_inicio;
