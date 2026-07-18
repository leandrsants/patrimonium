-- Policies funcionais para 'authenticated'. RLS ja estava habilitado e
-- fechado desde a migration de criacao de cada tabela (fail-closed) --
-- estas policies so adicionam acesso, nunca abrem o que estava fechado
-- sem regra. 'anon' continua sem grant e sem policy nenhuma.

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
    execute format('create policy select_authenticated on public.%I for select to authenticated using (true)', t);
    execute format('create policy insert_authenticated on public.%I for insert to authenticated with check (true)', t);
    execute format('create policy update_authenticated on public.%I for update to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;

-- auditoria: somente select/insert (tabela de acrescimo, sem update/delete concedido).
create policy select_authenticated on public.auditoria for select to authenticated using (true);
create policy insert_authenticated on public.auditoria for insert to authenticated with check (true);
