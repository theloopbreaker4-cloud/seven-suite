-- Row-level security for tenant-owned platform tables (ADR-006).
--
-- Two connections:
--   * the migration/owner role (DATABASE_URL) owns the tables and bypasses RLS — used only by
--     platform code that must look across tenants (login: "which orgs is this user in?");
--   * `seven_app` (DATABASE_APP_URL) is what the application uses for everything else; it only
--     sees rows whose org_id equals the transaction-local setting `app.org_id`.
-- With no organization set, NULLIF(...) yields NULL and the policies match nothing.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'seven_app') THEN
    -- Password and LOGIN are set by ops (dev: docker/postgres/init.sql).
    CREATE ROLE seven_app NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA platform TO seven_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO seven_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO seven_app;

CREATE OR REPLACE FUNCTION platform.current_org_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.org_id', true), '')::uuid $$;
GRANT EXECUTE ON FUNCTION platform.current_org_id() TO seven_app;

-- organization: a tenant sees only itself.
ALTER TABLE platform.organization ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.organization
  USING (id = platform.current_org_id()) WITH CHECK (id = platform.current_org_id());

ALTER TABLE platform.role ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.role
  USING (org_id = platform.current_org_id()) WITH CHECK (org_id = platform.current_org_id());

ALTER TABLE platform.membership ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.membership
  USING (org_id = platform.current_org_id()) WITH CHECK (org_id = platform.current_org_id());

-- Events and audit rows may be global (org_id NULL, e.g. sign-up); the app role still only
-- reads its own organization's rows, while the worker dispatches with the owner role.
ALTER TABLE platform.outbox_event ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.outbox_event
  USING (org_id = platform.current_org_id())
  WITH CHECK (org_id IS NULL OR org_id = platform.current_org_id());

ALTER TABLE platform.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.audit_log
  USING (org_id = platform.current_org_id())
  WITH CHECK (org_id IS NULL OR org_id = platform.current_org_id());

-- Audit is append-only for the application.
REVOKE UPDATE, DELETE ON platform.audit_log FROM seven_app;
