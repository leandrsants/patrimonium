-- Baixa a venda do Leo - Acai de 96,00 para 48,00 (o que foi efetivamente pago).
--
-- Historico: a venda veio do legado como 96,00 com parcela unica 'paga' e
-- lancamento integral. O extrato mostrou que so entraram 48,00 (16/07). Em
-- 20260813100000 a parcela virou 'parcial' e em 20260813110000 foi cancelada
-- como perda, porque o cliente desistiu.
--
-- Depois que o grafico do painel passou a calcular lucro por competencia
-- (faturamento - despesas), esses 48,00 nao recebidos passaram a aparecer como
-- lucro de julho. O tratamento contabil correto seria lancar a perda como
-- despesa; o titular preferiu simplesmente reduzir a venda, por ser caso raro.
--
-- A venda cai para 48,00 e a parcela volta a 'paga' — vendido 48, recebido 48,
-- sem residuo. O que foi vendido originalmente fica registrado na observacao,
-- ja que o valor deixa de contar essa historia.
--
-- Impacto: 1 venda (valor_final 96 -> 48), 1 parcela (valor_devido 96 -> 48,
--          status cancelada -> paga) e a observacao da venda.
--          Faturamento de julho: 914,90 -> 866,90.
--          Lucro de julho no grafico: 566,09 -> 518,09.
--          Meta 10K: NAO muda (2272,90) — conta recebido, e o recebido segue 48.
--          Saldo da Inter: NAO muda (2062,00 menos a despesa de 13/08).
--          Contas a receber: seguem zeradas.
-- Risco: baixo — nenhum registro e criado ou removido; o lancamento de 48,00
--        nao e tocado.
-- Rollback: valor_final/valor_devido de volta para 96.00 e parcela para
--           'cancelada'.

update public.parcelas
set valor_devido = 48.00,
    status = 'paga'
where id = 'cbf4740f-f331-446c-a2f5-b3b314bdf0db'
  and valor_devido = 96.00;

update public.vendas
set valor_final = 48.00,
    observacao = 'Venda fechada por 96,00; cliente desistiu apos pagar a '
      || 'primeira metade. Valor reduzido para 48,00 (o efetivamente pago) em '
      || '2026-08-14, em vez de registrar perda por inadimplencia.'
where id = '9a118558-854f-4346-b65f-61a15a44c998'
  and valor_final = 96.00;
