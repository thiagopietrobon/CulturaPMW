# Ajustes do RF01 — 18/11/2026

## Correções incluídas

- A ação **Consultar situação** força uma nova consulta do perfil do produtor no Supabase, em vez de depender de uma consulta global que já esteja em andamento.
- Quando a solicitação continua pendente, a tela informa que segue em análise.
- Quando o status muda para aprovado, reprovado ou suspenso, o produtor é direcionado à tela correspondente.
- A tela de aguardando aprovação oferece retorno à agenda pública e mantém as opções de consultar dados e encerrar sessão.
- A tela de perfil retorna à tela adequada ao status atual do produtor.
- Erros internos retornados pelo Supabase durante o cadastro não exibem mensagens de configuração/migration ao usuário final. Os detalhes técnicos permanecem no console para diagnóstico.

## Banco de dados

Estas correções não exigem uma nova migration SQL. Elas reaproveitam as tabelas, policies, funções e triggers do RF01 já aplicados no Supabase.

Caso a consulta de situação retorne erro, conferir no Supabase se a migration `202611180002_rf01_contas_produtor.sql` foi aplicada e se a sessão do produtor tem permissão de SELECT no próprio registro de `profiles` e `produtores`.

## Validação realizada

- `vue-tsc -b`: concluído sem erros.
- `vite build`: não concluiu neste ambiente porque o pacote opcional nativo do Rolldown para Linux (`@rolldown/binding-linux-x64-gnu`) não está presente. A falha ocorre ao iniciar o Vite, não durante a checagem de tipos.
