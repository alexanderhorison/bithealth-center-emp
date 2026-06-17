create table if not exists presence.access_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references presence.employees(id) on delete cascade,
  provider text not null check (provider in ('GITHUB', 'FIGMA')),
  request_type text not null check (request_type in ('REPO_ACCESS', 'NEW_REPO', 'FIGMA_FILE', 'FIGMA_PROJECT')),
  target_url text not null,
  display_name text not null,
  justification text not null,
  extra_info text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'DENIED')),
  admin_note text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_access_requests_employee_id on presence.access_requests (employee_id);
create index if not exists idx_access_requests_provider on presence.access_requests (provider);
create index if not exists idx_access_requests_status on presence.access_requests (status);
create index if not exists idx_access_requests_created_at on presence.access_requests (created_at desc);

drop trigger if exists trg_access_requests_set_updated_at on presence.access_requests;
create trigger trg_access_requests_set_updated_at
before update on presence.access_requests
for each row
execute procedure presence.set_updated_at();

alter table presence.access_requests enable row level security;

drop policy if exists access_requests_service_role_all on presence.access_requests;
create policy access_requests_service_role_all
on presence.access_requests
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists access_requests_insert_self on presence.access_requests;
create policy access_requests_insert_self
on presence.access_requests
for insert
with check (
  exists (
    select 1
    from presence.employees e
    where e.id = access_requests.employee_id
      and e.clerk_user_id = auth.jwt() ->> 'sub'
  )
);

drop policy if exists access_requests_select_own on presence.access_requests;
create policy access_requests_select_own
on presence.access_requests
for select
using (
  exists (
    select 1
    from presence.employees e
    where e.id = access_requests.employee_id
      and e.clerk_user_id = auth.jwt() ->> 'sub'
  )
);
