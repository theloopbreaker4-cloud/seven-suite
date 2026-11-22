// Runs every admin browser scenario in sequence (CI and local). Needs the API on :4000 (started with
// PLATFORM_ADMINS=ops-e2e@e2e.seven), `nx serve admin` on :4200 and Mailpit (MAILPIT=http://…).
// Usage: node e2e/admin/run-all.mjs [screenshotDir]
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = process.argv[2] ? [process.argv[2]] : [];
let failed = 0;
for (const script of ['admin-smoke.mjs', 'security-e2e.mjs', 'org-e2e.mjs']) {
  console.log(`\n== ${script}`);
  const r = spawnSync(process.execPath, [join(here, script), ...shots], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
console.log(failed ? `\n${failed} scenario file(s) failed` : '\nall admin scenarios passed');
process.exit(failed ? 1 : 0);
