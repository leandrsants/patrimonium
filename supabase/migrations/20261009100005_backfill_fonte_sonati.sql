-- Vincula os lancamentos historicos da categoria Sonati/Sonate a fonte Sonati.
--
-- O recebido de 01/10/2026 tambem e ligado a recorrencia mensal da Sonati
-- (competencia 2026-10-01), para que a geracao de previstos de outubro nao
-- crie um previsto duplicado de um valor que ja entrou.
--
-- Impacto: UPDATE de fonte_extra_id em 4 lancamentos (e da recorrencia em 1).
--          Nenhum valor, data ou status muda. Meta 10K e saldos nao mudam.
-- Risco: baixo.
-- Rollback: update lancamentos_financeiros set fonte_extra_id = null,
--           fonte_extra_recorrencia_id = null where fonte_extra_id = <Sonati>;

update public.lancamentos_financeiros l
set fonte_extra_id = f.id
from public.categorias_financeiras c, public.fontes_extras f
where l.categoria_id = c.id
  and c.nome = 'Sonati/Sonate'
  and f.nome = 'Sonati'
  and l.natureza = 'receita_extra'
  and l.fonte_extra_id is null;

update public.lancamentos_financeiros l
set fonte_extra_recorrencia_id = r.id,
    competencia_referencia = '2026-10-01'
from public.fontes_extras f
join public.fontes_extras_recorrencias r on r.fonte_id = f.id and r.dia_mes = 1
where f.nome = 'Sonati'
  and l.fonte_extra_id = f.id
  and l.status = 'recebido'
  and l.data_pagamento between '2026-10-01' and '2026-10-31'
  and l.fonte_extra_recorrencia_id is null
  and not exists (
    select 1 from public.lancamentos_financeiros x
    where x.fonte_extra_recorrencia_id = r.id and x.competencia_referencia = '2026-10-01'
  );
