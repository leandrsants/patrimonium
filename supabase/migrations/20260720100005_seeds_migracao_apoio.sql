-- ============================================================================
-- SEEDS DE APOIO À MIGRAÇÃO (idempotentes)
-- ----------------------------------------------------------------------------
-- Cria o mínimo que os backfills precisam e ainda não existe:
--   1) Conta "Caixa" — todo lançamento exige conta_id.
--   2) Produto técnico/INATIVO "Venda avulsa — legado" (Vision) — destino A1 das
--      vendas históricas cujo produto não é 100% confiável. A observação
--      original é preservada em vendas.legado_observacao_original.
-- Não recria empresas/categorias/produtos das 43 (já idempotentes lá).
-- Impacto: aditivo/idempotente. Rollback: remover as 2 linhas criadas.
-- ============================================================================

insert into public.contas (nome, tipo, saldo_inicial)
select 'Caixa', 'especie', 0
where not exists (select 1 from public.contas where nome = 'Caixa');

insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, ativo, ordem)
select e.id, 'Venda avulsa — legado', 'unico', false, 999
from public.empresas e
where e.slug = 'vision'
  and not exists (
    select 1 from public.produtos_servicos p
    where p.empresa_id = e.id and p.nome = 'Venda avulsa — legado'
  );
