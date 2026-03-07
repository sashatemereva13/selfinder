import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexPath = resolve('src/index.jsx');
const trackerComponentPath = resolve('src/tracking/UserPathTracker.jsx');
const trackerModulePath = resolve('src/tracking/userPathTracker.js');
const indexFile = readFileSync(indexPath, 'utf8');

test('User path tracking files exist', () => {
  assert.equal(existsSync(trackerComponentPath), true, 'Missing src/tracking/UserPathTracker.jsx');
  assert.equal(existsSync(trackerModulePath), true, 'Missing src/tracking/userPathTracker.js');
});

test('App integrates entry gate + route path tracking', () => {
  assert.match(indexFile, /import\s+UserPathTracker\s+from\s+"\.\/tracking\/UserPathTracker(\.jsx)?";/, 'Missing UserPathTracker import in index.jsx');
  assert.match(indexFile, /import\s*\{\s*appendPathStep\s*\}\s+from\s+"\.\/tracking\/userPathTracker";/, 'Missing appendPathStep import in index.jsx');
  assert.match(indexFile, /appendPathStep\(\{\s*path:\s*"\/entry-gate"/, 'EntryGate path should be tracked');
  assert.match(indexFile, /<UserPathTracker\s*\/>/, 'UserPathTracker should run inside Router');
});
