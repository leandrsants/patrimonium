# Auditoria de dados históricos (Fase 3 — somente leitura)

**Fonte analisada:** `backups/dados_antes_refatoracao.sql` (SHA-256 `7b114599...54dd3`, 55.352 bytes).
**Método:** leitura estática do arquivo de backup de dados. Nenhum acesso ao banco remoto. Nenhuma alteração no arquivo de backup, nenhuma migration criada.
**Privacidade:** nomes e telefones aparecem aqui apenas mascarados ou como contagens agregadas. Nenhuma lista completa de clientes é reproduzida. Chaves/segredos de `push_subscriptions` não são reproduzidos.

---

## 1. Quantidade de registros por tabela

| Tabela | Registros |
|---|---|
| `ciclos` | 1 |
| `clientes` | 66 |
| `conversas` | 29 |
| `fontes` | 5 |
| `vendas` | 67 |
| `entregas` | 11 |
| `gastos_ads` | 36 |
| `mensagens` | 16 |
| `pacotes` | 3 |
| `pipeline` | 15 |
| `push_subscriptions` | 2 |
| `auth.*` (todas as subtabelas) | 0 |
| `storage.*` (todas as subtabelas) | 0 |

**Achado importante:** o schema `auth` está totalmente vazio — nenhum usuário, sessão ou identidade jamais foi criado. O login por e-mail/senha exigido pela especificação (seção 25 do doc 01) **nunca foi implementado/usado** na versão anterior. O schema `storage` também está vazio — nenhum arquivo foi armazenado no Supabase Storage, consistente com a nota da especificação de que contratos ficam no Google Drive.

---

## 2. Intervalo de datas por tabela

| Tabela | Data mais antiga | Data mais recente |
|---|---|---|
| `clientes` (criado_em) | 24/02/2026 | 16/07/2026 |
| `vendas` (data da venda) | 21/02/2026 | 16/07/2026 |
| `gastos_ads` (data) | 20/02/2026 | 15/07/2026 |
| `entregas` (criado_em) | 01/07/2026 | 16/07/2026 |
| `pipeline` (criado_em) | 27/06/2026 | 16/07/2026 |
| `conversas` (criado_em) | 07/04/2026 (dia único) | 07/04/2026 |
| `ciclos` | período definido: 21/06/2026 a 31/12/2026 | — |
| `fontes` | todas criadas em 25/06/2026 | — |

Nenhuma data futura além de "hoje" (17/07/2026) foi encontrada. Nenhuma data claramente inválida (fora de 2026) foi encontrada.

---

## 3. Colunas vazias ou frequentemente vazias

- `clientes.whatsapp` — vazio (NULL ou string vazia) em aproximadamente 40% dos registros, principalmente nos criados a partir de junho/2026.
- `clientes.instagram` — vazio em **100%** dos registros (nenhum cliente tem Instagram preenchido).
- `clientes.origem` — preenchido como `facebook_ads` até ~final de maio/2026; depois disso passa a ficar **NULL** na maioria dos registros novos — coincide com a criação da tabela `fontes` (25/06/2026), sugerindo que a origem passou a ser controlada por `fonte_id` em `vendas`/`pipeline`/`gastos_ads`, não mais pelo campo texto em `clientes`.
- `clientes.observacao` — vazio em 100% dos registros.
- `vendas.observacao` — vazio em cerca de metade dos registros mais antigos (até março/2026); preenchido com descrição do produto na maioria dos registros a partir de junho/2026.
- `vendas.status` — **um único valor em toda a tabela: `'pago'`**. Nenhum outro status (`previsto`, `parcial`, `atrasado`, `cancelado`) jamais foi usado.
- `entregas.status` — apenas três valores distintos usados: `entregue`, `em_andamento`, `pendente` (ver seção 5).
- `pipeline.status` — apenas dois valores distintos usados: `fechado`, `follow_up` (ver seção 5).

---

## 4. Valores distintos de status, categoria, origem, serviço e forma de pagamento

- **`vendas.status`:** somente `pago` (67/67 registros). Nenhuma venda com pagamento parcial ou pendente está registrada estruturalmente.
- **`entregas.status`:** `entregue` (7), `em_andamento` (1), `pendente` (2). Vocabulário bem mais simples que os 6 status da especificação (aguardando pagamento, aguardando material, em produção, aguardando aprovação, entregue, finalizado).
- **`pipeline.status`:** `fechado` (12), `follow_up` (3). Os estágios `interessado` e `perdido` da especificação **nunca aparecem** nos dados atuais.
- **`clientes.origem`:** `facebook_ads` (a grande maioria), `Instagram` (3 registros de teste, ver seção 9), demais NULL.
- **`fontes.nome`** (funciona como "categoria/empresa" nos dados): `Fotos/Vídeos com IA`, `Sonati`, `Digital Smile`, `Venda de Sites`, `Trium` — 5 valores fixos.
- **Forma de pagamento:** não existe nenhuma coluna estruturada de forma de pagamento em nenhuma tabela. A informação, quando existe, está embutida em texto livre (`observacao`) ou nas mensagens de template (ex.: menção a Pix).
- **Serviço/produto vendido:** não há coluna estruturada; a identificação do produto é inferida do texto livre em `vendas.observacao` (ex.: "5 fotos", "10 fotos com IA", "1 vídeo com IA", "1 vídeo + 10 fotos").

---

## 5. Distribuição por fonte (Vision / Digital Smile / Extras)

Cruzando `vendas.fonte_id` com `fontes.nome`:

| Fonte | Nº de vendas | Soma histórica (todos os tempos) |
|---|---|---|
| Fotos/Vídeos com IA (**Vision**) | 66 | R$ 2.093,90 |
| Sonati (**extra**) | 1 | R$ 400,00 |
| Digital Smile | 0 | R$ 0,00 |
| Venda de Sites | 0 | R$ 0,00 |
| Trium | 0 | R$ 0,00 |

**Total geral histórico em `vendas` (todos os tempos, todas as fontes): R$ 2.493,90 em 67 registros.**

Isso confirma, com os dados reais, a referência visual citada na especificação (seção 28): Digital Smile, Trium e Sites realmente têm zero vendas registradas até agora; toda a receita de vendas é Vision + uma única entrada de Sonati.

Em `gastos_ads`, todos os 36 registros usam a fonte Vision (`Fotos/Vídeos com IA`), **exceto um único registro** (07/07/2026, R$ 49,92) que está marcado com `fonte_id` = Digital Smile mas cuja descrição de texto diz "Tráfego pago - fotos com IA" — **inconsistência entre o rótulo da fonte e a descrição**, ver item de confirmação correspondente.

---

## 6. Dados elegíveis para a Meta 10K 2026 (desde 22/06/2026)

Filtrando `vendas` com `data >= 2026-06-22`, excluindo extras (Sonati):

- **12 vendas da Vision**, somando **R$ 961,00**.
- **1 venda de Sonati** (extra, não conta para a meta): R$ 400,00, em 13/07/2026.
- **Total de 13 vendas** no período, somando R$ 1.361,00 (Vision + extra).

Estes números **batem exatamente** com a referência visual da especificação (seção 28): "entradas totais: R$ 1.361", "Vision/fotos e vídeos: R$ 961", "Sonati: R$ 400", "13 vendas" — a auditoria dos dados reais confirma essa referência.

Em `gastos_ads`, os registros com `data >= 2026-06-22` (12 registros) somam **R$ 488,81**, também batendo exatamente com a referência da especificação ("investimento: R$ 488,81").

**Duas das 12 vendas elegíveis da Vision têm o mesmo cliente, mesmo valor (R$ 100,00) e descrição quase idêntica** ("1 vídeo - dançando" e "1 video dançando", datas 30/06 e 01/07) — ver seção 8 (duplicidade) e `itens_para_confirmacao.md`. Se for de fato um único evento duplicado, o valor elegível real seria R$ 861,00 em vez de R$ 961,00. Como a própria especificação já usa R$ 961 como referência, o valor duplicado provavelmente já estava presente na fonte que gerou aquela referência visual — mas isso precisa ser confirmado com você antes de decidir o que migrar.

---

## 7. Pagamentos parciais ou pendentes

**Não existe nenhum registro de pagamento parcial ou pendente em `vendas`** — 100% dos 67 registros têm `status = 'pago'`. Mesmo vendas de vídeo (que pela especificação nova deveriam ter 50% antes + 50% na entrega) aparecem como uma única linha com o valor cheio e status pago — não há visibilidade, pelos dados, sobre se ambas as parcelas de fato foram cobradas separadamente ou se o valor foi lançado de uma vez. Isso é uma lacuna estrutural do modelo antigo, não um erro de dado: o esquema atual simplesmente não tem colunas para representar parcelas.

---

## 8. Possíveis registros duplicados

### Clientes
- Um cliente com nome comum (~5 letras, iniciando com "El") aparece **duas vezes com o mesmo telefone exato** (mesma formatação, incluindo caracteres invisíveis de direção de texto), criado em datas diferentes (09/03/2026 e 11/03/2026) — praticamente certo que é a mesma pessoa cadastrada duas vezes.
- Dois registros com nomes muito parecidos ("Carlos Daudth" e "Carlos Daudth Edited"), ambos sem telefone, criados com 2 minutos de diferença (27/06/2026) — o sufixo "Edited" sugere que uma tentativa de editar o registro criou um novo registro em vez de atualizar o existente. Vale confirmar se isso é um padrão (bug de edição) que pode ter gerado outras duplicatas sem sufixo visível.
- Três registros com o mesmo primeiro nome ("Leandro" — mesmo nome do titular identificado nas mensagens de teste, seção 9), sem telefone, criados em sequência de segundos em 07/04/2026 — parecem testes manuais do formulário de cadastro, não clientes reais.
- Registros com valores claramente de teste/lixo: nomes de poucas letras sem sentido, e um registro com o nome literal "exemplo" — candidatos a exclusão lógica, não decidido aqui.

### Vendas
- Duas vendas do mesmo cliente, mesmo valor (R$ 100,00), datas consecutivas (30/06 e 01/07/2026), descrições quase idênticas ("1 vídeo - dançando" / "1 video dançando") — **forte suspeita de duplicidade de lançamento**, não de duas vendas reais distintas. Cada uma tem sua própria `entrega` associada (ambas marcadas como "entregue"), o que também poderia indicar duas entregas reais — **precisa de confirmação humana**, não é possível decidir só pelos dados.

### Pipeline vs. Vendas
- **Duas negociações marcadas como `fechado` no `pipeline`** (valores R$ 97,00 cada, ambas em 13/07/2026) **não têm nenhuma venda correspondente na tabela `vendas`** — nem por valor, nem por cliente reconhecível. Se essas duas negociações realmente se converteram em venda, **R$ 194,00 em receita pode estar ausente do total financeiro** que viria de `vendas`. Precisa de confirmação.
- Diversas outras linhas do `pipeline` marcadas como `fechado` têm nome, valor e observação praticamente idênticos a uma linha de `vendas` (mesmo cliente, mesmo valor, mesma descrição) — sugerindo que `pipeline` e `vendas` frequentemente registram o **mesmo evento de negócio duas vezes**, em tabelas diferentes. Isso é relevante para a Fase 4: pipeline não deve ser somado a vendas como receita adicional.

---

## 9. Possíveis telefones duplicados após normalização

Os telefones estão em formatos muito inconsistentes: alguns só dígitos (`5519994290928`), outros com máscara e símbolos (`+55 21 99338-3064`), e uma parte significativa contém **caracteres Unicode invisíveis de controle de direção de texto** (marcas de "embedding" LTR) e um traço especial (hífen não separável) ao redor do número — por exemplo, um número aparece como `‪+55 69 98473‑5283‬` (com caracteres invisíveis antes e depois, e um traço diferente do hífen comum). Isso é importante para o desenho da normalização de duplicidade (Fase 4): a função de normalização precisa remover esses caracteres invisíveis, não só espaços/parênteses/hífen comuns, ou duplicatas passarão despercebidas.

Já identificado com certeza (ver seção 8): um cliente duplicado por telefone idêntico.

Não foi feita uma varredura exaustiva de similaridade entre todos os 66 telefones nesta auditoria (isso exigiria normalização programática, que é atividade de implementação, não de auditoria) — recomenda-se que a Fase 4/6 inclua essa normalização completa antes da migração final.

---

## 10. Valores financeiros negativos, zerados ou suspeitos

- Nenhum valor negativo encontrado em `vendas.valor` nem em `gastos_ads.valor`.
- Nenhum valor zerado encontrado nessas colunas.
- Nenhum valor "gigante" fora do padrão do negócio (maior venda: R$ 400,00 — a entrada de Sonati; maior venda "de produto": R$ 189,00; maior gasto de anúncio: R$ 100,00).
- `fontes.meta` — os cinco valores (3000, 2400, 3000, 1800, 1000) somam **exatamente R$ 11.200**, que é a antiga meta mencionada na especificação (seção 28). Isso indica fortemente que a meta antiga estava armazenada como a soma de metas parciais por fonte/categoria, não como um valor único — mas isso é uma inferência da auditoria, precisa de confirmação humana antes de assumir como regra de migração.

---

## 11. Datas inválidas ou incoerentes

Nenhuma data claramente inválida foi encontrada (todas dentro de 2026, nenhuma no futuro além de hoje). Um padrão notado sem ser um problema: em alguns registros, a `data` da venda é anterior ao `criado_em` do cliente associado em poucos dias — isso é esperado (o usuário registra a venda com uma data retroativa), não é uma inconsistência.

---

## 12. Registros sem relacionamento correspondente

- **3 vendas com `cliente_id` NULL** (valores R$ 20,00, R$ 29,00 e R$ 80,00) — vendas sem cliente vinculado.
- **1 entrega com `venda_id` NULL** — entrega vinculada só ao cliente, sem venda associada.
- **`pipeline` não tem nenhuma coluna de FK para `clientes`** — a ligação entre um lead do pipeline e um cliente cadastrado, quando existe, só pode ser inferida pelo nome (texto livre), não garantida estruturalmente.
- **`conversas` não tem FK para `clientes`** — a ligação é só pelo número de whatsapp em texto livre.
- **`vendas` não referencia `pacotes`** — não é possível determinar estruturalmente qual produto do catálogo foi vendido; a informação está em texto livre.

---

## 13. Conteúdo real de `ciclos`, `pipeline`, `fontes`, `conversas` e `mensagens`

- **`ciclos`:** 1 único registro, "Jun-Dez 2026", período 21/06/2026 a 31/12/2026, ativo. Não tem coluna de valor de meta — o valor parece estar em `fontes.meta` (ver seção 10).
- **`fontes`:** 5 registros fixos que funcionam como categorização de negócio/origem: Vision (fotos/vídeos com IA), Sonati, Digital Smile, Venda de Sites, Trium. Cada uma com uma cor de exibição e uma "meta" numérica.
- **`pipeline`:** 15 negociações, quase todas com fonte Vision (uma com Sonati). Vocabulário de status muito mais simples que a especificação (só `fechado`/`follow_up`). Sobreposição relevante com `vendas` (ver seção 8).
- **`conversas`:** **29 mensagens de um único número de telefone** (um número no padrão claramente fictício/de teste), todas no mesmo dia (07/04/2026), formando um roteiro completo de atendimento (abordagem → qualificação → envio de portfólio → oferta de pacotes → cobrança via Pix → pedido de comprovante). O conteúdo bate exatamente com o tom e a estrutura dos templates da tabela `mensagens`. **Tudo indica que esta é uma conversa de demonstração/teste do fluxo do bot de vendas, não um histórico real de atendimento a um cliente.** Uma das mensagens contém uma chave Pix e nome do titular da conta bancária usados no script — **não reproduzido aqui** por ser dado sensível do próprio negócio.
- **`mensagens`:** 16 templates de mensagem categorizados (fechamento, follow-up, objeção, pós-venda, portfólio, e dois registros de instrução interna para geração de imagem por IA). São roteiros de vendas/atendimento, não dados financeiros. Um desses registros contém informações de um cliente específico (primeiro nome e idade) embutidas em uma instrução de prompt — não reproduzido aqui.

---

## 14. Dados que parecem antigos, provisórios ou fora do escopo

| Tabela / registro | Motivo |
|---|---|
| `conversas` (todas as 29 linhas) | Parecem ser uma demonstração/teste do fluxo do bot, não histórico real de cliente (ver seção 13). |
| `mensagens` (16 linhas) | Templates de script de vendas — não são dados financeiros nem de domínio do produto novo. |
| `push_subscriptions` (2 linhas) | Assinaturas de notificação push — não são dados de domínio financeiro. Contêm material de chave/endpoint que não deve ser reproduzido nem exposto (RLS atual é público, ver auditoria de schema). |
| Clientes de teste (nomes sem sentido, "exemplo", nomes repetidos do titular) | Aparentam ser testes manuais do formulário, não clientes reais. |
| `pacotes` "Pacote Básico (3 fotos)" | `ativo = false` — já desativado no sistema atual, preço (R$14) não corresponde a nenhum produto da especificação nova. |

Nenhum desses registros foi excluído ou marcado para exclusão — apenas identificados como candidatos a revisão manual, conforme pedido.

---

## 15. Informações que precisam ser preservadas na migração

- Todos os 67 registros de `vendas`, com valor, data e observação — é o histórico financeiro central do negócio.
- Todos os 36 registros de `gastos_ads` — histórico de investimento em aquisição.
- Todos os 66 registros de `clientes`, mesmo os aparentemente de teste — a decisão de arquivar ou descartar um registro de teste é humana, não automática.
- As 11 `entregas` e as 15 negociações de `pipeline` — histórico operacional, mesmo com sobreposição a esclarecer.
- Os 5 registros de `fontes`, que definem a categorização atual (Vision/Digital Smile/extras) usada por quase todas as outras tabelas.
- O registro único de `ciclos`, que documenta o período/meta anterior.
- Toda referência de origem (tabela legada, ID legado, data da migração) deve ser mantida por registro migrado, conforme regra permanente do projeto.

---

## 16. O que este documento não fez

- Não acessou o banco remoto.
- Não alterou o arquivo de backup.
- Não criou nenhuma migration.
- Não corrigiu nem alterou nada no Supabase.
- Não exibiu dados pessoais completos (nomes completos, telefones completos, e-mails, chaves ou tokens) — todos os exemplos aqui são mascarados ou agregados.
- Não classificou nenhum registro como definitivamente "inútil" ou "para exclusão" — todas as ambiguidades foram transformadas em perguntas objetivas em `docs/itens_para_confirmacao.md`.
