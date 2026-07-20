-- Prospecção Ativa vira CONTROLE DE NÚMEROS agregados: reuniões agendadas/
-- realizadas, no-shows, propostas e contratos passam a ser quantidades manuais
-- no próprio registro de prospecção (fonte de verdade de esforço e performance),
-- SEM exigir cadastro individual de cada lead. As colunas de reunião/proposta já
-- existem (reunioes_marcadas, reunioes_realizadas, no_shows, propostas_enviadas);
-- aqui só falta 'contratos'. O canal único da prospecção é gravado em 'fonte'.
-- Aditivo e idempotente — nenhuma coluna é removida (histórico preservado).

alter table public.registros_prospeccao
  add column if not exists contratos integer not null default 0 check (contratos >= 0);

-- Instagram do lead (para o cadastro rápido a partir da prospecção).
alter table public.oportunidades
  add column if not exists instagram text;
