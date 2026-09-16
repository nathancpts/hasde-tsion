revoke execute on function public.grant_admin_on_signup() from public;
revoke execute on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;