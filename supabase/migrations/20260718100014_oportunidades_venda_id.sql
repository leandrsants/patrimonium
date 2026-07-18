-- Fecha o ciclo oportunidades <-> vendas.
alter table public.oportunidades
  add column venda_id uuid references public.vendas (id) on delete restrict;

create index oportunidades_venda_idx on public.oportunidades (venda_id);
