// Seven Suite admin: Organization settings, Roles editor and System → Queues, in headless Chromium.
// Needs: API on :4000 started with PLATFORM_ADMINS=ops-e2e@e2e.seven, `nx serve admin` on :4200.
// Usage: node org-e2e.mjs [screenshotDir]
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4200';
const shots = process.argv[2];
const run = Date.now().toString(36);
const ops = {
  name: 'Ops E2E',
  org: 'Ops Co',
  email: 'ops-e2e@e2e.seven',
  password: 'ops password 1234',
};

const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(['ok', name]);
  } catch (e) {
    results.push(['FAIL', `${name}: ${String(e.message).split('\n')[0]}`]);
  }
};
const shot = async (page, name) =>
  shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: 'en-US' })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on(
  'console',
  (m) =>
    m.type() === 'error' &&
    !/40[13]|409|422/.test(m.text()) &&
    errors.push(m.text()),
);

await check('operator signs up (or in)', async () => {
  await page.goto(BASE + '/signup');
  await page.getByLabel('Your name').fill(ops.name);
  await page.getByLabel('Company name').fill(ops.org);
  await page.getByLabel('Email').fill(ops.email);
  await page.getByLabel('Password').fill(ops.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  const taken = page.getByText('An account with this email already exists.');
  const result = await Promise.race([
    page.waitForURL((u) => !u.pathname.endsWith('/signup')).then(() => 'in'),
    taken.waitFor().then(() => 'taken'),
  ]);
  if (result === 'taken') {
    await page.goto(BASE + '/login');
    await page.getByLabel('Email').fill(ops.email);
    await page.getByLabel('Password').fill(ops.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL((u) => !u.pathname.endsWith('/login'));
  }
});

await check('Organization page saves the profile', async () => {
  await page.getByRole('link', { name: 'Organization' }).click();
  await page.getByLabel('Legal name').waitFor();
  await page.getByLabel('Legal name').fill(`Ops Co LLC ${run}`);
  await page.getByLabel('Time zone').selectOption('Asia/Baku');
  await page.getByRole('checkbox', { name: 'Українська' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText('Organization saved').waitFor();
  await shot(page, 'org-01-settings');
  await page.reload();
  if (
    (await page.getByLabel('Legal name').inputValue()) !== `Ops Co LLC ${run}`
  )
    throw new Error('not persisted');
  // put the time zone back for the next run
  await page.getByLabel('Time zone').selectOption('Asia/Tbilisi');
  await page.getByRole('checkbox', { name: 'Українська' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText('Organization saved').waitFor();
});

await check(
  'Organization page adds and removes a storefront domain',
  async () => {
    const domain = `shop-${run}.example.ge`;
    await page
      .getByLabel('Your domain')
      .fill(`HTTPS://${domain.toUpperCase()}/`);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByText(domain, { exact: true }).waitFor();
    page.once('dialog', (d) => d.accept());
    await page
      .getByRole('listitem')
      .filter({ hasText: domain })
      .getByRole('button', { name: 'Remove' })
      .click();
    await page
      .getByText(domain, { exact: true })
      .waitFor({ state: 'detached' });
  },
);

await check('Roles page creates, edits and deletes a custom role', async () => {
  await page.getByRole('link', { name: 'Roles' }).click();
  await page.getByRole('button', { name: 'New role' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Support');
  await page.getByLabel('Key', { exact: true }).fill(`support_${run}`);
  await page
    .getByRole('checkbox', { name: 'platform:member:read', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save role' }).click();
  await page.getByText('Role saved').waitFor();
  const row = page.getByRole('row', { name: /Support/ });
  await row.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Customer support');
  await page
    .getByRole('checkbox', { name: 'platform:member:invite', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save role' }).click();
  await page
    .getByRole('cell', { name: 'platform:member:read, platform:member:invite' })
    .waitFor();
  await shot(page, 'org-02-roles');
  page.once('dialog', (d) => d.accept());
  await page
    .getByRole('row', { name: /Customer support/ })
    .getByRole('button', { name: 'Delete' })
    .click();
  await page.getByText('Role deleted').waitFor();
  const built = await page.getByText('(built-in)').count();
  if (built !== 3) throw new Error(`${built} built-in roles shown`);
});

await check('Modules page shows Core as always on', async () => {
  await page.getByRole('link', { name: 'Modules' }).click();
  await page.getByRole('heading', { name: 'Core' }).waitFor();
  await page.getByText('always on').waitFor();
});

await check('System → Queues shows queues and runs a task', async () => {
  await page.getByRole('link', { name: 'Queues' }).click();
  await page.getByText('seven-events').waitFor();
  await page.getByText('platform.tokens-cleanup').waitFor();
  const row = page.getByRole('row', { name: /platform\.tokens-cleanup/ });
  await row.getByRole('button', { name: 'Run now' }).click();
  await page.getByText(/platform\.tokens-cleanup: \{"refresh"/).waitFor();
  await shot(page, 'org-03-queues');
});

await check('no page errors', async () => {
  if (errors.length) throw new Error(errors.join(' | ').slice(0, 300));
});

await browser.close();
for (const [s, n] of results) console.log(s === 'ok' ? 'OK  ' : 'FAIL', n);
const failed = results.filter(([s]) => s !== 'ok').length;
console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
process.exit(failed ? 1 : 0);
