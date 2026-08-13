-- Faz o calculo de saldo respeitar a data_base da conta.
--
-- public.contas tem duas colunas que so fazem sentido juntas: saldo_inicial e
-- data_base. A semantica e "no fim do dia data_base a conta tinha
-- saldo_inicial". Mas patrimonio_saldos somava saldo_inicial a TODOS os
-- lancamentos da conta, inclusive os anteriores a data_base -- que ja estao
-- embutidos no proprio saldo_inicial. Resultado: o historico anterior a
-- migracao era contado duas vezes.
--
-- Foi por isso que a conta Inter acabou com saldo_inicial = -508,09: um valor
-- negativo digitado a mao para cancelar a duplicacao e fazer o saldo bater na
-- data em que foi calculado. Remendo que envelheceu mal.
--
-- Convencao adotada: saldo_inicial = saldo no FIM do dia data_base; contam
-- apenas lancamentos com data_pagamento estritamente POSTERIOR a data_base.
--
-- Impacto: recria a view public.patrimonio_saldos. As colunas seguem
--          identicas -- o app nao muda. Nenhum dado e alterado.
--          Binance: 2700,00 antes e depois (nao e afetada).
--          Inter: passa a depender da ancora corrigida na migration seguinte;
--          as duas devem ser aplicadas juntas.
-- Efeito colateral desejado: lancamentos ainda nao pagos (data_pagamento nula)
--          deixam de entrar no saldo. Antes um 'previsto' contava como dinheiro.
-- Risco: baixo -- e uma view, nao ha perda de dado.
-- Rollback: recriar a view sem os filtros de data_pagamento (versao de
--           20260718100026_views.sql).

create or replace view public.patrimonio_saldos
with (security_invoker = true) as
select
  c.id as conta_id,
  c.nome,
  c.saldo_inicial
    + coalesce((
        select sum(valor) from public.lancamentos_financeiros
        where conta_id = c.id and tipo = 'entrada'
          and data_pagamento > c.data_base
      ), 0)
    - coalesce((
        select sum(valor) from public.lancamentos_financeiros
        where conta_id = c.id and tipo = 'saida'
          and data_pagamento > c.data_base
      ), 0)
    - coalesce((
        select sum(valor) from public.lancamentos_financeiros
        where conta_id = c.id and tipo = 'transferencia'
          and data_pagamento > c.data_base
      ), 0)
    + coalesce((
        select sum(valor) from public.lancamentos_financeiros
        where conta_destino_id = c.id and tipo = 'transferencia'
          and data_pagamento > c.data_base
      ), 0)
    as saldo_calculado
from public.contas c
where c.ativa = true;

comment on column public.contas.saldo_inicial is
  'Saldo da conta no FIM do dia data_base. patrimonio_saldos soma a este valor '
  'apenas os lancamentos com data_pagamento posterior a data_base.';
