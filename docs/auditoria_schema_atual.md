# Auditoria do schema atual (Fase 3 — somente leitura)

**Fonte analisada:** `backups/schema_antes_refatoracao.sql` (SHA-256 `8d3e02a1...103e44`, 12.138 bytes).
**Método:** leitura estática do arquivo de backup do schema. Nenhum acesso ao banco remoto foi feito. Nenhum arquivo de dados foi lido nesta etapa.
**Projeto de origem:** Supabase `zaoavyeftnbtoqwipmml` ("FOTOS COM IA").

---

## 1. Schemas existentes

- `public` — único schema de aplicação; contém todas as tabelas e a view de negócio.
- `extensions` — usado apenas para extensões do Postgres (`pg_stat_statements`, `pgcrypto`, `uuid-ossp`).
- `vault` — usado apenas pela extensão `supabase_vault` (infraestrutura do Supabase, não é schema de aplicação).

Não há schemas separados por empresa (ex.: `vision`, `digital_smile`) nem schema próprio para dados legados.

## 1.1 Extensions instaladas

- `pg_stat_statements` (schema `extensions`) — estatísticas de performance de queries, não é de domínio.
- `pgcrypto` (schema `extensions`) — funções de criptografia, provavelmente suporte a `gen_random_uuid()`.
- `uuid-ossp` (schema `extensions`) — geração de UUIDs.
- `supabase_vault` (schema `vault`) — cofre de segredos do Supabase, não usado por nenhuma tabela do domínio identificada neste schema.

Todas são extensões padrão de projetos Supabase, não específicas do negócio.

---

## 2. Tabelas, colunas e tipos

Todas as tabelas estão no schema `public`. Todas usam `id uuid DEFAULT gen_random_uuid()` como chave primária e têm ao menos `criado_em timestamptz DEFAULT now()`.

### `ciclos`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | — |
| inicio | date | — |
| fim | date | — |
| ativo | boolean | false |
| criado_em | timestamptz | now() |

Sem coluna de valor de meta. Provável antecessor do conceito de "ciclo/meta" citado na especificação (ex.: antiga meta de R$ 11.200, ciclo jun–dez/2026).

### `clientes`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | — |
| whatsapp | text | — |
| instagram | text | — |
| origem | text | 'facebook_ads' |
| observacao | text | — |
| criado_em | timestamptz | now() |
| atualizado_em | timestamptz | now() |

Tabela única de clientes (sem separação por empresa). Sem CPF/CNPJ, sem e-mail, sem link de Drive — mais enxuta que o modelo de "clientes globais" da especificação, mas compatível como base.

### `conversas`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| whatsapp | text | — |
| role | text | — |
| conteudo | text | — |
| tipo | text | 'texto' |
| criado_em | timestamptz | now() |

Sem FK para `clientes` (vínculo é só pelo campo texto `whatsapp`). Parece um log de conversas de um bot/atendimento via WhatsApp (campo `role` sugere estrutura tipo assistente/usuário). **Fora do escopo funcional descrito na especificação atual** (que exclui automação de WhatsApp).

### `entregas`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| venda_id | uuid (FK) | — |
| cliente_id | uuid (FK) | — |
| descricao | text | — |
| status | text | 'pendente' |
| criado_em | timestamptz | now() |
| atualizado_em | timestamptz | now() |

Status é texto livre, sem enum/check constraint — não há garantia de que os valores usados coincidam com o vocabulário da especificação (aguardando material, em produção, entregue, etc.).

### `fontes`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | — |
| cor | text | — |
| criado_em | timestamptz | now() |
| meta | numeric | 0 |
| ativo | boolean | true |

Provável tabela de origens/campanhas (`fonte_id` é referenciado por `vendas`, `gastos_ads` e `pipeline`). A coluna `meta` (numérico, por fonte) tem propósito ambíguo — não corresponde a nenhum conceito claro da especificação atual.

### `gastos_ads`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| data | date | CURRENT_DATE |
| valor | numeric(10,2) | — |
| descricao | text | 'Facebook Ads' |
| criado_em | timestamptz | now() |
| atualizado_em | timestamptz | now() |
| fonte_id | uuid (FK) | — |

Investimento em aquisição. O default `'Facebook Ads'` sugere que, até aqui, só há uma plataforma de anúncio registrada. Sem coluna de empresa (Vision/Digital Smile).

### `mensagens`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| categoria | text | — |
| titulo | text | — |
| conteudo | text | — |
| ordem | integer | 0 |
| criado_em | timestamptz | now() |

Parece um catálogo de mensagens/templates prontos (possivelmente para uso manual ou por um bot). Sem relação clara com o domínio financeiro da especificação.

### `pacotes`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | — |
| descricao | text | — |
| preco | numeric(10,2) | — |
| destaque | boolean | false |
| ativo | boolean | true |
| ordem | integer | 0 |
| criado_em | timestamptz | now() |

Catálogo de produtos/pacotes — candidato natural a corresponder aos produtos da Vision (5 fotos, 10 fotos, vídeo, pacote, site). Sem FK a partir de `vendas` (vendas não referencia `pacotes`, ver abaixo).

### `pipeline`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | — |
| fonte_id | uuid (FK) | — |
| valor | numeric | — |
| observacao | text | — |
| status | text | 'mensagem' |
| criado_em | timestamptz | now() |
| atualizado_em | timestamptz | now() |

Provável tabela de leads/prospecção. Status default `'mensagem'` não corresponde diretamente ao vocabulário de estágios da especificação (interessado, follow-up, orçamento enviado, fechado, perdido). Sem FK para `clientes` — não há vínculo estrutural entre um lead do pipeline e um registro de cliente.

### `push_subscriptions`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| subscription | jsonb | — |
| criado_em | timestamptz | timezone('utc', now()) |

Assinaturas de notificação push (Web Push). Não é dado financeiro nem de domínio do produto. Tem RLS habilitado, mas com políticas totalmente públicas (ver seção 8) — **ponto de atenção de segurança**, não uma decisão a tomar aqui.

### `vendas`
| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| data | date | CURRENT_DATE |
| cliente_id | uuid (FK) | — |
| valor | numeric(10,2) | — |
| status | text | 'pago' |
| observacao | text | — |
| criado_em | timestamptz | now() |
| atualizado_em | timestamptz | now() |
| fonte_id | uuid (FK) | — |

Tabela central de vendas. Pontos relevantes para a migração:
- **Não há coluna de empresa** (Vision/Digital Smile) — todo o histórico está implicitamente em um único negócio.
- **Não há FK para `pacotes`** — não é possível saber diretamente qual produto foi vendido a partir do schema; a distinção provavelmente está em `observacao` (texto livre) ou terá de ser inferida dos dados.
- **Não há separação vendido/recebido/pendente nem parcelas** — `valor` e `status` (texto livre, default `'pago'`) são os únicos campos financeiros. Isso é uma lacuna estrutural grande frente à especificação (seção 11 do doc 01).
- Sem coluna de forma de pagamento, sem parcelamento 50/50.

## 2.1 Views

### `resumo_diario`
Combina, por dia: soma de `vendas.valor` onde `status = 'pago'`, soma de `gastos_ads.valor`, e calcula `lucro = total_vendas - gasto_ads`. Não distingue empresas, não separa extras, não considera pendente/recebido. É essencialmente o "dashboard" atual simplificado.

## 2.2 Funções e triggers

Nenhuma função customizada (`CREATE FUNCTION`) nem trigger (`CREATE TRIGGER`) aparece no dump do schema. Toda a lógica (ex.: avançar próxima cobrança, marcar atraso) provavelmente vive hoje na aplicação (frontend/backend), não no banco — precisa ser confirmado quando o código da aplicação anterior for revisado, se existir.

---

## 3. Chaves primárias

Todas as 10 tabelas têm PK simples em `id` (uuid): `ciclos`, `clientes`, `conversas`, `entregas`, `fontes`, `gastos_ads`, `mensagens`, `pacotes`, `pipeline`, `push_subscriptions`, `vendas`.

## 4. Chaves estrangeiras

| Tabela | Coluna | Referencia | On Delete |
|---|---|---|---|
| entregas | cliente_id | clientes(id) | CASCADE |
| entregas | venda_id | vendas(id) | CASCADE |
| gastos_ads | fonte_id | fontes(id) | CASCADE |
| pipeline | fonte_id | fontes(id) | CASCADE |
| vendas | cliente_id | clientes(id) | CASCADE |
| vendas | fonte_id | fontes(id) | CASCADE |

**Atenção:** todas as FKs usam `ON DELETE CASCADE`. Isso significa que apagar um `cliente` apaga em cascata suas `vendas` e `entregas`; apagar uma `fonte` apaga em cascata `gastos_ads` e `pipeline` relacionados. Isso é incompatível com a regra do projeto de nunca perder histórico — qualquer exclusão futura de um registro "pai" destruiria dados financeiros filhos silenciosamente. **Marcado como ponto crítico para o desenho do novo modelo (Fase 4)**, não uma decisão a tomar agora.

`conversas`, `mensagens`, `pipeline→clientes` e `vendas→pacotes` **não têm FK nenhuma**, apesar de existir relação implícita (pipeline não referencia clientes; vendas não referencia pacotes).

## 5. Índices e constraints

Além das PKs e FKs acima, não há índices adicionais explícitos (`CREATE INDEX`) nem `CHECK` constraints nem `UNIQUE` constraints no dump — por exemplo, não há unicidade em `clientes.whatsapp`, o que é consistente com o risco de duplicidade de clientes que a especificação pede para tratar (seção 20.1).

## 6. Views

Cobertas na seção 2.1 (`resumo_diario`). É a única view do banco.

## 7. Funções

Nenhuma função de aplicação encontrada no schema (seção 2.2).

## 8. Triggers

Nenhum trigger encontrado no schema (seção 2.2).

## 9. Políticas RLS

Apenas `push_subscriptions` tem RLS habilitado, com três políticas totalmente permissivas:

- `Permitir leitura pública` — `SELECT USING (true)`
- `Permitir inserção pública` — `INSERT WITH CHECK (true)`
- `Permitir exclusão pública` — `DELETE USING (true)`

Ou seja: qualquer pessoa (inclusive não autenticada) pode ler, inserir e apagar registros dessa tabela.

**Nenhuma outra tabela tem RLS habilitado** (`ciclos`, `clientes`, `conversas`, `entregas`, `fontes`, `gastos_ads`, `mensagens`, `pacotes`, `pipeline`, `vendas`). Combinado com os `GRANT ALL ... TO anon` explícitos vistos no final do dump para todas as tabelas, isso é um **ponto de segurança relevante**: com RLS desligado, os grants valem integralmente, e a role `anon` (usada pelo cliente público/frontend sem login) tem `GRANT ALL` (select/insert/update/delete) em todas as tabelas, incluindo `clientes`, `vendas` e `gastos_ads` — dados financeiros. Isso está registrado aqui como constatação de auditoria, não como algo a corrigir nesta fase.

---

## 10. Tabelas que parecem antigas, duplicadas ou provisórias

| Tabela | Observação | Situação |
|---|---|---|
| `conversas` | Log de conversa tipo bot (campo `role`), sem FK para `clientes`. Fora do escopo da especificação atual (que exclui automação de WhatsApp). | **Precisa de confirmação** — saber se ainda está em uso ou é resquício de uma automação anterior. |
| `mensagens` | Catálogo de mensagens/templates com categoria/ordem. Sem relação clara com o domínio financeiro. | **Precisa de confirmação** — uso atual e se deve ser migrada ou arquivada como legado. |
| `push_subscriptions` | Notificação push web, não é dado de negócio. RLS totalmente aberto (ver seção 9). | **Precisa de confirmação** — se o recurso de push ainda é usado; independentemente, o RLS aberto é um achado de segurança a registrar. |
| `pipeline` | Provável prospecção/leads, mas sem FK para `clientes` e com vocabulário de status (`'mensagem'`) que não bate com os estágios da especificação. | **Precisa de confirmação** — como o campo `status` é usado hoje e se há relação implícita com `clientes` via nome/whatsapp. |
| `fontes.meta` | Coluna numérica de propósito ambíguo dentro da tabela de origens/campanhas. | **Precisa de confirmação** — o que esse valor representa (meta de campanha? orçamento?). |
| `ciclos` | Sem valor de meta associado (nome, início, fim, ativo apenas). | **Precisa de confirmação** — onde fica armazenado o valor da meta (ex.: R$ 11.200 antiga, R$ 10.000 nova) se não está em `ciclos`. |
| `vendas` sem FK a `pacotes` | Impede saber pelo schema qual produto foi vendido em cada venda. | **Precisa de confirmação** — se o produto vendido está em `observacao` (texto livre) ou em outro lugar não identificado no schema. |

Nenhuma tabela foi classificada como "inútil" — a especificação e o `CLAUDE.md` exigem cruzar com uso real (código-fonte e dados) antes de qualquer julgamento, o que ainda não foi feito.

---

## 11. Resumo do que NÃO existe no schema atual

Ausente frente à especificação funcional (`docs/01_...`), a confirmar na Fase 4:

- Nenhuma tabela de empresas (Vision / Digital Smile).
- Nenhuma separação de vendido / recebido / pendente, nem parcelas.
- Nenhuma tabela de contratos, onboarding ou entregas com checklist estruturado (só um campo `status` texto livre em `entregas`).
- Nenhuma tabela de contas bancárias, patrimônio, saldo inicial/data-base, cartões, ou reserva Binance/USDT.
- Nenhuma tabela de metas com valor (`ciclos` tem período, não valor).
- Nenhuma tabela de receitas extras distinta de vendas.
- Nenhuma tabela de estornos/devoluções.
- Nenhuma tabela de fechamento mensal.
- Nenhum campo de exclusão lógica (soft delete) nas tabelas centrais (`clientes`, `vendas`, `entregas`) — só `pacotes.ativo` e `fontes.ativo`.
- Nenhuma trilha de auditoria.

---

## 12. O que este documento não fez

- Não leu `backups/dados_antes_refatoracao.sql`.
- Não acessou o banco remoto.
- Não criou nem alterou nenhuma migration.
- Não alterou nenhum arquivo de backup.
- Não classificou nenhuma tabela como candidata definitiva à remoção — apenas registrou dúvidas e pontos de atenção, marcados como "precisa de confirmação".
