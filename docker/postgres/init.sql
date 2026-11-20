-- Runs once when the dev database volume is created.
-- The application connects as a non-superuser role so row-level security applies to it
-- (superusers and table owners bypass RLS unless FORCE is used).
CREATE ROLE seven_app LOGIN PASSWORD 'seven_app_dev_password';
GRANT CONNECT ON DATABASE seven_suite TO seven_app;
-- A separate database for integration tests.
CREATE DATABASE seven_suite_test OWNER seven;
