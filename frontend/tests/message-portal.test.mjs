import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const experiencePath = resolve('src/Experience.jsx');
const experienceFile = readFileSync(experiencePath, 'utf8');

test('Message Html overlay portals to document.body', () => {
  assert.match(
    experienceFile,
    /const\s+htmlPortal\s*=\s*useRef\(null\);/,
    'Expected a stable portal ref for Html overlay'
  );

  assert.match(
    experienceFile,
    /htmlPortal\.current\s*=\s*document\.body;/,
    'Expected Html portal target to be document.body'
  );

  assert.match(
    experienceFile,
    /<Html\s+fullscreen\s+portal=\{htmlPortal\}/,
    'Expected fullscreen Html to use the body portal ref'
  );
});
