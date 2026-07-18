create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  produto_id uuid not null references public.produtos_servicos (id) on delete restrict,
  cliente_id uuid references public.clientes (id) on delete restrict,
  oportunidade_id uuid references public.oportunidades (id) on delete restrict,
  quantidade integer not null default 1,
  preco_tabela numeric(10, 2),
  desconto_valor numeric(10, 2) not null default 0,
  desconto_motivo text,
  valor_final numeric(10, 2) not null check (valor_final >= 0),
  data_venda date not null default current_date,
  condicao_pagamento jsonb,
  canal_id uuid references public.canais_aquisicao (id) on delete restrict,
  campanha_id uuid references public.campanhas (id) on delete restrict,
  status text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  status_entrega text check (
    status_entrega in ('aguardando_pagamento', 'aguardando_material', 'em_producao', 'aguardando_aprovacao', 'entregue', 'finalizado')
  ),
  checklist_entrega jsonb,
  drive_link text,
  observacao text,
  legado_tabela_origem text,
  legado_id_origem uuid,
  legado_observacao_original text,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column public.vendas.condicao_pagamento is
  'Snapshot descritivo da negociacao. NUNCA e fonte de verdade financeira -- isso e sempre parcelas + lancamentos_financeiros.';

create index vendas_empresa_data_idx on public.vendas (empresa_id, data_venda);
create index vendas_cliente_idx on public.vendas (cliente_id);
create index vendas_produto_idx on public.vendas (produto_id);

alter table public.vendas enable row level security;
revoke all on public.vendas from public;
revoke all on public.vendas from anon;
grant select, insert, update on public.vendas to authenticated;
