// Storefront (Next.js) in headless Chromium: language routing, organization frame, strict CSP.
// Needs: API on :4000 (WEB_BASE_DOMAIN=shops.local) and `next dev -p 4300` in apps/web with
// WEB_DEV_HOST=<slug>.shops.local. Usage: node e2e/web/storefront-e2e.mjs [org name]
import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE ?? 'http://127.0.0.1:4300';
const orgName = process.argv[2] ?? 'Ops Co';
const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push(['ok', name]); }
  catch (e) { results.push(['FAIL', `${name}: ${String(e.message).split('\n')[0]}`]); }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'ru-RU' });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));

await check('/ sends a Russian browser to /ru with the organization frame', async () => {
  await page.goto(BASE + '/');
  await page.waitForURL(/\/ru$/);
  await page.getByRole('heading', { name: `Добро пожаловать в ${orgName}` }).waitFor();
  if ((await page.getAttribute('html', 'lang')) !== 'ru') throw new Error('html lang is not ru');
  await page.getByRole('link', { name: orgName }).first().waitFor();
});

await check('language switcher offers only the enabled languages', async () => {
  const langs = await page.getByRole('navigation').getByRole('link').allInnerTexts();
  if (!langs.includes('English') || langs.includes('Հայերեն')) throw new Error(`languages: ${langs.join(', ')}`);
  await page.getByRole('link', { name: 'English' }).click();
  await page.getByRole('heading', { name: `Welcome to ${orgName}` }).waitFor();
});

await check('unknown page shows the localized 404 (no CSP errors)', async () => {
  problems.length = 0;
  const res = await page.goto(BASE + '/en/no-such-page');
  if (res?.status() !== 404) throw new Error(`status ${res?.status()}`);
  await page.getByRole('heading', { name: 'Page not found' }).waitFor();
  await page.waitForLoadState('networkidle');
  const real = problems.filter((p) => !/status of 404|Failed to load resource/.test(p));
  if (real.length) throw new Error(real.join(' | ').slice(0, 300));
});

await check('no CSP violations or script errors on the home page (strict nonce CSP)', async () => {
  problems.length = 0;
  await page.goto(BASE + '/en');
  await page.waitForLoadState('networkidle');
  const real = problems.filter((p) => !/404|Failed to load resource/.test(p));
  if (real.length) throw new Error(real.join(' | ').slice(0, 300));
});

await browser.close();
for (const [s, n] of results) console.log(s === 'ok' ? 'OK  ' : 'FAIL', n);
const failed = results.filter(([s]) => s !== 'ok').length;
console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
process.exit(failed ? 1 : 0);
