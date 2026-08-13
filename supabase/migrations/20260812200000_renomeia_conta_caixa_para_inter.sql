-- Renomeia a conta "Caixa" para "Inter".
--
-- A conta representa a conta do banco Inter, onde entram os pagamentos da
-- Vision e da Sonati. O nome "Caixa" vinha do seed de apoio a migracao
-- (20260720100005) e confundia leitura: sugeria dinheiro em especie.
--
-- Impacto: 1 linha de public.contas; muda apenas a coluna nome. Nenhum
--          lancamento e alterado e o saldo NAO muda (segue 1921,00).
--          Nada em src/ referencia a conta pelo nome -- so migrations ja
--          aplicadas, que resolvem por id em tempo de execucao.
-- Risco: baixo.
-- Rollback: update public.contas set nome = 'Caixa' where nome = 'Inter';

update public.contas
set nome = 'Inter'
where nome = 'Caixa';
