-- CulturaPMW - RF01: cadastro, edição e exclusão de contas de produtores.
-- Executar depois da configuração inicial e da migração administrativa.

-- O cadastro é criado por um trigger de auth.users. Assim, o perfil público
-- e o registro do produtor são inseridos na mesma transação do Supabase Auth,
-- inclusive quando a confirmação de e-mail está habilitada.
create or replace function public.culturapmw_criar_perfil_produtor()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nome text := nullif(trim(new.raw_user_meta_data ->> 'nome'), '');
  v_documento text := regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf_cnpj', ''), '[^0-9]', '', 'g');
  v_telefone text := regexp_replace(coalesce(new.raw_user_meta_data ->> 'telefone', ''), '[^0-9]', '', 'g');
  v_descricao text := nullif(trim(new.raw_user_meta_data ->> 'descricao'), '');
begin
  -- Usuários criados manualmente para administração não passam pelo cadastro de produtor.
  if coalesce(new.raw_user_meta_data ->> 'tipo_conta', '') <> 'produtor' then
    return new;
  end if;

  if v_nome is null then
    raise exception 'Informe o nome do produtor ou da empresa.';
  end if;

  if length(v_documento) not in (11, 14) then
    raise exception 'Informe um CPF ou CNPJ válido.';
  end if;

  if length(v_telefone) not in (10, 11) then
    raise exception 'Informe um telefone com DDD válido.';
  end if;

  if exists (select 1 from public.produtores where cpf_cnpj = v_documento) then
    raise exception 'Este CPF/CNPJ já está cadastrado como produtor.';
  end if;

  insert into public.profiles (id, nome, email, role)
  values (new.id, v_nome, new.email, 'produtor'::public.user_role);

  insert into public.produtores (id, cpf_cnpj, telefone, descricao, status)
  values (
    new.id,
    v_documento,
    v_telefone,
    v_descricao,
    'AGUARDANDO_APROVACAO'::public.status_produtor
  );

  return new;
end;
$$;

revoke all on function public.culturapmw_criar_perfil_produtor() from public, anon, authenticated;

drop trigger if exists culturapmw_auth_user_criar_produtor on auth.users;
create trigger culturapmw_auth_user_criar_produtor
after insert on auth.users
for each row execute function public.culturapmw_criar_perfil_produtor();

-- Mantém profiles.email sincronizado quando o usuário confirma a alteração
-- do e-mail por meio do Supabase Auth.
create or replace function public.culturapmw_sincronizar_email_produtor()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
       set email = new.email
     where id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.culturapmw_sincronizar_email_produtor() from public, anon, authenticated;

drop trigger if exists culturapmw_auth_email_atualizado on auth.users;
create trigger culturapmw_auth_email_atualizado
after update of email on auth.users
for each row execute function public.culturapmw_sincronizar_email_produtor();

-- A tabela profiles contém e-mail. A leitura pública passa a ser feita por
-- uma view restrita aos campos públicos do produtor aprovado.
drop policy if exists "Leitura publica profiles" on public.profiles;
drop policy if exists "culturapmw_profiles_select_own" on public.profiles;
create policy "culturapmw_profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "culturapmw_profiles_update_own" on public.profiles;
create policy "culturapmw_profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- CPF/CNPJ e telefone não devem ser lidos anonimamente.
drop policy if exists "Leitura publica produtores aprovados" on public.produtores;
drop policy if exists "culturapmw_produtores_select_own" on public.produtores;
create policy "culturapmw_produtores_select_own"
  on public.produtores for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- O público consulta eventos pela view filtrada. Não deve ler diretamente
-- eventos ocultos ou endereços completos das tabelas internas.
drop policy if exists "Leitura publica eventos" on public.eventos;
drop policy if exists "Leitura publica localizacoes" on public.localizacoes;
drop policy if exists "Leitura publica links" on public.links_externos;

drop policy if exists "culturapmw_public_links_select" on public.links_externos;
create policy "culturapmw_public_links_select"
  on public.links_externos for select to anon, authenticated
  using (evento_id in (select id from public.vw_eventos_publicos));

grant select on public.vw_eventos_publicos to anon, authenticated;

drop policy if exists "culturapmw_produtores_update_own" on public.produtores;
create policy "culturapmw_produtores_update_own"
  on public.produtores for update to authenticated
  using (id = auth.uid() and status = 'APROVADO'::public.status_produtor)
  with check (id = auth.uid() and status = 'APROVADO'::public.status_produtor);

-- As contas são criadas somente pelo trigger de auth.users e removidas por
-- RPC. O cliente não recebe permissão para inserir/apagar perfis diretamente.
revoke select on public.profiles from anon;
revoke insert, delete on public.profiles from authenticated;
revoke select on public.produtores from anon;
revoke insert, delete on public.produtores from authenticated;
revoke update on public.profiles from authenticated;
grant update (nome) on public.profiles to authenticated;
grant select on public.profiles to authenticated;
grant select, update on public.produtores to authenticated;

-- View pública sem e-mail, CPF/CNPJ ou status interno.
create or replace view public.vw_produtores_publicos
with (security_invoker = false)
as
select
  p.id,
  p.nome,
  pr.telefone,
  pr.descricao
from public.profiles p
join public.produtores pr on pr.id = p.id
where pr.status = 'APROVADO'::public.status_produtor
  and (pr.suspenso_ate is null or pr.suspenso_ate <= now());

grant select on public.vw_produtores_publicos to anon, authenticated;

-- Exclusão da própria conta. A remoção do auth.users dispara os ON DELETE
-- CASCADE já definidos no schema: profiles, produtores, eventos, localização
-- e links externos são excluídos na mesma transação.
create or replace function public.produtor_excluir_propria_conta()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado para excluir a conta.';
  end if;

  if not exists (
    select 1
      from public.profiles p
     where p.id = v_user_id
       and p.role = 'produtor'::public.user_role
  ) then
    raise exception 'Somente produtores podem excluir a própria conta por esta operação.';
  end if;

  if not exists (select 1 from public.produtores pr where pr.id = v_user_id) then
    raise exception 'Cadastro de produtor não encontrado.';
  end if;

  delete from auth.users where id = v_user_id;
  if not found then
    raise exception 'Não foi possível localizar a conta de autenticação.';
  end if;
end;
$$;

revoke all on function public.produtor_excluir_propria_conta() from public, anon;
grant execute on function public.produtor_excluir_propria_conta() to authenticated;
