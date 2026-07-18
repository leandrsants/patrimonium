create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  produto_id uuid not null references public.produtos_servicos (id) on delete restrict,
  oportunidade_id uuid references public.oportunidades (id) on delete restrict,
  venda_origem_id uuid references public.vendas (id) on delete restrict,
  valor_mensal numeric(10, 2) not null,
  preco_referencia numeric(10, 2),
  dia_vencimento integer not null check (dia_vencimento between 1 and 31),
  data_inicio date not null default current_date,
  status text not null default 'onboarding' check (
    status in ('onboarding', 'ativo', 'pagamento_pendente', 'inadimplente', 'em_risco', 'pausado', 'cancelado', 'finalizado')
  ),
  proxima_data_cobranca date not null,
  data_cancelamento date,
  motivo_cancelamento text,
  contrato_necessario boolean not null default true,
  contrato_enviado boolean not null default false,
  contrato_assinado boolean not null default false,
  data_assinatura_contrato date,
  contrato_drive_link text,
  checklist_onboarding jsonb,
  checklist_entrega_trafego jsonb,
  verba_anuncios_dentista_estimada numeric(10, 2),
  canal_id uuid references public.canais_aquisicao (id) on delete restrict,
  campanha_id uuid references public.campanhas (id) on delete restrict,
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column public.assinaturas.verba_anuncios_dentista_estimada is
  'Informativo apenas. Nunca gera lancamentos_financeiros.';

-- Impede duas assinaturas ativas do mesmo servico para o mesmo cliente.
create unique index assinaturas_cliente_produto_ativo_unico
  on public.assinaturas (cliente_id, produto_id)
  where status not in ('cancelado', 'finalizado');

create index assinaturas_proxima_cobranca_idx on public.assinaturas (proxima_data_cobranca);

alter table public.assinaturas enable row level security;
revoke all on public.assinaturas from public;
revoke all on public.assinaturas from anon;
grant select, insert, update on public.assinaturas to authenticated;
