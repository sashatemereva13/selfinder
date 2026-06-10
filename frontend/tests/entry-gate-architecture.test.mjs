import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexPath = resolve('src/index.jsx');
const entryGateJsxPath = resolve('src/frontpage/EntryGate.jsx');
const entryGateCssPath = resolve('src/frontpage/EntryGate.css');

const indexFile = readFileSync(indexPath, 'utf8');

test('EntryGate extracted into dedicated feature files', () => {
  assert.equal(existsSync(entryGateJsxPath), true, 'Missing src/frontpage/EntryGate.jsx');
  assert.equal(existsSync(entryGateCssPath), true, 'Missing src/frontpage/EntryGate.css');
});

test('index.jsx imports extracted EntryGate and has no inline EntryGate function', () => {
  assert.match(indexFile, /import\s+EntryGate\s+from\s+"\.\/frontpage\/EntryGate";/, 'Missing EntryGate import in index.jsx');
  assert.doesNotMatch(indexFile, /function\s+EntryGate\s*\(/, 'EntryGate should not be declared inline in index.jsx');
});
