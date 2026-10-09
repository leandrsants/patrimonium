-- Liga lancamentos de receita extra a uma fonte e (opcionalmente) a uma
-- recorrencia da fonte.
--
-- O indice unico (recorrencia, competencia) garante que gerar os previstos
-- do mes duas vezes nunca duplica lancamento.
--
-- Impacto: duas colunas novas, nulas; nenhum valor existente muda.
-- Risco: baixo. A CHECK so restringe linhas que preencham fonte_extra_id.
-- Rollback: colunas podem ser ignoradas.

alter table public.lancamentos_financeiros
  add column if not exists fonte_extra_id uuid references public.fontes_extras (id) on delete restrict,
  add column if not exists fonte_extra_recorrencia_id uuid references public.fontes_extras_recorrencias (id) on delete restrict;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lancamentos_fonte_extra_so_receita_extra'
  ) then
    alter table public.lancamentos_financeiros
      add constraint lancamentos_fonte_extra_so_receita_extra
      check (fonte_extra_id is null or natureza = 'receita_extra');
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'lancamentos_recorrencia_extra_exige_fonte'
  ) then
    alter table public.lancamentos_financeiros
      add constraint lancamentos_recorrencia_extra_exige_fonte
      check (fonte_extra_recorrencia_id is null or (fonte_extra_id is not null and competencia_referencia is not null));
  end if;
end;
$$;

create unique index if not exists lancamentos_recorrencia_extra_competencia_unica
  on public.lancamentos_financeiros (fonte_extra_recorrencia_id, competencia_referencia)
  where fonte_extra_recorrencia_id is not null;

create index if not exists lancamentos_fonte_extra_idx on public.lancamentos_financeiros (fonte_extra_id);
