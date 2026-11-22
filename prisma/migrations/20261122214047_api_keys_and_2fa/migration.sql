-- AlterTable
ALTER TABLE "platform"."user" ADD COLUMN     "totp_enabled_at" TIMESTAMPTZ(3),
ADD COLUMN     "totp_last_step" BIGINT;

-- CreateTable
CREATE TABLE "platform"."recovery_code" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" CHAR(64) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."api_key" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" VARCHAR(16) NOT NULL,
    "key_hash" CHAR(64) NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by_id" UUID NOT NULL,
    "last_used_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recovery_code_code_hash_key" ON "platform"."recovery_code"("code_hash");

-- CreateIndex
CREATE INDEX "recovery_code_user_id_idx" ON "platform"."recovery_code"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_key_hash_key" ON "platform"."api_key"("key_hash");

-- CreateIndex
CREATE INDEX "api_key_org_id_idx" ON "platform"."api_key"("org_id");

-- AddForeignKey
ALTER TABLE "platform"."recovery_code" ADD CONSTRAINT "recovery_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."api_key" ADD CONSTRAINT "api_key_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tenant isolation for API keys (ADR-006). Key lookup by hash happens with the owner role
-- (the caller's organization is not known until the key is found).
ALTER TABLE platform.api_key ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.api_key
  USING (org_id = platform.current_org_id()) WITH CHECK (org_id = platform.current_org_id());

-- Recovery codes are account-level and only touched by platform auth code (owner role).
REVOKE ALL ON platform.recovery_code FROM seven_app;
