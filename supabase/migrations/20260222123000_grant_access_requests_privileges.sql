grant usage on schema presence to authenticated, service_role;
grant all on presence.access_requests to service_role;
grant select, insert on presence.access_requests to authenticated;
