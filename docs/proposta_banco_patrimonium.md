# Proposta técnica — Modelo de dados definitivo do Patrimonium (Fase 4) — v2

**Status:** proposta consolidada, aprovada conceitualmente, aguardando aprovação final para substituir `docs/proposta_banco_patrimonium.md`. **Nenhuma migration foi criada, nenhum comando SQL foi executado, nenhuma tabela antiga foi alterada ou apagada.**

**Fontes usadas nesta proposta:**
- `CLAUDE.md`
- `docs/01_especificacao_completa_ecossistema_financeiro_v1_2.md`
- `docs/auditoria_schema_atual.md`
- `docs/auditoria_dados_atual.md`
- `docs/itens_para_confirmacao.md`

Este documento foi escrito do zero como versão 2, incorporando todas as decisões consolidadas nesta sessão. Cada tabela e cada seção aparece **uma única vez**.

---

## 0. Princípios que guiaram o desenho

- Empresa, produto/serviço, origem do cliente e canal de aquisição são **quatro dimensões separadas** — nenhuma tabela mistura essas dimensões como a antiga `fontes` fazia.
- **`empresa_id` (FK para `empresas`) é a única referência de empresa em todo o banco.** Não existe nenhum enum com valores `"vision"`/`"digital_smile"` em lugar nenhum do modelo novo — a antiga coluna `classificacao` foi removida definitivamente.
- **`natureza`** classifica o financeiro (`receita_empresarial`, `receita_extra`, `despesa_empresarial`, `despesa_pessoal`, `transferencia`) — dimensão ortogonal a `empresa_id`, nunca um substituto dela.
- **`tipo`** (`entrada`,`saida`,`transferencia`) é a direção pura do caixa — coincide com `natureza` exceto em linhas de estorno, onde `natureza` preserva o balde original enquanto `tipo` se inverte.
- Vendido, recebido e pendente são **sempre calculados**, nunca campos redundantes que podem dessincronizar.
- **Nenhum status "atrasado"/"atrasada" é armazenado em lugar nenhum do banco.** Atraso é sempre uma condição derivada (`data_vencimento < hoje AND saldo_pendente > 0 AND status <> 'cancelada'`), calculada em view/consulta — o Postgres não dispara nada sozinho com a passagem do tempo, então um status gravado ficaria obsoleto sem uma operação explícita. Não existe job/trigger para "marcar atraso".
- `parcelas` é a tabela única de "o que é devido e quando" — serve vendas e assinaturas, exatamente uma origem por linha, nunca as duas, nunca nenhuma.
- Uma parcela pode receber **vários** lançamentos (pagamentos parciais, múltiplos estornos) — nenhuma unique constraint em `lancamentos_financeiros` restringe isso.
- O avanço da próxima cobrança de uma assinatura depende da **criação** da parcela da competência, nunca do **pagamento** dela.
- Nenhuma FK em dado financeiro/histórico usa `ON DELETE CASCADE`. Exclusão é sempre lógica ou `RESTRICT`.
- Toda tabela sensível exige autenticação e tem RLS habilitado; `anon` não tem nenhum acesso.
- Receita extra nunca entra automaticamente em faturamento, lucro, CAC, ticket médio ou Meta 10K.
- Pipeline nunca é somado como receita — só a venda formal conta.
- Estruturas antigas fora de escopo (`push_subscriptions`, `conversas`, `mensagens`, `fontes` bruta) não são copiadas; permanecem intactas até a limpeza final aprovada.
- Casos históricos "em revisão" usam `revisoes_migracao`/`candidatos_duplicidade_cliente`, não bloqueiam migrations.
- Nenhuma tabela nova só para "rateio" de despesa compartilhada — resolvido com `despesa_compartilhada_grupo_id` e múltiplas linhas criadas atomicamente na mesma transação.

---

## 1. Empresas

### `empresas`
**Finalidade:** cadastro fixo das duas empresas operacionais.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| nome | text | "Vision", "Digital Smile" |
| slug | text unique | `vision`, `digital_smile` |
| cor_tema | text | uso só na UI |
| ativa | boolean | default true |
| criado_em | timestamptz | |

- **Relacionamentos:** referenciada por praticamente todas as tabelas comerciais e financeiras.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only. Seed fixo de 2 linhas.

---

## 2. Produtos e serviços

### `produtos_servicos`
**Finalidade:** catálogo de produtos/serviços por empresa — dimensão separada de "empresa".

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| empresa_id | uuid FK → empresas | not null |
| nome | text | "5 fotos com IA", "Vídeo com IA", "Combo Fotos + Vídeo", "Site", "Gestão de Tráfego Pago", "Google Meu Negócio" |
| tipo_cobranca | text check (`unico`,`recorrente_mensal`) | define se gera `vendas` ou `assinaturas` |
| preco_tabela | numeric(10,2) | nullable |
| preco_referencia | numeric(10,2) | nullable |
| regra_pagamento_padrao | jsonb | sugestão de condição — nunca fonte de verdade financeira |
| ativo | boolean | |
| ordem | integer | default 0 |
| criado_em / atualizado_em | timestamptz | |

- **Constraints:** `unique(empresa_id, nome)`. "Site" existe como duas linhas (Vision e Digital Smile) — nunca é uma terceira empresa.
- **Seed inicial ativo (dia 1):** Vision → Fotos com IA, Vídeos com IA, Combos, Sites. Digital Smile → Gestão de Tráfego Pago. Google Meu Negócio entra **inativo**.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

---

## 3. Clientes globais e duplicidade

### `clientes`
**Finalidade:** cliente único, independente de empresa.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| nome | text not null | |
| telefone | text | como digitado |
| telefone_normalizado | text | dígitos apenas, sem símbolos nem caracteres Unicode de direção |
| email / cpf_cnpj / empresa_clinica_nome / instagram / drive_link / observacao | | opcionais |
| tipo_registro | text check (`normal`,`legado_teste`) | default `normal` |
| motivo_legado_teste | text | |
| ativo | boolean | default true |
| excluido_em | timestamptz | nullable — soft delete |
| legado_tabela_origem / legado_id_origem / migrado_em | | |
| criado_em / atualizado_em | timestamptz | |

- **Constraint de unicidade:**
  ```sql
  CREATE UNIQUE INDEX clientes_telefone_normalizado_unico
    ON clientes (telefone_normalizado)
    WHERE tipo_registro = 'normal'
      AND excluido_em IS NULL
      AND telefone_normalizado IS NOT NULL;
  ```
  Aplica-se só a clientes normais e ativos — não bloqueia duplicados legado/teste nem casos históricos ainda em revisão.
- **Índices:** `btree(telefone_normalizado)`, `btree(tipo_registro)`.
- **Exclusão:** `RESTRICT` a nível de FK; soft delete via `ativo/excluido_em`.
- **RLS:** authenticated only.

### `candidatos_duplicidade_cliente`
**Finalidade:** registrar pares suspeitos sem mesclar automaticamente.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| cliente_id_a / cliente_id_b | uuid FK → clientes | |
| motivo | text check (`telefone_identico`,`nome_similar`,`sufixo_edited`,`email_igual`,`cadastro_proximo`) | |
| status | text check (`pendente`,`mesclado`,`rejeitado`) | default `pendente` |
| decidido_em | timestamptz | |
| observacao | text | |
| criado_em | timestamptz | |

- **Constraints:** `unique(cliente_id_a, cliente_id_b)`; `check(cliente_id_a <> cliente_id_b)`.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

---

## 4. Prospecção (leads e negociações)

### `oportunidades`
**Finalidade:** pipeline comercial de cada empresa — nunca é receita por si só.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| empresa_id | uuid FK → empresas | |
| cliente_id | uuid FK → clientes | nullable |
| nome_contato / telefone_contato | text | usados enquanto não há `cliente_id` |
| servico_interesse_id | uuid FK → produtos_servicos | nullable |
| canal_id | uuid FK → canais_aquisicao | |
| campanha_id | uuid FK → campanhas | nullable, atribuição manual |
| estagio | text | valores por empresa (ver abaixo) |
| proxima_acao / proxima_acao_data | | |
| motivo_perda | text | |
| reaberto_em | timestamptz | permite reabrir lead perdido |
| venda_id | uuid FK → vendas | preenchido só quando a negociação vira venda — impede dupla contagem |
| observacao | text | |
| legado_tabela_origem / legado_id_origem / migrado_em | | |
| criado_em / atualizado_em | timestamptz | |

- **Estágios Vision:** `interessado, follow_up, orcamento_enviado, fechado, perdido`.
- **Estágios Digital Smile:** `interessado, reuniao_agendada, reuniao_realizada, proposta_enviada, follow_up, fechado, perdido`.
- **Regra central:** `estagio='fechado'` nunca gera lançamento financeiro sozinho — só a conversão explícita em `vendas` faz isso.
- **Relacionamentos:** `reunioes` (1:N).
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `reunioes`
**Finalidade:** status de reunião da Digital Smile, independente do estágio do lead.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| oportunidade_id | uuid FK → oportunidades | |
| data | date | |
| horario | time | |
| status | text check (`agendada`,`realizada`,`no_show`,`cancelada`) | |
| observacao | text | |
| criado_em | timestamptz | |

- Mudar `status` aqui nunca altera `oportunidades.estagio` automaticamente.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

---

## 5. Vendas

### `vendas`
**Finalidade:** venda formal — única fonte de "valor vendido" por empresa/produto/cliente.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| empresa_id | uuid FK → empresas | not null |
| produto_id | uuid FK → produtos_servicos | not null |
| cliente_id | uuid FK → clientes | nullable só para registros legados migrados |
| oportunidade_id | uuid FK → oportunidades | nullable |
| quantidade | integer | default 1 |
| preco_tabela | numeric(10,2) | nullable |
| desconto_valor / desconto_motivo | | |
| valor_final | numeric(10,2) | not null — o "vendido" |
| data_venda | date | not null |
| condicao_pagamento | jsonb | **descritivo/snapshot da negociação — nunca fonte de verdade financeira.** A fonte oficial de valor devido, vencimentos, recebido e pendente é sempre `parcelas` + `lancamentos_financeiros` |
| canal_id | uuid FK → canais_aquisicao | |
| campanha_id | uuid FK → campanhas | nullable |
| status | text check (`ativa`,`cancelada`) | default `ativa` |
| status_entrega | text check (`aguardando_pagamento`,`aguardando_material`,`em_producao`,`aguardando_aprovacao`,`entregue`,`finalizado`) | usado quando `empresa_id = Vision` |
| checklist_entrega | jsonb | usado quando `empresa_id = Digital Smile` e o produto é Site |
| drive_link / observacao | | |
| legado_tabela_origem / legado_id_origem / legado_observacao_original / migrado_em | | |
| criado_em / atualizado_em | timestamptz | |

- **Constraints:** `check(valor_final >= 0)`.
- **Índices:** `(empresa_id, data_venda)`, `(cliente_id)`, `(produto_id)`.
- **Exclusão:** `RESTRICT`. Cancelamento é `status='cancelada'`, nunca `DELETE`.
- **RLS:** authenticated only.

Suporta diretamente: fotos 100% antecipado, vídeo 50/50, combo personalizado, site normalmente 50/50, condições customizadas — descrito em `condicao_pagamento`, efetivado em `parcelas`.

---

## 6. Cobranças, parcelas e pagamentos

### `parcelas`
**Finalidade:** tabela única de "o que é devido e quando" — serve vendas e assinaturas, nunca as duas na mesma linha.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| venda_id | uuid FK → vendas | nullable |
| assinatura_id | uuid FK → assinaturas | nullable |
| competencia_referencia | date | nullable — obrigatório só quando `assinatura_id` está preenchido (primeiro dia do mês cobrado) |
| numero | integer | nullable — obrigatório só quando `venda_id` está preenchido (1, 2, ...) |
| descricao | text | "entrada", "entrega", "mensalidade 08/2026" |
| valor_devido | numeric(10,2) | not null |
| data_vencimento | date | not null |
| status | text check (`prevista`,`parcial`,`paga`,`cancelada`) | **apenas estados persistentes — "atrasada" nunca é gravado aqui** |
| criado_em / atualizado_em | timestamptz | |
| legado_tabela_origem / legado_id_origem / migrado_em | | |

- **Constraints:**
  ```sql
  CHECK ((venda_id IS NOT NULL AND assinatura_id IS NULL)
      OR (venda_id IS NULL AND assinatura_id IS NOT NULL))
  CHECK (assinatura_id IS NULL OR competencia_referencia IS NOT NULL)
  CHECK (venda_id IS NULL OR competencia_referencia IS NULL)
  CHECK (venda_id IS NULL OR numero IS NOT NULL)

  CREATE UNIQUE INDEX parcelas_competencia_unica
    ON parcelas (assinatura_id, competencia_referencia)
    WHERE assinatura_id IS NOT NULL;

  CREATE UNIQUE INDEX parcelas_numero_unico
    ON parcelas (venda_id, numero)
    WHERE venda_id IS NOT NULL;
  ```
- **Manutenção do `status`:** mantido por trigger a partir da soma de `lancamentos_financeiros` vinculados (`prevista` → nada recebido; `parcial` → recebido líquido > 0 e < devido; `paga` → recebido líquido = devido). `cancelada` é a única transição feita diretamente pela aplicação; o trigger nunca a sobrescreve.
- **Índices:** `(status)`, `(data_vencimento)`, `(assinatura_id)`, `(venda_id)`.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

**Atraso — sempre derivado, nunca armazenado:**
```
saldo_pendente(parcela) = valor_devido
  − SUM(lancamentos_financeiros.valor WHERE parcela_id = X AND tipo = 'entrada')
  + SUM(lancamentos_financeiros.valor WHERE parcela_id = X AND estorno_de_id IS NOT NULL)

situacao(parcela) =
  CASE
    WHEN status = 'cancelada'                                    THEN 'cancelada'
    WHEN data_vencimento < hoje AND saldo_pendente(parcela) > 0   THEN 'atrasada'
    ELSE status
  END
```
Implementado como view/consulta (ex.: `parcelas_situacao`) — nunca coluna gravada. Não existe job nem trigger que "marca atrasada"; dashboard, filtros e o bloco "Atenção" sempre leem essa view/consulta.

**Pagamentos:** não existe tabela `pagamentos` separada. Um pagamento é uma linha de `lancamentos_financeiros` com `tipo='entrada'` e `parcela_id` preenchido. Uma parcela pode ter várias linhas de `lancamentos_financeiros` — não há nenhum unique sobre `parcela_id` sozinho.

**Exemplo válido de pagamento parcial:**
```
parcela (valor_devido = 500.00)
  → lancamento A: entrada, valor = 300.00, idempotency_key = 'ui-submit-8f2a...'
  → lancamento B: entrada, valor = 200.00, idempotency_key = 'ui-submit-91cd...'
  → ambos coexistem; parcela.status: 'prevista' → 'parcial' (após A) → 'paga' (após B)
```

**Idempotência:** `lancamentos_financeiros.idempotency_key` é `unique`, gerada pelo cliente/formulário a cada submissão individual (nunca derivada só de `parcela_id` ou de competência) — protege contra clique duplo/retry sem bloquear um segundo pagamento parcial genuíno.

---

## 7. Assinaturas (mensalidades recorrentes de cliente)

### `assinaturas`
**Finalidade:** contratos recorrentes (gestão de tráfego pago da Digital Smile, e qualquer futuro serviço recorrente).

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| empresa_id | uuid FK → empresas | normalmente Digital Smile |
| cliente_id | uuid FK → clientes | |
| produto_id | uuid FK → produtos_servicos | `tipo_cobranca='recorrente_mensal'` |
| oportunidade_id | uuid FK → oportunidades | nullable — vínculo comercial padrão |
| venda_origem_id | uuid FK → vendas | nullable — rastreabilidade quando a assinatura nasce vinculada a uma venda pontual (ex.: site + tráfego fechados juntos) |
| valor_mensal | numeric(10,2) | valor/preço contratado |
| preco_referencia | numeric(10,2) | nullable |
| dia_vencimento | integer | 1–31, ajustado para o último dia válido do mês |
| data_inicio | date | |
| status | text check (`onboarding`,`ativo`,`pagamento_pendente`,`inadimplente`,`em_risco`,`pausado`,`cancelado`,`finalizado`) | estado do relacionamento comercial — distinto da situação de cada parcela; transição sempre decidida pela aplicação/usuário |
| proxima_data_cobranca | date | avança quando a parcela da competência atual é **criada com sucesso**, nunca quando é **paga** |
| data_cancelamento | date | dado de cancelamento |
| motivo_cancelamento | text | dado de cancelamento |
| contrato_necessario | boolean | |
| contrato_enviado | boolean | |
| contrato_assinado | boolean | |
| data_assinatura_contrato | date | |
| contrato_drive_link | text | |
| checklist_onboarding | jsonb | etapas da seção 13.1 da especificação |
| checklist_entrega_trafego | jsonb | etapas da seção 13.2 |
| verba_anuncios_dentista_estimada | numeric(10,2) | informativo apenas — nunca entra em `lancamentos_financeiros` |
| canal_id | uuid FK → canais_aquisicao | |
| campanha_id | uuid FK → campanhas | nullable |
| legado_tabela_origem / legado_id_origem / migrado_em | | |
| criado_em / atualizado_em | timestamptz | |

- **Constraint:** `unique(cliente_id, produto_id) WHERE status NOT IN ('cancelado','finalizado')` — impede duas assinaturas ativas do mesmo serviço para o mesmo cliente.
- **Regra de avanço da cobrança:**
  1. Ao chegar `proxima_data_cobranca <= hoje`, cria-se **uma única** linha em `parcelas` (`assinatura_id`, `competencia_referencia`, `valor_devido = valor_mensal`, `data_vencimento` calculada a partir de `dia_vencimento`) **e, na mesma operação, `proxima_data_cobranca` avança para o mês seguinte** — depende só da criação, nunca do pagamento.
  2. Isso permite que agosto fique `parcial`/pendente e, mesmo assim, setembro gere sua própria parcela normalmente quando chegar a hora — **várias competências podem ficar pendentes/atrasadas ao mesmo tempo** para a mesma assinatura.
  3. `unique(assinatura_id, competencia_referencia)` em `parcelas` garante que a geração nunca duplica o mês, mesmo se disparada duas vezes.
  4. Nunca gera competência futura antes da hora; se o app ficar sem uso por meses, as competências em atraso são geradas uma de cada vez na próxima vez que o app for usado, sempre respeitando o unique.
- **Exclusão:** `RESTRICT`. Cancelamento/pausa é `status`. **RLS:** authenticated only.

---

## 8. Financeiro (razão único)

### `lancamentos_financeiros`
**Finalidade:** único razão de todo movimento de dinheiro — receitas empresariais, receitas extras, despesas empresariais, despesas pessoais, investimentos, transferências, parcelas de cartão.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| tipo | text check (`entrada`,`saida`,`transferencia`) | direção pura do caixa |
| natureza | text check (`receita_empresarial`,`receita_extra`,`despesa_empresarial`,`despesa_pessoal`,`transferencia`) | classificação de negócio — ortogonal a `empresa_id` |
| empresa_id | uuid FK → empresas | nullable — **única referência de empresa em todo o banco; não existe coluna `classificacao`** |
| categoria_id | uuid FK → categorias_financeiras | |
| cliente_id | uuid FK → clientes | nullable |
| venda_id | uuid FK → vendas | nullable — só para consulta direta; o vínculo formal é via `parcela_id → parcelas.venda_id` |
| parcela_id | uuid FK → parcelas | nullable — **pagamento de assinatura chega à assinatura por `parcela_id → parcelas.assinatura_id`; não existe coluna `assinatura_id` direta aqui** |
| campanha_id | uuid FK → campanhas | nullable |
| compra_cartao_id | uuid FK → compras_cartao | nullable |
| numero_parcela_cartao | integer | nullable, obrigatório junto com `compra_cartao_id` |
| despesa_recorrente_id | uuid FK → despesas_recorrentes | nullable |
| competencia_referencia | date | nullable — usado só para `despesa_recorrente_id` |
| despesa_compartilhada_grupo_id | uuid | nullable — mesmo valor em todas as linhas do rateio de uma despesa compartilhada |
| conta_id | uuid FK → contas | not null |
| conta_destino_id | uuid FK → contas | nullable — só para `tipo='transferencia'` |
| valor | numeric(10,2) | not null, sempre positivo |
| data_competencia | date | not null |
| data_vencimento | date | nullable |
| data_pagamento | date | nullable |
| status | text check (`previsto`,`recebido`,`pago`,`cancelado`) | **sem "atrasado" — derivado por `data_vencimento < hoje AND status='previsto'`** |
| estorno_de_id | uuid FK → lancamentos_financeiros (self) | nullable |
| motivo_estorno | text check (`devolucao_total`,`devolucao_parcial`,`chargeback`,`cobranca_perdoada`,`desconto_posterior`) | nullable |
| idempotency_key | text unique | gerada pelo cliente/formulário a cada submissão individual |
| entra_no_cac | boolean | copiado de `categorias_financeiras.entra_no_cac` no momento da inserção (trigger) |
| legado_tabela_origem / legado_id_origem / legado_observacao_original / migrado_em | | |
| observacao | text | |
| criado_em / atualizado_em | timestamptz | |

**Constraints centrais (com exceção para linhas de estorno, validada por trigger):**
```sql
CHECK (estorno_de_id IS NOT NULL OR natureza <> 'receita_empresarial'
       OR (tipo = 'entrada' AND empresa_id IS NOT NULL))
CHECK (estorno_de_id IS NOT NULL OR natureza <> 'despesa_empresarial'
       OR (tipo = 'saida' AND empresa_id IS NOT NULL))
CHECK (natureza <> 'receita_extra' OR (empresa_id IS NULL AND parcela_id IS NULL))
CHECK (natureza <> 'despesa_pessoal' OR empresa_id IS NULL)
CHECK (natureza <> 'transferencia'
       OR (tipo = 'transferencia' AND empresa_id IS NULL AND categoria_id IS NULL
           AND conta_destino_id IS NOT NULL AND conta_destino_id <> conta_id))
CHECK ((tipo = 'transferencia') = (natureza = 'transferencia'))
CHECK (NOT entra_no_cac OR (natureza = 'despesa_empresarial' AND empresa_id IS NOT NULL))
CHECK (compra_cartao_id IS NULL OR numero_parcela_cartao IS NOT NULL)
CHECK (valor >= 0)

CREATE UNIQUE INDEX lancamentos_idempotency_unico ON lancamentos_financeiros (idempotency_key);
CREATE UNIQUE INDEX lancamentos_parcela_cartao_unico ON lancamentos_financeiros (compra_cartao_id, numero_parcela_cartao);
CREATE UNIQUE INDEX lancamentos_despesa_recorrente_competencia_unica
  ON lancamentos_financeiros (despesa_recorrente_id, competencia_referencia)
  WHERE despesa_recorrente_id IS NOT NULL;
```
- **Nenhum unique sobre `parcela_id` sozinho** — permite vários pagamentos e estornos para a mesma parcela.
- **Índices:** `(natureza, data_competencia)`, `(empresa_id)`, `(status)`, `(cliente_id)`, `(parcela_id)`, `(despesa_compartilhada_grupo_id)`.
- **Exclusão:** `RESTRICT`. Nunca `DELETE` de um lançamento real.
- **RLS:** authenticated only; `anon` zero acesso; `service_role` só em rotinas internas controladas.

**Estorno/devolução/chargeback:** nova linha, `estorno_de_id` apontando para o lançamento original (nunca apagado nem sobrescrito), mesmo `parcela_id`, valor igual ou menor (parcial), `motivo_estorno` diferenciando os casos. O saldo líquido da parcela é sempre recalculado como pagamentos menos estornos vinculados (fórmula na seção 6).

**Despesa compartilhada:** dividida em N linhas atômicas (uma por empresa), cada uma `natureza='despesa_empresarial'`, `empresa_id` próprio, valor já rateado, todas com o mesmo `despesa_compartilhada_grupo_id`. Criadas na mesma transação (todas ou nenhuma), via função de aplicação — nunca existe um rateio parcialmente salvo. O valor total é sempre `SUM(valor) WHERE despesa_compartilhada_grupo_id = X`. Nenhuma tabela nova para isso.

### `categorias_financeiras`
| Coluna | Tipo |
|---|---|
| id | uuid PK |
| nome | text |
| grupo | text check (`empresarial`,`pessoal`,`extra`) |
| entra_no_cac | boolean default false |
| ativo | boolean |

- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `contas`
**Finalidade:** patrimônio real — bancária, cripto, espécie, investimento.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| nome | text | "Conta principal", "Binance USDT" |
| tipo | text check (`bancaria`,`cripto`,`especie`,`investimento`) | |
| moeda_ativo | text | `BRL`, `USDT` |
| saldo_inicial | numeric(14,2) | |
| data_base | date | |
| quantidade_ativo | numeric(18,8) | nullable, só `tipo='cripto'` |
| cotacao_manual_brl | numeric(10,2) | nullable, só `tipo='cripto'` |
| ativa | boolean | |
| criado_em | timestamptz | |

- Binance/USDT é só mais uma linha aqui (`tipo='cripto'`) — **sem subsistema cripto separado**.
- Vision e Digital Smile compartilham a mesma linha física de conta bancária — separação só por `lancamentos_financeiros.empresa_id`.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `cartoes`
| Coluna | Tipo |
|---|---|
| id | uuid PK |
| nome / dia_fechamento / dia_vencimento / ativo | |

- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `compras_cartao`
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| cartao_id | uuid FK → cartoes | |
| descricao | text | |
| valor_total | numeric(10,2) | |
| data_compra | date | |
| numero_parcelas | integer | |
| categoria_id | uuid FK → categorias_financeiras | |
| empresa_id | uuid FK → empresas | nullable — `NULL` = despesa pessoal |
| despesa_compartilhada_grupo_id | uuid | nullable — mesmo padrão de rateio, se a compra for dividida entre empresas |
| mes_primeira_fatura | date | |
| criado_em | timestamptz | |

- Ao cadastrar, **todas as parcelas futuras são geradas imediatamente** (diferente de assinaturas/despesas recorrentes) — cada uma vira uma linha em `lancamentos_financeiros` (`tipo='saida'`, `status='previsto'`, `compra_cartao_id` + `numero_parcela_cartao`), com `unique(compra_cartao_id, numero_parcela_cartao)`.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `despesas_recorrentes`
**Finalidade:** despesas empresariais ou pessoais recorrentes sem cliente associado (Magnific, domínio, ferramentas etc.) — separada de `assinaturas`, que é sempre receita de cliente.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| nome | text | "Magnific", "domínio site X" |
| valor | numeric(10,2) | |
| periodicidade | text check (`mensal`,`anual`) | |
| proxima_data_vencimento | date | |
| categoria_id | uuid FK → categorias_financeiras | |
| empresa_id | uuid FK → empresas | nullable — `NULL` = pessoal |
| despesa_compartilhada_grupo_id | uuid | nullable |
| status | text check (`ativo`,`pausado`,`encerrado`) | |
| criado_em / atualizado_em | timestamptz | |

- **Não gera meses futuros em massa** — só `proxima_data_vencimento`. Ao marcar como paga: cria `lancamentos_financeiros` (`despesa_recorrente_id`, `competencia_referencia` = mês pago) e avança `proxima_data_vencimento`. `unique(despesa_recorrente_id, competencia_referencia)` em `lancamentos_financeiros` impede duplicar o mês. Para quando `status <> 'ativo'`.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `campanhas`
| Coluna | Tipo |
|---|---|
| id | uuid PK |
| empresa_id | uuid FK → empresas |
| nome / data_inicio / data_fim / observacao / ativa | |

- Investimento da campanha = `SUM(lancamentos_financeiros.valor) WHERE campanha_id = X AND entra_no_cac = true`.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `canais_aquisicao`
| Coluna | Tipo |
|---|---|
| id | uuid PK |
| nome | text (`Instagram`,`WhatsApp`,`Indicação`,`Anúncio`,`Google Maps`,`Lista própria`,`Outro`) |
| ativo | boolean |

- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `metas`
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| nome | text | "Meta 10K 2026" |
| valor_alvo | numeric(10,2) | 10000.00 |
| data_inicio / data_fim | date | 22/06/2026 – 31/12/2026 |
| empresas_incluidas | jsonb | referências a `empresas.id` (Vision, Digital Smile) |
| inclui_extras | boolean | default false |
| ativa | boolean | |
| observacao | text | ex.: registro histórico da meta antiga de R$11.200, `ativa=false` |

**Cálculo conceitual (usa `empresa_id` + `natureza`, nunca enum de empresa):**
```sql
valor_atingido = SUM(lancamentos_financeiros.valor)
  WHERE tipo = 'entrada'
    AND natureza = 'receita_empresarial'
    AND empresa_id IN (SELECT id FROM empresas WHERE slug IN ('vision','digital_smile'))
    AND status = 'recebido'
    AND data_pagamento BETWEEN meta.data_inicio AND meta.data_fim
    AND NOT EXISTS (revisão pendente em revisoes_migracao vinculada a este lançamento/parcela/venda)
```
Não contam: receitas extras (`natureza='receita_extra'`), pipeline (nunca gera `lancamentos_financeiros` sozinho), pagamentos pendentes (só `status='recebido'` conta), valores em revisão (excluídos pelo `NOT EXISTS`).
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

### `fechamentos_mensais`
| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| competencia | date | primeiro dia do mês |
| faturamento_vision / faturamento_digital_smile | numeric(10,2) | por `empresa_id` |
| recebido_vision / recebido_digital_smile | numeric(10,2) | |
| receitas_extras | numeric(10,2) | `natureza='receita_extra'` |
| despesas_vision / despesas_digital_smile | numeric(10,2) | `natureza='despesa_empresarial'` por `empresa_id` |
| despesas_compartilhadas | numeric(10,2) | soma por `despesa_compartilhada_grupo_id` |
| despesas_pessoais | numeric(10,2) | `natureza='despesa_pessoal'` |
| investimento_vision / investimento_digital_smile | numeric(10,2) | `entra_no_cac=true` por `empresa_id` |
| lucro_vision / lucro_digital_smile | numeric(10,2) | |
| clientes_novos_vision / clientes_novos_digital_smile | integer | |
| cac_vision / cac_digital_smile | numeric(10,2) | nullable |
| inadimplencia | numeric(10,2) | |
| patrimonio_fim_mes | numeric(14,2) | |
| gerado_em | timestamptz | |
| reaberto_em | timestamptz | nullable |

- **Constraints:** `unique(competencia)`.
- **Regras:** é snapshot; não substitui lançamentos originais; reabrir exige confirmação e sinaliza necessidade de recálculo.
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

---

## 9. Receitas extras

Sem tabela dedicada — é `lancamentos_financeiros` com `tipo='entrada'`, `natureza='receita_extra'`, `empresa_id=NULL`, `categoria_id` apontando para `Sonati`, `Trium`, `Presentes`, `Projetos paralelos` (categorias novas são só uma linha nova em `categorias_financeiras`).

- Conta em: total recebido geral, patrimônio.
- Nunca conta em: faturamento, lucro, CAC, ticket médio, Meta 10K — garantido por `natureza='receita_extra'` ser excluída de todos esses cálculos, e pela constraint que impede `receita_extra` de ter `parcela_id`.

---

## 10. Tráfego pago e CAC

- Investimento é `lancamentos_financeiros` (`tipo='saida'`, `natureza='despesa_empresarial'`, `empresa_id`, `categoria_id.entra_no_cac=true`, `campanha_id` opcional).
- **CAC = investimento (`empresa_id = X`, `entra_no_cac = true`) ÷ novos clientes da empresa X.**
- Verba de anúncio paga diretamente pelo dentista **não** entra como lançamento — só `assinaturas.verba_anuncios_dentista_estimada` (informativo).
- Ferramentas/assinaturas usam `categorias_financeiras.entra_no_cac=false` — nunca entram no CAC mesmo sendo despesa empresarial.
- Histórico de `gastos_ads` migra com `empresa_id` corrigido (o caso de R$49,92 vai para Vision, fonte/descrição originais preservadas em `legado_observacao_original`).
- Gastos históricos de Digital Smile em 2024 poderão ser cadastrados depois como novas linhas de `lancamentos_financeiros` com `data_competencia` em 2024 — fora do período da Meta 10K, sem gerar CAC histórico sem base de clientes confiável.

---

## 11. Patrimônio e contas

- Vision e Digital Smile compartilham uma `contas` física — separação 100% por `lancamentos_financeiros.empresa_id`.
- Binance/USDT é uma linha em `contas` (`tipo='cripto'`), sem tabela extra.
- Transferência: `tipo='transferencia'`, `natureza='transferencia'`, `empresa_id=NULL` — reduz `conta_id`, aumenta `conta_destino_id`; como é a mesma linha lida nos dois lados, o total geral de patrimônio nunca é contado duas vezes, e por não ter `empresa_id`/`natureza` empresarial, nunca aparece em receita, despesa, lucro ou Meta 10K.
- Patrimônio consolidado = soma de saldos calculados de todas as `contas` ativas − passivos (`compras_cartao` em aberto).

---

## 12. Casos "em revisão"

### `revisoes_migracao`
**Finalidade:** fila única para qualquer ambiguidade histórica que não pode ser resolvida automaticamente.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| tipo | text check (`duplicidade_valor`,`pipeline_sem_venda`,`cliente_duplicado`,`registro_teste_ambiguo`) | |
| tabela_referencia | text | |
| registro_id | uuid | |
| descricao | text | |
| valor_afetado | numeric(10,2) | nullable |
| status | text check (`pendente`,`confirmado`,`rejeitado`) | default `pendente` |
| decisao_texto | text | |
| criado_em / resolvido_em | timestamptz | |

- Cobre os 4 casos históricos ainda em aberto: possível duplicidade de R$100, R$194 do pipeline sem venda, cliente duplicado por telefone (complementar a `candidatos_duplicidade_cliente`) e registros teste/duplicidade ambíguos. **Nenhum deles bloqueia migrations.**
- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

---

## 13. Segurança

- **Autenticação:** obrigatória (Supabase Auth, e-mail/senha) em todas as tabelas.
- **RLS conceitual padrão:**
  ```sql
  ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;
  CREATE POLICY select_authenticated ON <tabela> FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY write_authenticated  ON <tabela> FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  CREATE POLICY update_authenticated ON <tabela> FOR UPDATE USING (auth.role() = 'authenticated');
  -- Sem policy de DELETE físico em tabelas históricas/financeiras.
  ```
- **`anon`:** nenhum `GRANT` em nenhuma tabela nova.
- **`service_role`:** só em rotinas internas controladas (ex.: geração da competência mensal de assinaturas/despesas recorrentes), nunca no frontend.
- **Soft delete:** `excluido_em`/`ativo` em `clientes`, `vendas`, `oportunidades`, `assinaturas`.
- **`ON DELETE`:** `RESTRICT` em toda FK de tabela histórica/financeira — nunca `CASCADE`.

### `auditoria`
| Coluna | Tipo |
|---|---|
| id | uuid PK |
| tabela | text |
| registro_id | uuid |
| acao | text check (`insert`,`update`,`delete_logico`,`estorno`) |
| dados_antes / dados_depois | jsonb |
| origem | text check (`app`,`migracao`) |
| criado_em | timestamptz |

**Triggers automáticos para as operações críticas abaixo serão implementados em migrations próprias e devem estar ativos antes de o Patrimonium entrar em produção com dados reais:**
- qualquer inserção/atualização em `lancamentos_financeiros` (inclusive estornos);
- mudança de `status` em `parcelas` e `assinaturas`;
- soft delete em `clientes`, `vendas`, `assinaturas`;
- mesclagem de clientes em `candidatos_duplicidade_cliente`;
- resolução de itens em `revisoes_migracao`.

- **Exclusão:** `RESTRICT`. **RLS:** authenticated only.

---

## 14. Histórico e migração — mapa tabela a tabela

| Tabela antiga | Destino | Migra? |
|---|---|---|
| `clientes` | `clientes` | Sim — `telefone_normalizado`, `tipo_registro`, `legado_id_origem` |
| `vendas` | `vendas` + `parcelas` | Sim — `empresa_id` corrigido, 100% recebido, duplicidade de R$100 sinalizada |
| `gastos_ads` | `lancamentos_financeiros` (`saida`, aquisição) | Sim — correção do gasto com fonte trocada |
| `entregas` | `vendas.status_entrega` / `vendas.checklist_entrega` | Sim, incorporado |
| `pipeline` | `oportunidades` | Sim — vínculo a `vendas` quando identificável; caso dos R$194 sinalizado |
| `ciclos` | `metas` (linha histórica, `ativa=false`) | Sim, só como registro histórico |
| `pacotes` | `produtos_servicos` (seed do catálogo ativo) | Parcial |
| `fontes` | *(não copiada)* — vira `empresa_id` + `canais_aquisicao` + `natureza='receita_extra'` | Não — dados úteis transformados, tabela não migra |
| `push_subscriptions` | — | Não migra |
| `conversas` | — | Não migra |
| `mensagens` | — | Não migra |
| `auth.*`, `storage.*` | — | Vazias no legado |

**Regra geral para as 4 tabelas que não migram:** permanecem intactas no Supabase antigo e nos backups; só podem ser removidas na etapa final de limpeza, depois que (1) o banco novo estiver criado, (2) os dados úteis migrados, (3) totais e históricos validados, (4) o app novo funcionando, e (5) aprovação humana explícita.

---

## Diagrama textual de relacionamentos

```
empresas ──< produtos_servicos, campanhas, oportunidades, vendas, assinaturas,
             lancamentos_financeiros, compras_cartao, despesas_recorrentes

clientes ──< oportunidades ──< reunioes
clientes ──< candidatos_duplicidade_cliente >── clientes (self, par)
clientes ──< vendas >── produtos_servicos, empresas, campanhas, oportunidades
clientes ──< assinaturas >── produtos_servicos, empresas, campanhas, oportunidades, vendas (venda_origem_id)

vendas ──< parcelas
assinaturas ──< parcelas
parcelas ──< lancamentos_financeiros (vários por parcela)

contas ──< lancamentos_financeiros >── categorias_financeiras
cartoes ──< compras_cartao ──< lancamentos_financeiros
despesas_recorrentes ──< lancamentos_financeiros
lancamentos_financeiros ──(self: estorno_de_id)── lancamentos_financeiros
lancamentos_financeiros (N linhas) ──(despesa_compartilhada_grupo_id, agrupamento lógico)── lancamentos_financeiros

revisoes_migracao ── (referência solta por tabela_referencia + registro_id) ── qualquer tabela
metas, fechamentos_mensais, auditoria ── tabelas independentes, alimentadas por consulta sobre lancamentos_financeiros
```

---

## Fluxos

### Lead → oportunidade → venda → parcela → pagamento → recebido
1. `oportunidades` criada, estágio avança manualmente até `fechado` — nenhum valor financeiro criado ainda.
2. Conversão explícita cria `vendas` (`oportunidade_id` preenchido) e `oportunidades.venda_id` aponta para ela — impede contar o mesmo evento duas vezes.
3. `vendas` gera `parcelas` (`venda_id`, `numero`, `valor_devido`, `data_vencimento`) conforme o que foi negociado (registrado descritivamente em `condicao_pagamento`).
4. Cada pagamento (total ou parcial) gera uma linha em `lancamentos_financeiros` (`parcela_id`, `idempotency_key` própria) — quantas forem necessárias.
5. **Vendido** = `vendas.valor_final`. **Recebido líquido de uma parcela** = soma das entradas menos estornos vinculados. **Pendente** = devido − recebido líquido. **Atrasada** = derivado, nunca gravado.

### Fluxo de assinatura (mensalidade Digital Smile)
1. `assinaturas` ativa; `proxima_data_cobranca` calculada a partir de `dia_vencimento`.
2. Ao vencer o momento, cria-se a `parcelas` da competência (`assinatura_id`, `competencia_referencia`) **e** `proxima_data_cobranca` avança imediatamente — independente de pagamento.
3. Pagamentos (parciais ou totais) e eventuais estornos são linhas de `lancamentos_financeiros` ligadas à mesma parcela, exatamente como em vendas.
4. Múltiplas competências podem ficar pendentes/atrasadas simultaneamente sem impedir a geração da próxima.

### Receita extra
`lancamentos_financeiros` direto (`natureza='receita_extra'`, `empresa_id=NULL`, sem `parcela_id`) → soma em recebido geral e patrimônio → nunca em faturamento/CAC/ticket/Meta 10K.

### Despesa (empresarial, pessoal ou compartilhada)
`lancamentos_financeiros` (`natureza='despesa_empresarial'` com `empresa_id`, ou `despesa_pessoal` com `empresa_id=NULL`); despesa compartilhada = N linhas na mesma transação, mesmo `despesa_compartilhada_grupo_id`, cada uma só com o valor rateado daquela empresa.

### Cartão
`compras_cartao` gera imediatamente todas as `lancamentos_financeiros` das parcelas futuras (`compra_cartao_id` + `numero_parcela_cartao`, `status='previsto'`), diferente de assinaturas/despesas recorrentes.

### Transferência
`lancamentos_financeiros` (`tipo='transferencia'`, `natureza='transferencia'`, `conta_id`=origem, `conta_destino_id`=destino) → nunca soma em receita, despesa, lucro ou Meta 10K; não duplica patrimônio porque é uma única linha lida nos dois lados.

### Meta 10K
Ver fórmula na seção 8 (subseção `metas`) — R$10.000 efetivamente recebidos, Vision + Digital Smile, 22/06/2026–31/12/2026, via `empresa_id` + `natureza='receita_empresarial'`.

### Patrimônio
Ver seção 11 — soma de saldos de `contas` ativas menos passivos de `compras_cartao` em aberto; transferências nunca duplicam o total.

### Estratégia de migração (ordem)
1. Criar o schema novo lado a lado, sem tocar nas tabelas antigas.
2. Popular catálogo (`empresas`, `produtos_servicos`, `categorias_financeiras`, `canais_aquisicao`, `contas`).
3. Migrar `clientes` (normalizar telefone, marcar candidatos a duplicidade e legado/teste, sem mesclar nada automaticamente).
4. Migrar `vendas` + gerar `parcelas`, aplicando as correções já decididas.
5. Migrar `gastos_ads` → `lancamentos_financeiros`.
6. Migrar `pipeline` → `oportunidades`, sinalizando o caso dos R$194 em `revisoes_migracao`.
7. Migrar `ciclos` → registro histórico em `metas` (inativo); criar a Meta 10K nova.
8. Deixar `conversas`, `mensagens`, `push_subscriptions` e `fontes` (bruta) fora.
9. Validar totais migrados contra os números já confirmados na auditoria.
10. Trocar a aplicação para o schema novo.
11. Validar em uso real.
12. Só então planejar a remoção das tabelas antigas, com aprovação humana explícita.

---

## Lista consolidada — 21 tabelas em 4 blocos

**Bloco 1 — Catálogo (7)**
1. `empresas`
2. `produtos_servicos`
3. `categorias_financeiras`
4. `canais_aquisicao`
5. `campanhas`
6. `contas`
7. `cartoes`

**Bloco 2 — Comercial (7)**
8. `clientes`
9. `candidatos_duplicidade_cliente`
10. `oportunidades`
11. `reunioes`
12. `vendas`
13. `parcelas`
14. `assinaturas`

**Bloco 3 — Financeiro (5)**
15. `lancamentos_financeiros`
16. `compras_cartao`
17. `despesas_recorrentes`
18. `metas`
19. `fechamentos_mensais`

**Bloco 4 — Governança (2)**
20. `revisoes_migracao`
21. `auditoria`

**Total: 21 tabelas.**

---

## Decisões já aprovadas antes das migrations

1. **Nomes:** português, snake_case.
2. **`condicao_pagamento`/checklist:** checklist em jsonb; condição financeira estruturada em `parcelas`; jsonb é apenas snapshot/descritivo, nunca fonte financeira oficial.
3. **`telefone_normalizado`:** unique parcial para `tipo_registro='normal' AND excluido_em IS NULL`, sem bloquear legado/teste nem casos em revisão.
4. **Estornos:** nova linha financeira de reversão vinculada por `estorno_de_id`; nunca apaga ou sobrescreve o original; suporta estorno parcial, devolução e chargeback.
5. **Binance/USDT:** dentro de `contas`, sem subsistema cripto separado.
6. **Auditoria:** tabela `auditoria` criada; triggers automáticos definidos para as operações críticas da seção 13, implementados em migrations próprias, ativos antes de produção com dados reais.
7. **`compras_cartao`:** gera todas as parcelas futuras no cadastro, diferente de assinaturas/despesas recorrentes.
8. **Casos em revisão:** possível duplicidade de R$100, R$194 do pipeline sem venda, cliente duplicado por telefone e registros teste/duplicidade ambíguos permanecem em `revisoes_migracao`/`candidatos_duplicidade_cliente`, com decisão humana pendente — **não bloqueiam migrations**.
9. **Seed de produtos:** ativos no dia 1 conforme seção 2 (Vision: Fotos, Vídeos, Combos, Sites; Digital Smile: Gestão de Tráfego Pago). Google Meu Negócio inicialmente inativo.
10. **Parcelas unificadas:** `parcelas` serve vendas e assinaturas, com origem exclusiva e `unique(assinatura_id, competencia_referencia)`.
11. **`empresa_id` + `natureza`:** substituem definitivamente o antigo enum `classificacao`; `empresa_id` é a única referência de empresa, `natureza` é só a classificação financeira.
12. **Despesa compartilhada:** múltiplos lançamentos rateados com `despesa_compartilhada_grupo_id`, criados atomicamente na mesma transação, sem tabela nova.
13. **Atraso:** sempre derivado (data + saldo pendente), nunca um status gravado, sem job/trigger de tempo.
14. **Avanço de competência de assinatura:** depende da criação da parcela, nunca do pagamento.

Nenhum item de implementação restante (SQL exato de triggers/views, função de despesa compartilhada, job vs. botão de geração de competência) bloqueia o início das migrations — são detalhes a resolver na própria escrita das migrations, não decisões de negócio em aberto.

---

Nenhuma migration foi criada, nenhum comando SQL foi executado, nenhuma tabela antiga foi alterada ou apagada. Este documento é a versão 2 consolidada da proposta técnica, aguardando aprovação final antes de substituir `docs/proposta_banco_patrimonium.md`.
