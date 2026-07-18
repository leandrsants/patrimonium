# Plano de migrations do Patrimonium (Fase 5 — planejamento, sem execução)

**Status:** planejamento apenas, ainda não aprovado para escrever a primeira migration. **Nenhuma migration foi criada, nenhum SQL foi executado, nenhuma tabela antiga foi renomeada/movida, nenhum comando tocou o Supabase remoto, nenhum código de frontend foi alterado.**

**Documentos relidos antes deste plano:** `CLAUDE.md`, `docs/proposta_banco_patrimonium.md`, `docs/auditoria_schema_atual.md`, `docs/auditoria_dados_atual.md`, `docs/itens_para_confirmacao.md`.

**Questão crítica que motivou este documento:** o schema `public` do Supabase legado já usa nomes como `clientes`, `vendas`, `entregas`, `pipeline`, `ciclos` — nomes que o modelo novo também usa (`clientes`, `vendas`, além de `oportunidades`, `parcelas` etc.). Não é possível restaurar o legado completo e criar as tabelas definitivas com os mesmos nomes dentro do mesmo `public`, nem aplicar as tabelas novas no `public` do projeto remoto antigo mantendo as antigas intactas com os mesmos nomes — as duas coisas colidem.

---

## 1. Estratégia de isolamento e cutover — arquitetura em 3 camadas

Uma única instância de banco local "com tudo dentro" (legado restaurado + schema novo lado a lado) **não resolve** a colisão — apenas move o mesmo problema do projeto remoto para o ambiente local. A estratégia adotada separa fisicamente as três responsabilidades:

### Componente A — Fonte legada local, separada e somente leitura
- A cópia do legado (a partir dos backups já existentes em `backups/`, com SHA-256 já conferido) é restaurada numa **instância/banco local separado**, dedicado só a isso.
- Tratada como **fonte read-only** para os scripts de ETL — nenhuma escrita acontece nela, e o schema novo **nunca** é criado dentro dela.
- Continua usando os nomes originais (`public.clientes`, `public.vendas` etc.) sem nenhum problema, porque vive isolada em sua própria instância.

### Componente B — Target novo, local
- Supabase CLI local completo (`supabase start`), banco limpo, sem nenhum dado do legado.
- As migrations criam as 21 tabelas definitivas em `public` (`clientes`, `vendas`, `oportunidades`, `parcelas` etc.) — sem colisão nenhuma, porque essa instância nunca teve o legado dentro dela.
- Pode ser destruído e recriado (`supabase db reset`) quantas vezes forem necessárias durante o desenvolvimento.
- Os scripts de ETL leem do Componente A e escrevem no Componente B — duas conexões distintas (fonte e destino), nunca a mesma base.

### Componente C — Destino definitivo
- Um **novo projeto Supabase dedicado ao Patrimonium** (diferente do projeto legado atual) — não o mesmo projeto remoto que hoje serve o app antigo.
- Recebe só as migrations já testadas e validadas no Componente B — de novo, sem colisão, porque é um projeto remoto novo, vazio, sem nenhuma tabela legada.
- Os dados reais são migrados do projeto legado (lido em modo read-only) para este novo projeto.
- Reconciliação (seção 10) roda contra este projeto novo antes de qualquer troca de aplicação.
- **O projeto Supabase antigo permanece intacto, como fallback, durante todo o cutover** — nada nele é renomeado, movido ou apagado em nenhum momento deste plano. A troca do app para o projeto novo só acontece após aprovação humana explícita, e mesmo depois disso o projeto antigo continua existindo intocado até a etapa de limpeza final (fora do escopo desta fase).

**Por que isso elimina a colisão de nomes sem renomear ou apagar nada:** o schema novo e o schema antigo nunca coexistem na mesma base de dados física em nenhum momento — nem em desenvolvimento (Componentes A e B são instâncias separadas), nem em produção (Componente C é um projeto Supabase diferente do legado). Como as duas estruturas nunca dividem o mesmo `public`, os nomes `clientes`/`vendas`/etc. podem ser idênticos nos dois lados sem qualquer conflito, e a tabela legada nunca precisa ser tocada.

Nada disso é criado agora — este documento é só a arquitetura aprovada para quando a implementação começar.

---

## 2. Ordem das migrations (estrutura) — RLS fail-closed desde a criação

Nenhuma tabela sensível existe, em nenhum momento, com RLS desligado e grants abertos — cada migration que cria uma tabela já habilita RLS e revoga privilégios na mesma migration, antes de qualquer policy funcional existir. Como o Postgres nega tudo por padrão quando RLS está habilitado e não há nenhuma policy, isso já deixa a tabela **fechada** (fail-closed) desde o primeiro commit, mesmo antes das policies funcionais serem escritas.

Padrão aplicado em **cada** migration de criação de tabela (não apenas numa migration final de RLS):
```sql
CREATE TABLE <tabela> (...);
ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON <tabela> FROM PUBLIC;
REVOKE ALL ON <tabela> FROM anon;
GRANT SELECT, INSERT, UPDATE ON <tabela> TO authenticated;
-- Sem GRANT DELETE em tabelas históricas/financeiras.
-- Sem policy nenhuma ainda: RLS habilitado + zero policies = acesso negado por padrão, mesmo para authenticated.
```
O `REVOKE` explícito não é redundante: o achado da auditoria de que o schema legado tem `GRANT ALL` para `anon` em todas as tabelas sugere que o projeto pode ter (ou ter tido) `ALTER DEFAULT PRIVILEGES` concedendo grants automáticos a novas tabelas. Por isso o plano não assume que uma tabela nova nasce sem privilégios — cada migration **garante isso explicitamente**, tanto no ambiente local (Componente B) quanto no projeto novo (Componente C).

| # | Migration (nome sugerido) | Objetivo | Tabelas afetadas | Dependências | Risco | Como validar | Estrutura/Dados |
|---|---|---|---|---|---|---|---|
| 1 | `0001_extensoes.sql` | Habilitar `pgcrypto`/`uuid-ossp` | — | Nenhuma | Baixo | `SELECT * FROM pg_extension` | Estrutura |
| 2 | `0002_empresas.sql` | Criar `empresas` + RLS + revoke/grant (padrão acima) | `empresas` | Extensões | Baixo | Testar insert como `anon` (deve falhar) e como `authenticated` sem policy (deve falhar) | Estrutura |
| 3 | `0003_categorias_financeiras.sql` | Idem para `categorias_financeiras` | `categorias_financeiras` | Nenhuma | Baixo | idem | Estrutura |
| 4 | `0004_canais_aquisicao.sql` | Idem para `canais_aquisicao` | `canais_aquisicao` | Nenhuma | Baixo | idem | Estrutura |
| 5 | `0005_cartoes.sql` | Idem para `cartoes` | `cartoes` | Nenhuma | Baixo | idem | Estrutura |
| 6 | `0006_contas.sql` | Idem para `contas` | `contas` | Nenhuma | Baixo | idem | Estrutura |
| 7 | `0007_produtos_servicos.sql` | Idem para `produtos_servicos` | `produtos_servicos` | `empresas` | Baixo | `unique(empresa_id, nome)` testado | Estrutura |
| 8 | `0008_campanhas.sql` | Idem para `campanhas` | `campanhas` | `empresas` | Baixo | idem | Estrutura |
| 9 | `0009_clientes.sql` | Idem para `clientes` (inclui a unique parcial de telefone) | `clientes` | Nenhuma | Baixo | Testar os 3 casos: normal ativo duplicado (bloqueia), legado/teste duplicado (permite), excluído logicamente (permite) | Estrutura |
| 10 | `0010_candidatos_duplicidade_cliente.sql` | Idem para `candidatos_duplicidade_cliente` | `candidatos_duplicidade_cliente` | `clientes` | Baixo | `check(cliente_id_a <> cliente_id_b)` testado | Estrutura |
| 11 | `0011_oportunidades.sql` | Criar `oportunidades` **sem** a coluna `venda_id` (quebra o ciclo com `vendas` — ver seção 3) + RLS/grants | `oportunidades` | `empresas`, `clientes`, `produtos_servicos`, `canais_aquisicao`, `campanhas` | Baixo | Insert de teste | Estrutura |
| 12 | `0012_reunioes.sql` | Idem para `reunioes` | `reunioes` | `oportunidades` | Baixo | idem | Estrutura |
| 13 | `0013_vendas.sql` | Criar `vendas`, incluindo FK para `oportunidades`, + RLS/grants | `vendas` | `empresas`, `produtos_servicos`, `clientes`, `oportunidades`, `canais_aquisicao`, `campanhas` | Médio | Insert cobrindo os 3 modelos de pagamento | Estrutura |
| 14 | `0014_oportunidades_venda_id.sql` | `ALTER TABLE oportunidades ADD COLUMN venda_id uuid REFERENCES vendas(id)` — fecha o ciclo | `oportunidades` | `vendas` (migration 13) | Baixo | Conversão de negociação em venda testada | Estrutura |
| 15 | `0015_assinaturas.sql` | Criar `assinaturas` + RLS/grants | `assinaturas` | `empresas`, `clientes`, `produtos_servicos`, `oportunidades`, `vendas`, `canais_aquisicao`, `campanhas` | Médio | `unique(cliente_id, produto_id) WHERE status NOT IN (...)` testado | Estrutura |
| 16 | `0016_parcelas.sql` | Criar `parcelas` com origem exclusiva + RLS/grants | `parcelas` | `vendas`, `assinaturas` | **Alto** | Testar as 4 combinações do CHECK de origem exclusiva + as duas unique parciais | Estrutura |
| 17 | `0017_compras_cartao.sql` | Idem para `compras_cartao` | `compras_cartao` | `cartoes`, `categorias_financeiras`, `empresas` | Baixo | idem | Estrutura |
| 18 | `0018_despesas_recorrentes.sql` | Idem para `despesas_recorrentes` | `despesas_recorrentes` | `categorias_financeiras`, `empresas` | Baixo | idem | Estrutura |
| 19 | `0019_lancamentos_financeiros.sql` | Criar `lancamentos_financeiros` — todas as CHECKs que não dependem de outra tabela + RLS/grants | `lancamentos_financeiros` | `empresas`, `categorias_financeiras`, `clientes`, `vendas`, `parcelas`, `campanhas`, `compras_cartao`, `despesas_recorrentes`, `contas` | **Alto** | Testar cada CHECK individualmente com inserts que devem falhar e inserts que devem passar | Estrutura |
| 20 | `0020_metas.sql` | Idem para `metas` | `metas` | Nenhuma FK real | Baixo | Insert de teste | Estrutura |
| 21 | `0021_fechamentos_mensais.sql` | Idem para `fechamentos_mensais` | `fechamentos_mensais` | Nenhuma FK real | Baixo | `unique(competencia)` testado | Estrutura |
| 22 | `0022_revisoes_migracao.sql` | Idem para `revisoes_migracao` | `revisoes_migracao` | Nenhuma FK real | Baixo | Insert de teste | Estrutura |
| 23 | `0023_auditoria.sql` | Idem para `auditoria` | `auditoria` | Nenhuma FK real | Baixo | Insert de teste | Estrutura |
| 24 | `0024_constraints_cruzadas_trigger.sql` | CHECKs/triggers que dependem de consulta a outra tabela (empresa/natureza consistente com venda/assinatura, validação de estorno) | `lancamentos_financeiros` | 0019 | **Alto** | Testar estorno, despesa compartilhada, transferência | Estrutura |
| 25 | `0025_indices.sql` | Índices adicionais de performance (não-unique) | várias | Todas as tabelas acima | Baixo | `EXPLAIN` em consultas típicas do dashboard | Estrutura |
| 26–32 | `0026_..._trigger.sql` (uma por função — ver seção 5) | Funções/triggers individuais | várias | Tabelas relevantes | Médio/Alto conforme a função | Testes unitários por função | Estrutura |
| 33 | `0033_views.sql` (ou uma por view) | Views derivadas (seção 6) | — | Tabelas + triggers | Baixo | Comparar view com cálculo manual | Estrutura |
| 34 | `0034_policies_funcionais.sql` (ou uma por tabela) | Adicionar as policies `USING`/`WITH CHECK` funcionais de `authenticated` em cada tabela — **RLS já estava habilitado e fechado desde a migration de criação**; esta migration só adiciona as regras de acesso, nunca abre o que estava fechado sem regra | Todas as 21 | Migrations 2–24 | Médio | Testar leitura/escrita como `authenticated` real, e reconfirmar que `anon` continua negado | Estrutura |
| 35 | `0035_seeds.sql` | Seeds de catálogo (seção 8) | `empresas`, `produtos_servicos`, `categorias_financeiras`, `canais_aquisicao`, `metas` | Migrations de estrutura completas | Baixo | Conferir contagem de linhas esperada | Dados |
| 36+ | Scripts de ETL do legado (seção 9) — **não são migrations de schema**, rodam à parte, lendo do Componente A e escrevendo no Componente B/C | — | Todas as tabelas relevantes | Migrations 1–35 completas | **Alto** | Checklist da seção 10 | Dados |

---

## 3. Dependências entre as 21 tabelas — ordem de criação

```
1.  empresas
2.  categorias_financeiras
3.  canais_aquisicao
4.  cartoes
5.  contas
6.  produtos_servicos          (dep: empresas)
7.  campanhas                  (dep: empresas)
8.  clientes
9.  candidatos_duplicidade_cliente   (dep: clientes)
10. oportunidades              (dep: empresas, clientes, produtos_servicos, canais_aquisicao, campanhas)
                                — criada SEM venda_id ainda
11. reunioes                   (dep: oportunidades)
12. vendas                     (dep: empresas, produtos_servicos, clientes, oportunidades, canais_aquisicao, campanhas)
    → ALTER oportunidades ADD COLUMN venda_id REFERENCES vendas(id)   -- fecha o ciclo oportunidades ⇄ vendas
13. assinaturas                (dep: empresas, clientes, produtos_servicos, oportunidades, vendas, canais_aquisicao, campanhas)
14. parcelas                   (dep: vendas, assinaturas)
15. compras_cartao             (dep: cartoes, categorias_financeiras, empresas)
16. despesas_recorrentes       (dep: categorias_financeiras, empresas)
17. lancamentos_financeiros    (dep: empresas, categorias_financeiras, clientes, vendas, parcelas, campanhas,
                                      compras_cartao, despesas_recorrentes, contas, self-FK estorno_de_id)
18. metas                      (sem FK real)
19. fechamentos_mensais        (sem FK real)
20. revisoes_migracao          (sem FK real)
21. auditoria                  (sem FK real)
```

**Único ciclo de dependência do modelo:** `oportunidades.venda_id → vendas` e `vendas.oportunidade_id → oportunidades`. Resolvido criando `oportunidades` primeiro sem a coluna `venda_id`, depois `vendas` com a FK para `oportunidades`, e só então adicionando `venda_id` a `oportunidades` via `ALTER TABLE`. Nenhuma outra tabela do modelo tem dependência circular.

---

## 4. Onde cada constraint crítica será implementada

| Constraint | Tabela | Tipo | Migration (planejada) |
|---|---|---|---|
| Origem exclusiva de parcela (venda XOR assinatura) | `parcelas` | `CHECK` | 0016 |
| `unique(assinatura_id, competencia_referencia)` | `parcelas` | `UNIQUE INDEX` parcial | 0016 |
| `unique(venda_id, numero)` | `parcelas` | `UNIQUE INDEX` parcial | 0016 |
| `telefone_normalizado` único para clientes normais ativos | `clientes` | `UNIQUE INDEX` parcial | 0009 |
| `idempotency_key` | `lancamentos_financeiros` | `UNIQUE` | 0019 |
| `unique(compra_cartao_id, numero_parcela_cartao)` | `lancamentos_financeiros` | `UNIQUE INDEX` | 0019 |
| `unique(despesa_recorrente_id, competencia_referencia)` | `lancamentos_financeiros` | `UNIQUE INDEX` parcial | 0019 |
| Regras `empresa_id` + `natureza` (as que não dependem de outra tabela) | `lancamentos_financeiros` | `CHECK` | 0019 |
| Regras `empresa_id` + `natureza` que dependem de consulta cruzada | `lancamentos_financeiros` | `CHECK` + `TRIGGER` | 0024 |
| Transferência sem `empresa_id`/`categoria_id`, com `conta_destino_id` obrigatório e diferente de `conta_id` | `lancamentos_financeiros` | `CHECK` | 0019 |
| Estorno vinculado (`estorno_de_id`) sem apagar o original | `lancamentos_financeiros` | `FK` self + `TRIGGER` de validação | 0024 |
| Ausência de `ON DELETE CASCADE` em histórico/financeiro | FKs de `vendas`, `parcelas`, `assinaturas`, `lancamentos_financeiros`, `oportunidades`, `clientes` | `FK ... ON DELETE RESTRICT` | Cada uma na sua própria migration de criação (0009–0023) |
| RLS habilitado + `anon` revogado + `authenticated` sem policy ainda | Todas as 21 | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `REVOKE`/`GRANT` | Na própria migration de criação de cada tabela (fail-closed desde o início — ver seção 2) |

---

## 5. Funções e triggers — planejamento (sem implementar)

| Função/trigger | Dispara em | Faz o quê | Observação |
|---|---|---|---|
| `normalizar_telefone()` | `BEFORE INSERT/UPDATE` em `clientes` | Remove símbolos, espaços e caracteres Unicode de direção (LRM/RLM) de `telefone`, grava em `telefone_normalizado` | A auditoria encontrou exatamente esse tipo de caractere invisível nos telefones legados |
| `atualizar_status_parcela()` | `AFTER INSERT/UPDATE/DELETE` em `lancamentos_financeiros` | Recalcula `parcelas.status` (`prevista`/`parcial`/`paga`) a partir da soma líquida de lançamentos vinculados; nunca sobrescreve `cancelada` | Não seta "atrasada" — isso continua sempre derivado por consulta/view, nunca por trigger |
| `registrar_auditoria()` | `AFTER INSERT/UPDATE` nas tabelas críticas listadas na seção 13 da proposta | Grava linha em `auditoria` com `dados_antes`/`dados_depois` | Trigger genérico reaproveitável, parametrizado por tabela |
| `validar_estorno()` | `BEFORE INSERT` em `lancamentos_financeiros` quando `estorno_de_id IS NOT NULL` | Confirma que o lançamento original existe, é do tipo compatível, e que a soma de estornos não ultrapassa o valor original | Não é um `CHECK` puro porque exige consulta a outra linha da mesma tabela |
| `validar_natureza_empresa()` | `BEFORE INSERT` em `lancamentos_financeiros` | Cobre os casos que um `CHECK` simples não cobre sozinho (ex.: `empresa_id` do lançamento bater com `empresa_id` da venda/assinatura vinculada via `parcela_id`) | Complementa as CHECKs da migration 0019 |
| `criar_despesa_compartilhada(...)` | Função chamada pela aplicação (não é trigger) | Insere as N linhas rateadas de uma despesa compartilhada dentro de uma única transação, todas com o mesmo `despesa_compartilhada_grupo_id` | A atomicidade vem de rodar dentro de uma transação, não de um trigger |
| `gerar_competencia_assinatura(...)` | Função chamada pela aplicação (ou job agendado) | Cria a `parcela` da competência corrente de uma assinatura **e** avança `proxima_data_cobranca` na mesma transação, respeitando `unique(assinatura_id, competencia_referencia)` | Gera só a competência que já venceu — nunca antecipa meses futuros |
| `gerar_despesa_recorrente(...)` | Função chamada pela aplicação (ou job agendado) | Cria o `lancamentos_financeiros` da competência corrente de uma despesa recorrente e avança `proxima_data_vencimento` | Mesmo princípio da anterior — nunca gera meses futuros em massa |

**Confirmação explícita:** nenhuma função/trigger listada acima "marca atraso". Atraso continua **sempre** derivado por view/consulta (seção 6), nunca por job ou trigger dependente da passagem do tempo.

---

## 6. Views planejadas (sem criar ainda)

| View | Finalidade | Evita recriar |
|---|---|---|
| `parcelas_situacao` | Saldo pendente e situação (incluindo "atrasada" derivada) de cada parcela | Que cada tela precise reimplementar a fórmula de saldo/atraso |
| `vendas_resumo_financeiro` | Vendido / recebido líquido / pendente por venda | Consultas repetidas de soma de `lancamentos_financeiros` por venda |
| `assinaturas_situacao` | Competências em aberto/atrasadas por assinatura, status comercial | Consultas repetidas para o bloco "Atenção" do dashboard |
| `inadimplencia_resumo` | Total vencido e não pago, por empresa | Cálculo de inadimplência do Dashboard e de cada empresa |
| `meta_10k_progresso` | Valor confirmado, percentual, dias restantes, médias necessárias — separado do valor em revisão | O cálculo da Meta 10K num só lugar, já respeitando a camada de reconciliação da seção 10 |
| `patrimonio_saldos` | Saldo calculado de cada conta (saldo inicial + movimentos) | Reimplementar o cálculo de patrimônio em várias telas |
| `cac_por_empresa` | Investimento (`entra_no_cac`) ÷ novos clientes, por empresa e por período | Cálculo repetido de CAC no resumo de cada empresa e no fechamento mensal |

Nenhuma view adicional além dessas 7 é proposta.

---

## 7. Ordem segura de RLS e segurança

RLS não é uma etapa isolada no fim — é parte de cada migration de criação (seção 2). O que resta planejar aqui é a camada de **policies funcionais**, que só adiciona acesso a algo que já nasceu fechado:

1. Cada tabela já é criada com RLS habilitado, `anon` revogado explicitamente e sem nenhuma policy (migrations 0002–0023) — nesse estado, **nada** é acessível, nem por `authenticated`, porque RLS sem policy nega tudo por padrão.
2. Antes de qualquer policy, **confirmar ativamente** (não assumir) que nenhum grant automático de `anon`/`public` foi herdado — checar `information_schema.role_table_grants` em cada ambiente (Componente B e, mais tarde, Componente C).
3. Migration 0034 adiciona as policies de `SELECT`/`INSERT`/`UPDATE` para `authenticated` (padrão da seção 13 da proposta) — sem policy de `DELETE` físico em tabelas históricas/financeiras.
4. Confirmar, como teste ativo, que `anon` continua sem nenhum acesso mesmo depois das policies de `authenticated` existirem.
5. Reservar `service_role` só para as rotinas internas já identificadas (geração de competência de assinatura/despesa recorrente, triggers de auditoria) — nunca usada nas chamadas do frontend.
6. **Não alterar nada nas policies do banco legado** nesta fase — a correção do RLS do banco legado é um projeto separado, já registrado como decisão do item 2 em `itens_para_confirmacao.md`, e o legado (Componente A / projeto antigo) nunca é escrito por este plano.

---

## 8. Seeds — dados iniciais exatos (sem inventar valores históricos)

- **`empresas`:** `Vision` (slug `vision`), `Digital Smile` (slug `digital_smile`).
- **`produtos_servicos`** (decisão registrada):
  - Vision (ativos): "5 fotos com IA" (R$29), "10 fotos com IA" (R$49), "Vídeo com IA" (preço personalizado), "Combo Fotos + Vídeo" (preço personalizado), "Site" (preço personalizado).
  - Digital Smile (ativo): "Gestão de Tráfego Pago" (preço de referência R$1.000, valor comercial inicial R$500).
  - Digital Smile (**inativo desde o início**, decisão registrada nesta rodada): "Site" — entra no catálogo já no seed, mas `ativo=false`; pode ser ativado no futuro sem migration, só mudando a flag.
  - Digital Smile (inativo): "Google Meu Negócio" — decisão já aprovada anteriormente.
- **`categorias_financeiras`** (retiradas da especificação, seções 14.3–14.5, não inventadas):
  - Empresariais: Tráfego pago (`entra_no_cac=true`), Ferramentas, Assinaturas, Magnific, Domínio, Hospedagem, Freelancer, Taxas, Outros.
  - Pessoais: Alimentação, Transporte, Cinema e lazer, Compras, Saúde, Assinaturas pessoais, Outros.
  - Extras: Sonati/Sonate, Trium/Trio, Presentes, Projetos por fora, Outras entradas extras.
- **`canais_aquisicao`:** Instagram, WhatsApp, Indicação, Anúncio, Google Maps, Lista própria, Outro.
- **`metas`:** "Meta 10K 2026", `valor_alvo=10000.00`, `data_inicio=2026-06-22`, `data_fim=2026-12-31`, `empresas_incluidas=[vision, digital_smile]`, `inclui_extras=false`, `ativa=true`.

Nenhum valor financeiro histórico (vendas, gastos, saldo inicial de conta) é semeado aqui — isso pertence à migração do legado (seção 9).

---

## 9. Migração do legado — planejamento por tabela (nada é migrado nesta etapa)

| Tabela legada | Transformação planejada |
|---|---|
| `clientes` | Uma linha nova por linha antiga; `telefone_normalizado` calculado pela função de normalização; `tipo_registro='legado_teste'` para os candidatos já identificados na auditoria; `legado_id_origem`/`legado_tabela_origem` preenchidos. |
| `vendas` | Uma `vendas` nova por linha antiga + `parcelas` geradas conforme a condição de pagamento; `empresa_id` definido pelo mapeamento aprovado da fonte (item 4). A venda da "Sonati" (R$400) **não** vira `vendas` — vira `lancamentos_financeiros` direto com `natureza='receita_extra'` (decisão do item 7; ver exemplo de transformação na seção 10). |
| `gastos_ads` | Uma linha em `lancamentos_financeiros` (`natureza='despesa_empresarial'`, `entra_no_cac=true`) por registro; o caso de 07/07/2026 (R$49,92) é classificado como Vision, preservando a fonte original incorreta e a descrição original em `legado_observacao_original` (decisão do item 5). |
| `entregas` | Incorporado em `vendas.status_entrega` (Vision) ou `vendas.checklist_entrega` (Digital Smile, quando o produto é Site) — sem tabela própria nova. |
| `pipeline` | Uma `oportunidades` nova por linha antiga; vínculo com `vendas` quando o cliente/valor/data batem com uma venda existente; as 2 negociações "fechadas" sem venda correspondente (R$194) ficam com `venda_id = NULL` e uma linha em `revisoes_migracao` (`tipo='pipeline_sem_venda'`) — decisão do item 9. |
| `ciclos` | Uma linha em `metas`, histórica, `ativa=false`, com a soma de `fontes.meta` (R$11.200) registrada em `observacao` como "meta histórica derivada das metas por fonte" (decisão do item 6). |
| `pacotes` | Produtos ainda válidos entram como seed adicional em `produtos_servicos`, se houver algum não coberto pela seção 8; itens obsoletos ficam só documentados. |
| `fontes` | **Não migrada como tabela.** Cada linha de `vendas`/`gastos_ads`/`pipeline` migrada recebe `empresa_id` (ou `natureza='receita_extra'`) conforme o mapeamento aprovado (item 4); `fontes.meta` não vira coluna — só o registro histórico da meta antiga em `ciclos → metas`. |

**Casos especiais — tratamento planejado, nada executado ainda:**
- **Sonati R$400:** vira `lancamentos_financeiros` (`natureza='receita_extra'`, sem `empresa_id`, sem `parcela_id`) — decisão do item 7. Ver a equação de reconciliação completa na seção 10.
- **Gasto de R$49,92 corrigido para Vision:** `empresa_id=Vision`, fonte/descrição originais preservadas em `legado_observacao_original` — decisão do item 5.
- **Venda de R$100 em revisão:** ambas as vendas históricas preservadas; uma delas marcada em `revisoes_migracao` (`tipo='duplicidade_valor'`); excluída do valor confirmado e da Meta 10K até confirmação humana — decisão do item 8.
- **R$194 do pipeline em revisão:** `oportunidades` com `venda_id=NULL` + linha em `revisoes_migracao` (`tipo='pipeline_sem_venda'`) — decisão do item 9. Fica fora de vendido/recebido/receita enquanto não houver venda/pagamento confirmado.
- **Duplicidade de cliente:** candidatos identificados entram em `candidatos_duplicidade_cliente` com `status='pendente'`; nenhuma mesclagem automática — decisões dos itens 11 e 12.
- **Registros teste/legado:** `clientes.tipo_registro='legado_teste'` para os casos claros; ambíguos entram em `revisoes_migracao` (`tipo='registro_teste_ambiguo'`) — decisão do item 13.
- **Vídeos históricos pagos integralmente:** o legado registra o pagamento como uma única linha "paga" no valor cheio. A migração preserva esse **fato histórico real**: uma única `parcela` já `paga`, no valor total — **não** se cria retroativamente uma segunda parcela 50/50 artificial. A estrutura nova suporta 50/50 normalmente para vendas **novas** feitas a partir de agora; o legado só é reclassificado se houver evidência concreta de que uma parcela específica está errada (decisão do item 10).

---

## 10. Validação obrigatória antes de qualquer cutover — reconciliação em duas camadas

A reconciliação não pode se limitar a comparar contagens/somas brutas entre legado e novo banco, porque a migração **transforma** alguns registros (a Sonati deixa de ser `vendas` e vira `lancamentos_financeiros` extra, por exemplo). Uma reconciliação só de "COUNT/SUM iguais" esconderia exatamente esse tipo de transformação em vez de comprová-la.

### A. Reconciliação de origem (números brutos do legado, sem transformação nenhuma)

| Métrica | Valor de conferência | Fonte |
|---|---|---|
| Total de vendas históricas (registros) | 67 | `auditoria_dados_atual.md`, seção 1 |
| Total histórico de vendas (soma de valor) | R$ 2.493,90 | `auditoria_dados_atual.md`, seção 5 |
| Total de registros de `gastos_ads` | 36 | `auditoria_dados_atual.md`, seção 1 |
| Vision elegível para Meta 10K, valor bruto do período (desde 22/06/2026, antes de qualquer revisão) | R$ 961,00 (12 vendas) | `auditoria_dados_atual.md`, seção 6 |
| Sonati (extra) | R$ 400,00 | `auditoria_dados_atual.md`, seção 5/6 |
| Total recebido bruto no período (Vision + Sonati) | R$ 1.361,00 (13 vendas) | `auditoria_dados_atual.md`, seção 6 |
| Investimento de aquisição desde 22/06/2026 | R$ 488,81 (12 registros) | `auditoria_dados_atual.md`, seção 6 |
| Total histórico de gastos de anúncios (36 registros) | **não confirmado** — ver nota abaixo | — |

**Nota sobre R$1.024,81:** esse valor, citado como "histórico total de gastos de anúncios", **não aparece em `auditoria_dados_atual.md`** — o documento só soma o período elegível da meta (R$488,81, 12 registros), nunca os 36 registros totais. Antes de fechar o checklist oficial de reconciliação, será feita uma **verificação somente leitura diretamente no backup** (`backups/dados_antes_refatoracao.sql`), recalculando `SUM(valor)` e `COUNT(*)` de `gastos_ads` sem nenhuma escrita, para confirmar (ou corrigir) esse número antes de tratá-lo como valor de conferência.

### B. Reconciliação de destino/transformação (para onde cada valor foi)

A equação que precisa fechar, registro a registro, não é "67 = 67", e sim:

```
total de registros legados em `vendas` (67)
  =
vendas empresariais migradas para `vendas` (novo)
  + receitas extras transformadas em `lancamentos_financeiros` (natureza='receita_extra')
  + registros em revisão (revisoes_migracao, status='pendente')
  + eventuais registros excluídos de métricas por regra documentada (ex.: registros de teste)
```

**Exemplo obrigatório de verificação — Sonati R$400:**
| Lado legado | Lado novo |
|---|---|
| 1 registro em `vendas` (legado), cliente "Sonati", R$400,00 | 0 registros novos em `vendas`; **1 registro** novo em `lancamentos_financeiros` (`tipo='entrada'`, `natureza='receita_extra'`, `empresa_id=NULL`, `valor=400.00`) |

A reconciliação deve mostrar explicitamente essa transformação (venda legada → receita extra), não apenas confirmar que "o total ainda bate" — nenhum valor pode simplesmente desaparecer da equação, e nenhuma transformação pode ficar implícita.

**Meta 10K — três camadas separadas, nunca uma soma única:**
1. **Valor histórico bruto potencialmente elegível:** R$961,00 (12 vendas Vision, sem nenhum ajuste de revisão).
2. **Valor confirmado:** R$961,00 menos os R$100,00 da venda em revisão (item 8) = **R$861,00**, enquanto a revisão estiver `pendente`.
3. **Valores em revisão:** R$100,00 (venda de vídeo possivelmente duplicada) — nunca somado ao valor confirmado.

O caso dos R$194,00 do pipeline **não entra em nenhuma das três camadas da Meta 10K** — ele nunca foi uma `vendas`, então não é "histórico bruto elegível" nem "confirmado"; fica inteiramente fora de vendido/recebido/receita até haver confirmação humana de que virou venda/pagamento real.

**Regra geral:** nenhum valor em revisão (R$100 do item 8, R$194 do item 9) pode ser forçado a entrar no valor confirmado da Meta 10K ou de qualquer métrica financeira "fechada", mesmo que a soma pareça "bater melhor" incluindo-os. Eles aparecem sempre como uma camada separada e explícita.

O cutover só pode ser considerado apto quando (a) todos os números da camada A baterem exatamente, (b) a equação da camada B fechar sem nenhum valor "perdido" ou implícito, e (c) os valores em revisão estiverem listados à parte, nunca somados aos confirmados.

---

## 11. Rollback e cutover

- **Testar repetidamente sem tocar no remoto:** todo o desenvolvimento e todos os testes (estrutura + ETL) rodam contra os Componentes A e B, ambos locais. O projeto Supabase legado (remoto) não recebe nenhum comando de escrita durante essa fase, e o futuro projeto novo (Componente C) só recebe as migrations depois de tudo validado localmente.
- **Descartar e recriar o ambiente de teste:** `supabase db reset` (ou equivalente) no Componente B, quantas vezes forem necessárias — cada iteração começa de um estado limpo e conhecido. O Componente A (fonte legada local) pode ser recarregado do zero a partir dos backups sempre que necessário, sem qualquer risco.
- **Validar a migração:** rodar o checklist da seção 10 (camadas A e B) após cada rodada completa de migrations + ETL, primeiro localmente (Componente B), depois no projeto novo (Componente C) antes do cutover final.
- **Cutover:** só ocorre depois de (a) todas as migrations de estrutura testadas no Componente B, (b) o ETL do legado testado e reconciliado, (c) as mesmas migrations aplicadas ao Componente C (projeto novo) e revalidadas, (d) aprovação humana explícita — nunca automática.
- **Voltar ao estado anterior caso algo falhe:** como o projeto Supabase legado nunca é alterado por este plano, "reverter" significa simplesmente não trocar a aplicação para o projeto novo — o app antigo continua funcionando exatamente como está, apontando para o projeto Supabase original intacto, enquanto o problema é investigado. Não há nenhum cenário em que o legado precise ser restaurado, porque ele nunca foi modificado.

---

## 12. Plano de execução

- **Fase 5A — Planejamento** *(este documento)*.
- **Fase 5B — Migrations locais de estrutura**: escrever e aplicar, só no Componente B (target novo local), as migrations 0001–0034 (tabelas + RLS/grants desde a criação + constraints + triggers + views) descritas nas seções 2–7.
- **Fase 5C — Testes locais de estrutura**: inserts de teste, tentativas de violação de cada constraint crítica (seção 4), testes de RLS/grants como `anon`/`authenticated`/`service_role` no Componente B.
- **Fase 5D — Scripts de migração de dados**: ETL lendo do Componente A (fonte legada local, read-only) e escrevendo no Componente B, conforme a seção 9.
- **Fase 5E — Reconciliação**: checklist de duas camadas da seção 10, incluindo a verificação somente leitura pendente do valor de gastos históricos totais, rodada no Componente B.
- **Fase 5F — Aprovação humana**: apresentação dos resultados da reconciliação; nenhuma ação no Componente C ou no legado acontece sem aprovação explícita aqui.
- **Fase 5G — Aplicação controlada no ambiente definitivo**: criação do novo projeto Supabase dedicado (Componente C — ainda não feita agora), aplicação das migrations já testadas, ETL real a partir do legado (lido em modo read-only), reconciliação repetida no Componente C, e só depois a troca da aplicação — o projeto Supabase legado permanece intocado como fallback durante e após essa etapa.

---

## Decisões registradas nesta rodada (já resolvidas)

1. **Ambiente local:** Supabase CLI completo para o Componente B (target novo). A fonte legada (Componente A) fica em instância separada, read-only, nunca compartilhando base com o schema novo.
2. **Dados para desenvolvimento:** usar os backups já existentes (`backups/`, SHA-256 já conferido) para os testes locais. Antes do cutover definitivo (Fase 5G), gerar um backup/exportação atualizado do legado, com aprovação humana explícita. Backups nunca entram no Git.
3. **Site da Digital Smile:** entra no seed do catálogo desde o início, como produto **inativo**; pode ser ativado no futuro só mudando a flag, sem migration nova.
4. **R$1.024,81 (gastos históricos totais):** não tratado como confirmado. Planejada uma verificação somente leitura diretamente no backup (recalcular `SUM`/`COUNT` de `gastos_ads`) antes de fechar o checklist oficial da seção 10.
5. **Casos históricos em revisão** (R$100, R$194, cliente duplicado, testes ambíguos): não bloqueiam a escrita nem os testes das migrations locais. Devem ser resolvidos antes do cutover final quando houver evidência suficiente; qualquer caso ainda não resolvido nessa data permanece explicitamente em revisão e não é forçado a entrar em nenhuma métrica confirmada.

## Decisões que ainda permanecem realmente pendentes

- Nenhuma decisão de negócio ficou em aberto após esta rodada. Resta apenas um detalhe técnico de implementação, que não bloqueia o planejamento: o mecanismo exato de conexão do ETL entre o Componente A e o Componente B (ex.: `postgres_fdw`/`dblink` rodando dentro do Postgres local, ou um script de aplicação com duas strings de conexão) — decisão a tomar no momento de escrever os scripts de ETL, não antes.

---

Nenhuma migration foi criada, nenhum SQL foi executado, nenhuma tabela antiga foi renomeada ou movida, nenhum comando alterou o Supabase remoto, nenhum código de frontend foi alterado. Este documento é somente o planejamento da Fase 5, aguardando aprovação.
