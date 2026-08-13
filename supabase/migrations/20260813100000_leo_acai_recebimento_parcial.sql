-- Corrige o recebimento da venda do Leo - Acai: pagou metade, nao o total.
--
-- A venda de 96,00 (16/07/2026) veio do legado com parcela unica marcada
-- 'paga' e lancamento de 96,00 'recebido'. O extrato do Inter mostra que
-- entraram apenas 48,00 nesse dia. O titular confirmou: a venda e de 96,00
-- mesmo, mas a segunda metade nunca foi paga -- e o unico recebivel em aberto
-- do periodo.
--
-- A venda NAO muda: 96,00 continua sendo o valor vendido. O que muda e quanto
-- entrou. O trigger trg_atualizar_status_parcela recalcula a parcela sozinho
-- (48 recebido < 96 devido => 'parcial'), fazendo os 48,00 pendentes
-- aparecerem em parcelas_situacao como saldo a receber.
--
-- Impacto: 1 linha de public.lancamentos_financeiros (valor 96 -> 48).
--          A parcela muda de 'paga' para 'parcial' por efeito do trigger.
--          Meta 10K: -48,00. Saldo da Inter: NAO muda (lancamento de 16/07 e
--          anterior a data_base 2026-08-12).
-- Risco: baixo -- nenhum registro e criado ou removido.
-- Rollback: update public.lancamentos_financeiros set valor = 96.00
--           where id = 'b2abd14d-8fad-45e6-92ef-345d2759504e';
--           (o trigger devolve a parcela para 'paga')

update public.lancamentos_financeiros
set valor = 48.00
where id = 'b2abd14d-8fad-45e6-92ef-345d2759504e'
  and valor = 96.00;
