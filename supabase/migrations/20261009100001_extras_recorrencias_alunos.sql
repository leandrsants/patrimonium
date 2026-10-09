-- Recorrencias de pagamento por fonte extra e alunos do Jiu-jitsu.
--
-- fontes_extras_recorrencias: uma linha por pagamento esperado no mes
--   (Danilo = 2 linhas: dia 15 e dia 30). Para fonte 'variavel' o valor da
--   linha e ignorado na geracao: vale a soma das mensalidades dos alunos
--   ativos (repasse unico por Pix no dia_mes).
-- alunos_jiujitsu: cadastro simples; base da previsao mensal.
--
-- Impacto: duas tabelas novas, aditivas. Risco: baixo.
-- Rollback: tabelas podem ser ignoradas (nao apagar em producao).

create table if not exists public.fontes_extras_recorrencias (
  id uuid primary key default gen_random_uuid(),
  fonte_id uuid not null references public.fontes_extras (id) on delete restrict,
  descricao text,
  valor numeric(10, 2) not null default 0 check (valor >= 0),
  dia_mes integer not null check (dia_mes between 1 and 31),
  data_inicio date not null default date_trunc('month', current_date)::date,
  data_fim date,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (data_fim is null or data_fim >= data_inicio)
);

create index if not exists fontes_extras_recorrencias_fonte_idx on public.fontes_extras_recorrencias (fonte_id);

create table if not exists public.alunos_jiujitsu (
  id uuid primary key default gen_random_uuid(),
  fonte_id uuid not null references public.fontes_extras (id) on delete restrict,
  nome text not null,
  mensalidade numeric(10, 2) not null check (mensalidade >= 0),
  data_entrada date not null default current_date,
  data_saida date,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (data_saida is null or data_saida >= data_entrada)
);

create index if not exists alunos_jiujitsu_fonte_idx on public.alunos_jiujitsu (fonte_id);

do $$
declare
  t text;
begin
  foreach t in array array['fontes_extras_recorrencias', 'alunos_jiujitsu']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
    execute format('drop policy if exists select_authenticated on public.%I', t);
    execute format('drop policy if exists insert_authenticated on public.%I', t);
    execute format('drop policy if exists update_authenticated on public.%I', t);
    execute format('create policy select_authenticated on public.%I for select to authenticated using (true)', t);
    execute format('create policy insert_authenticated on public.%I for insert to authenticated with check (true)', t);
    execute format('create policy update_authenticated on public.%I for update to authenticated using (true) with check (true)', t);
  end loop;
end;
$$;
