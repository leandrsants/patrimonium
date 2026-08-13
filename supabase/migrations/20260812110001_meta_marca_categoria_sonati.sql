-- Marca a categoria Sonati/Sonate como contavel na Meta 10K.
--
-- A Sonati e trabalho contratado por fora: nao e empresa, nao tem CAC e pode
-- encerrar a qualquer momento -- por isso segue como receita_extra e fora do
-- faturamento de Vision e Digital Smile. Mas ela foi contada no plano de bater
-- 10k em 2026, entao precisa aparecer no progresso da meta.
--
-- Impacto: 1 linha de public.categorias_financeiras. Nenhum lancamento e
--          alterado. Efeito pratico: as receitas extras dessa categoria dentro
--          da janela da meta passam a somar em valor_confirmado.
-- Risco: baixo -- reversivel com um update.
-- Rollback: update public.categorias_financeiras set conta_na_meta = false
--           where nome = 'Sonati/Sonate';
--           (usar tambem no dia em que a Sonati encerrar)

update public.categorias_financeiras
set conta_na_meta = true
where nome = 'Sonati/Sonate'
  and conta_na_meta is distinct from true;
