-- CreateTable
CREATE TABLE "platform"."organization_domain" (
    "domain" TEXT NOT NULL,
    "org_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_domain_pkey" PRIMARY KEY ("domain")
);

-- CreateIndex
CREATE INDEX "organization_domain_org_id_idx" ON "platform"."organization_domain"("org_id");

-- AddForeignKey
ALTER TABLE "platform"."organization_domain" ADD CONSTRAINT "organization_domain_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lower-case hostnames only (the API normalises; this keeps bad data out for good).
ALTER TABLE platform.organization_domain
  ADD CONSTRAINT organization_domain_format CHECK (domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$');

-- Tenants manage their own domains; the storefront lookup by host uses the owner role.
ALTER TABLE platform.organization_domain ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.organization_domain
  USING (org_id = platform.current_org_id()) WITH CHECK (org_id = platform.current_org_id());
