import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontPagePath = resolve('src/FrontPage.jsx');
const frontPageFile = readFileSync(frontPagePath, 'utf8');

test('FrontPage should not render a second Drei Loader overlay', () => {
  assert.doesNotMatch(
    frontPageFile,
    /import\s*\{\s*Loader\s*\}\s*from\s*"@react-three\/drei";/,
    'FrontPage should not import Loader from @react-three/drei'
  );

  assert.doesNotMatch(
    frontPageFile,
    /<Loader\b/,
    'FrontPage should not render Loader; RouteLoader already handles app loading'
  );
});
