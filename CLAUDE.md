# Regras permanentes do projeto — Patrimonium

## Produto

- O projeto se chama **Patrimonium**: um ecossistema financeiro pessoal para administrar Vision, Digital Smile, receitas extras, despesas pessoais, patrimônio e metas.
- A especificação funcional completa está em `docs/01_especificacao_completa_ecossistema_financeiro.md` — leia antes de tomar qualquer decisão de produto.
- O processo de auditoria e migração segura está em `docs/02_primeiros_passos_claude_code_supabase.md` — leia antes de tocar no Supabase.
- O aplicativo **já existe** e possui uma versão anterior com um Supabase de produção contendo histórico financeiro real. A nova versão deve **reaproveitar o projeto e os dados existentes**, não recriar do zero.
- Existem apenas cinco áreas principais: Dashboard, Vision, Digital Smile, Financeiro, Metas e Patrimônio.
- A interface deve ser minimalista.
- Não criar páginas ou funcionalidades fora da especificação sem aprovação.
- Produtos futuros (mentoria, curso, comunidade) ficam invisíveis até serem ativados.
- Fontes extras (Sonati, Danilo, Jiu-jítsu…) entram na Meta 10K e no faturamento total; nunca no CAC, ticket ou lucro das empresas. Extras avulsos sem fonte (ex.: presentes) ficam fora da meta.

## Banco de dados

- O Supabase atual contém histórico real de produção.
- Nunca apagar tabela ou registro de produção sem autorização explícita.
- Toda mudança de schema deve usar migration versionada.
- Preservar dados legados e permitir rastrear sua origem (tabela legada, ID legado, data da migração).
- Não executar `supabase db reset --linked`.
- Não executar `DROP TABLE`, `TRUNCATE` ou `DELETE` em produção.
- Não executar `supabase db push` sem dry-run, backup e aprovação.
- Estratégia de migração obrigatória: expandir → migrar → validar → trocar a aplicação → preservar tabelas antigas → remover somente em etapa futura.

## Processo

- Primeiro analisar, depois documentar, depois propor um plano. Só implementar após aprovação explícita.
- Antes de editar o banco, listar impacto, risco, rollback e validações.
- Evitar duplicidades e operações não idempotentes.
- Uma migration por assunto; migrations pequenas e idempotentes.
- Nunca misturar criação, backfill e exclusão no mesmo arquivo de migration.

## Segurança

- Nunca imprimir ou versionar segredos.
- Não usar service role no frontend.
- Não expor dados financeiros em rotas públicas.
- Segredos ficam em `.env.local` ou no gerenciador de segredos da plataforma — nunca no código ou no Git.
