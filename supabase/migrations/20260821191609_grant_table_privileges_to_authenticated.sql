-- Este projeto não concede privilégios de tabela automaticamente, então o RLS
-- sozinho não basta: sem GRANT o PostgREST devolve 42501 antes de avaliar as
-- políticas. Só o papel `authenticated` recebe — quem não fez login não tem
-- nada a ver com estas tabelas.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.reading_progress to authenticated;
grant select, insert, update, delete on public.favorite_verses to authenticated;
