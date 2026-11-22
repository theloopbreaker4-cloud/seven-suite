// End-to-end smoke test of the Seven Suite admin in headless Chromium.
// Needs: API on :4000, `nx serve admin` on :4200, Mailpit UI on :8026.
// Usage: node admin-smoke.mjs [screenshotDir]
import { chromium } from 'playwright';

// BASE=https://seven.toolpix.dev/suite MAILPIT= node admin-smoke.mjs  → production run without email steps
const BASE = process.env.BASE ?? 'http://127.0.0.1:4200';
const MAILPIT = process.env.MAILPIT ?? (BASE.includes('127.0.0.1') ? 'http://127.0.0.1:8026' : '');
const DOMAIN = process.env.EMAIL_DOMAIN ?? (MAILPIT ? 'e2e.seven' : 'example.com');
const shots = process.argv[2];
const run = Date.now().toString(36);
const owner = { name: 'Nino Owner', org: `Smoke ${run}`, email: `owner-${run}@${DOMAIN}`, password: 'owner password 123' };
const invitee = { name: 'Giorgi Member', email: `member-${run}@${DOMAIN}`, password: 'member password 123' };

const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(['ok', name]);
  } catch (e) {
    results.push(['FAIL', `${name}: ${String(e.message).split('\n')[0]}`]);
  }
};
const shot = async (page, name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });

async function linkFromMailpit(to) {
  for (let i = 0; i < 20; i++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
    if (list.messages?.length) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${list.messages[0].ID}`)).json();
      const m = /token=([^\s&"<]+)/.exec(msg.Text);
      if (m) return decodeURIComponent(m[1]);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no email for ${to}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'en-US' });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(e.message));

await check('anonymous visitor is sent to /login', async () => {
  await page.goto(BASE + '/');
  await page.waitForURL(/\/login/);
  await page.getByRole('heading', { name: 'Sign in' }).waitFor();
  await shot(page, '01-login');
});

await check('sign up creates a workspace and lands on the dashboard', async () => {
  await page.getByRole('link', { name: 'Create one' }).click();
  await page.getByLabel('Your name').fill(owner.name);
  await page.getByLabel('Company name').fill(owner.org);
  await page.getByLabel('Email').fill(owner.email);
  await page.getByLabel('Password').fill(owner.password);
  await shot(page, '02-signup');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByRole('heading', { name: `Hello, ${owner.name}` }).waitFor();
  await page.getByText('Please confirm your email address').waitFor();
  await shot(page, '03-dashboard');
});

await check('members page lists the owner and sends an invitation', async () => {
  await page.getByRole('link', { name: 'Members' }).first().click();
  await page.waitForURL(/settings\/members/);
  await page.getByRole('cell', { name: owner.email }).waitFor();
  await page.getByLabel('Email').fill(invitee.email);
  await page.getByRole('button', { name: 'Send invitation' }).click();
  await page.getByText(`Invitation sent to ${invitee.email}.`).waitFor();
  await page.getByRole('cell', { name: invitee.email }).waitFor();
  await shot(page, '04-members');
});

await check('a reload keeps the session (refresh cookie)', async () => {
  await page.reload();
  await page.getByRole('cell', { name: owner.email }).waitFor();
});

await check('language switch to Georgian and dark theme', async () => {
  await page.getByLabel('Language').selectOption('ka');
  await page.getByRole('heading', { name: 'წევრები' }).waitFor();
  try {
    await page.getByRole('button', { name: 'მუქი თემა' }).click();
    // The theme is applied by an effect on the next change-detection pass.
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 5000 });
    await shot(page, '05-members-ka-dark');
  } finally {
    // Always return to English so later steps can find their texts.
    await page.getByLabel('ენა').selectOption('en');
    await page.getByRole('heading', { name: 'Members' }).waitFor();
  }
});

await check('sign out, wrong password message, sign in again', async () => {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL(/\/login/);
  await page.getByLabel('Email').fill(owner.email);
  await page.getByLabel('Password').fill('not the password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Wrong email or password.').waitFor();
  await page.getByLabel('Password').fill(owner.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: `Hello, ${owner.name}` }).waitFor();
});

if (MAILPIT) await check('the invitee accepts from the email link and joins as member', async () => {
  const token = await linkFromMailpit(invitee.email);
  const other = await (await browser.newContext({ locale: 'en-US' })).newPage();
  other.on('pageerror', (e) => consoleErrors.push(e.message));
  await other.goto(`${BASE}/invitation?token=${encodeURIComponent(token)}`);
  await other.getByText(`You have been invited to ${owner.org} as Member.`).waitFor();
  await other.getByLabel('Your name').fill(invitee.name);
  await other.getByLabel('New password').fill(invitee.password);
  await shot(other, '06-invitation');
  await other.getByRole('button', { name: 'Accept and continue' }).click();
  await other.getByRole('heading', { name: `Hello, ${invitee.name}` }).waitFor();
  await other.getByRole('link', { name: 'Members' }).first().click();
  await other.getByRole('cell', { name: owner.email }).waitFor();
  if (await other.getByRole('button', { name: 'Send invitation' }).count()) {
    throw new Error('a member can see the invite form');
  }
  await shot(other, '07-member-view');
});

if (MAILPIT) await check('verification link from the email confirms the address', async () => {
  const token = await linkFromMailpit(owner.email);
  await page.goto(`${BASE}/verify-email?token=${encodeURIComponent(token)}`);
  await page.getByText('Your email address is confirmed.').waitFor();
  await page.getByRole('link', { name: 'Continue' }).click();
  await page.getByRole('heading', { name: `Hello, ${owner.name}` }).waitFor();
  if (await page.getByText('Please confirm your email address').count()) throw new Error('banner still shown');
});

await browser.close();
for (const [s, n] of results) console.log(`${s.padEnd(4)} ${n}`);
const realErrors = consoleErrors.filter((e) => !/401|Unauthorized|status of 401/.test(e));
console.log(`console errors: ${realErrors.length}${realErrors.length ? '\n  ' + realErrors.slice(0, 5).join('\n  ') : ''}`);
process.exit(results.some(([s]) => s === 'FAIL') || realErrors.length ? 1 : 0);
