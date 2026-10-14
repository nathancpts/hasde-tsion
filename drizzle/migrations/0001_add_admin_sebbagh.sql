create or replace function public.grant_admin_on_signup()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if lower(coalesce(new.email, '')) = 'nathan.capitain@fortus.fr'
     or (lower(coalesce(new.email, '')) = 'js@sebbagh-avocats.com' and new.email_confirmed_at is not null) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::public.app_role)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed_grant_admin on auth.users;
create trigger on_auth_user_confirmed_grant_admin
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.grant_admin_on_signup();