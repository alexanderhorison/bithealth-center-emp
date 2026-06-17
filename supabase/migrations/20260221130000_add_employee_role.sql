do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'employee_role'
      and n.nspname = 'presence'
  ) then
    create type presence.employee_role as enum ('admin', 'employee');
  end if;
end $$;

alter table presence.employees
add column if not exists role presence.employee_role not null default 'employee';

create index if not exists idx_employees_role on presence.employees (role);
