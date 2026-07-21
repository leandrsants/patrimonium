-- ============================================================================
-- BACKFILL — entregas (legado Vision) -> entregas
-- ----------------------------------------------------------------------------
-- Preserva as 12 entregas da Vision. venda_id/cliente_id só são mantidos se
-- resolverem para linhas migradas (senão ficam nulos, sem quebrar FK).
-- Status legado ('pendente'/'entregue') mapeado para o enum novo.
-- Rollback: delete where legado_tabela_origem='legado_vision_entregas'.
-- ============================================================================

insert into public.entregas (
  id, empresa_id, venda_id, cliente_id, descricao, status,
  legado_tabela_origem, legado_id_origem, migrado_em, criado_em
)
select
  e.id,
  (select id from public.empresas where slug = 'vision'),
  case when exists (select 1 from public.vendas v where v.id = e.venda_id) then e.venda_id else null end,
  case when exists (select 1 from public.clientes c where c.id = e.cliente_id) then e.cliente_id else null end,
  e.descricao,
  case when e.status in ('pendente', 'em_producao', 'aguardando_aprovacao', 'revisao', 'entregue')
       then e.status else 'pendente' end,
  'legado_vision_entregas', e.id, now(), e.criado_em
from public.legado_vision_entregas e
on conflict (id) do nothing;
