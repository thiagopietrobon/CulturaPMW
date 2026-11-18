-- CulturaPMW - RF01: consulta segura de disponibilidade de CPF/CNPJ.
-- Execute depois das migrations administrativa e RF01.
-- Retorna somente um booleano; nunca retorna CPF/CNPJ, nome ou e-mail.

create or replace function public.verificar_documento_produtor_disponivel(
  p_documento text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select case
    when pg_catalog.length(
      pg_catalog.regexp_replace(coalesce(p_documento, ''), '[^0-9]', '', 'g')
    ) not in (11, 14)
    then false
    else not exists (
      select 1
      from public.produtores as produtor
      where produtor.cpf_cnpj = pg_catalog.regexp_replace(
        coalesce(p_documento, ''), '[^0-9]', '', 'g'
      )
    )
  end;
$function$;

-- A função é necessária antes do login, portanto pode ser chamada por anon.
-- Ela expõe somente disponibilidade (true/false), nunca os dados do cadastro.
revoke all on function public.verificar_documento_produtor_disponivel(text)
  from public, anon, authenticated;
grant execute on function public.verificar_documento_produtor_disponivel(text)
  to anon, authenticated;
