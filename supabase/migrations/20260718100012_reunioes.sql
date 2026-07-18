create table public.reunioes (
  id uuid primary key default gen_random_uuid(),
  oportunidade_id uuid not null references public.oportunidades (id) on delete restrict,
  data date not null,
  horario time,
  status text not null check (status in ('agendada', 'realizada', 'no_show', 'cancelada')),
  observacao text,
  criado_em timestamptz not null default now()
);

alter table public.reunioes enable row level security;
revoke all on public.reunioes from public;
revoke all on public.reunioes from anon;
grant select, insert, update on public.reunioes to authenticated;
