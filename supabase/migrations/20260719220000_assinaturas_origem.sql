-- Assinatura (contrato) também preserva a origem quando nasce da conversão de um
-- lead: 'fonte' (canal textual da prospecção) e 'registro_prospeccao_id'
-- (data/origem). canal_id/campanha_id/metodo_aquisicao já existem. Aditivo.

alter table public.assinaturas
  add column if not exists fonte text,
  add column if not exists registro_prospeccao_id uuid references public.registros_prospeccao (id) on delete set null;
