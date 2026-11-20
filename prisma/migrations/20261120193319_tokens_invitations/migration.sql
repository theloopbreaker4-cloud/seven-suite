-- CreateTable
CREATE TABLE "platform"."user_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."invitation" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "invited_by_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_token_token_hash_key" ON "platform"."user_token"("token_hash");

-- CreateIndex
CREATE INDEX "user_token_user_id_purpose_idx" ON "platform"."user_token"("user_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_token_hash_key" ON "platform"."invitation"("token_hash");

-- CreateIndex
CREATE INDEX "invitation_org_id_email_idx" ON "platform"."invitation"("org_id", "email");

-- AddForeignKey
ALTER TABLE "platform"."user_token" ADD CONSTRAINT "user_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."invitation" ADD CONSTRAINT "invitation_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."invitation" ADD CONSTRAINT "invitation_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invitations belong to one organization.
ALTER TABLE platform.invitation ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON platform.invitation
  USING (org_id = platform.current_org_id()) WITH CHECK (org_id = platform.current_org_id());

-- Credentials and one-time tokens are handled only by platform auth code (owner connection);
-- the application role has no business reading them.
REVOKE ALL ON platform.user_token, platform.refresh_token FROM seven_app;
