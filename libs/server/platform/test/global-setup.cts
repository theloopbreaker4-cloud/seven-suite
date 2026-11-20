/**
 * Prepare the test database before integration tests:
 *  1. bring it to the latest schema with `prisma migrate deploy` (what production runs);
 *  2. let the RLS-bound `seven_app` role log in with the password from DATABASE_APP_URL, so
 *     tests connect exactly like the application does and row-level security is enforced.
 */
const { execSync } = require('node:child_process');
const path = require('node:path');
const { Client } = require('pg');

module.exports = async () => {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../../../.env'),
    quiet: true,
  });
  const url = process.env.DATABASE_TEST_URL;
  const appUrl = process.env.DATABASE_APP_URL;
  if (!url) throw new Error('DATABASE_TEST_URL is not set');
  if (!appUrl)
    throw new Error(
      'DATABASE_APP_URL is not set (the app role password comes from it)',
    );

  execSync('pnpm exec prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../../../..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });

  const app = new URL(appUrl);
  const db = new URL(url).pathname.slice(1);
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const password = decodeURIComponent(app.password).replace(/'/g, "''");
    await client.query(
      `ALTER ROLE ${app.username} LOGIN PASSWORD '${password}'`,
    );
    await client.query(`GRANT CONNECT ON DATABASE "${db}" TO ${app.username}`);
  } finally {
    await client.end();
  }
};
