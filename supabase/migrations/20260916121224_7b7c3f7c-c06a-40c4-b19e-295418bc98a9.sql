-- 1) Rôles
create type public.app_role as enum ('admin', 'member');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can read their own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all roles"
on public.user_roles for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 2) Bootstrap admin
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users
where lower(email) = 'nathan.capitain@fortus.fr'
on conflict do nothing;

create or replace function public.grant_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email, '')) = 'nathan.capitain@fortus.fr' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::public.app_role)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_grant_admin
after insert on auth.users
for each row execute function public.grant_admin_on_signup();

-- 3) Annonces
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;

alter table public.announcements enable row level security;

create policy "Admins can manage announcements"
on public.announcements for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Members can read sent announcements"
on public.announcements for select to authenticated
using (sent_at is not null);

create trigger announcements_touch_updated_at
before update on public.announcements
for each row execute function public.touch_updated_at();

create index announcements_pending_idx on public.announcements (scheduled_at) where sent_at is null;

-- 4) Appareils rattachés au compte
alter table public.push_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

create policy "Users can read their own devices"
on public.push_subscriptions for select to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own devices"
on public.push_subscriptions for update to authenticated
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id);

create policy "Users can delete their own devices"
on public.push_subscriptions for delete to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all devices"
on public.push_subscriptions for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete devices"
on public.push_subscriptions for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 5) Préférence notifications sur le profil
alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true;

create policy "Admins can read all profiles"
on public.profiles for select to authenticated
using (public.has_role(auth.uid(), 'admin'));