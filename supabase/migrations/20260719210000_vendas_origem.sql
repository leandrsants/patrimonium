-- Ao converter um lead em venda, a ORIGEM já existe no lead e deve ser
-- preservada na venda: além de canal_id/metodo_aquisicao/campanha_id, guarda-se
-- também a 'fonte' (canal textual da prospecção, ex.: "Instagram") e o
-- 'registro_prospeccao_id' (data/origem da prospecção). Aditivo e idempotente.

alter table public.vendas
  add column if not exists fonte text,
  add column if not exists registro_prospeccao_id uuid references public.registros_prospeccao (id) on delete set null;
