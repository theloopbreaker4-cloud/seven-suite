// Seven Suite admin: two-factor sign-in and API keys, end to end in headless Chromium.
// Needs: API on :4000 and `nx serve admin` on :4200 (dev). Usage: node security-e2e.mjs [screenshotDir]
import { createHmac } from 'node:crypto';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4200';
const API = process.env.API ?? 'http://127.0.0.1:4000/api/v1';
const shots = process.argv[2];
const run = Date.now().toString(36);
const owner = { name: 'Sec Owner', org: `Sec ${run}`, email: `sec-${run}@e2e.seven`, password: 'owner password 123' };

// RFC 6238 TOTP (SHA-1, 6 digits, 30 s) — same as an authenticator app.
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32decode(s) {
  let bits = 0, value = 0; const out = [];
  for (const ch of s.replace(/\s/g, '').toUpperCase()) {
    value = (value << 5) | B32.indexOf(ch); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
function totp(secret, offset = 0) {
  const step = Math.floor(Date.now() / 30000) + offset;
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac('sha1', b32decode(secret)).update(counter).digest();
  const o = mac[mac.length - 1] & 15;
  return String((mac.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
}

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(['ok', name]); }
  catch (e) { results.push(['FAIL', `${name}: ${String(e.message).split('\n')[0]}`]); }
};
const shot = async (page, name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'en-US' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/40[13]|422/.test(m.text()) && errors.push(m.text()));
let secret = '';
let apiKey = '';

await check('sign up', async () => {
  await page.goto(BASE + '/signup');
  await page.getByLabel('Your name').fill(owner.name);
  await page.getByLabel('Company name').fill(owner.org);
  await page.getByLabel('Email').fill(owner.email);
  await page.getByLabel('Password').fill(owner.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL((u) => !u.pathname.endsWith('/signup'));
});

await check('Security page turns on two-factor sign-in with a QR code', async () => {
  await page.getByRole('link', { name: 'Security' }).click();
  await page.getByRole('heading', { name: 'Two-factor sign-in' }).waitFor();
  await page.getByRole('button', { name: 'Turn on' }).click();
  await page.getByAltText('QR code for your authenticator app').waitFor();
  secret = (await page.locator('p.break-all.font-mono').innerText()).trim();
  if (!/^[A-Z2-7]{32}$/.test(secret)) throw new Error(`unexpected secret "${secret}"`);
  await shot(page, 'sec-01-setup');
  await page.getByLabel('Code').fill('000000');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByText('Wrong code').waitFor();
  await page.getByLabel('Code').fill(totp(secret));
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByText('Your recovery codes').waitFor();
  const codes = await page.locator('ul.font-mono li').allInnerTexts();
  if (codes.length !== 10) throw new Error(`${codes.length} recovery codes`);
  await shot(page, 'sec-02-codes');
  await page.getByRole('button', { name: 'I saved them' }).click();
  await page.getByText('10 recovery codes left').waitFor();
});

await check('sign-in asks for the code after the password', async () => {
  await ctx.clearCookies();
  await page.goto(BASE + '/login');
  await page.getByLabel('Email').fill(owner.email);
  await page.getByLabel('Password').fill(owner.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Enter the 6-digit code from your authenticator app.').waitFor();
  await shot(page, 'sec-03-code-step');
  await page.getByLabel('Code').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByText('Wrong code.').waitFor();
  await page.getByLabel('Code').fill(totp(secret, 1)); // the current step was used to enable
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForURL((u) => !u.pathname.endsWith('/login'));
  await page.getByRole('link', { name: 'API keys' }).waitFor();
});

await check('API keys page creates a key shown once, usable against the API', async () => {
  await page.getByRole('link', { name: 'API keys' }).click();
  await page.getByText('No API keys yet.').waitFor();
  await page.getByLabel('Name').fill('E2E integration');
  await page.getByText('platform:member:read', { exact: true }).click();
  await page.getByRole('button', { name: 'Create key' }).click();
  await page.getByText('Key “E2E integration” created').waitFor();
  apiKey = (await page.locator('p.break-all.font-mono').innerText()).trim();
  if (!apiKey.startsWith('sv_')) throw new Error('no key shown');
  await shot(page, 'sec-04-key');
  const res = await fetch(`${API}/org/members`, { headers: { 'X-Api-Key': apiKey } });
  if (res.status !== 200) throw new Error(`members with key → ${res.status}`);
  const me = await fetch(`${API}/auth/me`, { headers: { 'X-Api-Key': apiKey } });
  if (me.status !== 403) throw new Error(`/auth/me with key → ${me.status}`);
});

await check('revoking the key stops it at once', async () => {
  await page.getByRole('button', { name: 'I saved them' }).click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Revoke' }).click();
  await page.getByText('(revoked)').waitFor();
  const res = await fetch(`${API}/org/members`, { headers: { 'X-Api-Key': apiKey } });
  if (res.status !== 401) throw new Error(`revoked key → ${res.status}`);
});

await check('no page errors', async () => {
  if (errors.length) throw new Error(errors.join(' | ').slice(0, 300));
});

await browser.close();
for (const [s, n] of results) console.log(s === 'ok' ? 'OK  ' : 'FAIL', n);
const failed = results.filter(([s]) => s !== 'ok').length;
console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
process.exit(failed ? 1 : 0);
