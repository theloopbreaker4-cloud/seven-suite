/**
 * Bring the test database (DATABASE_TEST_URL) to the latest schema before integration tests,
 * with the same `prisma migrate deploy` production uses.
 */
const { execSync } = require('node:child_process');
const path = require('node:path');

module.exports = async () => {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../../../.env'),
  });
  const url = process.env.DATABASE_TEST_URL;
  if (!url) throw new Error('DATABASE_TEST_URL is not set');
  execSync('pnpm exec prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../../../..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
};
