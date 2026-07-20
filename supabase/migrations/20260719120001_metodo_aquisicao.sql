-- Método de aquisição é uma dimensão SEPARADA do canal.
-- Canal = onde (Instagram, WhatsApp, Google Maps...).
-- Método = como (prospecção ativa, tráfego pago, orgânico, indicação, outros).
-- Adicionado a oportunidades (lead), vendas (atribuição do cliente/venda) e
-- lancamentos_financeiros (atribuir gasto de aquisição a um método -> CAC por método).

do $$
begin
  alter table public.oportunidades add column if not exists metodo_aquisicao text;
  alter table public.vendas add column if not exists metodo_aquisicao text;
  alter table public.lancamentos_financeiros add column if not exists metodo_aquisicao text;
end $$;

alter table public.oportunidades
  drop constraint if exists oportunidades_metodo_chk,
  add constraint oportunidades_metodo_chk
  check (metodo_aquisicao is null or metodo_aquisicao in ('prospeccao_ativa', 'trafego_pago', 'organico', 'indicacao', 'outros'));

alter table public.vendas
  drop constraint if exists vendas_metodo_chk,
  add constraint vendas_metodo_chk
  check (metodo_aquisicao is null or metodo_aquisicao in ('prospeccao_ativa', 'trafego_pago', 'organico', 'indicacao', 'outros'));

alter table public.lancamentos_financeiros
  drop constraint if exists lancamentos_metodo_chk,
  add constraint lancamentos_metodo_chk
  check (metodo_aquisicao is null or metodo_aquisicao in ('prospeccao_ativa', 'trafego_pago', 'organico', 'indicacao', 'outros'));

create index if not exists vendas_metodo_idx on public.vendas (metodo_aquisicao);
create index if not exists lancamentos_metodo_idx on public.lancamentos_financeiros (metodo_aquisicao);
