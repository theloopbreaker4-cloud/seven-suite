-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "platform";

-- CreateTable
CREATE TABLE "platform"."organization" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "country" CHAR(2) NOT NULL DEFAULT 'GE',
    "base_currency" CHAR(3) NOT NULL DEFAULT 'GEL',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tbilisi',
    "locale" TEXT NOT NULL DEFAULT 'ka',
    "languages" TEXT[] DEFAULT ARRAY['ka', 'en', 'ru']::TEXT[],
    "modules_enabled" TEXT[] DEFAULT ARRAY['core']::TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "email_verified" TIMESTAMPTZ(3),
    "totp_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."role" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."membership" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."refresh_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "user_agent" TEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "rotated_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."outbox_event" (
    "id" UUID NOT NULL,
    "org_id" UUID,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatched_at" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "outbox_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."processed_event" (
    "consumer" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_event_pkey" PRIMARY KEY ("consumer","event_id")
);

-- CreateTable
CREATE TABLE "platform"."audit_log" (
    "id" UUID NOT NULL,
    "org_id" UUID,
    "actor_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "platform"."organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "platform"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_org_id_key_key" ON "platform"."role"("org_id", "key");

-- CreateIndex
CREATE INDEX "membership_user_id_idx" ON "platform"."membership"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "membership_org_id_user_id_key" ON "platform"."membership"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "platform"."refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_family_id_idx" ON "platform"."refresh_token"("family_id");

-- CreateIndex
CREATE INDEX "outbox_event_dispatched_at_occurred_at_idx" ON "platform"."outbox_event"("dispatched_at", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_log_org_id_entity_type_entity_id_idx" ON "platform"."audit_log"("org_id", "entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "platform"."role" ADD CONSTRAINT "role_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."membership" ADD CONSTRAINT "membership_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."membership" ADD CONSTRAINT "membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."membership" ADD CONSTRAINT "membership_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "platform"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
