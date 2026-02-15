-- Fix user_roles role checks and signup flow behavior for existing deployments.
-- 1) Make role helper functions resilient to RLS recursion.
-- 2) Route new signups by metadata:
--    - signup_type=employee -> pending signup_requests row
--    - signup_type=customer (default) -> user role row

begin;

create or replace function public.current_app_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  if auth.uid() is null then
    return null;
  end if;

  select ur.role
  into current_role
  from public.user_roles ur
  where ur.user_id = auth.uid()
  limit 1;

  return current_role;
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_is_admin boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  )
  into user_is_admin;

  return coalesce(user_is_admin, false);
end;
$$;

drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
on public.user_roles for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "user_roles_admin_insert" on public.user_roles;
create policy "user_roles_admin_insert"
on public.user_roles for insert
with check (public.is_admin());

drop policy if exists "user_roles_admin_update" on public.user_roles;
create policy "user_roles_admin_update"
on public.user_roles for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user_roles_admin_delete" on public.user_roles;
create policy "user_roles_admin_delete"
on public.user_roles for delete
using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_name_value text;
  last_name_value text;
  signup_type_value text;
begin
  first_name_value := nullif(new.raw_user_meta_data ->> 'first_name', '');
  last_name_value := nullif(new.raw_user_meta_data ->> 'last_name', '');
  signup_type_value := lower(coalesce(nullif(new.raw_user_meta_data ->> 'signup_type', ''), 'customer'));

  insert into public.profiles (user_id, first_name, last_name)
  values (new.id, first_name_value, last_name_value)
  on conflict (user_id)
  do update
  set first_name = excluded.first_name,
      last_name = excluded.last_name,
      updated_at = now();

  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id) do nothing;
  elsif signup_type_value = 'employee' then
    insert into public.signup_requests (user_id, email, first_name, last_name, status)
    values (new.id, new.email, first_name_value, last_name_value, 'pending')
    on conflict (user_id) do update
    set email = excluded.email,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        status = 'pending',
        updated_at = now();
  else
    insert into public.user_roles (user_id, role)
    values (new.id, 'user')
    on conflict (user_id) do update
    set role = 'user',
        updated_at = now();

    delete from public.signup_requests
    where user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill: ensure legacy users without role/request are treated as customers.
insert into public.user_roles (user_id, role)
select au.id, 'user'
from auth.users au
left join public.user_roles ur on ur.user_id = au.id
left join public.signup_requests sr on sr.user_id = au.id and sr.status = 'pending'
where ur.user_id is null
  and sr.user_id is null
on conflict (user_id) do nothing;

commit;
