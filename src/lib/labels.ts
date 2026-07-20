import type { Accent } from "@/components/ui/primitives";

export const ESTAGIO_LABEL: Record<string, string> = {
  interessado: "Lead / oportunidade",
  primeiro_contato: "Primeiro contato",
  respondeu: "Respondeu",
  qualificado: "Qualificado",
  follow_up: "Follow-up",
  orcamento_enviado: "Orçamento enviado",
  convite_reuniao: "Convite para reunião",
  reuniao_agendada: "Reunião agendada",
  reuniao_realizada: "Reunião realizada",
  diagnostico: "Diagnóstico realizado",
  proposta_enviada: "Proposta enviada",
  negociacao: "Negociação",
  fechado: "Contrato fechado",
  perdido: "Perdido",
};

export const ESTAGIO_ACCENT: Record<string, Accent> = {
  interessado: "neutral",
  primeiro_contato: "neutral",
  respondeu: "warning",
  qualificado: "warning",
  follow_up: "warning",
  orcamento_enviado: "smile",
  convite_reuniao: "smile",
  reuniao_agendada: "smile",
  reuniao_realizada: "smile",
  diagnostico: "smile",
  proposta_enviada: "vision",
  negociacao: "vision",
  fechado: "positive",
  perdido: "negative",
};

export const ESTAGIOS_VISION = ["interessado", "follow_up", "orcamento_enviado", "fechado", "perdido"];
export const ESTAGIOS_SMILE = [
  "interessado",
  "primeiro_contato",
  "respondeu",
  "qualificado",
  "convite_reuniao",
  "reuniao_agendada",
  "reuniao_realizada",
  "diagnostico",
  "proposta_enviada",
  "negociacao",
  "fechado",
  "perdido",
];

// Estágios que indicam que a oportunidade ATINGIU a qualificação (para derivar
// "qualificados" no funil da prospecção ativa, mesmo tendo avançado depois).
export const ESTAGIOS_QUALIFICADO_OU_ALEM = [
  "qualificado", "convite_reuniao", "reuniao_agendada", "reuniao_realizada",
  "diagnostico", "proposta_enviada", "negociacao", "fechado",
];

// Fonte dos contatos (ONDE encontrei) — distinta do canal de contato (COMO abordei).
export const FONTES_CONTATO = ["Instagram", "Google Maps", "Lista própria", "Facebook", "Indicação", "Outro"];

/** Canal único da atividade de prospecção ativa (por onde abordei). */
export const CANAIS_PROSPECCAO = ["Instagram", "WhatsApp", "Ligação", "Google Maps", "Lista própria", "Facebook", "Outro"];

/** Canal da prospecção → chave da meta diária (para somar sem digitar duas vezes). */
export const CANAL_META_CHAVE: Record<string, string> = {
  Instagram: "acoes_instagram",
  WhatsApp: "acoes_whatsapp",
  Ligação: "acoes_ligacao",
};

/** Pendência de identificação de lead (originada da Prospecção Ativa). */
export const PENDENCIA_TIPO_LABEL: Record<string, string> = {
  follow_up: "Follow-up",
  reuniao_agendada: "Reunião agendada",
  reuniao_realizada: "Reunião realizada",
  proposta_enviada: "Proposta enviada",
};

/** Etapa sugerida ao completar o lead, conforme o evento que gerou a pendência. */
export const PENDENCIA_TIPO_ESTAGIO: Record<string, string> = {
  follow_up: "interessado",
  reuniao_agendada: "reuniao_agendada",
  reuniao_realizada: "reuniao_realizada",
  proposta_enviada: "proposta_enviada",
};

export const ENTREGA_LABEL: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  aguardando_material: "Aguardando material",
  em_producao: "Em produção",
  aguardando_aprovacao: "Aguardando aprovação",
  entregue: "Entregue",
  finalizado: "Finalizado",
};

export const ENTREGA_STEPS = [
  "aguardando_pagamento",
  "aguardando_material",
  "em_producao",
  "aguardando_aprovacao",
  "entregue",
  "finalizado",
];

export const SITUACAO_ACCENT: Record<string, Accent> = {
  prevista: "neutral",
  parcial: "warning",
  paga: "positive",
  cancelada: "neutral",
  atrasada: "negative",
};

export const SITUACAO_LABEL: Record<string, string> = {
  prevista: "Prevista",
  parcial: "Parcial",
  paga: "Paga",
  cancelada: "Cancelada",
  atrasada: "Atrasada",
};

export const ASSINATURA_ACCENT: Record<string, Accent> = {
  onboarding: "smile",
  ativo: "positive",
  pagamento_pendente: "warning",
  inadimplente: "negative",
  em_risco: "warning",
  pausado: "neutral",
  cancelado: "neutral",
  finalizado: "neutral",
};

export const ASSINATURA_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  ativo: "Ativo",
  pagamento_pendente: "Pagamento pendente",
  inadimplente: "Inadimplente",
  em_risco: "Em risco",
  pausado: "Pausado",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

export const ONBOARDING_STEPS: { key: string; label: string }[] = [
  { key: "reuniao_agendada", label: "Reunião agendada" },
  { key: "pagamento_inicial", label: "Pagamento inicial recebido" },
  { key: "contrato_assinado", label: "Contrato assinado" },
  { key: "reuniao_realizada", label: "Reunião realizada" },
  { key: "acessos", label: "Acessos recebidos" },
  { key: "materiais", label: "Materiais recebidos" },
  { key: "projeto_iniciado", label: "Projeto / campanha iniciado" },
];

export const OPERACAO_STEPS: { key: string; label: string }[] = [
  { key: "onboarding_concluido", label: "Onboarding concluído" },
  { key: "acessos", label: "Acessos recebidos" },
  { key: "planejamento", label: "Planejamento concluído" },
  { key: "campanha_criada", label: "Campanha criada" },
  { key: "campanha_ativa", label: "Campanha ativa" },
  { key: "acompanhamento", label: "Acompanhamento em andamento" },
  { key: "relatorio", label: "Relatório enviado" },
  { key: "reuniao_acompanhamento", label: "Reunião de acompanhamento" },
];

// Digital Smile — onboarding e operação de gestão de tráfego (mais detalhados).
export const ONBOARDING_STEPS_DS: { key: string; label: string }[] = [
  { key: "reuniao_onboarding_agendada", label: "Reunião de onboarding agendada" },
  { key: "pagamento_inicial", label: "Pagamento inicial recebido" },
  { key: "contrato_assinado", label: "Contrato assinado" },
  { key: "reuniao_realizada", label: "Reunião de onboarding realizada" },
  { key: "acessos_solicitados", label: "Acessos solicitados" },
  { key: "acessos_recebidos", label: "Acessos recebidos" },
  { key: "materiais", label: "Materiais recebidos" },
  { key: "projeto_preparado", label: "Campanha / projeto preparado" },
  { key: "projeto_iniciado", label: "Campanha / projeto iniciado" },
];

export const OPERACAO_STEPS_DS: { key: string; label: string }[] = [
  { key: "onboarding_concluido", label: "Onboarding concluído" },
  { key: "reuniao_inicial", label: "Reunião inicial" },
  { key: "acessos_solicitados", label: "Acessos solicitados" },
  { key: "acessos_recebidos", label: "Acessos recebidos" },
  { key: "config_contas", label: "Configuração das contas" },
  { key: "planejamento", label: "Planejamento" },
  { key: "landing_page", label: "Landing page (quando aplicável)" },
  { key: "pixel", label: "Pixel / rastreamento" },
  { key: "integracoes", label: "Integrações" },
  { key: "campanha_criada", label: "Campanha criada" },
  { key: "anuncios_aprovados", label: "Anúncios aprovados" },
  { key: "campanha_ativa", label: "Campanha ativa" },
  { key: "otimizacoes", label: "Otimizações / acompanhamento" },
  { key: "relatorio", label: "Relatório enviado" },
  { key: "reuniao_acompanhamento", label: "Reunião de acompanhamento" },
];

export const SITE_STEPS_DS: { key: string; label: string }[] = [
  { key: "pagamento_inicial", label: "Pagamento inicial" },
  { key: "briefing", label: "Briefing" },
  { key: "materiais", label: "Materiais recebidos" },
  { key: "estrutura", label: "Estrutura aprovada" },
  { key: "design", label: "Design" },
  { key: "desenvolvimento", label: "Desenvolvimento" },
  { key: "revisao", label: "Revisão" },
  { key: "pagamento_final", label: "Pagamento final" },
  { key: "publicacao", label: "Publicação" },
  { key: "entrega", label: "Entrega" },
];

export const MOTIVOS_PERDA = ["Preço", "Sem interesse", "Sem retorno", "Timing", "Concorrente", "Não qualificado", "Desistiu", "Outro"];
