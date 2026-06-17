-- Many-to-many: employees ↔ roles
-- Replaces employees.role_id (single role) with a join table.

create table if not exists presence.employee_roles (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references presence.employees(id) on delete cascade,
  role_id     uuid not null references presence.roles(id) on delete restrict,
  assigned_by uuid references presence.employees(id) on delete set null,
  assigned_at timestamptz not null default now(),
  constraint employee_roles_unique unique (employee_id, role_id)
);

create index if not exists idx_employee_roles_employee_id on presence.employee_roles (employee_id);
create index if not exists idx_employee_roles_role_id     on presence.employee_roles (role_id);

-- RLS
alter table presence.employee_roles enable row level security;

drop policy if exists employee_roles_service_role_all on presence.employee_roles;
create policy employee_roles_service_role_all
  on presence.employee_roles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists employee_roles_authenticated_select on presence.employee_roles;
create policy employee_roles_authenticated_select
  on presence.employee_roles for select
  using (auth.role() = 'authenticated');

grant all on presence.employee_roles to service_role;
grant select on presence.employee_roles to authenticated;

-- Migrate existing role assignments from employees.role_id → employee_roles
-- assigned_by = NULL means system-assigned (original data)
insert into presence.employee_roles (employee_id, role_id, assigned_by)
select e.id, e.role_id, null
from presence.employees e
where e.role_id is not null
on conflict (employee_id, role_id) do nothing;

-- Drop old single-role columns from employees
-- Drop FK constraint first
alter table presence.employees
  drop constraint if exists employees_role_id_fkey;

-- Drop old enum column + role_id column
alter table presence.employees
  drop column if exists role_id;

alter table presence.employees
  drop column if exists role;

-- Drop default function (no longer needed)
drop function if exists presence.default_employee_role_id();
