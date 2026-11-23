#!/bin/sh
# Runs once when the stack's database volume is created: the RLS-bound application role.
# (Superusers and table owners bypass row-level security, so the app must not use them.)
set -eu
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v pw="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE seven_app LOGIN PASSWORD :'pw';
GRANT CONNECT ON DATABASE seven_suite TO seven_app;
SQL
