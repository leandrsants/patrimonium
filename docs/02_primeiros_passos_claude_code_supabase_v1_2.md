# PRIMEIROS PASSOS NO CLAUDE CODE  
## Projeto existente com Supabase e histórico real

**Versão:** 1.2  
**Objetivo:** iniciar o projeto com segurança, entender o código e o banco atuais e produzir um plano de migração antes de construir a nova versão.

Este documento deve ser usado depois que a especificação funcional do aplicativo estiver aprovada.

Arquivo de referência esperado:

```text
docs/01_especificacao_completa_ecossistema_financeiro.md
```

---

# 1. Regra principal

O Claude Code não deve começar construindo telas nem criando tabelas imediatamente.

A primeira etapa é:

1. proteger o histórico;
2. versionar o código;
3. gerar backups;
4. entender o projeto;
5. entender o Supabase;
6. mapear os dados antigos;
7. propor a migração;
8. parar e aguardar aprovação.

O Claude Code consegue ler arquivos, editar código e executar comandos. Por isso, a primeira sessão deve usar **plan mode**, que permite analisar e propor um plano antes de editar arquivos.

---

# 2. Resultado esperado desta fase

Ao final dos primeiros passos, devem existir:

```text
docs/
├── 01_especificacao_completa_ecossistema_financeiro.md
├── estado_atual_aplicacao.md
├── inventario_banco_atual.md
├── uso_das_tabelas_no_codigo.md
├── mapa_migracao.md
├── plano_migracao.md
└── pendencias_para_usuario.md
```

Também devem existir:

- backup do schema;
- backup dos dados;
- backup dos roles;
- commit inicial;
- baseline do banco atual, revisada;
- nenhuma perda de histórico;
- nenhuma alteração funcional em produção;
- nenhuma tabela apagada.

---

# 3. O que preparar antes de abrir o Claude Code

## 3.1 Projeto local

Tenha a pasta do aplicativo atual no computador.

Ela deve conter, sempre que possível:

- código-fonte;
- package.json;
- arquivos de configuração;
- arquivos do Supabase;
- variáveis de ambiente locais;
- repositório Git.

## 3.2 Acessos necessários

Tenha acesso a:

- projeto no painel do Supabase;
- Project Ref;
- senha do banco;
- conta que possui o código;
- ambiente onde o app está hospedado.

Não cole senhas ou chaves no Claude Chat.

No Claude Code, segredos devem ficar em `.env.local` ou no gerenciador de segredos da plataforma.

## 3.3 Ferramentas

Recomendado:

- Git;
- Node.js;
- npm;
- Claude Code;
- Supabase CLI;
- Docker Desktop, caso use `supabase db pull` ou ambiente local.

O `db pull` do Supabase utiliza um container local para comparar schemas, portanto depende de Docker ou runtime compatível.

---

# 4. Organização inicial dos arquivos

Na raiz do projeto, criar:

```text
/
├── CLAUDE.md
├── CLAUDE.local.md
├── docs/
│   └── 01_especificacao_completa_ecossistema_financeiro.md
├── backups/
├── supabase/
├── .env.local
└── .gitignore
```

## 4.1 `.gitignore`

Garantir no mínimo:

```gitignore
.env
.env.*
!.env.example

backups/
supabase/.temp/
supabase/.branches/

node_modules/
dist/
build/
.next/
```

Nunca enviar para Git:

- backup com dados financeiros;
- senha do banco;
- service role key;
- access token;
- arquivo `.env.local`.

---

# 5. Criar o `CLAUDE.md`

O `CLAUDE.md` deve ser curto.

Não copie toda a especificação para ele. Um arquivo muito grande consome contexto e reduz a chance de as regras serem seguidas.

Conteúdo recomendado:

```md
# Regras permanentes do projeto

## Produto

- O produto é um ecossistema financeiro para Vision e Digital Smile.
- A especificação funcional está em `docs/01_especificacao_completa_ecossistema_financeiro.md`.
- A interface deve permanecer minimalista.
- Existem somente cinco áreas principais.
- Seções transversais da especificação não representam páginas novas.
- Não movimentar automaticamente o estágio de leads ao alterar reuniões.
- Não aplicar 50/50 ao pacote inteiro de fotos + vídeo sem definição manual.
- A revisão de registros ambíguos é temporária e exclusiva da migração.
- Não adicionar funções fora do escopo sem aprovação.

## Banco de dados

- O Supabase atual contém histórico real.
- Nunca apagar tabela ou registro de produção sem autorização explícita.
- Toda mudança de schema deve usar migration versionada.
- Preservar dados legados e permitir rastrear sua origem.
- Não executar `supabase db reset --linked`.
- Não executar `DROP TABLE`, `TRUNCATE` ou `DELETE` em produção.
- Não executar `supabase db push` sem dry-run, backup e aprovação.

## Processo

- Primeiro analisar.
- Depois documentar.
- Depois propor um plano.
- Só implementar após aprovação.
- Antes de editar banco, listar impacto, risco, rollback e validações.
- Evitar duplicidades e operações não idempotentes.

## Segurança

- Nunca imprimir ou versionar segredos.
- Não usar service role no frontend.
- Não expor dados financeiros em rotas públicas.
```

O Claude Code lê `CLAUDE.md` no início das sessões.

## 5.1 `CLAUDE.local.md`

Criar para dados locais e colocar no `.gitignore`.

Exemplo:

```md
# Informações locais

- O ambiente de produção do Supabase é somente leitura durante a auditoria.
- O caminho local dos backups é `./backups`.
- Não executar publicação sem confirmação humana.
```

---

# 6. Versionar o estado atual

Antes de qualquer modificação:

```bash
git init
git add .
git commit -m "snapshot do aplicativo antes da refatoracao"
git switch -c refactor/ecossistema-financeiro
```

Caso o projeto já use Git:

```bash
git status
git add .
git commit -m "snapshot antes da refatoracao financeira"
git switch -c refactor/ecossistema-financeiro
```

Não prossiga se existirem alterações importantes não salvas.

---

# 7. Copiar a especificação para o projeto

Colocar o primeiro documento em:

```text
docs/01_especificacao_completa_ecossistema_financeiro.md
```

O Claude Code deve tratar esse arquivo como fonte de verdade do produto.

---

# 8. Iniciar o Claude Code em modo de planejamento

Na raiz do projeto:

```bash
claude --permission-mode plan
```

O status deve indicar que o modo de planejamento está ativo.

Nesse modo, o Claude pode ler arquivos e propor um plano, mas deve aguardar aprovação antes de editar.

---

# 9. Primeiro prompt para o Claude Code

Cole exatamente este prompt:

```text
Leia primeiro:

- CLAUDE.md
- docs/01_especificacao_completa_ecossistema_financeiro.md
- package.json
- arquivos de configuração
- pasta src, app ou equivalente
- pasta supabase
- migrations existentes
- tipos gerados do Supabase
- serviços, hooks e consultas que acessam o banco

Estamos trabalhando em um aplicativo existente com dados financeiros reais
no Supabase. Nesta primeira etapa, não construa telas, não crie tabelas e
não altere o banco remoto.

Objetivo desta sessão:

1. Entender a arquitetura atual.
2. Descobrir quais tecnologias estão sendo usadas.
3. Localizar todos os acessos ao Supabase.
4. Identificar tabelas, views e funções aparentes pelo código e migrations.
5. Identificar riscos de perda de histórico.
6. Criar um plano de auditoria e migração.

Proibições nesta etapa:

- não executar supabase db push;
- não executar supabase db reset --linked;
- não executar DROP, DELETE ou TRUNCATE;
- não executar migrations na produção;
- não alterar arquivos ainda;
- não modificar variáveis de ambiente;
- não exibir segredos;
- não assumir que uma tabela é inútil apenas pelo nome.

Entregue no chat:

- resumo da arquitetura;
- lista das tecnologias;
- lista dos pontos que acessam o banco;
- arquivos que precisam ser analisados com mais profundidade;
- comandos seguros sugeridos para backup;
- plano de documentação;
- dúvidas objetivas;
- riscos encontrados.

Pare depois do plano e aguarde minha aprovação.
```

## 9.1 O que verificar na resposta

A resposta deve demonstrar que o Claude entendeu:

- que existe histórico;
- que o Supabase atual é produção;
- que não pode apagar tabelas;
- que o app novo precisa reaproveitar dados;
- que a especificação é minimalista;
- que a auditoria vem antes da implementação.

Não aprove uma resposta genérica que diga apenas “vou criar novas tabelas”.

---

# 10. Inicializar e vincular o Supabase CLI

Somente depois de ler o plano e confirmar que o repositório está salvo.

Caso ainda não exista a pasta Supabase:

```bash
npx supabase init
```

Autenticar manualmente no seu próprio terminal:

```bash
npx supabase login
```

O login abre um fluxo interativo no navegador. Execute você mesmo esse comando fora de qualquer automação do Claude Code. Não forneça seu access token ao modelo.

Vincular ao projeto atual:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
```

O Project Ref aparece no endereço do painel do projeto.

O vínculo permite que a CLI execute operações remotas. Portanto, comandos de escrita continuam proibidos até a aprovação.

---

# 11. Criar backups completos

Criar uma pasta local:

```bash
mkdir backups
```

No PowerShell:

```powershell
New-Item -ItemType Directory -Force backups
```

Gerar três arquivos separados.

## 11.1 Roles

```bash
npx supabase db dump --linked --role-only -f backups/roles_antes_refatoracao.sql
```

## 11.2 Schema

```bash
npx supabase db dump --linked -f backups/schema_antes_refatoracao.sql
```

## 11.3 Dados

```bash
npx supabase db dump --linked --data-only --use-copy -f backups/dados_antes_refatoracao.sql
```

Regras:

- não versionar os backups;
- conferir se os arquivos existem;
- conferir se não estão vazios;
- registrar data e tamanho;
- comparar contagens e somas importantes antes e depois;
- quando possível, testar a restauração em um Postgres local descartável;
- não declarar backup concluído sem validação.

## 11.4 Backup no painel

Verificar também no Supabase:

```text
Database → Backups
```

Confirmar se existe backup restaurável.

Os backups do banco não necessariamente restauram arquivos físicos do Supabase Storage. No projeto atual, os contratos ficarão no Google Drive, reduzindo esse risco.

---

# 12. Segunda sessão: auditoria com edição de documentos

Depois dos backups, permitir que Claude edite apenas arquivos de documentação.

Iniciar novamente em plan mode ou manter a sessão:

```bash
claude --permission-mode plan
```

Prompt:

```text
Os backups foram concluídos e validados.

Agora analise o código, as migrations e o arquivo de schema exportado.
Você pode criar ou editar somente arquivos dentro de `docs/`.

Não altere o código da aplicação.
Não altere migrations.
Não altere o Supabase remoto.
Não execute comandos de escrita no banco.

Produza:

1. `docs/estado_atual_aplicacao.md`
   - stack;
   - arquitetura;
   - páginas;
   - fluxos;
   - componentes;
   - estado global;
   - autenticação;
   - pontos frágeis.

2. `docs/inventario_banco_atual.md`
   - tabelas;
   - colunas;
   - chaves;
   - relacionamentos;
   - índices;
   - views;
   - funções;
   - triggers;
   - políticas RLS;
   - finalidade aparente;
   - indicação de dados históricos.

3. `docs/uso_das_tabelas_no_codigo.md`
   - tabela;
   - arquivo que usa;
   - tipo de operação;
   - dependências;
   - risco de alteração;
   - tabelas aparentemente sem uso, sem recomendar exclusão ainda.

4. `docs/pendencias_para_usuario.md`
   - perguntas que não podem ser respondidas pelo código;
   - registros que podem exigir classificação manual;
   - dados ou saldos ainda não confirmados.

Pare depois de criar os documentos.
Não proponha a implementação final ainda.
```

---

# 12.1 Confirmar decisões funcionais antes do mapa de migração

Antes da baseline final, do mapa de migração e da implementação, confirmar que a especificação vigente contém:

- histórico elegível desde 22/06/2026 dentro da Meta 10K;
- fotos pagas 100% antes e vídeos em 50/50 por padrão;
- pacotes de fotos + vídeo com condição personalizada;
- reunião e estágio sem sincronização automática;
- atraso automático em todas as contas a receber;
- despesas recorrentes simplificadas;
- revisão temporária de registros históricos ambíguos;
- saldo inicial por conta;
- vencimento no último dia válido do mês;
- atribuição manual de campanhas.

Se o arquivo da especificação já contiver essas regras, apenas registrar a confirmação no plano. Não criar novas páginas para implementá-las.

---

# 13. Criar a baseline do schema atual

A baseline transforma o estado atual do banco em uma migration inicial versionada.

Isso deve acontecer somente depois de:

- backup confirmado;
- schema exportado;
- inventário revisado;
- Docker funcionando;
- aprovação humana.

Comando:

```bash
npx supabase db pull baseline_banco_atual
```

A CLI criará algo como:

```text
supabase/migrations/2026XXXXXXXXXX_baseline_banco_atual.sql
```

## 13.1 Revisão obrigatória

O `db pull` compara o remoto com um ambiente local e pode incluir comandos inesperados.

Antes de fazer commit:

- ler o arquivo;
- procurar `DROP`;
- procurar alterações de extensions;
- verificar schemas;
- verificar funções;
- verificar policies;
- confirmar que não existem comandos destrutivos inesperados.

Não editar a baseline antiga depois que novas migrations forem criadas.

## 13.2 Histórico remoto de migrations

O comando pode perguntar se deve atualizar o histórico remoto de migrations.

Não responder automaticamente.

O Claude deve explicar:

- o que será gravado;
- por que é necessário;
- como isso afeta futuros `db push`;
- qual é o rollback.

Só confirmar após entender.

---

# 14. Criar um ambiente de desenvolvimento

A produção não deve ser o ambiente de teste.

## 14.1 Opção recomendada para começar

Supabase local:

```bash
npx supabase start
```

Depois:

```bash
npx supabase db reset --local
```

O reset local pode ser usado para recriar o banco local.

## 14.2 Comando proibido em produção

Nunca executar:

```bash
npx supabase db reset --linked
```

Esse comando atua no projeto remoto vinculado e pode remover entidades criadas pelo usuário.

## 14.3 Alternativas

Caso o projeto permita:

- Supabase Branch;
- segundo projeto Supabase de desenvolvimento;
- banco local restaurado com uma cópia anonimizada.

Branches do Supabase são ambientes separados, mas dependem da estrutura de migrations do projeto. Por isso, a baseline deve estar correta primeiro.

---

# 15. Gerar dados de teste seguros

Não usar dados pessoais reais em `seed.sql`.

Criar registros fictícios representativos:

- cliente Vision;
- cliente Digital Smile;
- venda de fotos;
- vídeo 50/50;
- site 50/50;
- mensalidade ativa;
- mensalidade atrasada;
- receita extra;
- despesa pessoal;
- transferência banco → Binance;
- estorno;
- cliente duplicado por telefone.

O seed deve permitir testar todas as regras sem expor histórico real.

---

# 16. Produzir o mapa de migração

Depois da baseline, pedir ao Claude:

```text
Com base em:

- docs/01_especificacao_completa_ecossistema_financeiro.md
- docs/inventario_banco_atual.md
- docs/uso_das_tabelas_no_codigo.md
- baseline do Supabase
- código atual

Crie:

1. `docs/mapa_migracao.md`
2. `docs/plano_migracao.md`

O mapa deve conter:

- tabela antiga;
- coluna antiga;
- entidade nova;
- coluna nova;
- transformação;
- regra de classificação;
- risco;
- validação;
- rollback;
- necessidade de revisão manual.

O plano deve seguir a estratégia:

1. expandir;
2. migrar;
3. validar;
4. trocar a aplicação;
5. preservar tabelas antigas;
6. remover somente em uma etapa futura.

Não criar migrations ainda.
Não alterar o código.
Não apagar tabelas.
Pare depois dos documentos.
```

---

# 17. Estratégia de migração obrigatória

## 17.1 Expandir

Criar novas estruturas sem apagar as antigas.

## 17.2 Migrar

Copiar os registros antigos.

Cada registro migrado deve manter referência à origem:

- tabela legada;
- ID legado;
- data da migração.

## 17.3 Validar

Comparar:

- quantidade de vendas;
- soma dos recebimentos;
- soma de investimentos;
- número de clientes;
- datas;
- categorias;
- registros sem destino;
- duplicidades;
- valores extras.

## 17.4 Trocar a aplicação

Somente depois da validação, atualizar o frontend.

## 17.5 Preservar

As tabelas antigas devem permanecer inicialmente:

- sem novas gravações;
- identificadas como legadas;
- disponíveis para auditoria;
- sem `DROP TABLE` na primeira implantação.

---

# 18. Primeiro ponto de parada obrigatório

O Claude Code deve parar antes de criar as tabelas novas.

Nesse momento, você deve ter em mãos:

- especificação aprovada;
- backup validado;
- inventário do código;
- inventário do banco;
- baseline revisada;
- mapa de migração;
- plano de migração;
- lista de dúvidas;
- ambiente local.

Somente depois disso deve ser criado um terceiro documento ou prompt de implementação por fases.

---

# 19. Regras para a fase de implementação futura

Quando a construção começar:

- uma migration por assunto;
- migrations pequenas;
- migrations idempotentes;
- sem misturar criação, backfill e exclusão no mesmo arquivo;
- testar localmente;
- validar totais antes e depois;
- regenerar tipos;
- executar lint e testes;
- fazer `db push --dry-run`;
- revisar;
- criar novo backup;
- publicar;
- validar produção.

Exemplo de organização:

```text
supabase/migrations/
├── ..._create_core_entities.sql
├── ..._create_financial_entities.sql
├── ..._create_sales_and_payments.sql
├── ..._create_contracts_and_onboarding.sql
├── ..._add_constraints_and_indexes.sql
├── ..._backfill_businesses.sql
├── ..._backfill_contacts.sql
├── ..._backfill_sales.sql
├── ..._backfill_transactions.sql
└── ..._add_validation_queries.sql
```

---

# 20. Comandos que exigem cuidado

## Permitidos durante auditoria

- `git status`
- `git log`
- leitura de arquivos;
- `npx supabase db dump`;
- consultas `SELECT`;
- geração de documentação;
- `npx supabase db pull`, somente após backup e aprovação.

## Proibidos inicialmente

- `npx supabase db push`
- `npx supabase db reset --linked`
- `DROP TABLE`
- `DROP SCHEMA`
- `TRUNCATE`
- `DELETE`
- mudanças pelo SQL Editor de produção;
- alteração de RLS sem plano;
- modificação de dados históricos;
- rotação ou exposição de chaves sem necessidade.

---

# 21. Como avaliar se o Claude Code está trabalhando corretamente

Sinais positivos:

- pergunta antes de executar comando de risco;
- cita arquivos e tabelas reais;
- não inventa estrutura;
- diferencia fato de suposição;
- propõe validações;
- mantém rollback;
- evita exclusões;
- produz migrations pequenas;
- verifica duplicidades;
- conserva rastreabilidade.

Sinais de risco:

- quer recriar o banco do zero;
- recomenda apagar tabelas antigas imediatamente;
- mistura todos os dados em uma tabela genérica;
- trata extras como faturamento;
- não separa vendido e recebido;
- cria todo o app antes de auditar o banco;
- executa comandos remotos sem explicar;
- usa service role no frontend;
- não cria backup;
- não confere totais antes e depois.

---

# 22. Ordem prática resumida

1. Copiar a especificação para `docs/`.
2. Criar `CLAUDE.md`.
3. Criar `.gitignore`.
4. Fazer commit inicial.
5. Abrir branch de refatoração.
6. Iniciar Claude Code em plan mode.
7. Rodar o primeiro prompt de análise.
8. Vincular Supabase CLI.
9. Criar e validar backups.
10. Gerar inventário do app e banco.
11. Criar baseline.
12. Revisar a baseline.
13. Criar ambiente local.
14. Criar seed fictício.
15. Produzir mapa e plano de migração.
16. Parar.
17. Aprovar o plano.
18. Só então iniciar a implementação.

---

# 23. Referências oficiais consultadas

- Claude Code Docs — Overview.
- Claude Code Docs — How Claude remembers your project.
- Claude Code Docs — Common workflows e Plan mode.
- Supabase Docs — Local development workflow.
- Supabase Docs — CLI Reference.
- Supabase Docs — Database Backups.
- Supabase Docs — Database Migrations.
- Supabase Docs — Branching.

---

# 24. Conclusão

O primeiro trabalho do Claude Code não é criar o novo aplicativo.

O primeiro trabalho é garantir que ele entenda:

- o produto;
- o projeto atual;
- o banco atual;
- o histórico;
- os riscos;
- a migração.

A construção deve começar somente depois que esses elementos estiverem documentados e aprovados.
