-- ============================================================================
-- BACKFILL — clientes (legado Vision -> clientes global)
-- ----------------------------------------------------------------------------
-- Preserva o MESMO id (rastreabilidade + FKs de vendas/entregas resolvem por
-- identidade). whatsapp -> telefone (a normalização é feita pelo trigger).
-- Dedup: há 1 telefone duplicado no legado; o 2º registro entra como
-- 'legado_teste' (não conta na unicidade) para revisão posterior.
-- Impacto: só INSERT em clientes (vazia). Rollback: delete where
-- legado_tabela_origem='legado_vision_clientes'. Idempotente (on conflict id).
-- ============================================================================

insert into public.clientes (
  id, nome, telefone, instagram, observacao,
  tipo_registro, motivo_legado_teste,
  legado_tabela_origem, legado_id_origem, migrado_em, criado_em
)
select
  s.id, s.nome, s.whatsapp, s.instagram, s.observacao,
  case when s.tn is not null and s.rn > 1 then 'legado_teste' else 'normal' end,
  case when s.tn is not null and s.rn > 1 then 'Duplicado de telefone na migração (revisar)' else null end,
  'legado_vision_clientes', s.id, now(), s.criado_em
from (
  select
    v.*,
    public.normalizar_telefone(v.whatsapp) as tn,
    row_number() over (
      partition by public.normalizar_telefone(v.whatsapp)
      order by v.criado_em nulls last
    ) as rn
  from public.legado_vision_clientes v
) s
on conflict (id) do nothing;
