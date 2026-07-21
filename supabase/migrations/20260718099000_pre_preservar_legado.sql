-- ============================================================================
-- PRÉ-MIGRAÇÃO — PRESERVAR 100% DO LEGADO (renomear, NUNCA apagar)
-- ----------------------------------------------------------------------------
-- Objetivo: liberar os nomes `clientes` e `vendas` para o schema novo do
-- Patrimonium e preservar todo o histórico do app anterior (Vision) em tabelas
-- `legado_*`, com os dados e as FKs internas intactos (o Postgres rastreia as
-- FKs por OID, então renomear a tabela referenciada não quebra nada).
--
-- RODA PRIMEIRO (timestamp anterior a 20260718100001) para que os
-- `create table clientes/vendas` das 43 migrations não colidam.
--
-- Impacto: apenas RENAME de tabelas/views. Nenhum dado é alterado ou removido.
-- Rollback: renomear de volta (legado_* -> nome original).
-- Idempotente: só renomeia se o alvo legado_* ainda não existir.
-- ============================================================================

do $$
begin
  if to_regclass('public.legado_vision_clientes')       is null and to_regclass('public.clientes')      is not null then alter table public.clientes      rename to legado_vision_clientes;       end if;
  if to_regclass('public.legado_vision_vendas')         is null and to_regclass('public.vendas')        is not null then alter table public.vendas        rename to legado_vision_vendas;         end if;
  if to_regclass('public.legado_vision_entregas')       is null and to_regclass('public.entregas')      is not null then alter table public.entregas      rename to legado_vision_entregas;       end if;
  if to_regclass('public.legado_vision_pipeline')       is null and to_regclass('public.pipeline')      is not null then alter table public.pipeline      rename to legado_vision_pipeline;       end if;
  if to_regclass('public.legado_vision_gastos_ads')     is null and to_regclass('public.gastos_ads')    is not null then alter table public.gastos_ads    rename to legado_vision_gastos_ads;     end if;
  if to_regclass('public.legado_vision_resumo_diario')  is null and to_regclass('public.resumo_diario') is not null then alter table public.resumo_diario rename to legado_vision_resumo_diario;  end if;
  if to_regclass('public.legado_fontes')                is null and to_regclass('public.fontes')        is not null then alter table public.fontes        rename to legado_fontes;                end if;
  if to_regclass('public.legado_ciclos')                is null and to_regclass('public.ciclos')        is not null then alter table public.ciclos        rename to legado_ciclos;                end if;
  if to_regclass('public.legado_conversas')             is null and to_regclass('public.conversas')     is not null then alter table public.conversas     rename to legado_conversas;             end if;
  if to_regclass('public.legado_mensagens')             is null and to_regclass('public.mensagens')     is not null then alter table public.mensagens     rename to legado_mensagens;             end if;
  if to_regclass('public.legado_pacotes')               is null and to_regclass('public.pacotes')       is not null then alter table public.pacotes       rename to legado_pacotes;               end if;
  -- push_subscriptions: mantém o nome (segue em uso).
end $$;
