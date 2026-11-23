// Conventional commits: `type(scope)?: subject`. Used by .githooks/commit-msg and CI.
import { readFileSync } from 'node:fs';

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'release',
];
const PATTERN = new RegExp(
  String.raw`^(${TYPES.join('|')})(\([a-z0-9-/]+\))?!?: \S`,
);

const message = readFileSync(process.argv[2], 'utf8');
const subject =
  message.split('\n').find((l) => l.trim() && !l.startsWith('#')) ?? '';
// git's own messages (merge, revert, fixup!/squash! while rebasing) pass through.
if (
  /^(Merge|Revert|fixup!|squash!|amend!)/.test(subject) ||
  PATTERN.test(subject)
)
  process.exit(0);

console.error(
  `Commit message must look like "type(scope): subject" — got:\n  ${subject}\n`,
);
console.error(
  `Types: ${TYPES.join(', ')}. Example: fix(api): refuse expired invitations`,
);
process.exit(1);
