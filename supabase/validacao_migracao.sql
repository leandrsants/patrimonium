-- ============================================================================
-- VALIDAÇÃO DA MIGRAÇÃO (SOMENTE LEITURA) — rodar APÓS aplicar, antes de trocar
-- o app. NÃO é migration (fica fora de migrations/). Compara legado × novo.
-- Cada linha deve bater com o esperado comentado.
-- ============================================================================

-- Clientes: novo == legado (66)
select 'clientes' as verificacao,
  (select count(*) from public.clientes where legado_tabela_origem = 'legado_vision_clientes') as novo,
  (select count(*) from public.legado_vision_clientes) as legado;  -- esperado 66 == 66

-- Vendas Vision: contagem e soma == legado (67 / 2483.90)
select 'vendas_vision' as verificacao,
  (select count(*) from public.vendas where legado_tabela_origem = 'legado_vision_vendas') as n_novo,
  (select coalesce(sum(valor_final),0) from public.vendas where legado_tabela_origem = 'legado_vision_vendas') as soma_novo,
  (select count(*) from public.legado_vision_vendas v join public.legado_fontes f on f.id=v.fonte_id where f.nome='Fotos/Vídeos com IA') as n_legado,
  (select coalesce(sum(v.valor),0) from public.legado_vision_vendas v join public.legado_fontes f on f.id=v.fonte_id where f.nome='Fotos/Vídeos com IA') as soma_legado;

-- Pagamentos: recebido empresarial Vision == soma das vendas migradas
select 'recebido_vision' as verificacao,
  (select coalesce(sum(valor),0) from public.lancamentos_financeiros
     where natureza='receita_empresarial' and status='recebido'
       and legado_tabela_origem='legado_vision_vendas') as recebido;  -- esperado 2483.90

-- Parcelas das vendas migradas devem estar 'paga' (trigger)
select 'parcelas_pagas' as verificacao,
  (select count(*) from public.parcelas where legado_tabela_origem='legado_vision_vendas' and status='paga') as pagas,
  (select count(*) from public.parcelas where legado_tabela_origem='legado_vision_vendas') as total;  -- devem ser iguais

-- Investimento/CAC: por empresa (Vision 974.89 / Digital Smile 49.92)
select 'investimento' as verificacao, e.nome,
  coalesce(sum(l.valor) filter (where l.entra_no_cac),0) as investimento
from public.empresas e
left join public.lancamentos_financeiros l on l.empresa_id=e.id
  and l.legado_tabela_origem='legado_vision_gastos_ads'
group by e.nome;

-- Extra Sonati: 1 lançamento receita_extra de 400, SEM empresa (não conta na meta)
select 'extra_sonati' as verificacao,
  count(*) as n, coalesce(sum(valor),0) as soma,
  count(*) filter (where empresa_id is not null) as com_empresa_deve_ser_zero
from public.lancamentos_financeiros where idempotency_key like 'legado-sonati-%';

-- Meta 10K: recebido (Vision+DS) entre 22/06 e 31/12, sem extras
select 'meta_10k' as verificacao, nome, valor_alvo, valor_confirmado
from public.meta_10k_progresso;

-- Pipeline -> oportunidades (16 na fonte Vision) e entregas (12)
select 'oportunidades' as verificacao,
  (select count(*) from public.oportunidades where legado_tabela_origem='legado_vision_pipeline') as novo;
select 'entregas' as verificacao,
  (select count(*) from public.entregas where legado_tabela_origem='legado_vision_entregas') as novo,
  (select count(*) from public.legado_vision_entregas) as legado;

-- Ciclos e vínculo da meta
select 'ciclos' as verificacao,
  (select count(*) from public.ciclos where legado_tabela_origem='legado_ciclos') as ciclos,
  (select count(*) from public.metas where ciclo_id is not null) as metas_vinculadas;

-- Legado preservado (deve continuar existindo)
select 'legado_preservado' as verificacao, string_agg(relname, ', ' order by relname) as tabelas
from pg_class where relkind in ('r','v') and relnamespace = 'public'::regnamespace
  and relname like 'legado\_%';
