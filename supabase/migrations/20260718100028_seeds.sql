-- Seeds aprovados: empresas, catalogo de produtos/servicos, categorias
-- financeiras, canais de aquisicao, Meta 10K. Nenhum valor financeiro
-- historico (vendas, gastos, saldo de conta) e semeado aqui.

insert into public.empresas (nome, slug, cor_tema) values
  ('Vision', 'vision', '#D4AF37'),
  ('Digital Smile', 'digital_smile', '#2E86DE');

insert into public.categorias_financeiras (nome, grupo, entra_no_cac) values
  ('Tráfego pago', 'empresarial', true),
  ('Ferramentas', 'empresarial', false),
  ('Assinaturas', 'empresarial', false),
  ('Magnific', 'empresarial', false),
  ('Domínio', 'empresarial', false),
  ('Hospedagem', 'empresarial', false),
  ('Freelancer', 'empresarial', false),
  ('Taxas', 'empresarial', false),
  ('Outros', 'empresarial', false),
  ('Alimentação', 'pessoal', false),
  ('Transporte', 'pessoal', false),
  ('Cinema e lazer', 'pessoal', false),
  ('Compras', 'pessoal', false),
  ('Saúde', 'pessoal', false),
  ('Assinaturas pessoais', 'pessoal', false),
  ('Outros (pessoal)', 'pessoal', false),
  ('Sonati/Sonate', 'extra', false),
  ('Trium/Trio', 'extra', false),
  ('Presentes', 'extra', false),
  ('Projetos por fora', 'extra', false),
  ('Outras entradas extras', 'extra', false);

insert into public.canais_aquisicao (nome) values
  ('Instagram'), ('WhatsApp'), ('Indicação'), ('Anúncio'), ('Google Maps'), ('Lista própria'), ('Outro');

-- Vision: produtos ativos
insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, preco_tabela, ativo)
select id, '5 fotos com IA', 'unico', 29.00, true from public.empresas where slug = 'vision';

insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, preco_tabela, ativo)
select id, '10 fotos com IA', 'unico', 49.00, true from public.empresas where slug = 'vision';

insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, ativo)
select id, 'Vídeo com IA', 'unico', true from public.empresas where slug = 'vision';

insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, ativo)
select id, 'Combo Fotos + Vídeo', 'unico', true from public.empresas where slug = 'vision';

insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, ativo)
select id, 'Site', 'unico', true from public.empresas where slug = 'vision';

-- Digital Smile: gestao de trafego pago ativa; Site e Google Meu Negocio inativos desde o inicio
insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, preco_tabela, preco_referencia, ativo)
select id, 'Gestão de Tráfego Pago', 'recorrente_mensal', 500.00, 1000.00, true from public.empresas where slug = 'digital_smile';

insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, ativo)
select id, 'Site', 'unico', false from public.empresas where slug = 'digital_smile';

insert into public.produtos_servicos (empresa_id, nome, tipo_cobranca, ativo)
select id, 'Google Meu Negócio', 'unico', false from public.empresas where slug = 'digital_smile';

insert into public.metas (nome, valor_alvo, data_inicio, data_fim, empresas_incluidas, inclui_extras, ativa)
select
  'Meta 10K 2026', 10000.00, '2026-06-22', '2026-12-31',
  jsonb_build_array(
    (select id from public.empresas where slug = 'vision'),
    (select id from public.empresas where slug = 'digital_smile')
  ),
  false, true;
