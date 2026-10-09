-- Ancora a conta Binance num saldo conferido pelo titular.
--
-- A Binance estava com saldo_inicial = 950,00 e data_base 2026-07-21, mais um
-- lancamento de entrada de 1750,00 em 2026-08-09 (categoria 'Presentes',
-- grupo extra, conta_na_meta = false). Saldo calculado: 2700,00.
--
-- O titular informou que gastou a reserva e que o saldo real hoje e 148,00.
-- Nao ha extrato lancamento a lancamento dessas saidas, entao a correcao segue
-- o mesmo padrao da ancora do Inter (20260812210001): fixa saldo_inicial no
-- valor conferido e move data_base para a data da conferencia, em vez de
-- inventar uma despesa de 2552,00 que sujaria o lucro do periodo.
--
-- Impacto: 1 linha de public.contas; muda saldo_inicial e data_base.
--          Nenhum lancamento e alterado ou apagado. O credito de 1750,00 de
--          09/08 continua no historico, apenas deixa de somar no saldo por ser
--          anterior a nova data_base (convencao de 20260812210000).
--          Patrimonio: Binance passa de 2700,00 para 148,00 (-2552,00).
--          Meta 10K nao muda -- a categoria 'Presentes' tem conta_na_meta
--          false e a meta le lancamentos, nao saldo.
--          Dashboard (faturamento, despesas, lucro) nao muda -- nenhuma
--          despesa e criada.
-- Risco: baixo.
-- Rollback: update public.contas set saldo_inicial = 950.00,
--           data_base = '2026-07-21' where nome = 'Binance';

update public.contas
set saldo_inicial = 148.00,
    data_base = '2026-09-02'
where nome = 'Binance';
