/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// One schema file per module in prisma/schema/. Migrations run as the database owner
// (DATABASE_URL); the application itself connects as the RLS-bound role (DATABASE_APP_URL).
export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
