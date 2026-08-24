-- O login passou a ser só com Google, e o OAuth entrega os dados da pessoa com
-- outros nomes: full_name/name para o nome e avatar_url/picture para a foto.
alter table public.profiles add column if not exists avatar_url text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, language)
  values (
    new.id,
    new.email,
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        new.raw_user_meta_data ->> 'display_name'
      ),
      ''
    ),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'avatar_url',
        new.raw_user_meta_data ->> 'picture'
      ),
      ''
    ),
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'pt-BR')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
