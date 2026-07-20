-- Produtos educacionais futuros (mentoria, curso, comunidade) para ambas as
-- empresas. Ficam INATIVOS por padrão -- não poluem a operação -- mas existem
-- no catálogo para poder ser ativados no futuro sem alterar código nem schema.
-- Idempotente: só insere se ainda não existir a linha (empresa_id, nome).

do $$
declare
  v_empresa record;
  v_produtos text[] := array['Mentoria individual', 'Curso gravado', 'Comunidade'];
  v_nome text;
begin
  for v_empresa in select id from public.empresas loop
    foreach v_nome in array v_produtos loop
      if not exists (
        select 1 from public.produtos_servicos
        where empresa_id = v_empresa.id and nome = v_nome
      ) then
        insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, ativo, ordem)
        values (
          v_empresa.id,
          v_nome,
          case when v_nome = 'Comunidade' then 'recorrente_mensal' else 'unico' end,
          false,
          100
        );
      end if;
    end loop;
  end loop;
end $$;
