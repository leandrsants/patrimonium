create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  telefone_normalizado text,
  email text,
  cpf_cnpj text,
  empresa_clinica_nome text,
  instagram text,
  drive_link text,
  observacao text,
  tipo_registro text not null default 'normal' check (tipo_registro in ('normal', 'legado_teste')),
  motivo_legado_teste text,
  ativo boolean not null default true,
  excluido_em timestamptz,
  legado_tabela_origem text,
  legado_id_origem uuid,
  migrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Normalização de telefone: remove símbolos, espaços e caracteres Unicode de
-- direção (LRM/RLM/etc.) encontrados nos dados legados, mantendo só dígitos.
create or replace function public.normalizar_telefone(telefone_bruto text)
returns text
language plpgsql
immutable
as $$
declare
  resultado text;
begin
  if telefone_bruto is null then
    return null;
  end if;

  resultado := regexp_replace(telefone_bruto, '[​‎‏‪-‮⁦-⁩؜]', '', 'g');
  resultado := regexp_replace(resultado, '\D', '', 'g');

  if resultado = '' then
    return null;
  end if;

  return resultado;
end;
$$;

create or replace function public.clientes_normalizar_telefone_trigger()
returns trigger
language plpgsql
as $$
begin
  new.telefone_normalizado := public.normalizar_telefone(new.telefone);
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger trg_clientes_normalizar_telefone
  before insert or update on public.clientes
  for each row execute function public.clientes_normalizar_telefone_trigger();

create index clientes_telefone_normalizado_idx on public.clientes (telefone_normalizado);
create index clientes_tipo_registro_idx on public.clientes (tipo_registro);

-- Unique parcial: só bloqueia duplicidade nova em clientes normais e ativos;
-- não afeta duplicados legado/teste nem registros excluídos logicamente.
create unique index clientes_telefone_normalizado_unico
  on public.clientes (telefone_normalizado)
  where tipo_registro = 'normal' and excluido_em is null and telefone_normalizado is not null;

alter table public.clientes enable row level security;
revoke all on public.clientes from public;
revoke all on public.clientes from anon;
grant select, insert, update on public.clientes to authenticated;
