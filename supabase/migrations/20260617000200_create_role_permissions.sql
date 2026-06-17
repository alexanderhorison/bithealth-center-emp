-- Role permissions: which routes within an app a role can access.
-- Route values match the path segment used in middleware/nav guards.

create table if not exists presence.role_permissions (
  id         uuid primary key default gen_random_uuid(),
  role_id    uuid not null references presence.roles(id) on delete cascade,
  route      text not null,
  created_at timestamptz not null default now(),
  constraint role_permissions_unique unique (role_id, route)
);

create index if not exists idx_role_permissions_role_id on presence.role_permissions (role_id);

-- RLS
alter table presence.role_permissions enable row level security;

drop policy if exists role_permissions_service_role_all on presence.role_permissions;
create policy role_permissions_service_role_all
  on presence.role_permissions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists role_permissions_authenticated_select on presence.role_permissions;
create policy role_permissions_authenticated_select
  on presence.role_permissions for select
  using (auth.role() = 'authenticated');

grant all on presence.role_permissions to service_role;
grant select on presence.role_permissions to authenticated;

-- Seed default permissions

-- ADMIN (cms): all CMS routes
insert into presence.role_permissions (role_id, route)
select r.id, route
from presence.roles r
cross join (
  values
    ('dashboard'),
    ('employees'),
    ('roles'),
    ('presences'),
    ('access-requests')
) as routes(route)
where r.code = 'ADMIN'
on conflict (role_id, route) do nothing;

-- EMPLOYEE (emp): core employee routes
insert into presence.role_permissions (role_id, route)
select r.id, route
from presence.roles r
cross join (
  values
    ('dashboard'),
    ('presence'),
    ('account-request')
) as routes(route)
where r.code = 'EMPLOYEE'
on conflict (role_id, route) do nothing;
