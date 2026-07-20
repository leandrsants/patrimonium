-- Fonte dos contatos (ONDE encontrei) — separada do canal de contato (COMO
-- abordei, que já está nas ações IG/WA/ligação). Ex.: Fonte = Google Maps,
-- ações = 15 WhatsApp + 5 ligações.
alter table public.registros_prospeccao add column if not exists fonte text;

-- Convite para reunião (evento distinto de proposta comercial). Marca quando o
-- convite foi feito, para derivar a taxa de agendamento.
alter table public.oportunidades add column if not exists convite_reuniao_em timestamptz;
alter table public.oportunidades add column if not exists fonte text;

-- Campos antigos de resultado no registro agregado (reunioes_*, no_shows,
-- propostas_enviadas, orcamentos, contatos_feitos, leads_encontrados) permanecem
-- no schema para compatibilidade, mas deixam de ser preenchidos pelo formulário
-- de prospecção — esses resultados passam a ser DERIVADOS do Comercial real.
