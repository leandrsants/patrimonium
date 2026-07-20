-- ============================================================================
-- DADOS DE EXEMPLO — DIGITAL SMILE (somente LOCAL, para explorar o app).
-- Re-executável: limpa os próprios dados (marcados como DEMO_DS) antes de criar.
-- Para remover tudo: rode a seção de limpeza abaixo, ou `supabase db reset`.
-- NÃO é migration (não roda no reset). Datas são relativas a current_date.
-- ============================================================================

-- ---------- LIMPEZA (idempotência) ----------
delete from public.lancamentos_financeiros where idempotency_key like 'demo-ds-%';
delete from public.parcelas where assinatura_id in (
  select a.id from public.assinaturas a join public.clientes c on a.cliente_id=c.id where c.observacao='DEMO_DS');
delete from public.reunioes where oportunidade_id in (select id from public.oportunidades where observacao='DEMO_DS');
delete from public.pendencias_lead where registro_prospeccao_id in (select id from public.registros_prospeccao where observacao='DEMO_DS');
delete from public.assinaturas where cliente_id in (select id from public.clientes where observacao='DEMO_DS');
delete from public.oportunidades where observacao='DEMO_DS';
delete from public.registros_prospeccao where observacao='DEMO_DS';
delete from public.campanhas where nome like 'DEMO · %';
delete from public.clientes where observacao='DEMO_DS';
delete from public.contas where nome='Caixa Digital Smile (demo)';

-- ---------- Função auxiliar: cria cliente + contrato + histórico de cobranças ----------
create or replace function public.demo_ds_contrato(
  p_ds uuid, p_conta uuid, p_prod uuid,
  p_nome text, p_tel text, p_valor numeric, p_inicio date, p_dia int,
  p_status text, p_metodo text, p_fonte text, p_cac numeric,
  p_open_from date, p_last_gen date, p_campanha uuid default null,
  p_cancel date default null, p_motivo_cancel text default null
) returns void language plpgsql as $$
declare
  v_cli uuid; v_ass uuid; v_parc uuid;
  v_month date; v_venc date; v_last int; v_dia_ef int; v_paydate date; v_prox date;
begin
  insert into public.clientes(nome, telefone, observacao)
    values (p_nome, p_tel, 'DEMO_DS') returning id into v_cli;

  v_prox := (date_trunc('month', greatest(p_last_gen, current_date)) + interval '1 month')::date + (least(p_dia,28)-1);
  insert into public.assinaturas(
    empresa_id, cliente_id, produto_id, valor_mensal, dia_vencimento, data_inicio,
    proxima_data_cobranca, status, metodo_aquisicao, fonte, cac_atribuido, campanha_id,
    data_cancelamento, motivo_cancelamento
  ) values (
    p_ds, v_cli, p_prod, p_valor, p_dia, p_inicio,
    v_prox, p_status, p_metodo, p_fonte, p_cac, p_campanha, p_cancel, p_motivo_cancel
  ) returning id into v_ass;

  v_month := date_trunc('month', p_inicio)::date;
  while v_month <= date_trunc('month', p_last_gen)::date loop
    v_last   := extract(day from (date_trunc('month', v_month) + interval '1 month - 1 day'))::int;
    v_dia_ef := least(p_dia, v_last);
    v_venc   := v_month + (v_dia_ef - 1);
    insert into public.parcelas(assinatura_id, competencia_referencia, descricao, valor_devido, data_vencimento)
      values (v_ass, v_month, 'mensalidade '||to_char(v_month,'MM/YYYY'), p_valor, v_venc)
      returning id into v_parc;
    if v_venc < p_open_from then  -- competência paga
      v_paydate := least(v_venc, current_date);
      insert into public.lancamentos_financeiros(
        tipo, natureza, empresa_id, cliente_id, parcela_id, conta_id, valor,
        data_competencia, data_pagamento, status, idempotency_key
      ) values (
        'entrada','receita_empresarial', p_ds, v_cli, v_parc, p_conta, p_valor,
        v_venc, v_paydate, 'recebido', 'demo-ds-pay-'||v_parc::text
      );
    end if;
    v_month := (v_month + interval '1 month')::date;
  end loop;
end $$;

-- ---------- Criação dos dados ----------
do $$
declare
  v_ds uuid; v_prod uuid; v_conta uuid; v_camp uuid; v_cat_traf uuid;
  v_reg uuid;
  v_opp_paula uuid; v_opp_sergio uuid; v_opp_tiago uuid;
  m0 date := date_trunc('month', current_date)::date;         -- 1º dia do mês atual
  m1 date := (date_trunc('month', current_date) - interval '1 month')::date;
  m2 date := (date_trunc('month', current_date) - interval '2 month')::date;
  m3 date := (date_trunc('month', current_date) - interval '3 month')::date;
  m4 date := (date_trunc('month', current_date) - interval '4 month')::date;
begin
  select id into v_ds from public.empresas where slug='digital_smile';
  select id into v_prod from public.produtos_servicos where empresa_id=v_ds and nome='Gestão de Tráfego Pago' limit 1;
  select id into v_cat_traf from public.categorias_financeiras where entra_no_cac=true limit 1; -- categoria de aquisição (CAC)

  insert into public.contas(nome, tipo) values ('Caixa Digital Smile (demo)','bancaria') returning id into v_conta;
  insert into public.campanhas(empresa_id, nome, data_inicio, ativa)
    values (v_ds, 'DEMO · Meta Ads Dentistas', m2, true) returning id into v_camp;

  -- Contratos (variados: ativo, onboarding novo, inadimplente, pausado, cancelado)
  perform public.demo_ds_contrato(v_ds, v_conta, v_prod, 'Dra. Camila Rocha',   '11911110001', 1500, m3 + 9,  10, 'ativo',       'prospeccao_ativa','Instagram', 300, (m0 + interval '1 month')::date, current_date);
  perform public.demo_ds_contrato(v_ds, v_conta, v_prod, 'Dr. Bruno Almeida',   '11922220002', 1200, m2 + 24, 25, 'ativo',       'trafego_pago',    'Instagram', 450, m0, current_date, v_camp);
  perform public.demo_ds_contrato(v_ds, v_conta, v_prod, 'Clínica SorrisoBom',  '11933330003', 2000, current_date, extract(day from current_date)::int, 'onboarding', 'prospeccao_ativa','Instagram', 280, m0, current_date);
  perform public.demo_ds_contrato(v_ds, v_conta, v_prod, 'Clínica Novo Sorriso','11933330007', 1400, current_date, extract(day from current_date)::int, 'onboarding', 'trafego_pago',    'Instagram', 450, m0, current_date, v_camp);
  perform public.demo_ds_contrato(v_ds, v_conta, v_prod, 'Dr. Felipe Nunes',    '11944440004', 1000, m2 + 11, 12, 'inadimplente','trafego_pago',    'Instagram', 520, m1, current_date, v_camp);
  perform public.demo_ds_contrato(v_ds, v_conta, v_prod, 'Dra. Marina Costa',   '11955550005',  900, m4 + 7,   8, 'pausado',     'organico',        'Indicação',   0, (m1)::date, (m2 + 27));
  perform public.demo_ds_contrato(v_ds, v_conta, v_prod, 'OdontoVida Clínica',  '11966660006', 1100, m4 + 14, 15, 'cancelado',   'indicacao',       'Indicação', 200, (m1)::date, (m2 + 27), null, (m1 + 5), 'Trocou de agência');

  -- Investimento em tráfego (entra no CAC) + despesas operacionais do mês
  -- Categoria "Tráfego pago" marca entra_no_cac (via trigger) → alimenta o CAC.
  -- metodo_aquisicao='trafego_pago' atribui o custo ao método (CAC por método).
  insert into public.lancamentos_financeiros(tipo,natureza,empresa_id,categoria_id,campanha_id,conta_id,metodo_aquisicao,valor,data_competencia,data_pagamento,status,idempotency_key)
    values ('saida','despesa_empresarial',v_ds,v_cat_traf,v_camp,v_conta,'trafego_pago', 900, m0+4, m0+4,'pago', 'demo-ds-inv-1');
  insert into public.lancamentos_financeiros(tipo,natureza,empresa_id,conta_id,valor,data_competencia,data_pagamento,status,entra_no_cac,idempotency_key)
    values ('saida','despesa_empresarial',v_ds,v_conta, 350, m0+2, m0+2,'pago', false, 'demo-ds-exp-1'),
           ('saida','despesa_empresarial',v_ds,v_conta, 700, m0+9, m0+9,'pago', false, 'demo-ds-exp-2');

  -- Prospecção ativa por números (vários dias do mês)
  insert into public.registros_prospeccao(empresa_id,data,metodo_aquisicao,fonte,novos_prospectados,respostas,respostas_positivas,reunioes_marcadas,reunioes_realizadas,no_shows,propostas_enviadas,observacao) values
    (v_ds, m0,      'prospeccao_ativa','Instagram',   40, 9, 4, 1, 1, 0, 0, 'DEMO_DS'),
    (v_ds, m0 + 2,  'prospeccao_ativa','WhatsApp',    25, 7, 3, 1, 1, 0, 1, 'DEMO_DS'),
    (v_ds, m0 + 7,  'prospeccao_ativa','Ligação',     15, 6, 2, 1, 0, 1, 0, 'DEMO_DS'),
    (v_ds, m0 + 13, 'prospeccao_ativa','Instagram',   50, 12,6, 2, 2, 0, 1, 'DEMO_DS'),
    (v_ds, m0 + 17, 'prospeccao_ativa','Google Maps', 30, 5, 2, 0, 0, 0, 0, 'DEMO_DS');
  insert into public.registros_prospeccao(empresa_id,data,metodo_aquisicao,fonte,novos_prospectados,respostas,respostas_positivas,reunioes_marcadas,propostas_enviadas,observacao)
    values (v_ds, current_date,'prospeccao_ativa','Instagram', 20, 4, 2, 1, 1, 'DEMO_DS') returning id into v_reg;

  -- Pendências de identificação ("Leads a cadastrar")
  insert into public.pendencias_lead(empresa_id,registro_prospeccao_id,tipo_evento,canal,data_origem) values
    (v_ds, v_reg,'reuniao_agendada','Instagram', current_date),
    (v_ds, v_reg,'reuniao_agendada','Instagram', current_date),
    (v_ds, v_reg,'proposta_enviada','Instagram', current_date),
    (v_ds, v_reg,'reuniao_agendada','WhatsApp',  m0 + 2);

  -- Comercial: pipeline em vários estágios
  insert into public.oportunidades(empresa_id,nome_contato,telefone_contato,metodo_aquisicao,fonte,estagio,proposta_valor,proposta_status,proposta_data,valor_potencial,motivo_perda,criado_em,fechado_em,campanha_id,observacao) values
    (v_ds,'Dr. Ricardo Lima',   '11970000011','prospeccao_ativa','Instagram',  'interessado',     null,null,null,null,null, current_date-3, null,null,'DEMO_DS'),
    (v_ds,'Clínica Bem Estar',  '11970000012','prospeccao_ativa','WhatsApp',   'qualificado',     null,null,null,null,null, current_date-6, null,null,'DEMO_DS'),
    (v_ds,'OdontoTop',          '11970000015','trafego_pago',    'Instagram',  'proposta_enviada',1800,'enviada',current_date-4,1800,null, current_date-10,null,v_camp,'DEMO_DS'),
    (v_ds,'Dr. Tiago Farias',   '11970000016','prospeccao_ativa','Indicação',  'negociacao',      2200,'negociacao',current_date-2,2200,null, current_date-8, null,null,'DEMO_DS'),
    (v_ds,'Clínica XYZ',        '11970000017','prospeccao_ativa','Instagram',  'perdido',         null,null,null,1500,'Preço acima do orçamento', current_date-14, null,null,'DEMO_DS'),
    (v_ds,'Dra. Ana Prado',     '11970000018','trafego_pago',    'Instagram',  'perdido',         null,null,null,1200,'Sem retorno',              current_date-18, null,v_camp,'DEMO_DS'),
    (v_ds,'Dra. Helena Vasco',  '11970000019','prospeccao_ativa','Instagram',  'fechado',         null,null,null,null,null, current_date-20, current_date-8, null,'DEMO_DS'),
    (v_ds,'Dr. Marcos Diniz',   '11970000020','trafego_pago',    'Instagram',  'fechado',         null,null,null,null,null, current_date-30, current_date-5, v_camp,'DEMO_DS');
  insert into public.oportunidades(empresa_id,nome_contato,telefone_contato,metodo_aquisicao,fonte,estagio,criado_em,observacao)
    values (v_ds,'Dra. Paula Menezes','11970000013','trafego_pago','Instagram','reuniao_agendada', current_date-5,'DEMO_DS') returning id into v_opp_paula;
  insert into public.oportunidades(empresa_id,nome_contato,telefone_contato,metodo_aquisicao,fonte,estagio,criado_em,observacao)
    values (v_ds,'Dr. Sérgio Ramos','11970000014','prospeccao_ativa','Google Maps','reuniao_realizada', current_date-7,'DEMO_DS') returning id into v_opp_sergio;

  -- Reuniões (agendada, realizada, no-show)
  insert into public.reunioes(oportunidade_id,data,horario,status) values
    (v_opp_paula,  current_date + 4, '14:00','agendada'),
    (v_opp_sergio, current_date - 5, '10:30','realizada');
  insert into public.reunioes(oportunidade_id,data,status)
    select id, current_date - 6, 'no_show' from public.oportunidades where nome_contato='Dr. Tiago Farias' and observacao='DEMO_DS';
end $$;

drop function public.demo_ds_contrato(uuid,uuid,uuid,text,text,numeric,date,int,text,text,text,numeric,date,date,uuid,date,text);

-- Resumo do que foi criado
select 'clientes'  as tabela, count(*) from public.clientes where observacao='DEMO_DS'
union all select 'assinaturas', count(*) from public.assinaturas a join public.clientes c on a.cliente_id=c.id where c.observacao='DEMO_DS'
union all select 'parcelas', count(*) from public.parcelas p join public.assinaturas a on p.assinatura_id=a.id join public.clientes c on a.cliente_id=c.id where c.observacao='DEMO_DS'
union all select 'oportunidades', count(*) from public.oportunidades where observacao='DEMO_DS'
union all select 'registros_prospeccao', count(*) from public.registros_prospeccao where observacao='DEMO_DS'
union all select 'pendencias_lead', count(*) from public.pendencias_lead where canal is not null and registro_prospeccao_id in (select id from public.registros_prospeccao where observacao='DEMO_DS');
