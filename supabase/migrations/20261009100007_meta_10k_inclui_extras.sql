-- Meta 10K passa a incluir as fontes extras (Sonati, Danilo, Jiu-jítsu).
-- O cálculo já vem da view meta_10k_progresso (20261009100006); aqui só
-- alinhamos o flag informativo. Idempotente: não toca se já estiver true.
-- Rollback: update public.metas set inclui_extras = false where nome = 'Meta 10K 2026';

update public.metas
set inclui_extras = true
where nome = 'Meta 10K 2026'
  and inclui_extras is distinct from true;
