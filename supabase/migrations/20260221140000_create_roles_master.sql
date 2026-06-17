create table if not exists presence.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_code_uppercase check (code = upper(code))
);

create index if not exists idx_roles_code on presence.roles (code);

drop trigger if exists trg_roles_set_updated_at on presence.roles;
create trigger trg_roles_set_updated_at
before update on presence.roles
for each row
execute procedure presence.set_updated_at();

insert into presence.roles (code, name, description, is_system)
values
  ('ADMIN', 'Admin', 'Can access CMS and Employee App.', true),
  ('EMPLOYEE', 'Employee', 'Can access Employee App.', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system;

alter table presence.employees
add column if not exists role_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_role_id_fkey'
      and conrelid = 'presence.employees'::regclass
  ) then
    alter table presence.employees
    add constraint employees_role_id_fkey
    foreign key (role_id) references presence.roles(id);
  end if;
end $$;

update presence.employees e
set role_id = r.id
from presence.roles r
where e.role_id is null
  and (
    (e.role::text = 'admin' and r.code = 'ADMIN')
    or (coalesce(e.role::text, 'employee') <> 'admin' and r.code = 'EMPLOYEE')
  );

create or replace function presence.default_employee_role_id()
returns uuid
language sql
stable
as $$
  select id
  from presence.roles
  where code = 'EMPLOYEE'
  limit 1
$$;

alter table presence.employees
alter column role_id set default presence.default_employee_role_id();

update presence.employees
set role_id = presence.default_employee_role_id()
where role_id is null;

alter table presence.employees
alter column role_id set not null;

create index if not exists idx_employees_role_id on presence.employees (role_id);

alter table presence.roles enable row level security;

drop policy if exists roles_service_role_all on presence.roles;
create policy roles_service_role_all
on presence.roles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

grant all on presence.roles to service_role;
grant select on presence.roles to authenticated;
