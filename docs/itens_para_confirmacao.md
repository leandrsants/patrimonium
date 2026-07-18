# Itens para confirmação humana — Fase 3 (auditoria do schema + dados)

Cada item abaixo representa uma ambiguidade encontrada na auditoria (`docs/auditoria_schema_atual.md` e `docs/auditoria_dados_atual.md`). Alguns itens já possuem decisão ou critério definido; os demais ainda aguardam confirmação humana.

## Status das decisões

| Item | Assunto | Status |
|---|---|---|
| 1 | Exclusão em cascata em dados financeiros | **Decidido** |
| 2 | RLS desligado e acesso público (role anon) | **Decidido** |
| 3 | `push_subscriptions` — migrar ou não | **Decidido** |
| 4 | Mapeamento de fontes → empresa/produto/receita extra | **Decidido** |
| 5 | Gasto de R$ 49,92 com fonte conflitante | **Decidido** |
| 6 | Origem da antiga meta de R$ 11.200 | **Decidido** quanto à interpretação histórica |
| 7 | Receita Sonati lançada como cliente/venda | **Decidido** |
| 8 | Duplicidade de venda de vídeo de R$ 100 | **Pendente** — critério de tratamento definido |
| 9 | Negociações fechadas sem venda, total de R$ 194 | **Pendente** — critério de tratamento definido |
| 10 | Vendas de vídeo sem parcela registrada | **Decidido** |
| 11 | Cliente duplicado por telefone idêntico | **Pendente** — critério de tratamento definido |
| 12 | Possível duplicidade causada por edição ("Edited") | **Pendente** — critério de busca definido |
| 13 | Clientes de teste/legado | **Critério definido** — casos ambíguos pendentes de confirmação |
| 14 | Tabela `conversas` — legado/demo do bot | **Decidido** |
| 15 | Tabela `mensagens` — templates de vendas | **Decidido** |
| 16 | Pipeline versus vendas | **Decidido** |
| 17 | Outros usos de `fontes.meta` | **Decidido** |

---

## Sobre estrutura e segurança

**1.** Todas as tabelas atuais usam `ON DELETE CASCADE` nas chaves estrangeiras (ex.: apagar um cliente apaga suas vendas e entregas em cascata). O novo modelo deve **proibir cascata em dados financeiros** (preferindo restringir a exclusão ou usar exclusão lógica)? Confirma que isso deve ser corrigido na Fase 4?

> **Decisão registrada (17/07/2026):** confirmado — o modelo novo deve proibir `ON DELETE CASCADE` em dados financeiros e históricos, incluindo clientes, vendas, pagamentos, recebimentos, despesas e entregas. Usar exclusão lógica sempre que aplicável, e `RESTRICT` ou `NO ACTION` nos relacionamentos históricos. Nenhuma exclusão de cliente pode apagar seu histórico financeiro.

**2.** Hoje, `RLS` está desligado em praticamente todas as tabelas (`clientes`, `vendas`, `gastos_ads`, etc.), e todas têm `GRANT ALL` para a role `anon` — ou seja, dados financeiros estão acessíveis publicamente sem login no projeto atual. Isso é algo que você já sabia, ou é um achado novo? Deseja que isso seja corrigido já na baseline nova (Fase 4/6), antes mesmo do restante da migração?

> **Decisão registrada (17/07/2026):** confirmado que deve ser corrigido na baseline nova. Todas as tabelas financeiras, comerciais e de clientes do Patrimonium devem exigir autenticação, ter RLS habilitado, possuir políticas explícitas, impedir leitura, inserção, alteração ou exclusão direta pela role `anon`, e reservar a service role apenas para operações internas e controladas. O projeto remoto atual não será alterado agora — a correção do banco atual será planejada separadamente, para não quebrar o aplicativo antigo antes de verificar suas dependências.

**3.** A tabela `push_subscriptions` tem políticas RLS que permitem leitura, inserção e exclusão públicas (qualquer pessoa, sem login). Essa tabela e o recurso de notificação push ainda estão em uso? Deve ser migrada ou pode ser deixada de lado?

> **Decisão registrada (18/07/2026):** não migrar `push_subscriptions` para o modelo novo — pertence à infraestrutura de notificações do aplicativo antigo, fora do escopo atual do Patrimonium. Não reutilizar os endpoints/subscriptions antigos nem transportar as políticas RLS públicas atuais.
>
> **Regra geral para estruturas antigas não utilizadas no Patrimonium (aplica-se também aos itens 14, 15 e à tabela `fontes`):** não migrar para o modelo novo; manter intactas durante o desenvolvimento e a migração; preservar cópia nos backups já realizados; remover do Supabase somente na etapa final de limpeza — e só depois que (1) o banco novo estiver criado, (2) os dados úteis tiverem sido migrados, (3) os totais e históricos tiverem sido validados, (4) o novo aplicativo estiver funcionando corretamente e (5) houver aprovação humana explícita para a limpeza final. Nada é apagado agora.
>
> Se notificações push forem necessárias futuramente, implementar uma solução nova, segura e protegida por autenticação/RLS — sem reaproveitar automaticamente esta estrutura antiga.

---

## Sobre classificação de negócio (Vision / Digital Smile / Extras)

**4.** A tabela `fontes` parece funcionar como a categorização atual de negócio/origem (`Fotos/Vídeos com IA` = Vision, `Sonati`, `Digital Smile`, `Venda de Sites`, `Trium`). Essa leitura está correta?

> **Decisão registrada (18/07/2026):** confirmado o mapeamento de origem para cada valor histórico de `fontes`:
> - `Fotos/Vídeos com IA` → Vision.
> - `Venda de Sites` → **Vision** (não é empresa separada; no app antigo, "Fotos/Vídeos com IA" e "Venda de Sites" foram separadas como fontes apenas para acompanhar faturamento por produto, não porque fossem negócios diferentes).
> - `Digital Smile` → Digital Smile.
> - `Sonati` → receita extra.
> - `Trium` → receita extra.
>
> Todos os registros históricos de vendas com fonte `Venda de Sites` devem ser reclassificados como Vision na migração.
>
> No modelo novo, Vision é a empresa; Fotos com IA, Vídeos com IA, combos de foto+vídeo e Sites são produtos/serviços da Vision. A Vision terá faturamento total unificado, mas o modelo deve permitir analisar separadamente faturamento, quantidade de vendas, ticket médio e lucro por produto/serviço.
>
> O modelo novo deve separar quatro dimensões distintas: **empresa**, **produto/serviço**, **origem do cliente** e **canal de aquisição** — a tabela `fontes` antiga não deve ser copiada literalmente para o Patrimonium novo, pois mistura essas dimensões (empresa, produto/serviço e receita extra) em uma única coluna.

**5.** Um registro de `gastos_ads` (07/07/2026, R$ 49,92) está marcado com `fonte_id` = Digital Smile, mas o texto da descrição diz "Tráfego pago - fotos com IA" (Vision). Qual classificação está correta: a fonte marcada (Digital Smile) ou a descrição (Vision)? Isso muda o CAC de ambas as empresas se classificado errado.

> **Decisão registrada (17/07/2026):** o gasto pertence à Vision. Todos os gastos identificados como "Tráfego Pago - Foto com IA" ou cuja descrição indique "Fotos com IA" devem ser classificados como investimento de aquisição da Vision — portanto, o gasto de R$ 49,92 é classificado como gasto de tráfego pago da Vision, apesar de a fonte original estar marcada como Digital Smile.
>
> Preservar no histórico: o valor original, a fonte original incorreta, a descrição original, e o registro de que a classificação foi corrigida por confirmação humana.
>
> Esse gasto deve entrar nos gastos de aquisição da Vision e participar dos cálculos de CAC da Vision quando houver dados suficientes; não deve entrar nos gastos ou no CAC da Digital Smile.
>
> **Sobre a Digital Smile:** ela não possui gastos registrados no banco legado analisado. Isso deve ser exibido como "sem gastos registrados", não como confirmação de que o gasto histórico foi R$ 0. Existiram gastos da Digital Smile em 2024, que serão cadastrados posteriormente com seus valores e datas originais. Regras: não estimar nem criar esses gastos agora; os lançamentos de 2024 não entram na Meta 10K de 2026; poderão entrar nos relatórios históricos da Digital Smile quando forem cadastrados; não calcular CAC histórico de 2024 sem informações confiáveis sobre os clientes adquiridos no mesmo período.

**6.** A soma dos valores de `fontes.meta` (3000 + 2400 + 3000 + 1800 + 1000) dá exatamente R$ 11.200, a antiga meta citada na especificação. Confirma que a meta antiga era, de fato, a soma de metas por categoria/fonte, e não um valor único em outro lugar do sistema (que não foi encontrado)?

> **Decisão registrada (18/07/2026):** confirmada a interpretação histórica — R$ 3.000 + R$ 2.400 + R$ 3.000 + R$ 1.800 + R$ 1.000 = R$ 11.200. A antiga meta de R$ 11.200 fica documentada como "meta histórica derivada das metas por fonte" (`fontes.meta`). Essa estrutura não será transportada para o Patrimonium novo.
>
> A Meta 10K atual é um conceito diferente: R$ 10.000, apenas valores efetivamente recebidos, somando Vision + Digital Smile, no período de 22/06/2026 a 31/12/2026; Sonati, Trium e demais receitas extras não contam.
>
> Se a pergunta 17 apontar outro uso possível de `fontes.meta` além dessa meta histórica, apenas essa parte específica (usos alternativos) permanece pendente — a interpretação da meta de R$ 11.200 em si está decidida.

**7.** Um cliente foi cadastrado com o nome "Sonati" e uma venda de R$ 400,00 foi lançada para esse "cliente" com a fonte Sonati — ou seja, a receita extra Sonati está hoje modelada como se fosse uma venda normal a um cliente chamado "Sonati". Confirma que, no modelo novo, isso deve virar um registro de **receita extra**, desvinculado do conceito de cliente/venda de empresa?

> **Decisão registrada (17/07/2026):** migrar como receita extra, não como cliente ou venda de empresa. Deve contar no total recebido geral e no patrimônio, mas não deve contar na Meta 10K, faturamento, lucro, CAC ou ticket médio da Vision e Digital Smile.

---

## Sobre a Meta 10K 2026

**8.** Duas vendas elegíveis para a meta (mesmo cliente, R$ 100,00 cada, datas 30/06 e 01/07/2026, descrições "1 vídeo - dançando" e "1 video dançando") parecem ser o mesmo evento lançado duas vezes. Se for duplicidade, o valor elegível real cairia de R$ 961,00 para R$ 861,00. **Você confirma se são duas vendas reais (dois vídeos distintos) ou uma duplicidade de lançamento?** Isso afeta diretamente o valor da Meta 10K.

> **Decisão registrada (17/07/2026):** preservar os dois registros históricos. Marcar um deles como "possível duplicidade — aguardando confirmação". Não criar estorno, pois não há evidência de devolução de dinheiro. Enquanto estiver em revisão, separar os R$ 100 do valor financeiro confirmado, exibindo-os como "valor em revisão" — não contam no valor confirmado nem na Meta 10K até confirmação humana.

**9.** Duas negociações do `pipeline` estão marcadas como `fechado` (R$ 97,00 cada, ambas em 13/07/2026: uma associada a um nome de cliente, outra rotulada apenas "Venda Direta") mas **não têm nenhum registro correspondente em `vendas`**. Essas duas vendas (total R$ 194,00) realmente aconteceram e o dinheiro foi recebido? Se sim, precisam ser incluídas no histórico financeiro migrado e, possivelmente, na Meta 10K (se a data e a empresa forem elegíveis).

> **Decisão registrada (17/07/2026):** preservar os registros do pipeline como pendentes de confirmação. Não criar vendas ou pagamentos automaticamente. Não contar os R$ 194 como vendido, recebido ou Meta 10K até confirmação humana.

**10.** Nenhuma venda de vídeo no histórico tem registro de parcela separada — todas aparecem como uma única linha "paga" no valor cheio, mesmo a especificação nova exigindo 50% antes + 50% na entrega para vídeos. Para as vendas de vídeo já existentes, devo assumir que **o valor total já foi recebido integralmente** (ambas as parcelas), ou existem vendas de vídeo em que só a primeira metade foi paga e a segunda ainda está pendente na realidade, mesmo constando como "pago" no sistema antigo?

> **Decisão registrada (17/07/2026):** confiar no histórico literal — migrar como 100% recebido. Não criar artificialmente duas parcelas retroativas. Registrar que o pagamento foi importado do sistema legado, permitindo correção manual futura caso alguma venda específica esteja errada.

---

## Sobre clientes e duplicidade

**11.** Um cliente (nome iniciado em "El...") aparece duas vezes com o telefone idêntico, cadastrado com 2 dias de diferença. Autoriza mesclar esse par assim que o modelo novo estiver pronto (preservando as vendas de ambos os registros)?

> **Decisão registrada (17/07/2026):** marcar como candidato a mesclagem. Não mesclar automaticamente. Quando houver confirmação humana, unir os cadastros preservando todas as vendas, entregas e referências históricas.

**12.** Dois registros de cliente parecem ser o mesmo negócio/pessoa, um deles com o sufixo "Edited" no nome, criados com 2 minutos de diferença — sugerindo que uma tentativa de editar o cadastro no app antigo criou um novo registro em vez de atualizar. Você sabe se esse é um comportamento conhecido do app anterior? Isso ajudaria a saber se há mais duplicatas silenciosas do mesmo tipo (sem um sufixo óbvio) para procurar.

> **Critério definido (17/07/2026) — ainda pendente de confirmação:** não há confirmação de que o aplicativo antigo criava duplicatas ao editar. Tratar "Carlos Daudth" e "Carlos Daudth Edited" como candidatos a duplicidade, não como duplicidade confirmada. Na auditoria e na migração, procurar outros candidatos usando: telefone normalizado, nomes semelhantes, e-mails iguais, datas de cadastro próximas, e palavras como "Edited", "Editado", "teste" ou semelhantes. Não mesclar, corrigir ou apagar automaticamente nenhum registro.

**13.** Existem clientes com nomes claramente de teste (strings sem sentido, o nome literal "exemplo", três registros seguidos com o mesmo primeiro nome do titular do negócio, cadastrados em segundos de diferença). Confirma que são testes internos e podem ser marcados como legado/teste (sem excluir), em vez de migrados como clientes reais?

> **Critério definido (18/07/2026):** registros claramente artificiais devem ser marcados como legado/teste, sem serem apagados. Eles devem ficar fora das listas normais de clientes e das métricas reais (não contam como cliente, conversão, recompra ou CAC), mas devem ser preservados para auditoria.
>
> Não classificar um registro como teste apenas porque o nome parece estranho. Usar como sinais: nome explícito como "teste"; dados claramente artificiais; registros repetidos em poucos segundos; ausência de contato e atividade real; palavras como "Edited" ou "Editado"; e, por fim, confirmação humana.
>
> Se houver vendas, pagamentos ou entregas ligadas a um possível teste: não excluir nada automaticamente, preservar os relacionamentos e marcar para revisão humana. Os casos ambíguos específicos continuam pendentes de confirmação individual.

---

## Sobre tabelas ambíguas

**14.** A tabela `conversas` (29 mensagens, todas de um único número de telefone, em um único dia, formando um roteiro completo de vendas) parece ser uma demonstração/teste do fluxo do bot de atendimento, não uma conversa real com cliente. Confirma essa leitura? Se for só teste, ela precisa ser migrada para o Patrimonium ou pode ficar de fora (mantida apenas no backup)?

> **Decisão registrada (18/07/2026):** tratar `conversas` como legado/demo do bot antigo, não como histórico comercial real do Patrimonium. Não migrar para o banco operacional novo e não usar esses registros em clientes, pipeline, vendas, métricas ou financeiro.
>
> Aplica-se a mesma regra geral definida no item 3: manter essa estrutura intacta durante o desenvolvimento e a migração, preservar cópia nos backups já realizados e remover do Supabase somente na etapa final de limpeza, depois que o banco novo estiver criado, os dados úteis tiverem sido migrados, os totais e históricos tiverem sido validados, o novo aplicativo estiver funcionando corretamente e houver aprovação humana explícita para a limpeza final.
>
> Se futuramente houver integração de WhatsApp, chat ou atendimento no Patrimonium, criar uma estrutura nova e específica para isso, sem reaproveitar automaticamente a tabela `conversas` antiga.

**15.** A tabela `mensagens` contém 16 templates de script de vendas/atendimento (aberturas, follow-ups, quebra de objeção, pós-venda, portfólio). Isso é conteúdo que você quer preservar/reaproveitar em algum lugar do Patrimonium (ainda que fora do escopo das 5 áreas), ou é material que pode ficar só no histórico/backup, sem virar uma tabela no banco novo?

> **Decisão registrada (18/07/2026):** não migrar a tabela `mensagens` para o banco operacional novo neste momento. Esses registros são templates/scripts de vendas e atendimento do sistema antigo, e não devem virar automaticamente uma tabela equivalente no Patrimonium.
>
> Aplica-se a mesma regra geral definida no item 3: manter essa estrutura intacta durante o desenvolvimento e a migração, preservar cópia nos backups já realizados e remover do Supabase somente na etapa final de limpeza, depois que o banco novo estiver criado, os dados úteis tiverem sido migrados, os totais e históricos tiverem sido validados, o novo aplicativo estiver funcionando corretamente e houver aprovação humana explícita para a limpeza final.
>
> Futuramente, caso o Patrimonium tenha uma área de scripts, templates, mensagens ou materiais de prospecção, os conteúdos úteis poderão ser revisados e importados conscientemente para uma estrutura nova, sem reaproveitar automaticamente a tabela antiga.

**16.** A tabela `pipeline` frequentemente registra o mesmo evento de negócio que já existe em `vendas` (mesmo cliente, valor e descrição). No modelo novo, confirma que **pipeline representa apenas a etapa de prospecção/negociação**, e que o valor dela nunca deve ser somado ao valor de `vendas` como receita adicional (ou seja, quando uma negociação fecha, o dado financeiro real é o de `vendas`, não o de `pipeline`)?

> **Decisão registrada (18/07/2026):** confirmado — pipeline representa somente o processo comercial (prospecção/negociação) e nunca deve ser usado diretamente para calcular valor vendido, valor recebido, valor pendente, faturamento, lucro ou Meta 10K. Mesmo uma negociação marcada como "fechado" não significa pagamento confirmado.
>
> Os números financeiros devem vir sempre de venda formal, cobranças/parcelas e pagamentos efetivamente recebidos. Uma negociação pode gerar ou ser vinculada a uma venda, mas nunca deve ser somada separadamente a ela — isso evita dupla contagem.
>
> Registros históricos fechados no pipeline sem venda/pagamento correspondente (ver item 9) continuam pendentes de confirmação humana.

**17.** Não foi encontrada nenhuma coluna ou registro que explique o propósito da coluna `fontes.meta` além da hipótese da pergunta 6. Existe algum outro uso dessa coluna que eu deveria considerar?

> **Decisão registrada (18/07/2026):** não há evidência de outro uso funcional de `fontes.meta` além da antiga meta histórica de R$ 11.200 já documentada no item 6.
>
> Preservar esses valores apenas como evidência histórica da migração.
>
> No modelo novo:
> - não criar campo equivalente a `fontes.meta`;
> - não transportar metas antigas por fonte;
> - não inferir outros significados sem evidência;
> - manter a Meta 10K nova como uma regra própria e independente.
>
> A tabela `fontes` antiga também não deve permanecer como estrutura operacional do Patrimonium após a migração, porque mistura conceitos diferentes: empresa, produto/serviço e receita extra.
>
> Os dados úteis dessa tabela devem ser transformados para a estrutura nova antes de qualquer remoção, respeitando o mapeamento já decidido:
> - `Fotos/Vídeos com IA` → Vision;
> - `Venda de Sites` → Vision;
> - `Digital Smile` → Digital Smile;
> - `Sonati` → receita extra;
> - `Trium` → receita extra.
>
> Aplica-se a mesma regra geral definida no item 3: manter a estrutura antiga intacta durante o desenvolvimento e a migração, preservar cópia nos backups já realizados e remover do Supabase somente na etapa final de limpeza, depois que o banco novo estiver criado, os dados úteis tiverem sido migrados, os totais e históricos tiverem sido validados, o novo aplicativo estiver funcionando corretamente e houver aprovação humana explícita para a limpeza final.

---

## Resumo de prioridade

Não resta nenhuma decisão estrutural obrigatória impedindo o desenho do banco novo.

As perguntas 1, 2, 3, 4, 5, 6, 7, 10, 14, 15, 16 e 17 têm decisão registrada.
A pergunta 13 possui critério definido, restando pendentes apenas casos ambíguos individuais.

Permanecem apenas casos históricos específicos em revisão:

- Item 8 — possível duplicidade de R$ 100 em venda de vídeo;
- Item 9 — R$ 194 em negociações fechadas no pipeline sem venda correspondente;
- Item 11 — cliente duplicado por telefone idêntico, candidato a mesclagem;
- Item 12 e parte do item 13 — candidatos ambíguos de teste ou duplicidade.

Esses casos não impedem o início da Fase 4, porque o novo modelo deverá:

- suportar status "em revisão";
- preservar os dados originais;
- permitir correção posterior com rastreabilidade;
- impedir que valores em revisão sejam contados automaticamente em métricas financeiras ou na Meta 10K.

As estruturas antigas que não serão usadas no Patrimonium não serão apagadas agora.
Elas somente poderão ser removidas do Supabase na etapa final de limpeza, após migração validada, funcionamento correto do novo aplicativo e aprovação humana explícita.
