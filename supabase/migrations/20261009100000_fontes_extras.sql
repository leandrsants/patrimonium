-- Fontes de renda extra (Sonati, Danilo/Cosmus Digital, Jiu-jitsu...).
--
-- Ate aqui "extra" era so uma categoria solta. A fonte passa a ser entidade
-- propria: nome identificavel no app inteiro, tipo (fixa/variavel), cor,
-- status e conta padrao onde o dinheiro cai.
--
-- Impacto: tabela nova, aditiva. Nenhum dado existente e alterado.
-- Risco: baixo.
-- Rollback: a tabela pode ser ignorada (nao apagar em producao).

create table if not exists public.fontes_extras (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  contato text,
  tipo text not null default 'fixa' check (tipo in ('fixa', 'variavel')),
  cor text not null default '#8a919c',
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'encerrada')),
  observacao text,
  conta_padrao_id uuid references public.contas (id) on delete restrict,
  conta_na_meta boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column public.fontes_extras.conta_na_meta is
  'true = recebimentos desta fonte entram na Meta 10K e no faturamento total. Nunca no CAC.';

alter table public.fontes_extras enable row level security;
revoke all on public.fontes_extras from public;
revoke all on public.fontes_extras from anon;
grant select, insert, update on public.fontes_extras to authenticated;
grant select, insert, update on public.fontes_extras to service_role;

drop policy if exists select_authenticated on public.fontes_extras;
drop policy if exists insert_authenticated on public.fontes_extras;
drop policy if exists update_authenticated on public.fontes_extras;
create policy select_authenticated on public.fontes_extras for select to authenticated using (true);
create policy insert_authenticated on public.fontes_extras for insert to authenticated with check (true);
create policy update_authenticated on public.fontes_extras for update to authenticated using (true) with check (true);
