-- Ancora a conta Inter num saldo conferido no extrato.
--
-- O saldo_inicial de -508,09 com data_base 2026-07-21 era um remendo: numero
-- negativo digitado a mao para cancelar a dupla contagem do historico legado
-- (ver 20260812210000). Nao corresponde a nenhum fato -- a conta foi criada
-- com saldo_inicial 0 pelo seed 20260720100005.
--
-- Troca por um valor real: 2062,00 e o saldo que o titular leu no extrato do
-- Inter em 2026-08-12, com todos os pagamentos ja recebidos, inclusive a
-- segunda metade do projeto do Adalberto.
--
-- Impacto: 1 linha de public.contas; muda saldo_inicial e data_base. Nenhum
--          lancamento e alterado, nenhuma venda e alterada. Como nao ha
--          lancamento com data_pagamento posterior a 2026-08-12, o saldo
--          calculado passa a ser exatamente 2062,00.
--          Meta 10K nao muda (2321,00) -- ela le lancamentos, nao saldo.
-- Observacao: os 141,00 de diferenca que existiam entre app e extrato ficam
--          absorvidos nesta ancora. Nao foi possivel identificar sua origem
--          nos 107 lancamentos da conta; o titular confirmou que se tratava de
--          gastos nao registrados, nao de venda. Se algum pedaco era receita da
--          Vision, ela segue fora da Meta 10K.
-- Risco: baixo.
-- Rollback: update public.contas set saldo_inicial = -508.09,
--           data_base = '2026-07-21' where nome = 'Inter';

update public.contas
set saldo_inicial = 2062.00,
    data_base = '2026-08-12'
where nome = 'Inter';
