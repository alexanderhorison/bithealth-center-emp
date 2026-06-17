-- Ensure PostgREST exposes the custom schema.
alter role authenticator set pgrst.db_schemas = 'public,storage,graphql_public,presence';
alter role authenticator set pgrst.db_extra_search_path = 'public,extensions,presence';
notify pgrst, 'reload config';

-- Usage on schema for anon/authenticated; table access still controlled by RLS.
grant usage on schema presence to anon, authenticated, service_role;
