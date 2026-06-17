-- Presence Application schema (non-public)
create extension if not exists pgcrypto;

create schema if not exists presence;

create type presence.presence_status as enum ('PRESENT', 'WFH', 'NOT_PRESENT', 'GO_TO_CLIENT');

create table if not exists presence.employees (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  email text not null unique,
  full_name text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists presence.presences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references presence.employees(id) on delete cascade,
  presence_date date not null,
  status presence.presence_status not null,
  selfie_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, presence_date)
);

create index if not exists idx_presences_presence_date on presence.presences (presence_date desc);
create index if not exists idx_presences_employee_id on presence.presences (employee_id);
create index if not exists idx_employees_clerk_user_id on presence.employees (clerk_user_id);

create or replace function presence.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_employees_set_updated_at on presence.employees;
create trigger trg_employees_set_updated_at
before update on presence.employees
for each row
execute procedure presence.set_updated_at();

drop trigger if exists trg_presences_set_updated_at on presence.presences;
create trigger trg_presences_set_updated_at
before update on presence.presences
for each row
execute procedure presence.set_updated_at();

-- RLS configuration for future JWT-based client access.
alter table presence.employees enable row level security;
alter table presence.presences enable row level security;

-- Service role policies used by server-only operations.
drop policy if exists employees_service_role_all on presence.employees;
create policy employees_service_role_all
on presence.employees
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists presences_service_role_all on presence.presences;
create policy presences_service_role_all
on presence.presences
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Optional policies for Clerk JWT template where sub = Clerk user ID.
drop policy if exists employees_select_own on presence.employees;
create policy employees_select_own
on presence.employees
for select
using ((auth.jwt() ->> 'sub') = clerk_user_id);

drop policy if exists presences_select_own on presence.presences;
create policy presences_select_own
on presence.presences
for select
using (
  exists (
    select 1
    from presence.employees e
    where e.id = presences.employee_id
      and e.clerk_user_id = (auth.jwt() ->> 'sub')
  )
);

grant usage on schema presence to authenticated, service_role;
grant all on all tables in schema presence to service_role;
grant select on presence.employees, presence.presences to authenticated;
