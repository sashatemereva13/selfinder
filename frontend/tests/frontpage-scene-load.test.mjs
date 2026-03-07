import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontPagePath = resolve('src/FrontPage.jsx');
const frontPageFile = readFileSync(frontPagePath, 'utf8');

test('FrontPage keeps route loader visible until scene assets finish loading', () => {
  assert.match(
    frontPageFile,
    /import\s*\{\s*useProgress\s*\}\s*from\s*"@react-three\/drei";/,
    'FrontPage should use Drei loading progress'
  );

  assert.match(
    frontPageFile,
    /import\s+RouteLoader\s+from\s+"\.\/designElements\/RouteLoader";/,
    'FrontPage should reuse RouteLoader for scene loading state'
  );

  assert.match(
    frontPageFile,
    /\{\s*!sceneReady\s*&&\s*<RouteLoader\s*\/>\s*\}/,
    'FrontPage should render RouteLoader until sceneReady'
  );
});
