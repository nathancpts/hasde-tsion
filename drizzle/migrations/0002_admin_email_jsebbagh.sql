create or replace function public.grant_admin_on_signup()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if lower(coalesce(new.email, '')) = 'nathan.capitain@fortus.fr'
     or (lower(coalesce(new.email, '')) = 'jsebbagh@free.fr' and new.email_confirmed_at is not null) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::public.app_role)
    on conflict do nothing;
  end if;
  return new;
end;
$$;