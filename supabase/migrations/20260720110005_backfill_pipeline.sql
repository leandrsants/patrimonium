-- ============================================================================
-- BACKFILL — pipeline (legado Vision) -> oportunidades
-- ----------------------------------------------------------------------------
-- Migra o pipeline da Vision como oportunidades (só display do funil comercial).
-- IMPORTANTE (regra do usuário): itens 'fechado' NÃO geram nova venda nem nova
-- conversão. Isso é seguro porque CAC/faturamento/funil do app derivam de
-- vendas + lancamentos + registros_prospeccao — nunca da contagem de
-- oportunidades. Aqui só preservamos/vinculamos o histórico.
-- Tenta casar cliente por nome (best-effort). Preserva o mesmo id.
-- Rollback: delete where legado_tabela_origem='legado_vision_pipeline'.
-- ============================================================================

insert into public.oportunidades (
  id, empresa_id, cliente_id, nome_contato, estagio, valor_potencial,
  observacao, metodo_aquisicao, fechado_em,
  legado_tabela_origem, legado_id_origem, migrado_em, criado_em
)
select
  p.id,
  (select id from public.empresas where slug = 'vision'),
  (select c.id from public.clientes c
     where lower(c.nome) = lower(p.nome) and c.tipo_registro = 'normal' limit 1),
  p.nome,
  case p.status when 'fechado' then 'fechado' when 'follow_up' then 'follow_up' else 'interessado' end,
  p.valor,
  nullif(trim(coalesce(p.observacao, '') || ' [migrado do pipeline legado; não gera nova venda/conversão]'), ''),
  'outros',
  case when p.status = 'fechado' then p.atualizado_em else null end,
  'legado_vision_pipeline', p.id, now(), p.criado_em
from public.legado_vision_pipeline p
join public.legado_fontes f on f.id = p.fonte_id and f.nome = 'Fotos/Vídeos com IA'
on conflict (id) do nothing;
