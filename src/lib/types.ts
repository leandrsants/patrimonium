export type EmpresaSlug = "vision" | "digital_smile";

export type Empresa = {
  id: string;
  nome: string;
  slug: EmpresaSlug;
  cor_tema: string | null;
  ativa: boolean;
};

export type ProdutoServico = {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_cobranca: "unico" | "recorrente_mensal";
  preco_tabela: number | null;
  preco_referencia: number | null;
  regra_pagamento_padrao: RegraPagamento | null;
  ativo: boolean;
  ordem: number;
};

export type RegraPagamento =
  | { tipo: "100_antes" }
  | { tipo: "50_50" }
  | { tipo: "personalizado"; antes_pct?: number; entrega_pct?: number };

export type CategoriaFinanceira = {
  id: string;
  nome: string;
  grupo: "empresarial" | "pessoal" | "extra";
  entra_no_cac: boolean;
  ativo: boolean;
};

export type CanalAquisicao = { id: string; nome: string; ativo: boolean };

export type Campanha = {
  id: string;
  empresa_id: string;
  nome: string;
  data_inicio: string | null;
  data_fim: string | null;
  observacao: string | null;
  ativa: boolean;
};

export type Conta = {
  id: string;
  nome: string;
  tipo: "bancaria" | "cripto" | "especie" | "investimento";
  moeda_ativo: string;
  saldo_inicial: number;
  data_base: string;
  quantidade_ativo: number | null;
  cotacao_manual_brl: number | null;
  ativa: boolean;
};

export type Cartao = {
  id: string;
  nome: string;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
  ativo: boolean;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  telefone_normalizado: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  empresa_clinica_nome: string | null;
  instagram: string | null;
  drive_link: string | null;
  observacao: string | null;
  tipo_registro: "normal" | "legado_teste";
  ativo: boolean;
  criado_em: string;
};

export type EstagioVision = "interessado" | "follow_up" | "orcamento_enviado" | "fechado" | "perdido";
export type EstagioSmile =
  | "interessado"
  | "reuniao_agendada"
  | "reuniao_realizada"
  | "proposta_enviada"
  | "follow_up"
  | "fechado"
  | "perdido";

export type Oportunidade = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  nome_contato: string | null;
  telefone_contato: string | null;
  servico_interesse_id: string | null;
  canal_id: string | null;
  campanha_id: string | null;
  estagio: string;
  proxima_acao: string | null;
  proxima_acao_data: string | null;
  motivo_perda: string | null;
  venda_id: string | null;
  metodo_aquisicao: string | null;
  valor_potencial: number | null;
  abordagem: string | null;
  cidade: string | null;
  email: string | null;
  proposta_valor: number | null;
  proposta_data: string | null;
  proposta_status: string | null;
  fechado_em: string | null;
  convite_reuniao_em: string | null;
  convite_reuniao_resultado: string | null;
  fonte: string | null;
  instagram: string | null;
  registro_prospeccao_id: string | null;
  observacao: string | null;
  criado_em: string;
  cliente?: { nome: string; telefone: string | null } | null;
  servico?: { nome: string } | null;
  canal?: { nome: string } | null;
};

export type Reuniao = {
  id: string;
  oportunidade_id: string;
  data: string;
  horario: string | null;
  status: "agendada" | "realizada" | "no_show" | "cancelada";
  diagnostico_realizado: boolean;
  observacao: string | null;
};

export type Venda = {
  id: string;
  empresa_id: string;
  produto_id: string;
  cliente_id: string | null;
  quantidade: number;
  preco_tabela: number | null;
  desconto_valor: number;
  valor_final: number;
  data_venda: string;
  condicao_pagamento: RegraPagamento | null;
  canal_id: string | null;
  campanha_id: string | null;
  fonte: string | null;
  registro_prospeccao_id: string | null;
  status: "ativa" | "cancelada";
  status_entrega: string | null;
  metodo_aquisicao: string | null;
  observacao: string | null;
  /** Texto original escrito na venda antiga (preservado na migração do legado). */
  legado_observacao_original: string | null;
  drive_link: string | null;
  cliente?: { nome: string; telefone: string | null } | null;
  produto?: { nome: string } | null;
};

export type Parcela = {
  id: string;
  venda_id: string | null;
  assinatura_id: string | null;
  competencia_referencia: string | null;
  numero: number | null;
  descricao: string | null;
  valor_devido: number;
  data_vencimento: string;
  status: "prevista" | "parcial" | "paga" | "cancelada";
};

export type ParcelaSituacao = Parcela & {
  recebido_liquido: number;
  saldo_pendente: number;
  situacao_calculada: "prevista" | "parcial" | "paga" | "cancelada" | "atrasada";
};

export type Assinatura = {
  id: string;
  empresa_id: string;
  cliente_id: string;
  produto_id: string;
  valor_mensal: number;
  preco_referencia: number | null;
  dia_vencimento: number;
  data_inicio: string;
  status: string;
  proxima_data_cobranca: string;
  data_cancelamento: string | null;
  motivo_cancelamento: string | null;
  contrato_necessario: boolean;
  contrato_enviado: boolean;
  contrato_assinado: boolean;
  data_assinatura_contrato: string | null;
  contrato_drive_link: string | null;
  checklist_onboarding: Record<string, boolean> | null;
  checklist_entrega_trafego: Record<string, boolean> | null;
  verba_anuncios_dentista_estimada: number | null;
  desconto_valor: number;
  motivo_desconto: string | null;
  data_reajuste: string | null;
  cac_atribuido: number | null;
  prazo_meses: number | null;
  metodo_aquisicao: string | null;
  fonte: string | null;
  campanha_contratacao: string | null;
  canal_id: string | null;
  campanha_id: string | null;
  criado_em?: string;
  cliente?: { nome: string; telefone: string | null } | null;
  produto?: { nome: string } | null;
};

export type Lancamento = {
  id: string;
  tipo: "entrada" | "saida" | "transferencia";
  natureza: "receita_empresarial" | "receita_extra" | "despesa_empresarial" | "despesa_pessoal" | "transferencia";
  empresa_id: string | null;
  categoria_id: string | null;
  cliente_id: string | null;
  venda_id: string | null;
  parcela_id: string | null;
  campanha_id: string | null;
  compra_cartao_id: string | null;
  numero_parcela_cartao: number | null;
  despesa_recorrente_id: string | null;
  conta_id: string;
  conta_destino_id: string | null;
  valor: number;
  data_competencia: string;
  data_vencimento: string | null;
  data_pagamento: string | null;
  status: "previsto" | "recebido" | "pago" | "cancelado";
  estorno_de_id: string | null;
  entra_no_cac: boolean;
  metodo_aquisicao: string | null;
  observacao: string | null;
  categoria?: { nome: string } | null;
  cliente?: { nome: string } | null;
  conta?: { nome: string } | null;
};

export type CompraCartao = {
  id: string;
  cartao_id: string;
  descricao: string | null;
  valor_total: number;
  data_compra: string;
  numero_parcelas: number;
  categoria_id: string | null;
  empresa_id: string | null;
  mes_primeira_fatura: string;
  conta_id: string | null;
};

export type DespesaRecorrente = {
  id: string;
  nome: string;
  valor: number;
  periodicidade: "mensal" | "anual";
  proxima_data_vencimento: string;
  categoria_id: string | null;
  empresa_id: string | null;
  status: "ativo" | "pausado" | "encerrado";
};

export type Meta = {
  id: string;
  nome: string;
  valor_alvo: number;
  data_inicio: string;
  data_fim: string;
  inclui_extras: boolean;
  ativa: boolean;
  observacao: string | null;
};

export type ContaSaldo = { conta_id: string; nome: string; saldo_calculado: number };

export type MetodoAquisicao = "prospeccao_ativa" | "trafego_pago" | "organico" | "indicacao" | "outros";

export type RegistroProspeccao = {
  id: string;
  empresa_id: string;
  data: string;
  metodo_aquisicao: MetodoAquisicao;
  canal_id: string | null;
  fonte: string | null;
  leads_encontrados: number;
  novos_prospectados: number;
  contatos_feitos: number;
  acoes_instagram: number;
  acoes_whatsapp: number;
  acoes_ligacao: number;
  acoes_outras: number;
  respostas: number;
  respostas_positivas: number;
  qualificados: number;
  orcamentos_enviados: number;
  reunioes_marcadas: number;
  reunioes_realizadas: number;
  no_shows: number;
  propostas_enviadas: number;
  contratos: number;
  observacao: string | null;
};

export type MetaProspeccao = { id: string; empresa_id: string; chave: string; meta_diaria: number; ativo: boolean };

export type PendenciaLead = {
  id: string;
  empresa_id: string;
  registro_prospeccao_id: string | null;
  tipo_evento: "follow_up" | "reuniao_agendada" | "reuniao_realizada" | "proposta_enviada";
  canal: string | null;
  data_origem: string;
  status: "pendente" | "resolvida" | "dispensada";
  oportunidade_id: string | null;
  resolvida_em: string | null;
  criado_em: string;
};
