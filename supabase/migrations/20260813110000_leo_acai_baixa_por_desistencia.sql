-- Da baixa nos 48,00 em aberto do Leo - Acai: cliente desistiu do projeto.
--
-- A venda de 96,00 (16/07/2026) teve so a primeira metade paga (ver
-- 20260813100000). O titular confirmou que o cliente desistiu e nao vai pagar
-- o restante, entao o recebivel deixa de ser cobranca e vira perda.
--
-- A venda NAO e cancelada: ela aconteceu, e os 48,00 recebidos sao faturamento
-- legitimo. O que muda e a expectativa de receber o resto. A parcela vai para
-- 'cancelada', que e o estado previsto no schema para recebivel baixado --
-- recalcular_status_parcela ignora parcelas canceladas, entao o status nao
-- volta sozinho.
--
-- Impacto: 1 linha de public.parcelas (status) e a observacao da venda.
--          Leo - Acai sai da lista de inadimplencia.
--          Meta 10K: NAO muda (2272,90) -- ela conta o que foi recebido, e os
--          48,00 recebidos continuam la.
--          Saldo da Inter: NAO muda (2062,00).
-- Risco: baixo -- nenhum registro e criado ou removido.
-- Rollback: update public.parcelas set status = 'parcial'
--           where id = 'cbf4740f-f331-446c-a2f5-b3b314bdf0db';

update public.parcelas
set status = 'cancelada'
where id = 'cbf4740f-f331-446c-a2f5-b3b314bdf0db'
  and status = 'parcial';

update public.vendas
set observacao = coalesce(observacao || ' | ', '')
  || 'Cliente desistiu do projeto em 2026-08. Recebeu 48,00 de 96,00; '
  || 'os 48,00 restantes foram baixados como perda.'
where id = '9a118558-854f-4346-b65f-61a15a44c998'
  and (observacao is null or observacao not like '%baixados como perda%');
