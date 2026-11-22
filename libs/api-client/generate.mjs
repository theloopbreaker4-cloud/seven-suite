// Regenerate the typed API description from a running API:
//   node libs/api-client/generate.mjs [http://127.0.0.1:4000/api/v1/openapi.json]
// Writes libs/api-client/openapi.json (committed: reviewable API diff) and src/lib/schema.ts.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] ?? 'http://127.0.0.1:4000/api/v1/openapi.json';
const res = await fetch(url);
if (!res.ok) throw new Error(`${url} → ${res.status}`);
const doc = await res.json();
writeFileSync(join(here, 'openapi.json'), JSON.stringify(doc, null, 2) + '\n');
const ast = await openapiTS(doc);
const header = '/** Generated from openapi.json by libs/api-client/generate.mjs — do not edit. */\n/* eslint-disable */\n';
writeFileSync(join(here, 'src/lib/schema.ts'), header + astToString(ast));
console.log(`api-client: ${Object.keys(doc.paths).length} paths from ${url}`);
