/**
 * @jest-environment node
 */
/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES, negotiateLocale } from '../src/lib/locales';
import {
  openSession,
  sealSession,
  type CustomerSession,
} from '../src/lib/session';

describe('negotiateLocale', () => {
  const allowed = ['ka', 'en', 'ru'];
  it('picks the best allowed language by quality', () => {
    expect(negotiateLocale('ru-RU,ru;q=0.9,en;q=0.8', allowed, 'ka')).toBe(
      'ru',
    );
    expect(negotiateLocale('de-DE,de;q=0.9,en;q=0.5', allowed, 'ka')).toBe(
      'en',
    );
    expect(negotiateLocale('en;q=0.2,ru;q=0.8', allowed, 'ka')).toBe('ru');
  });
  it('falls back to the organization default', () => {
    expect(negotiateLocale('fr', allowed, 'ka')).toBe('ka');
    expect(negotiateLocale(null, allowed, 'en')).toBe('en');
    expect(negotiateLocale('ru;q=0', allowed, 'ka')).toBe('ka');
  });
});

describe('customer session cookie', () => {
  const secret = 's'.repeat(40);
  const now = Date.UTC(2026, 10, 23);
  const session: CustomerSession = {
    org: 'org-1',
    vid: 'visitor-1',
    exp: now / 1000 + 3600,
  };

  it('round-trips', () => {
    expect(
      openSession(sealSession(session, secret), secret, 'org-1', now),
    ).toEqual(session);
  });
  it('rejects tampering, another shop, expiry, a wrong secret and short secrets', () => {
    const sealed = sealSession(session, secret);
    const forged =
      Buffer.from(JSON.stringify({ ...session, sub: 'someone-else' })).toString(
        'base64url',
      ) +
      '.' +
      sealed.split('.')[1];
    expect(openSession(forged, secret, 'org-1', now)).toBeNull();
    expect(openSession(sealed, secret, 'org-2', now)).toBeNull();
    expect(openSession(sealed, secret, 'org-1', now + 2 * 3600_000)).toBeNull();
    expect(openSession(sealed, 'x'.repeat(40), 'org-1', now)).toBeNull();
    expect(openSession('garbage', secret, 'org-1', now)).toBeNull();
    expect(() => sealSession(session, 'short')).toThrow(/32/);
  });
});

describe('storefront translations', () => {
  const dir = join(__dirname, '../messages');
  const flat = (o: Record<string, unknown>, p = ''): Record<string, string> =>
    Object.entries(o).reduce<Record<string, string>>(
      (acc, [k, v]) =>
        typeof v === 'string'
          ? { ...acc, [p + k]: v }
          : { ...acc, ...flat(v as Record<string, unknown>, `${p}${k}.`) },
      {},
    );
  const load = (l: string) =>
    flat(JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8')));
  const en = load('en');

  it('exist for every supported language', () => {
    expect(
      readdirSync(dir)
        .map((f) => f.replace('.json', ''))
        .sort(),
    ).toEqual([...LOCALES].sort());
  });
  it.each(LOCALES.filter((l) => l !== 'en'))(
    '%s has the same keys and {placeholders}',
    (lang) => {
      const other = load(lang);
      expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
      for (const [k, v] of Object.entries(en)) {
        const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
        expect({ k, ph: ph(other[k]) }).toEqual({ k, ph: ph(v) });
      }
    },
  );
});
