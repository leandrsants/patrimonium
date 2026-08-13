-- Permite registrar exclusao fisica de registro na auditoria.
--
-- Ate aqui 'acao' so aceitava 'delete_logico' (cancelamento, o registro
-- continua na tabela). A exclusao definitiva de um lancamento lancado por
-- engano (duplicidade, valor errado) e um evento diferente e precisa de rotulo
-- proprio -- caso contrario o unico rastro da linha apagada some junto com ela.
--
-- Impacto: apenas troca a CHECK constraint de public.auditoria.
-- Risco: baixo -- amplia o dominio aceito, nao invalida nenhuma linha existente.
-- Rollback: recriar a constraint sem 'delete_fisico' (so e possivel se nenhuma
--           linha ja tiver sido gravada com esse valor).

alter table public.auditoria
  drop constraint if exists auditoria_acao_check;

alter table public.auditoria
  add constraint auditoria_acao_check
  check (acao in ('insert', 'update', 'delete_logico', 'delete_fisico', 'estorno'));

comment on column public.auditoria.acao is
  'delete_logico = status trocado para cancelado (linha preservada). '
  'delete_fisico = linha removida da tabela; dados_antes guarda o registro inteiro.';
