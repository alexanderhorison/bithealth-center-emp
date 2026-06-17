-- Add app column to presence.roles
-- 'cms' = Admin CMS, 'emp' = Employee App
-- A role belongs to exactly one app; employees can have roles from multiple apps.

alter table presence.roles
  add column if not exists app text;

alter table presence.roles
  drop constraint if exists roles_app_check;

alter table presence.roles
  add constraint roles_app_check check (app in ('cms', 'emp'));

-- Seed / re-seed system roles with app assignment
insert into presence.roles (code, name, description, is_system, app)
values
  ('ADMIN', 'Admin', 'Can access Admin CMS.', true, 'cms'),
  ('EMPLOYEE', 'Employee', 'Can access Employee App.', true, 'emp')
on conflict (code) do update
  set
    name        = excluded.name,
    description = excluded.description,
    is_system   = excluded.is_system,
    app         = excluded.app;

-- Make app NOT NULL now that all rows have a value
alter table presence.roles
  alter column app set not null;

create index if not exists idx_roles_app on presence.roles (app);
