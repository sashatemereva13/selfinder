import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontPagePath = resolve('src/FrontPage.jsx');
const frontPageFile = readFileSync(frontPagePath, 'utf8');

test('Journey transfer unlocks content without forced page scroll', () => {
  assert.match(
    frontPageFile,
    /const\s+handleJourneyTransferComplete\s*=\s*\(\)\s*=>\s*\{[\s\S]*setJourneyUnlocked\(true\);[\s\S]*\}/,
    'Expected transfer handler to unlock journey state'
  );

  assert.doesNotMatch(
    frontPageFile,
    /scrollIntoView\(/,
    'FrontPage should not auto-scroll after journey transfer'
  );
});
