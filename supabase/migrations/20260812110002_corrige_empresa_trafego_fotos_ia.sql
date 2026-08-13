-- Corrige a empresa de uma despesa de trafego pago lancada na Digital Smile.
--
-- O lancamento de 49,92 em 07/07/2026 ("Trafego pago - fotos com IA") esta com
-- empresa_id = Digital Smile e entra_no_cac = true. "Foto com IA" e produto da
-- Vision -- as outras cinco recargas de trafego da mesma conta estao todas na
-- Vision. Com a empresa errada, o CAC da Digital Smile fica inflado em 49,92 e
-- o da Vision, subestimado no mesmo valor.
--
-- Impacto: 1 linha de public.lancamentos_financeiros; muda apenas empresa_id.
--          Valor, conta, data e status ficam intactos -- o saldo do Caixa NAO
--          muda. Afeta cac_por_empresa e o rateio de despesa por empresa.
-- Risco: baixo -- nao cria nem remove registro.
-- Rollback: update public.lancamentos_financeiros
--           set empresa_id = (select id from public.empresas where nome = 'Digital Smile')
--           where id = '13973ae2-af9c-4cbe-980d-9582332e3bb2';

update public.lancamentos_financeiros
set empresa_id = (select id from public.empresas where nome = 'Vision')
where id = '13973ae2-af9c-4cbe-980d-9582332e3bb2'
  and empresa_id = (select id from public.empresas where nome = 'Digital Smile');
