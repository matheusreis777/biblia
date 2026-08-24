-- Funções de trigger não devem ficar expostas como RPC em /rest/v1/rpc/.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
