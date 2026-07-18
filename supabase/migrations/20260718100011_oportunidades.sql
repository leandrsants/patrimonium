-- Criada SEM a coluna venda_id: oportunidades <-> vendas formam um ciclo de
-- dependencia. venda_id e adicionada em 20260718100014, depois que
-- public.vendas existir.
create table public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  cliente_id uuid references public.clientes (id) on delete restrict,
  nome_contato text,
  telefone_contato text,
  servico_interesse_id uuid references public.produtos_servicos (id) on delete restrict,
  canal_id uuid references public.canais_aquisicao (id) on delete restrict,
  campanha_id uuid references public.campanhas (id) on delete restrict,
  estagio text not null,
  proxima_acao text,
  proxima_acao_data date,
  motivo_perda text,
  reaberto_em timestamptz,
  observacao text,
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index oportunidades_empresa_estagio_idx on public.oportunidades (empresa_id, estagio);

alter table public.oportunidades enable row level security;
revoke all on public.oportunidades from public;
revoke all on public.oportunidades from anon;
grant select, insert, update on public.oportunidades to authenticated;
