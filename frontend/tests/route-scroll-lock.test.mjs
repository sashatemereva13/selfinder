import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexPath = resolve('src/index.jsx');
const indexFile = readFileSync(indexPath, 'utf8');

test('App should not enforce route-based body scroll locks', () => {
  assert.doesNotMatch(indexFile, /function\s+RouteScrollPolicy\s*\(/, 'RouteScrollPolicy should be removed');
  assert.doesNotMatch(indexFile, /sf-routeScrollLocked/, 'Route-based body lock class should not be toggled');
  assert.doesNotMatch(indexFile, /useLocation/, 'useLocation should not be imported for route scroll lock policy');
});
