-- Corrige tres vendas cujo valor diverge do extrato do Inter.
--
-- Conciliacao do extrato de 22/06 a 12/08/2026 contra os lancamentos da conta
-- Inter. Nos tres casos o dinheiro que entrou no banco difere do registrado:
--
--   Marcelao   23/06   app 99,00  -> extrato 100,00 (50,00 + 50,00 em 23 e 25/06)
--   Ely Costa  23/06   app 80,00  -> extrato  78,00 (39,00 + 39,00 em 23 e 25/06)
--   Leticia    15/07   app 29,00  -> extrato  29,90
--
-- Diferente do caso do Leo - Acai, aqui o valor da venda em si estava errado --
-- o cliente pagou integralmente, so que outro valor. Por isso venda, parcela e
-- lancamento vao juntos, mantendo a parcela como 'paga'.
--
-- A ordem importa: valor_devido da parcela e atualizado antes do lancamento,
-- para o trigger trg_atualizar_status_parcela avaliar contra o valor correto.
--
-- Impacto: 3 vendas, 3 parcelas e 3 lancamentos; apenas colunas de valor.
--          Meta 10K: -1,10 no liquido (+1,00 -2,00 +0,90).
--          Saldo da Inter: NAO muda (todos anteriores a data_base 2026-08-12).
-- Risco: baixo -- nenhum registro e criado ou removido; valor_final segue >= 0.
-- Rollback: reverter os mesmos ids para 99.00, 80.00 e 29.00.

-- Marcelao: 99,00 -> 100,00
update public.parcelas set valor_devido = 100.00
  where id = 'c112cc0a-5f82-4c6d-8cfe-c624d5f0bd6c' and valor_devido = 99.00;
update public.vendas set valor_final = 100.00
  where id = 'd93260d2-b0a4-489d-b3de-27374918a273' and valor_final = 99.00;
update public.lancamentos_financeiros set valor = 100.00
  where id = '6c2352b0-a40a-44b1-9607-5022e8002c3d' and valor = 99.00;

-- Ely Costa: 80,00 -> 78,00
update public.parcelas set valor_devido = 78.00
  where id = 'b0d41114-1c97-4e8f-adf5-88fd6a8d3cda' and valor_devido = 80.00;
update public.vendas set valor_final = 78.00
  where id = '5ff7a809-a8b7-4b85-9d5c-1450f8d35e02' and valor_final = 80.00;
update public.lancamentos_financeiros set valor = 78.00
  where id = 'a702ed85-6711-4a20-9544-bd81b992414c' and valor = 80.00;

-- Leticia: 29,00 -> 29,90
update public.parcelas set valor_devido = 29.90
  where id = '54184da1-f43c-4540-a99a-e4b5cd9247eb' and valor_devido = 29.00;
update public.vendas set valor_final = 29.90
  where id = '3fc6e3ef-f495-443c-a66a-7e49a78e5ddf' and valor_final = 29.00;
update public.lancamentos_financeiros set valor = 29.90
  where id = 'ec0a3f0e-88fe-44f9-931d-78f8cabd1d70' and valor = 29.00;
