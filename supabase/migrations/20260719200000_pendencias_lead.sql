-- "Leads a identificar" — pendências de cadastro geradas pela Prospecção Ativa.
-- O registro agregado NÃO cria leads reais. Quando há eventos que merecem
-- acompanhamento (reunião agendada, proposta enviada, etc.), cria-se uma
-- PENDÊNCIA (placeholder sem nome), que o usuário completa depois no Comercial,
-- gerando aí sim uma oportunidade real. Evita leads falsos/incompletos na tabela
-- principal e mantém o vínculo com a origem (registro de prospecção + canal).

create table public.pendencias_lead (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  registro_prospeccao_id uuid references public.registros_prospeccao (id) on delete set null,
  tipo_evento text not null
    check (tipo_evento in ('follow_up', 'reuniao_agendada', 'reuniao_realizada', 'proposta_enviada')),
  canal text,
  data_origem date not null default current_date,
  status text not null default 'pendente'
    check (status in ('pendente', 'resolvida', 'dispensada')),
  oportunidade_id uuid references public.oportunidades (id) on delete set null,
  resolvida_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pendencias_lead_empresa_status_idx on public.pendencias_lead (empresa_id, status);

alter table public.pendencias_lead enable row level security;
revoke all on public.pendencias_lead from public;
revoke all on public.pendencias_lead from anon;
grant select, insert, update on public.pendencias_lead to authenticated;
grant select, insert, update on public.pendencias_lead to service_role;

create policy select_authenticated on public.pendencias_lead for select to authenticated using (true);
create policy insert_authenticated on public.pendencias_lead for insert to authenticated with check (true);
create policy update_authenticated on public.pendencias_lead for update to authenticated using (true) with check (true);

-- Vínculo da oportunidade real com o registro de prospecção que a originou.
alter table public.oportunidades
  add column if not exists registro_prospeccao_id uuid references public.registros_prospeccao (id) on delete set null;
