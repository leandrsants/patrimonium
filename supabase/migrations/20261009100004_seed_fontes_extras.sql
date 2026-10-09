-- Cadastra as fontes extras e suas recorrencias iniciais (idempotente).
--
--   Sonati      fixa      R$ 600 no dia 1 (ultimo recebimento: 01/10/2026, R$ 600)
--   Danilo      fixa      R$ 1.000 no dia 15 + R$ 1.000 no dia 30 (Cosmus Digital)
--   Jiu-jitsu   variavel  sem recorrencia: dia do repasse e alunos sao
--                         cadastrados pela tela.
-- Conta padrao: Inter. Recorrencias a partir de 2026-10-01.
--
-- Impacto: 3 linhas em fontes_extras e 3 em fontes_extras_recorrencias.
-- Nenhum lancamento e criado aqui. Risco: baixo.
-- Rollback: update fontes_extras set status = 'encerrada' (nao apagar).

insert into public.fontes_extras (nome, contato, tipo, cor, conta_padrao_id, observacao)
select v.nome, v.contato, v.tipo, v.cor, (select id from public.contas where nome = 'Inter' limit 1), v.obs
from (values
  ('Sonati', null, 'fixa', '#b07fd0', 'Edicao de video (irmao).'),
  ('Danilo', 'Cosmus Digital', 'fixa', '#3fa37c', null),
  ('Jiu-jítsu', null, 'variavel', '#d08a3f', 'Aulas; repasse unico por Pix. Previsao = soma dos alunos ativos.')
) as v(nome, contato, tipo, cor, obs)
where not exists (select 1 from public.fontes_extras f where f.nome = v.nome);

insert into public.fontes_extras_recorrencias (fonte_id, descricao, valor, dia_mes, data_inicio)
select f.id, v.descricao, v.valor, v.dia, '2026-10-01'
from (values
  ('Sonati', 'Sonati — mensal', 600.00, 1),
  ('Danilo', 'Danilo — 1ª metade', 1000.00, 15),
  ('Danilo', 'Danilo — 2ª metade', 1000.00, 30)
) as v(fonte, descricao, valor, dia)
join public.fontes_extras f on f.nome = v.fonte
where not exists (
  select 1 from public.fontes_extras_recorrencias r
  where r.fonte_id = f.id and r.dia_mes = v.dia
);
