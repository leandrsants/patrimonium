-- Convite para reunião com resultado (evento distinto de proposta).
alter table public.oportunidades add column if not exists convite_reuniao_resultado text;
alter table public.oportunidades
  drop constraint if exists oportunidades_convite_resultado_chk,
  add constraint oportunidades_convite_resultado_chk
  check (convite_reuniao_resultado is null or convite_reuniao_resultado in ('aguardando', 'aceitou', 'recusou'));

-- Diagnóstico realizado na reunião (opcional).
alter table public.reunioes add column if not exists diagnostico_realizado boolean not null default false;
