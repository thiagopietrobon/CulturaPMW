# Unificação do login — 20/11/2026

## O que mudou

- A tela única de autenticação agora está disponível em `/login`.
- O `AuthService.entrar()` autentica pelo Supabase Auth e consulta `profiles.role` para identificar o tipo de conta.
- Administradores (`role = admin`) são direcionados para `/admin`.
- Produtores (`role = produtor`) são direcionados conforme o status cadastral:
  - `APROVADO`: `/produtor/painel` ou rota protegida solicitada antes do login.
  - `AGUARDANDO_APROVACAO`: `/produtor/aguardando-aprovacao`.
  - `REPROVADO`: `/produtor/reprovado`.
  - `SUSPENSO`: `/produtor/suspenso`.
- As rotas administrativas e do produtor continuam protegidas por verificações de perfil no roteador e pelas políticas RLS do Supabase.
- O cabeçalho público reconhece sessões de administrador e oferece acesso ao painel administrativo.
- `/produtor/login` e `/admin/login` continuam funcionando como redirecionamentos para `/login`, preservando links antigos.
- A tela administrativa de login duplicada foi removida. A autenticação e as áreas internas continuam separadas por perfil.

## Configuração do Supabase

Em **Authentication → URL Configuration**, inclua `/login` entre as Redirect URLs do ambiente local e do domínio publicado. Mantenha também a rota `/produtor/redefinir-senha`, utilizada no fluxo de recuperação de senha.

Não foi necessária alteração no schema ou nas migrations do banco para esta unificação.

## Validação técnica realizada

- `npx vue-tsc -b`: concluído sem erros.
- `npm run build`: a checagem TypeScript foi concluída, mas a etapa Vite não iniciou porque o pacote nativo opcional do Rolldown (`@rolldown/binding-linux-x64-gnu`) não está presente no `node_modules` recebido.
- Os fluxos de autenticação com o Supabase real ainda precisam ser testados no ambiente configurado do projeto.

## Testes manuais recomendados

1. Entrar com uma conta de administrador e confirmar o redirecionamento para `/admin`.
2. Entrar com um produtor aprovado e confirmar o acesso a `/produtor/painel`.
3. Entrar com produtores aguardando aprovação, reprovados e suspensos e confirmar suas respectivas telas de situação.
4. Tentar abrir `/admin` com uma conta de produtor e confirmar que o painel administrativo não é exibido.
5. Tentar abrir rotas de produtor com uma conta de administrador e confirmar que a área do produtor não é exibida.
6. Testar logout, atualização da página e persistência da sessão.
7. Abrir `/produtor/login` e `/admin/login` e confirmar que ambos redirecionam para `/login`.
