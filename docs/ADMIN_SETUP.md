# Configuração da área administrativa

A autenticação do CulturaPMW é feita pela tela única `/login`, usando o Supabase Auth. Depois do login, contas cujo campo `profiles.role` seja `admin` são direcionadas ao painel administrativo. As rotas administrativas continuam protegidas pela validação do perfil e pelas políticas RLS.

## 1. Configurar as variáveis locais

Copie `.env.example` para `.env` na raiz do projeto e confira se os valores de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` correspondem ao projeto Supabase utilizado.

## 2. Conferir os valores dos enums

O trecho de estrutura compartilhado mostra os campos como `USER-DEFINED`, sem listar os rótulos dos enums. Antes da migração, confira os valores existentes com esta consulta:

```sql
select t.typname as tipo, e.enumlabel as valor
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
order by t.typname, e.enumsortorder;
```

A implementação utiliza `admin`/`produtor` em `user_role`; `AGUARDANDO_APROVACAO`, `APROVADO`, `REPROVADO` e `SUSPENSO` em `status_produtor`; `ATIVO`, `CONCLUIDO` e `OCULTO` em `situacao_evento`; e `INGRESSO`, `DIVULGACAO`, `CONTATO` e `OUTRO` para os tipos de link. Caso os rótulos reais sejam diferentes, ajuste os valores no código e na migração.

## 3. Aplicar as permissões e funções

No Supabase, abra **SQL Editor** e execute o conteúdo de:

`supabase/migrations/202611180001_admin_area.sql`

A migração cria as políticas de acesso administrativo e as funções usadas para reativar suspensões vencidas e excluir produtores junto com os registros dependentes.

Os nomes dos valores dos enums são os utilizados pelos modelos TypeScript do projeto: `admin`, `produtor`, `AGUARDANDO_APROVACAO`, `APROVADO`, `REPROVADO` e `SUSPENSO`. Caso os enums no banco tenham rótulos diferentes, ajuste esses rótulos antes de executar a migração.

## 4. Criar ou promover a conta administradora

Crie primeiro o usuário em **Authentication → Users** no painel Supabase. Depois, promova o perfil correspondente pelo SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'SEU_EMAIL_ADMIN';
```

Se a aplicação ainda não tiver criado a linha em `profiles`, insira o perfil associado ao usuário já criado em Auth:

```sql
insert into public.profiles (id, nome, email, role)
select id, 'Administrador', email, 'produtor'::public.user_role
from auth.users
where email = 'SEU_EMAIL_ADMIN'
on conflict (id) do nothing;

update public.profiles
set role = 'admin'
where email = 'SEU_EMAIL_ADMIN';
```

Substitua `SEU_EMAIL_ADMIN` pelo e-mail da conta administradora. A migração força novos perfis a iniciarem como `produtor`; a promoção para `admin` é feita separadamente pelo SQL Editor.

## 5. Executar a aplicação

```bash
npm install
npm run dev
```

Acesse `/login` e entre com o e-mail e a senha da conta administradora. O sistema identificará `profiles.role = admin` e abrirá o painel administrativo.

## Funcionalidades incluídas

- Visão geral com indicadores de produtores, solicitações pendentes, eventos e categorias.
- Aprovação, reprovação, suspensão temporária, reativação e exclusão de produtores.
- Correção e remoção de eventos, incluindo informações, categoria, situação, endereço e links externos.
- Cadastro, edição e exclusão de categorias.

A exclusão de uma categoria que já esteja sendo usada por eventos é bloqueada pela chave estrangeira. A tela informa essa condição para evitar a perda de classificação dos eventos.
