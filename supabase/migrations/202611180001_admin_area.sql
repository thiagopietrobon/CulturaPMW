-- CulturaPMW: permissões e operações administrativas.
-- Execute este arquivo no SQL Editor do Supabase com uma conta de projeto.
-- Os rótulos de enums utilizados aqui seguem os modelos TypeScript do projeto:
-- user_role: produtor, admin
-- status_produtor: AGUARDANDO_APROVACAO, APROVADO, REPROVADO, SUSPENSO

-- A função SECURITY DEFINER evita recursão quando as políticas de profiles
-- consultam o próprio perfil para confirmar se o usuário é administrador.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Impede que um produtor altere o próprio perfil para administrador ou
-- aprove/suspenda a própria conta por meio de uma política permissiva antiga.
create or replace function public.culturapmw_proteger_permissoes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' then
      -- Contas criadas pela aplicação sempre começam como produtor.
      new.role := 'produtor';
    elsif new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
      raise exception 'Somente um administrador pode alterar o perfil de acesso.';
    end if;
  elsif tg_table_name = 'produtores' then
    if tg_op = 'INSERT' then
      -- Nenhuma conta pode nascer aprovada ou suspensa.
      new.status := 'AGUARDANDO_APROVACAO';
      new.suspenso_ate := null;
    elsif (new.status is distinct from old.status or new.suspenso_ate is distinct from old.suspenso_ate)
      and auth.uid() is not null and not public.is_admin() then
      raise exception 'Somente um administrador pode alterar a aprovação ou suspensão de um produtor.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.culturapmw_proteger_permissoes() from public;

drop trigger if exists culturapmw_proteger_role_profile on public.profiles;
create trigger culturapmw_proteger_role_profile
  before insert or update of role on public.profiles
  for each row execute function public.culturapmw_proteger_permissoes();

drop trigger if exists culturapmw_proteger_status_produtor on public.produtores;
create trigger culturapmw_proteger_status_produtor
  before insert or update of status, suspenso_ate on public.produtores
  for each row execute function public.culturapmw_proteger_permissoes();

-- Permite ao administrador regularizar suspensões cujo prazo terminou.
-- A função é chamada pelo painel administrativo ao consultar produtores.
create or replace function public.admin_regularizar_suspensoes_expiradas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atualizados integer;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado: somente administradores podem executar esta operação.';
  end if;

  update public.produtores
     set status = 'APROVADO',
         suspenso_ate = null,
         updated_at = now()
   where status::text = 'SUSPENSO'
     and suspenso_ate is not null
     and suspenso_ate <= now();

  get diagnostics v_atualizados = row_count;
  return v_atualizados;
end;
$$;

revoke all on function public.admin_regularizar_suspensoes_expiradas() from public;
grant execute on function public.admin_regularizar_suspensoes_expiradas() to authenticated;

-- Exclusão transacional do produtor e dos registros dependentes.
-- A exclusão do usuário em auth.users também encerra a conta de autenticação.
create or replace function public.admin_excluir_produtor(p_produtor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado: somente administradores podem excluir produtores.';
  end if;

  select id
    into v_user_id
    from public.produtores
   where id = p_produtor_id
   for update;

  if v_user_id is null then
    raise exception 'Produtor não encontrado.';
  end if;

  delete from public.links_externos le
   using public.eventos e
   where le.evento_id = e.id
     and e.produtor_id = p_produtor_id;

  delete from public.localizacoes l
   using public.eventos e
   where l.evento_id = e.id
     and e.produtor_id = p_produtor_id;

  delete from public.eventos where produtor_id = p_produtor_id;
  delete from public.produtores where id = p_produtor_id;
  delete from public.profiles where id = v_user_id;
  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.admin_excluir_produtor(uuid) from public;
grant execute on function public.admin_excluir_produtor(uuid) to authenticated;

-- Ativa RLS nas tabelas usadas pela área administrativa.
alter table public.profiles enable row level security;
alter table public.produtores enable row level security;
alter table public.eventos enable row level security;
alter table public.categorias enable row level security;
alter table public.localizacoes enable row level security;
alter table public.links_externos enable row level security;
alter table public.regioes enable row level security;

-- Políticas exclusivas para o perfil administrativo. Elas coexistem com
-- políticas existentes de acesso público/produtor, sem removê-las.
drop policy if exists "culturapmw_admin_profiles_all" on public.profiles;
create policy "culturapmw_admin_profiles_all"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "culturapmw_admin_produtores_all" on public.produtores;
create policy "culturapmw_admin_produtores_all"
  on public.produtores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "culturapmw_admin_eventos_all" on public.eventos;
create policy "culturapmw_admin_eventos_all"
  on public.eventos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "culturapmw_admin_categorias_all" on public.categorias;
create policy "culturapmw_admin_categorias_all"
  on public.categorias for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "culturapmw_public_categorias_select" on public.categorias;
create policy "culturapmw_public_categorias_select"
  on public.categorias for select to anon, authenticated
  using (true);

drop policy if exists "culturapmw_admin_localizacoes_all" on public.localizacoes;
create policy "culturapmw_admin_localizacoes_all"
  on public.localizacoes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "culturapmw_admin_links_externos_all" on public.links_externos;
create policy "culturapmw_admin_links_externos_all"
  on public.links_externos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "culturapmw_admin_regioes_select" on public.regioes;
create policy "culturapmw_admin_regioes_select"
  on public.regioes for select to authenticated
  using (public.is_admin());

drop policy if exists "culturapmw_public_regioes_select" on public.regioes;
create policy "culturapmw_public_regioes_select"
  on public.regioes for select to anon, authenticated
  using (true);

drop policy if exists "culturapmw_public_links_select" on public.links_externos;
create policy "culturapmw_public_links_select"
  on public.links_externos for select to anon, authenticated
  using (evento_id in (select id from public.vw_eventos_publicos));

-- Privilégios SQL correspondentes às políticas acima.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.produtores to authenticated;
grant select, insert, update, delete on public.eventos to authenticated;
grant select, insert, update, delete on public.categorias to authenticated;
grant select, insert, update, delete on public.localizacoes to authenticated;
grant select, insert, update, delete on public.links_externos to authenticated;
grant select on public.regioes to anon, authenticated;
grant select on public.categorias to anon, authenticated;
grant select on public.links_externos to anon, authenticated;
grant usage, select on sequence public.categorias_id_seq to authenticated;
