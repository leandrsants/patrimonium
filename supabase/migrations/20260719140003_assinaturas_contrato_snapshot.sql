-- Snapshot de contratação: desconto, motivo, reajuste e CAC atribuído ao cliente.
-- preco_referencia (já existe) guarda a referência na contratação; alterar o
-- preço do produto depois não muda contratos históricos.
alter table public.assinaturas
  add column if not exists desconto_valor numeric(10, 2) not null default 0,
  add column if not exists motivo_desconto text,
  add column if not exists data_reajuste date,
  add column if not exists cac_atribuido numeric(10, 2),
  add column if not exists prazo_meses integer,
  add column if not exists metodo_aquisicao text,
  add column if not exists campanha_contratacao text;

alter table public.assinaturas
  drop constraint if exists assinaturas_metodo_chk,
  add constraint assinaturas_metodo_chk
  check (metodo_aquisicao is null or metodo_aquisicao in ('prospeccao_ativa', 'trafego_pago', 'organico', 'indicacao', 'outros'));
