# ESPECIFICAÇÃO FUNCIONAL COMPLETA  
## Ecossistema Financeiro — Vision e Digital Smile

**Versão:** 1.2  
**Idioma:** português do Brasil  
**Moeda principal:** real brasileiro (R$)  
**Fuso horário:** America/Sao_Paulo  
**Formato de data:** DD/MM/AAAA  
**Usuário:** uma única pessoa  
**Dispositivos:** computador, tablet e celular  

---

## 1. Objetivo do documento

Este documento define com clareza o que o aplicativo deve ser, quais problemas deve resolver, quais informações precisa controlar e quais funções não devem ser criadas neste momento.

Ele deve servir como:

- especificação do produto;
- referência para análise no Claude Chat;
- fonte de verdade para o Claude Code;
- base para decisões de interface, banco de dados e regras de negócio;
- critério de validação da versão 1.

O aplicativo já possui uma versão anterior e um banco de dados Supabase com histórico. A nova versão deve reaproveitar o projeto e preservar os dados válidos existentes.

Este documento não autoriza exclusões ou alterações destrutivas no banco de produção. A migração deve ser planejada e executada separadamente.


### Decisões fechadas após revisão técnica

- Os valores elegíveis recebidos desde 22/06/2026 contam para a Meta 10K 2026.
- Fotos com IA são pagas 100% antes da produção.
- Vídeos com IA são pagos, por padrão, 50% antes e 50% na entrega.
- Pacotes de fotos + vídeo têm condição de pagamento personalizada, sem regra automática fixa.
- O status da reunião não altera automaticamente o estágio do lead.
- A regra automática de atraso vale para todas as parcelas e mensalidades.
- Despesas recorrentes usam somente próxima data de vencimento, sem gerar lançamentos futuros em massa.
- Registros antigos ambíguos entram apenas em uma revisão temporária de migração até serem classificados.
- Toda conta precisa de saldo inicial e data-base.
- Vencimentos inexistentes em um mês usam o último dia válido.
- Leads perdidos podem ser reabertos.
- Atribuição de campanha é manual nesta versão.

---

## 2. Visão geral do aplicativo

O aplicativo será um **ecossistema financeiro, comercial e operacional pessoal** para administrar:

1. **Vision**
2. **Digital Smile**
3. **Receitas extras**
4. **Despesas pessoais**
5. **Patrimônio e reservas**
6. **Metas financeiras**

O aplicativo não deve parecer um CRM de prospecção ativa.

A primeira impressão deve ser de um painel financeiro e gerencial que responde rapidamente:

- Quanto foi vendido?
- Quanto foi recebido?
- Quanto foi investido?
- Quanto foi gasto?
- Quanto sobrou?
- Quanto falta para a meta?
- Como está a Vision?
- Como está a Digital Smile?
- Existem pagamentos atrasados?
- Existem clientes ou entregas que exigem atenção?
- Qual é o patrimônio atual?

A prospecção ativa continuará existindo, mas será uma ferramenta secundária dentro de cada empresa.

---

## 3. Princípios obrigatórios do produto

O produto deve ser completo em controle, mas minimalista na interface.

### 3.1 Simplicidade

- Poucas páginas.
- Poucos botões.
- Poucos cliques.
- Formulários curtos.
- Campos opcionais escondidos.
- Informações avançadas em seções recolhíveis.
- Sem páginas independentes para funções que podem ser agrupadas.
- Sem dashboards cheios de gráficos sem utilidade.
- Sem registrar atividades comerciais irrelevantes.
- Sem exigir cadastro de todos os leads frios.
- Sem transformar o sistema em uma ferramenta contábil complexa.

### 3.2 Velocidade

O usuário deve conseguir:

- registrar uma venda de fotos em menos de 30 segundos;
- registrar uma despesa em menos de 20 segundos;
- cadastrar um lead importante em menos de 20 segundos;
- registrar um pagamento com poucos cliques;
- visualizar os principais números assim que abrir o app;
- usar o sistema confortavelmente no celular.

### 3.3 Precisão

O sistema deve separar corretamente:

- valor vendido;
- valor recebido;
- valor pendente;
- faturamento empresarial;
- receitas extras;
- despesas empresariais;
- despesas pessoais;
- investimento em aquisição;
- custos operacionais;
- transferências entre contas;
- saldo disponível;
- patrimônio.

### 3.4 Evolução sem poluição

Mentoria, curso e comunidade devem existir como produtos futuros, mas permanecer invisíveis até serem ativados.

O crescimento do negócio deve ocorrer dentro das mesmas áreas, sem criar uma nova página para cada produto.

---

## 4. Contexto dos negócios

### 4.1 Vision

A Vision atualmente vende produtos e serviços de criação com inteligência artificial.

### Produtos ativos

- 5 fotos com IA — R$ 29;
- 10 fotos com IA — R$ 49;
- vídeo com IA — preço personalizado;
- pacote de fotos e vídeo — preço personalizado e com possibilidade de desconto;
- site — preço personalizado, quando a venda for realizada pela Vision.

### Público atual

A prospecção da Vision está focada principalmente em:

- joalherias;
- lojas de semijoias;
- lojas de acessórios;
- lojas de alianças.

Os leads são encontrados principalmente pelo Instagram.

### Evolução planejada

Produtos futuros, inicialmente inativos:

- mentoria individual;
- curso gravado;
- comunidade.

A intenção de médio prazo é migrar gradualmente de serviços baratos para produtos educacionais de maior valor.

### 4.2 Digital Smile

A Digital Smile é uma agência voltada a dentistas e clínicas odontológicas.

### Serviços ativos

- gestão de tráfego pago;
- criação de sites;
- Google Meu Negócio, como serviço eventual.

Não existe serviço de auditoria como produto ativo.

### Gestão de tráfego

- preço de referência normal: pelo menos R$ 1.000 por mês;
- preço comercial inicial: R$ 500 por mês;
- valor pode ser personalizado por cliente;
- contrato mensal;
- sem prazo mínimo obrigatório;
- cliente pode cancelar quando desejar;
- cada cliente possui sua própria data de vencimento.

### Evolução planejada

Produtos futuros, inicialmente inativos:

- mentoria individual;
- curso;
- comunidade.

Uma futura mentoria pode atender dentistas recém-formados que desejem orientação sobre Instagram e marketing antes de contratar uma assessoria completa.

### 4.3 Receitas extras

Receitas extras fazem parte da vida financeira, mas não representam desempenho das empresas.

Fontes atuais ou possíveis:

- Sonati/Sonate;
- Trium/Trio;
- presentes;
- projetos por fora;
- valores pessoais recebidos;
- outras entradas não operacionais.

As receitas extras:

- aparecem no total recebido;
- aumentam caixa e patrimônio;
- não entram na meta empresarial de R$ 10 mil;
- não entram no faturamento da Vision;
- não entram no faturamento da Digital Smile;
- não aumentam ticket médio;
- não entram no CAC;
- não entram no lucro dos negócios.

---

## 5. Navegação principal

O aplicativo deve ter somente cinco áreas principais:

1. **Dashboard**
2. **Vision**
3. **Digital Smile**
4. **Financeiro**
5. **Metas e Patrimônio**

> **Regra estrutural obrigatória:** as demais seções deste documento descrevem regras de negócio, componentes internos, cálculos e comportamentos transversais. Elas **não representam novas páginas principais**. Clientes globais, produtos, pagamentos, cartões, CAC, estornos, duplicidades, fechamento mensal, busca e alertas devem existir dentro das cinco áreas acima ou em painéis recolhíveis. A quantidade de páginas não deve crescer por causa da estrutura deste documento.

Configurações devem ser acessadas por um ícone discreto.

Não criar páginas principais separadas para:

- Leads
- Pipeline
- Follow-ups
- Reuniões
- Propostas
- Contratos
- Entregas
- Relatórios
- Testes A/B
- Extras
- Produtos
- Campanhas
- Inadimplência
- Cartões

Essas funções devem ficar dentro da área correspondente.

---

## 6. Dashboard inicial

O Dashboard deve ser financeiro e gerencial.

Ele não deve destacar número de abordagens, mensagens enviadas ou metas de prospecção.

### 6.1 Filtros

Permitir selecionar:

- mês;
- trimestre;
- ano;
- período personalizado;
- ciclo/meta ativa.

### 6.2 Indicadores principais

Os cards principais devem mostrar:

### Faturamento dos negócios

Somente:

- Vision;
- Digital Smile.

Não incluir receitas extras.

### Total recebido

Somar:

- Vision;
- Digital Smile;
- receitas extras.

### Investimento em aquisição

Somar somente:

- anúncios da Vision;
- anúncios da Digital Smile.

Não incluir:

- ferramentas;
- assinaturas;
- despesas pessoais;
- verba de anúncios paga pelo dentista.

### Lucro dos negócios

Calcular com:

- receitas recebidas da Vision;
- receitas recebidas da Digital Smile;
- menos despesas empresariais;
- menos investimento em aquisição.

Não incluir:

- receitas extras;
- despesas pessoais.

### Meta 10K 2026

Mostrar:

- valor recebido elegível;
- percentual atingido;
- quanto falta;
- dias restantes;
- média mensal necessária;
- média semanal necessária.

A meta considera somente dinheiro efetivamente recebido pela Vision e Digital Smile.

### 6.3 Indicadores secundários

Mostrar de forma menos destacada:

- despesas dos negócios;
- despesas pessoais;
- valores a receber;
- inadimplência;
- patrimônio líquido.

### 6.4 Visão por empresa

Criar dois cards resumidos.

### Vision

- faturamento;
- valor recebido;
- investimento;
- despesas;
- lucro;
- clientes novos;
- CAC.

### Digital Smile

- faturamento;
- valor recebido;
- receita mensal ativa;
- despesas;
- lucro;
- clientes ativos;
- CAC.

### 6.5 Gráficos

Usar somente gráficos úteis:

1. faturamento, despesas e lucro por mês;
2. faturamento dividido entre Vision e Digital Smile;
3. evolução da meta;
4. evolução do patrimônio.

Evitar gráficos redundantes.

### 6.6 Bloco “Atenção”

Mostrar somente quando houver pendências:

- pagamento vencido;
- pagamento vencendo;
- cliente inadimplente;
- contrato pendente;
- onboarding próximo;
- entrega atrasada;
- segunda parcela pendente;
- follow-up vencido;
- reunião próxima.

---

## 7. Área Vision

A Vision deve ter somente quatro abas internas:

1. **Resumo**
2. **Prospecção**
3. **Tráfego Pago**
4. **Clientes**

### 7.1 Resumo da Vision

Mostrar:

- faturamento;
- valor recebido;
- valor pendente;
- investimento em aquisição;
- despesas operacionais;
- lucro;
- margem;
- número de vendas;
- ticket médio;
- clientes novos;
- CAC;
- recompra.

Mostrar vendas por produto:

- 5 fotos;
- 10 fotos;
- vídeo;
- fotos + vídeo;
- site;
- produtos futuros, somente quando ativados.

### 7.2 Prospecção da Vision

A prospecção deve ser simples.

O usuário não deseja cadastrar todos os leads encontrados. Deve cadastrar apenas leads que:

- demonstraram interesse;
- precisam de follow-up;
- receberam orçamento;
- possuem chance real de venda.

### Campos mínimos

- nome;
- telefone;
- Instagram, opcional;
- serviço de interesse;
- origem;
- estágio;
- próxima data de follow-up;
- observação curta.

### Origens iniciais

- Instagram;
- WhatsApp;
- indicação;
- anúncio;
- outro.

### Estágios

- interessado;
- follow-up;
- orçamento enviado;
- fechado;
- perdido.

### Visualizações

- lista como padrão;
- pipeline simples como opção.

Não criar:

- contador obrigatório de abordagens;
- histórico de cada mensagem;
- scraping;
- integração com Instagram;
- lista complexa do Google Maps;
- automação de WhatsApp.

### 7.3 Tráfego Pago da Vision

Esta área controla os anúncios da própria Vision.

### Campos

- nome da campanha;
- data inicial;
- data final;
- investimento;
- leads ou conversas;
- clientes conquistados;
- vendas atribuídas;
- receita atribuída;
- observação.

### Métricas

- CPL;
- CAC;
- ROAS;
- taxa de conversão.

O aplicativo não deve substituir o Gerenciador de Anúncios da Meta. Não controlar conjunto, anúncio e criativo individualmente.

A atribuição de venda a campanha deve ser manual, vinculando o cliente ou a venda à campanha correspondente. Não criar janela automática de atribuição nesta versão.

### 7.4 Clientes da Vision

### Lista

Mostrar:

- nome;
- telefone;
- produto;
- valor vendido;
- valor recebido;
- valor pendente;
- data da venda;
- status da entrega.

### Cadastro mínimo

- nome;
- telefone;
- produto;
- valor final;
- data da venda;
- condição de pagamento;
- origem;
- status do pagamento;
- status da entrega.

### Dados adicionais opcionais

- quantidade;
- preço de tabela;
- desconto;
- motivo do desconto;
- campanha;
- link do Google Drive;
- observação.

### Status da entrega

- aguardando pagamento;
- aguardando material;
- em produção;
- aguardando aprovação;
- entregue;
- finalizado.

Não criar página separada de entregas para a Vision.

---

## 8. Área Digital Smile

A Digital Smile deve ter somente quatro abas internas:

1. **Resumo**
2. **Prospecção**
3. **Tráfego Pago**
4. **Clientes**

### 8.1 Resumo da Digital Smile

Mostrar:

- faturamento;
- valor recebido;
- valor a receber;
- receita mensal ativa;
- inadimplência;
- investimento em aquisição;
- despesas operacionais;
- lucro;
- clientes ativos;
- novos clientes;
- cancelamentos;
- CAC;
- ticket médio;
- churn.

### Métricas avançadas recolhíveis

- reuniões marcadas;
- reuniões realizadas;
- no-shows;
- taxa de comparecimento;
- custo por reunião marcada;
- custo por reunião realizada;
- custo por no-show;
- propostas enviadas;
- taxa de fechamento;
- LTV;
- payback;
- LTV/CAC.

Essas métricas não devem poluir o resumo principal.

### 8.2 Prospecção da Digital Smile

Cadastrar apenas dentistas ou clínicas que demonstraram interesse ou precisam de acompanhamento.

### Campos mínimos

- nome;
- telefone;
- Instagram, opcional;
- nome da clínica, opcional;
- serviço de interesse;
- origem;
- estágio;
- próxima ação;
- data da próxima ação;
- observação curta.

### Origens

- Instagram;
- Google Maps;
- indicação;
- anúncio;
- lista própria;
- outro.

### Estágios

- interessado;
- reunião agendada;
- reunião realizada;
- proposta enviada;
- follow-up;
- fechado;
- perdido.

Não registrar cada ligação ou mensagem.

### Reunião

Dentro do lead, permitir:

- data;
- horário;
- status;
- observação.

Status:

- agendada;
- realizada;
- no-show;
- cancelada.

O status da reunião e o estágio do lead são informações relacionadas, mas independentes.

Regras:

- alterar o status da reunião não muda o estágio automaticamente;
- o usuário decide manualmente o próximo estágio;
- quando uma reunião for marcada como `no-show` ou `cancelada`, o sistema pode apenas sugerir a ação “Mover para follow-up?”, sem executá-la sozinho;
- não criar automações que movimentem o lead sem confirmação.

Não criar página independente de reuniões.

### 8.3 Tráfego Pago da Digital Smile

Esta área controla os anúncios da própria Digital Smile para conquistar dentistas.

### Campos

- campanha;
- período;
- investimento;
- leads;
- reuniões marcadas;
- reuniões realizadas;
- no-shows;
- propostas;
- clientes conquistados;
- receita atribuída;
- observação.

### Métricas

Exibir diretamente apenas:

- investimento;
- leads;
- clientes conquistados;
- CAC;
- receita atribuída;
- ROAS.

Manter em uma seção recolhível chamada **“Métricas avançadas”**:

- CPL;
- custo por reunião marcada;
- custo por reunião realizada;
- custo por no-show;
- taxa de no-show;
- custo por proposta;
- taxa de fechamento;
- payback estimado.

As métricas avançadas não devem poluir a tela principal.

A atribuição de reuniões, clientes e receita à campanha deve ser manual. Não criar janela automática de atribuição nesta versão.

### 8.4 Clientes da Digital Smile

### Lista

Mostrar:

- cliente;
- telefone;
- serviço;
- mensalidade ou valor do projeto;
- próxima cobrança;
- situação do pagamento;
- status do cliente;
- progresso do onboarding.

### Cadastro básico

- nome;
- telefone;
- serviço;
- valor combinado;
- preço de referência;
- data de início;
- vencimento;
- origem;
- campanha opcional;
- status;
- verba mensal estimada do dentista para anúncios, como campo opcional e apenas informativo.

### Serviços ativos

- gestão de tráfego;
- site;
- Google Meu Negócio.

### Status do cliente

- onboarding;
- ativo;
- pagamento pendente;
- inadimplente;
- em risco;
- pausado;
- cancelado;
- finalizado.

---

## 9. Clientes globais e múltiplas compras

Um cliente deve existir uma única vez no banco.

A mesma pessoa pode:

- comprar fotos;
- comprar vídeo;
- contratar site;
- contratar gestão de tráfego;
- comprar mentoria futuramente.

Cada compra, oportunidade ou contrato deve ser vinculado ao mesmo contato.

### 9.1 Dados mínimos

- nome;
- telefone.

### 9.2 Dados opcionais

- e-mail;
- CPF ou CNPJ;
- empresa ou clínica;
- Instagram;
- link do Google Drive;
- observações.

### 9.3 Visão do cliente

Ao abrir o cliente, mostrar:

- nome e telefone;
- empresas relacionadas;
- serviços comprados;
- total vendido;
- total recebido;
- valor pendente;
- pagamentos atrasados;
- contratos;
- situação atual;
- histórico resumido;
- próximos compromissos;
- link do Drive.

Dentro da Vision, exibir somente relações da Vision.

Dentro da Digital Smile, exibir somente relações da Digital Smile.

---

## 10. Produtos e condições de pagamento

### 10.1 Fotos com IA

### 5 fotos

- preço padrão: R$ 29;
- pagamento integral antes da produção.

### 10 fotos

- preço padrão: R$ 49;
- pagamento integral antes da produção.

### 10.2 Vídeo com IA

- preço personalizado;
- 50% antes;
- 50% na entrega;
- regra editável em uma venda específica.

### 10.3 Fotos e vídeo

- preço personalizado;
- permitir desconto;
- condição de pagamento personalizada em cada venda;
- não aplicar automaticamente a regra 50/50 ao pacote inteiro;
- as fotos continuam normalmente pagas 100% antes;
- o vídeo continua normalmente pago 50% antes e 50% na entrega;
- quando o pacote tiver um valor único sem separação por item, o usuário informa manualmente quanto será pago antes e quanto ficará para a entrega.


### 10.4 Site

- preço personalizado;
- 50% antes;
- 50% na entrega;
- pode ser vendido pela Vision ou Digital Smile;
- nunca deve ser tratado como terceira empresa.

### 10.5 Gestão de tráfego

- mensalidade por cliente;
- valor sugerido inicial: R$ 500;
- preço de referência: R$ 1.000;
- valor personalizável;
- vencimento individual;
- contrato cancelável;
- próxima cobrança calculada pelo sistema.

### 10.6 Google Meu Negócio

- serviço eventual;
- preço personalizado.

### 10.7 Produtos futuros

Em ambas as empresas:

- mentoria;
- curso;
- comunidade.

Devem permanecer invisíveis enquanto inativos.

---

## 11. Valor vendido, recebido e pendente

O sistema deve separar obrigatoriamente:

- valor total vendido;
- valor efetivamente recebido;
- valor pendente.

Exemplo:

Site de R$ 2.000:

- vendido: R$ 2.000;
- primeira parcela recebida: R$ 1.000;
- pendente: R$ 1.000;
- meta recebe somente R$ 1.000 naquele momento.

A meta de 2026 é de recebimento, não de contratos futuros.

### Regra geral de atraso

Toda cobrança ou parcela não paga deve mudar automaticamente para `atrasada` quando a data de vencimento passar, incluindo:

- segunda parcela de vídeo;
- segunda parcela de site;
- mensalidade da Digital Smile;
- qualquer outra conta a receber.

Cobrança atrasada deve aparecer no bloco **Atenção**. A inadimplência empresarial deve considerar todas as cobranças vencidas, não apenas mensalidades.

---

## 12. Contratos e mensalidades da Digital Smile

### 12.1 Contrato

Criar seção recolhível dentro do cliente.

Campos:

- contrato necessário;
- contrato enviado;
- contrato assinado;
- data da assinatura;
- data de início;
- valor mensal;
- dia do vencimento;
- link do contrato no Google Drive;
- cancelamento livre;
- data do cancelamento;
- motivo do cancelamento.

Não armazenar o arquivo diretamente no app nesta versão.

### 12.2 Cobrança mensal simplificada

Não criar antecipadamente dezenas de mensalidades futuras.

Armazenar:

- valor mensal;
- dia de vencimento;
- último pagamento;
- próxima data de pagamento;
- status da cobrança atual;
- status do cliente.

### Comportamento

1. Ao ativar o contrato, calcular a primeira data.
2. Ao marcar como recebido, criar a entrada financeira.
3. Avançar a próxima data em um mês.
4. Se vencer sem pagamento, marcar como atrasado.
5. Permitir marcar o cliente como inadimplente.
6. Se cancelar, pausar ou desativar, não avançar novas cobranças.
7. Ao reativar, permitir definir manualmente a próxima data.
8. Nunca gerar duas cobranças da mesma competência.
9. Se o vencimento for dia 29, 30 ou 31 e o mês seguinte tiver menos dias, usar o último dia válido do mês.

### 12.3 Verba de anúncios do dentista

O dentista paga:

1. mensalidade da Digital Smile;
2. verba de anúncios diretamente à plataforma.

A verba do dentista:

- não é receita da Digital Smile;
- não é despesa da Digital Smile;
- não entra no fluxo de caixa;
- não entra no CAC;
- não entra no lucro;
- pode ser apenas um campo informativo no cliente.

---

## 13. Onboarding e entregas da Digital Smile

### 13.1 Onboarding

Seção recolhível dentro do cliente:

- reunião agendada;
- data e horário;
- pagamento inicial recebido;
- contrato assinado;
- reunião realizada;
- acessos recebidos;
- materiais recebidos;
- campanha ou projeto iniciado.

Mostrar um resumo como:

> Onboarding: 5 de 7 etapas concluídas

### 13.2 Entrega de tráfego

Checklist simples:

- onboarding concluído;
- acessos recebidos;
- planejamento concluído;
- campanha criada;
- campanha ativa;
- acompanhamento em andamento;
- relatório enviado;
- reunião de acompanhamento realizada.

### 13.3 Entrega de site

Checklist simples:

- pagamento inicial;
- briefing;
- materiais recebidos;
- estrutura;
- desenvolvimento;
- revisão;
- pagamento final;
- publicado;
- entregue.

Não criar página independente de entregas.

---

## 14. Financeiro unificado

O Financeiro deve centralizar:

- receitas da Vision;
- receitas da Digital Smile;
- receitas extras;
- despesas da Vision;
- despesas da Digital Smile;
- despesas compartilhadas;
- despesas pessoais;
- cartões;
- valores a receber;
- inadimplência;
- transferências.

### 14.1 Filtros rápidos

- tudo;
- Vision;
- Digital Smile;
- extra;
- pessoal.

### 14.2 Lançamento financeiro

Campos:

- tipo;
- valor;
- moeda ou ativo;
- data;
- vencimento;
- data de pagamento;
- status;
- classificação;
- empresa, quando aplicável;
- cliente, quando aplicável;
- venda ou contrato;
- categoria;
- conta;
- cartão;
- parcelas;
- recorrência;
- observação.

### Tipos

- entrada;
- saída;
- transferência.

### Status

- previsto;
- recebido;
- pago;
- parcial;
- atrasado;
- cancelado.

### 14.3 Categorias empresariais

- tráfego pago;
- ferramentas;
- assinaturas;
- Magnific;
- domínio;
- hospedagem;
- freelancer;
- taxas;
- outros.

Impostos não precisam ser implementados agora.

### Despesas recorrentes simplificadas

Assinaturas como Magnific podem ser marcadas como recorrentes.

Não gerar todas as despesas futuras antecipadamente.

Armazenar:

- valor;
- periodicidade;
- próxima data de vencimento;
- categoria;
- empresa;
- status ativo, pausado ou encerrado.

Ao marcar a despesa como paga, criar o lançamento financeiro e avançar a próxima data. A recorrência deve parar quando estiver pausada ou encerrada.

### 14.4 Categorias pessoais

- alimentação;
- transporte;
- cinema e lazer;
- compras;
- saúde;
- assinaturas pessoais;
- outros.

### 14.5 Categorias extras

- Sonati/Sonate;
- Trium/Trio;
- presentes;
- projetos por fora;
- outras entradas extras.

Os nomes devem ser editáveis.

---

## 15. Contas e patrimônio

### 15.1 Conta bancária dos negócios

Vision e Digital Smile utilizam a mesma conta bancária real.

Toda conta patrimonial deve possuir:

- saldo inicial;
- data-base do saldo inicial;
- moeda ou ativo;
- possibilidade de ajuste de saldo com motivo registrado.

O saldo inicial permite calcular patrimônio mesmo quando nem toda a movimentação anterior à data-base estiver detalhada no sistema.


Mesmo compartilhando a conta:

- cada lançamento deve indicar Vision, Digital Smile ou compartilhado;
- os relatórios devem permanecer separados;
- saldo físico e resultado de cada empresa são conceitos diferentes.

### 15.2 Binance — reserva pessoal em USDT

Situação inicial:

- R$ 950 foram guardados em USDT;
- não são US$ 950;
- a conta representa uma reserva pessoal;
- receitas extras e dinheiro pessoal reservado podem ser direcionados a ela.

Permitir:

- quantidade de USDT;
- valor de referência em reais;
- cotação manual;
- aportes;
- retiradas;
- histórico de saldo.

Não buscar cotação automaticamente nesta versão.

### 15.3 Transferências

Transferência do banco para Binance:

- reduz o saldo do banco;
- aumenta o saldo da Binance;
- não é receita;
- não é despesa;
- não altera lucro;
- não entra na meta;
- não pode ser contada duas vezes no patrimônio.

### 15.4 Outras contas futuras

- dinheiro em espécie;
- outras contas bancárias;
- corretoras;
- investimentos;
- reservas adicionais.

### 15.5 Passivos

Controlar:

- cartões;
- parcelas;
- dívidas;
- pagamentos pendentes.

### 15.6 Patrimônio líquido

Fórmula:

> Ativos − Passivos

O patrimônio deve ser calculado por saldos reais das contas e obrigações.

Faturamento histórico não deve ser transformado automaticamente em patrimônio.

---

## 16. Cartões

Permitir registrar cada compra individualmente.

Campos:

- cartão;
- descrição;
- valor total;
- data;
- número de parcelas;
- categoria;
- empresa ou pessoal;
- mês da primeira fatura.

O sistema deve:

- gerar parcelas futuras;
- mostrar fatura atual;
- mostrar próximas faturas;
- mostrar total em aberto;
- separar compras pessoais e empresariais.

Não criar integração bancária.

---

## 17. Meta financeira

### 17.1 Meta principal

- nome: Meta 10K 2026;
- início: 22/06/2026;
- fim: 31/12/2026;
- valor: R$ 10.000;
- base: valor efetivamente recebido;
- empresas incluídas: Vision e Digital Smile;
- extras excluídos.

### 17.2 Regras

- venda ainda não recebida não conta;
- parcela conta quando recebida;
- contrato futuro não antecipa resultado;
- estorno reduz o progresso;
- devolução parcial reduz o valor correspondente;
- extras não contam.

### 17.3 Exibição

- valor atingido;
- percentual;
- quanto falta;
- dias restantes;
- média mensal necessária;
- média semanal necessária;
- evolução mensal.

### 17.4 Metas futuras

Permitir criar meta de 2027 e anos seguintes sem alterar o sistema.

---

## 18. CAC e métricas

### 18.1 CAC da Vision

> Investimento em aquisição da Vision ÷ novos clientes da Vision

### 18.2 CAC da Digital Smile

> Investimento em aquisição da Digital Smile ÷ novos clientes da Digital Smile

### 18.3 O que entra no CAC

- anúncios da empresa;
- outros investimentos diretamente classificados como aquisição.

### 18.4 O que não entra no CAC

- Magnific;
- ferramentas;
- assinaturas;
- despesas pessoais;
- verba de mídia do dentista.

### 18.5 Outras fórmulas

- ticket médio = valor vendido ÷ número de vendas;
- margem = lucro ÷ faturamento;
- ROAS = receita atribuída ÷ investimento;
- MRR = mensalidades vigentes de clientes ativos;
- churn = cancelamentos ÷ clientes ativos no início do período;
- inadimplência = valor vencido ÷ total vencido;
- no-show = reuniões no-show ÷ reuniões agendadas;
- taxa de fechamento = clientes conquistados ÷ propostas;
- LTV realizado = total recebido do cliente;
- payback = CAC ÷ margem mensal média por cliente.

Quando não houver dados suficientes, mostrar “—” em vez de erro ou infinito.

---

## 19. Cancelamentos, estornos e devoluções

Permitir:

- cancelar venda não paga;
- cancelar cobrança;
- estornar recebimento;
- devolução total;
- devolução parcial;
- chargeback;
- cobrança perdoada;
- desconto posterior;
- reabrir cobrança cancelada.

### 19.1 Regras

- nunca apagar o lançamento original;
- criar lançamento de reversão;
- vincular ao registro original;
- atualizar recebido, pendente, lucro, caixa, patrimônio e meta;
- exigir confirmação;
- registrar data e motivo;
- manter histórico de auditoria.

---

## 20. Prevenção de duplicidades

Esta função é crítica.

### 20.1 Clientes

- normalizar telefone;
- ignorar diferenças de espaços, hífens, parênteses e código do país;
- avisar ao encontrar número existente;
- oferecer abrir o cliente atual;
- permitir continuar somente com confirmação;
- permitir mesclar clientes;
- preservar vendas, contratos e pagamentos na mesclagem;
- permitir reabrir leads marcados como `perdido`, retornando-os para `follow-up` ou outro estágio escolhido.

### 20.2 Pagamentos

- dois cliques em “Recebido” não podem gerar duas entradas;
- uma parcela só pode possuir um lançamento financeiro ativo;
- uma competência mensal não pode ser duplicada;
- avisar sobre lançamento semelhante por cliente, valor e data;
- usar identificadores idempotentes.

### 20.3 Exclusão

- exclusão lógica;
- registros excluídos não entram nos cálculos;
- permitir restauração;
- exclusão definitiva somente em ferramenta administrativa.

---

## 21. Fechamento mensal

Criar fechamento mensal simples.

Guardar:

- faturamento dos negócios;
- valor recebido dos negócios;
- receitas extras;
- despesas por empresa;
- despesas compartilhadas;
- despesas pessoais;
- investimento;
- lucro;
- clientes conquistados;
- CAC;
- inadimplência;
- patrimônio no fim do mês.

### 21.1 Regras

- fechamento é snapshot;
- não substitui lançamentos originais;
- permitir reabrir com confirmação;
- indicar necessidade de recálculo após alteração;
- comparar com o mês anterior;
- não criar contabilidade fiscal.

---

## 22. Busca global

Criar busca discreta no topo.

Pesquisar:

- cliente;
- telefone;
- clínica;
- venda;
- serviço;
- cobrança;
- contrato;
- lançamento financeiro.

Agrupar resultados por tipo e abrir diretamente o registro.

---

## 23. Alertas mínimos

Exibir apenas quando necessário:

- cobrança vencida;
- vencimento de hoje;
- reunião próxima;
- contrato não assinado;
- onboarding incompleto;
- segunda parcela pendente;
- follow-up vencido;
- entrega atrasada.

Não implementar envio por WhatsApp, e-mail ou push nesta versão.

---

## 24. Exportação e backup

Permitir exportar CSV de:

- clientes;
- vendas;
- recebimentos;
- despesas;
- cobranças;
- patrimônio;
- fechamento mensal.

Permitir relatório mensal para impressão ou PDF.

O relatório deve mostrar:

- faturamento;
- recebido;
- despesas;
- lucro;
- Vision;
- Digital Smile;
- extras;
- meta;
- patrimônio.

Antes de qualquer migração destrutiva, deve existir backup válido do Supabase.

---

## 25. Segurança

Mesmo com apenas um usuário:

- login por e-mail e senha;
- senha com armazenamento seguro;
- sessão protegida;
- logout;
- proteção de rotas;
- limite de tentativas;
- segredos fora do código;
- nenhuma rota pública com dados financeiros;
- confirmação de ações críticas;
- trilha de auditoria;
- políticas de acesso do Supabase quando aplicável.

Não criar equipe ou permissões múltiplas.

---

## 26. Design e responsividade

### 26.1 Direção visual

- tema escuro como padrão;
- fundo quase preto;
- cards escuros;
- bordas discretas;
- aparência premium;
- tipografia clara;
- bom espaçamento;
- verde para valores positivos;
- vermelho para despesas e atrasos;
- amarelo ou dourado para metas e Vision;
- azul para Digital Smile;
- roxo somente quando necessário para extras.

Evitar:

- animações excessivas;
- efeitos decorativos;
- dezenas de cores;
- dashboards densos;
- ícones sem função.

### 26.2 Computador

- sidebar compacta;
- tabelas;
- filtros;
- gráficos;
- edição detalhada.

### 26.3 Tablet

- cards em duas colunas;
- tabelas adaptadas;
- formulários laterais ou modais.

### 26.4 Celular

- navegação compacta;
- cards empilhados;
- botão “Adicionar”;
- listas resumidas;
- detalhes em tela cheia;
- sem tabelas horizontais inutilizáveis.

### 26.5 Ação global

Criar botão “Adicionar” com:

- receita;
- despesa;
- cliente;
- lead;
- investimento em anúncio.

O contexto deve preencher automaticamente a empresa atual.

---

## 27. Configurações

Permitir editar:

- produtos;
- preços;
- preços de referência;
- regras de pagamento;
- categorias;
- contas;
- cartões;
- fontes de leads;
- estágios;
- metas;
- despesas recorrentes;
- empresas;
- status;
- cotação manual do USDT.

Produtos inativos não devem aparecer na operação.

---

## 28. Histórico atual a preservar

O aplicativo atual e o Supabase precisam ser analisados.

Referências visuais anteriores indicavam aproximadamente:

- entradas totais: R$ 1.361;
- Vision/fotos e vídeos: R$ 961;
- Sonati: R$ 400;
- Digital Smile: R$ 0;
- Trium: R$ 0;
- sites: R$ 0;
- investimento: R$ 488,81;
- 13 vendas;
- ciclo de junho a dezembro de 2026.

Esses números não devem ser usados como verdade sem validação no banco.

### 28.1 Mapeamento esperado

- Fotos/Vídeos com IA → Vision;
- Digital Smile → Digital Smile;
- Sonati/Sonate → Extra;
- Trium/Trio → Extra;
- Venda de Sites → Vision ou Digital Smile;
- site sem empresa → pendente de classificação.

Registros históricos que não puderem ser identificados com segurança durante a migração devem entrar em uma **revisão temporária de classificação**.

Exemplos:

- venda antiga de site sem informação sobre Vision ou Digital Smile;
- entrada antiga sem indicação clara de empresa ou categoria;
- despesa antiga sem informação suficiente para saber se é pessoal ou empresarial.

Regras:

- não adivinhar a classificação;
- preservar o registro e seu valor;
- mostrar uma lista temporária de revisão apenas enquanto existirem pendências;
- permitir escolher Vision, Digital Smile, Extra ou Pessoal;
- recalcular os indicadores após a classificação;
- depois que todas as pendências forem resolvidas, essa lista deixa de aparecer;
- isso não é uma nova área permanente do aplicativo.

A antiga meta de R$ 11.200 deve ser preservada como histórico, mas substituída como meta ativa pela Meta 10K 2026.

Todo valor elegível da Vision ou Digital Smile que tiver sido efetivamente recebido entre **22/06/2026 e 31/12/2026** deve contar para a Meta 10K 2026, mesmo que tenha sido registrado originalmente durante a vigência da meta antiga.

Com base na referência visual, aproximadamente R$ 961 da Vision podem contar para a nova meta se o banco confirmar que foram recebidos dentro do período. Os R$ 400 classificados como Sonati/Sonate continuam como receita extra e não contam.

Nenhum dado histórico válido deve ser apagado.

---

## 29. Modelo conceitual de dados

A estrutura final deve conseguir representar:

- empresas;
- clientes globais;
- produtos e serviços;
- oportunidades;
- vendas;
- parcelas;
- contratos;
- onboarding;
- entregas;
- campanhas;
- transações financeiras;
- contas;
- cartões;
- metas;
- fechamentos mensais;
- estornos;
- auditoria;
- dados legados e mapa de migração.

O modelo físico deve ser definido depois da auditoria do banco existente.

Não criar tabelas duplicadas quando uma estrutura atual puder ser adaptada com segurança.

---

## 30. Fora do escopo da versão 1

Não implementar agora:

- múltiplos usuários;
- equipe;
- permissões por cargo;
- contador;
- impostos;
- nota fiscal;
- integração bancária;
- integração com cartão;
- integração com Meta Ads;
- integração com Google Ads;
- integração com WhatsApp;
- integração com Instagram;
- scraping;
- automação de prospecção;
- importação automática do Google Maps;
- armazenamento direto de contrato;
- envio automático de cobrança;
- cotação automática de USDT;
- CRM complexo;
- calendário completo;
- gestão avançada de projetos;
- gamificação;
- metas obrigatórias de mensagens;
- registro de cada interação;
- relatórios em dezenas de páginas.

---

## 31. Critérios de aceitação

A versão 1 só está correta se:

1. O Dashboard tiver foco financeiro.
2. Existirem apenas cinco áreas principais.
3. Vision e Digital Smile possuírem quatro abas cada.
4. Extras não entrarem na meta.
5. Extras não aumentarem indicadores empresariais.
6. Venda e recebimento forem separados.
7. Fotos usarem pagamento integral antecipado.
8. Vídeos e sites usarem 50/50 por padrão.
9. Gestão de tráfego usar cobrança mensal individual.
10. Um cliente puder comprar vários serviços.
11. Site puder ser vendido pelas duas empresas.
12. Site não for uma empresa separada.
13. Verba do dentista não entrar no financeiro.
14. CAC for separado por empresa.
15. Ferramentas não entrarem no CAC.
16. Digital Smile possuir contrato e onboarding dentro do cliente.
17. Inadimplência for controlada.
18. Cartões aceitarem parcelamento.
19. Patrimônio usar saldos reais.
20. Produtos futuros ficarem invisíveis.
21. Dados históricos forem preservados.
22. O app funcionar em desktop, tablet e celular.
23. Estornos corrigirem todos os indicadores.
24. Clientes e pagamentos duplicados forem bloqueados ou alertados.
25. Existir fechamento mensal.
26. Existir busca global.
27. Existir autenticação.
28. Existir exportação e backup.
29. Exclusões financeiras forem lógicas.
30. A interface continuar minimalista.

---

## 32. Ordem conceitual da construção

A construção deve seguir:

1. auditoria do código atual;
2. auditoria do Supabase;
3. backup;
4. inventário do histórico;
5. mapa de migração;
6. desenho final do banco;
7. migrações não destrutivas;
8. validação dos dados;
9. Dashboard;
10. Vision;
11. Digital Smile;
12. Financeiro;
13. Metas e Patrimônio;
14. segurança;
15. testes;
16. migração final;
17. validação em produção.

Nenhuma exclusão de tabela antiga deve ocorrer na primeira implantação.

---

## 33. Resultado esperado

O resultado deve ser um aplicativo no qual o usuário consiga abrir a tela inicial e entender sua situação financeira em poucos segundos.

O sistema deve oferecer controle suficiente para escalar a Vision e a Digital Smile durante 2026, 2027 e os anos seguintes, sem se transformar em uma ferramenta pesada.

A regra final do produto é:

> **Completo nos cálculos, simples na rotina e minimalista na interface.**
