-- Separa NOVOS LEADS PROSPECTADOS de AÇÕES COMERCIAIS (ex.: 1 dentista com msg
-- Instagram + WhatsApp + ligação = 1 prospectado, 3 ações). Ações por canal.
alter table public.registros_prospeccao
  add column if not exists novos_prospectados integer not null default 0 check (novos_prospectados >= 0),
  add column if not exists acoes_instagram integer not null default 0 check (acoes_instagram >= 0),
  add column if not exists acoes_whatsapp integer not null default 0 check (acoes_whatsapp >= 0),
  add column if not exists acoes_ligacao integer not null default 0 check (acoes_ligacao >= 0),
  add column if not exists acoes_outras integer not null default 0 check (acoes_outras >= 0),
  add column if not exists respostas_positivas integer not null default 0 check (respostas_positivas >= 0);
