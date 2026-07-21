-- ============================================================================
-- BACKFILL — vendas (legado Vision -> vendas)
-- ----------------------------------------------------------------------------
-- Só a fonte "Fotos/Vídeos com IA" (Vision). Sonati vai para receita_extra em
-- outro arquivo; "Venda de Sites" não tem vendas históricas.
-- Produto = "Venda avulsa — legado" (A1): a observação livre não é 100%
-- confiável -> preserva-se o texto em legado_observacao_original p/ revisão.
-- metodo_aquisicao derivado da origem do cliente (facebook_ads->tráfego;
-- Instagram->orgânico; sem cliente->outros). Preserva o mesmo id.
-- Valor histórico esperado: 67 vendas, R$ 2.483,90.
-- Rollback: delete where legado_tabela_origem='legado_vision_vendas'.
-- ============================================================================

insert into public.vendas (
  id, empresa_id, produto_id, cliente_id, valor_final, data_venda, status,
  metodo_aquisicao, observacao,
  legado_tabela_origem, legado_id_origem, legado_observacao_original, migrado_em, criado_em
)
select
  v.id,
  (select id from public.empresas where slug = 'vision'),
  (select p.id from public.produtos_servicos p
     where p.empresa_id = (select id from public.empresas where slug = 'vision')
       and p.nome = 'Venda avulsa — legado'),
  v.cliente_id,
  v.valor,
  v.data,
  'ativa',
  case lower(coalesce(c.origem, ''))
    when 'facebook_ads' then 'trafego_pago'
    when 'instagram' then 'organico'
    else 'outros'
  end,
  'Migrado do legado — revisar produto real.',
  'legado_vision_vendas', v.id, v.observacao, now(), v.criado_em
from public.legado_vision_vendas v
join public.legado_fontes f on f.id = v.fonte_id and f.nome = 'Fotos/Vídeos com IA'
left join public.legado_vision_clientes c on c.id = v.cliente_id
on conflict (id) do nothing;
