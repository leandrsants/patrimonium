-- Lanca a recarga de trafego pago da Vision de 13/08/2026 (50,00), paga pelo Inter.
--
-- Primeiro lancamento posterior a data_base da conta Inter (2026-08-12), entao
-- e o primeiro que efetivamente move o saldo calculado desde a ancoragem:
-- 2062,00 -> 2012,00. O extrato do Inter deve mostrar o mesmo valor.
--
-- Impacto: insere 1 linha em public.lancamentos_financeiros.
--          Saldo da Inter: 2062,00 -> 2012,00.
--          Gastos do ciclo: 488,81 -> 538,81. Lucro do ciclo: 1784,09 -> 1734,09.
--          CAC da Vision: +50,00 (entra_no_cac = true).
--          Meta 10K: NAO muda (2272,90) -- despesa nao afeta faturamento.
-- Risco: baixo. Protegido por idempotency_key contra duplicidade.
-- Rollback: delete from public.lancamentos_financeiros
--           where idempotency_key = 'ads-vision-2026-08-13-50';

insert into public.lancamentos_financeiros (
  tipo, natureza, empresa_id, categoria_id, conta_id, valor,
  data_competencia, data_pagamento, status, entra_no_cac,
  observacao, idempotency_key
)
select
  'saida', 'despesa_empresarial',
  (select id from public.empresas where nome = 'Vision'),
  (select id from public.categorias_financeiras where nome = 'Tráfego pago'),
  (select id from public.contas where nome = 'Inter'),
  50.00,
  '2026-08-13', '2026-08-13', 'pago', true,
  'Tráfego pago - Facebook Ads',
  'ads-vision-2026-08-13-50'
where not exists (
  select 1 from public.lancamentos_financeiros
  where idempotency_key = 'ads-vision-2026-08-13-50'
);
