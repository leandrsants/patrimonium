-- Corrigido durante a implementacao do frontend: service_role tem
-- rolbypassrls=true (ignora RLS), mas isso NAO substitui os GRANTs de
-- tabela -- sem GRANT explicito, service_role nao consegue nem SELECT.
-- As migrations anteriores so concediam privilegios a authenticated;
-- service_role precisa dos mesmos privilegios para as rotinas internas
-- controladas (triggers de auditoria, geracao de competencia, leitura
-- server-side), conforme ja previsto na secao de seguranca da proposta.

do $$
declare
  t text;
begin
  foreach t in array array[
    'empresas', 'produtos_servicos', 'categorias_financeiras', 'canais_aquisicao', 'campanhas', 'contas', 'cartoes',
    'clientes', 'candidatos_duplicidade_cliente', 'oportunidades', 'reunioes', 'vendas', 'parcelas', 'assinaturas',
    'lancamentos_financeiros', 'compras_cartao', 'despesas_recorrentes', 'metas', 'fechamentos_mensais',
    'revisoes_migracao'
  ]
  loop
    execute format('grant select, insert, update on public.%I to service_role', t);
  end loop;
end;
$$;

-- auditoria: mesmo padrao reduzido usado para authenticated (sem update/delete).
grant select, insert on public.auditoria to service_role;

grant select on public.parcelas_situacao to service_role;
grant select on public.vendas_resumo_financeiro to service_role;
grant select on public.assinaturas_situacao to service_role;
grant select on public.inadimplencia_resumo to service_role;
grant select on public.meta_10k_progresso to service_role;
grant select on public.patrimonio_saldos to service_role;
grant select on public.cac_por_empresa to service_role;
