# RF01 — Gerenciar contas de produtores

Implementação dos casos de uso da documentação de modelagem:

- UC 1.1 — Cadastrar produtor (página 21): cadastro via Supabase Auth; o trigger cria `profiles` e `produtores` com status `AGUARDANDO_APROVACAO`.
- UC 1.2 — Editar dados (página 23): produtor autenticado e aprovado pode atualizar nome, e-mail, CPF/CNPJ, telefone e descrição.
- UC 1.3 — Excluir dados (página 25): produtor confirma a exclusão; a RPC `produtor_excluir_propria_conta` remove `auth.users` e as FKs `ON DELETE CASCADE` removem os registros dependentes.

## Arquivos principais

- `src/services/AuthService.ts`: cadastro, login, logout, atualização de perfil, recuperação/redefinição de senha e exclusão.
- `src/composables/useAuth.ts`: estado reativo da sessão do produtor.
- `src/views/auth/`: cadastro, login, recuperação e redefinição de senha.
- `src/views/produtor/`: aguardando aprovação, estados de cadastro, painel e perfil.
- `src/router/index.ts`: guarda de rotas por papel e status.
- `supabase/migrations/202611180002_rf01_contas_produtor.sql`: trigger de cadastro, sincronização de e-mail, políticas RLS e RPC de exclusão.

## Ordem para aplicar no Supabase

Execute esta migration depois do schema inicial e depois de `202611180001_admin_area.sql`.

Ela pressupõe os enums `user_role` e `status_produtor`, as tabelas `profiles` e `produtores`, a função `public.is_admin()` e as FKs em cascata definidas no schema inicial.

## Configuração de autenticação

No Supabase, abra **Authentication → URL Configuration** e inclua como Redirect URL:

- `http://localhost:5173/login` (confirmação de cadastro em desenvolvimento)
- `http://localhost:5173/produtor/redefinir-senha` (recuperação de senha em desenvolvimento)
- A URL equivalente do domínio publicado, quando houver.

A confirmação de e-mail pode permanecer habilitada. O trigger é executado na criação do usuário e registra a solicitação como pendente mesmo quando a sessão só será aberta após a confirmação.

## Segurança aplicada

- O cliente não recebe permissão para inserir ou excluir diretamente registros de `profiles` e `produtores`.
- Perfis públicos deixam de expor e-mail e CPF/CNPJ. A leitura pública do produtor aprovado usa `vw_produtores_publicos`.
- O público consulta eventos pela `vw_eventos_publicos`; as tabelas internas de eventos e localização não ficam abertas para leitura direta. Links só são legíveis quando vinculados a evento público.
- Produtor pode ler seu próprio perfil e atualizar seus dados quando aprovado.
- A exclusão é feita por RPC com `auth.uid()` e não permite excluir outra conta.
- O trigger de cadastro só é executado quando a metadata `tipo_conta` é `produtor`, para não interferir em contas administrativas criadas manualmente.


## Ajustes de experiência e consulta de situação

- A tela de aguardando aprovação permite atualizar a situação consultando novamente o Supabase.
- Se o cadastro continuar pendente, a tela informa isso sem redirecionar o usuário.
- Se o administrador aprovar, reprovar ou suspender o produtor, a consulta encaminha para a tela correspondente.
- A tela de aguardando aprovação oferece retorno para a agenda pública.
- Falhas internas do trigger de cadastro não exibem instruções técnicas de migration ao usuário; os detalhes permanecem no console para diagnóstico.
