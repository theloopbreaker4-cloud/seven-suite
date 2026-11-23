/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every UI language has exactly the keys English has, with the same {{placeholders}} — a missing
 * or misspelled key would show the raw key on screen.
 */
const dir = join(__dirname, '../../../public/i18n');
type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'string'
      ? { ...acc, [key]: v }
      : { ...acc, ...flatten(v, key) };
  }, {});
}
const load = (lang: string) =>
  flatten(JSON.parse(readFileSync(join(dir, `${lang}.json`), 'utf8')));
const placeholders = (s: string) =>
  (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort();

const en = load('en');
const languages = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace('.json', ''));

describe('translations', () => {
  it('ships all six languages', () => {
    expect(languages.sort()).toEqual(['az', 'hy', 'ka', 'ru', 'uk']);
  });

  it.each(languages)('%s has the same keys as English', (lang) => {
    const other = load(lang);
    expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(languages)(
    '%s keeps every {{placeholder}} and has no empty strings',
    (lang) => {
      const other = load(lang);
      for (const [key, text] of Object.entries(en)) {
        expect({ key, placeholders: placeholders(other[key] ?? '') }).toEqual({
          key,
          placeholders: placeholders(text),
        });
        expect({ key, empty: !(other[key] ?? '').trim() }).toEqual({
          key,
          empty: false,
        });
      }
    },
  );
});
