-- Metas de prospecção configuráveis (não hardcoded). Versão funcional simples:
-- meta diária por chave (canal/ação). Escala/agenda por dia da semana fica para
-- uma iteração futura.
create table public.metas_prospeccao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  chave text not null,
  meta_diaria integer not null default 0 check (meta_diaria >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empresa_id, chave)
);

alter table public.metas_prospeccao enable row level security;
revoke all on public.metas_prospeccao from public;
revoke all on public.metas_prospeccao from anon;
grant select, insert, update on public.metas_prospeccao to authenticated;
grant select, insert, update on public.metas_prospeccao to service_role;

create policy select_authenticated on public.metas_prospeccao for select to authenticated using (true);
create policy insert_authenticated on public.metas_prospeccao for insert to authenticated with check (true);
create policy update_authenticated on public.metas_prospeccao for update to authenticated using (true) with check (true);

-- Seed inicial Digital Smile: Instagram 50, WhatsApp 25, Ligações 10.
do $$
declare v_ds uuid;
begin
  select id into v_ds from public.empresas where slug = 'digital_smile';
  if v_ds is not null then
    insert into public.metas_prospeccao (empresa_id, chave, meta_diaria) values
      (v_ds, 'acoes_instagram', 50),
      (v_ds, 'acoes_whatsapp', 25),
      (v_ds, 'acoes_ligacao', 10)
    on conflict (empresa_id, chave) do nothing;
  end if;
end $$;
