import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexJsxPath = resolve('src/index.jsx');
const entryGatePath = resolve('src/entryGate/EntryGate.jsx');
const indexHtmlPath = resolve('src/index.html');

const indexJsx = readFileSync(indexJsxPath, 'utf8');
const entryGate = readFileSync(entryGatePath, 'utf8');
const indexHtml = readFileSync(indexHtmlPath, 'utf8');

test('Tracker import is explicit to avoid case-insensitive resolver collisions', () => {
  assert.match(
    indexJsx,
    /import\s+UserPathTracker\s+from\s+"\.\/tracking\/UserPathTracker\.jsx";/,
    'UserPathTracker import should use explicit .jsx extension'
  );
});

test('EntryGate keeps heart visual outside paragraph semantics', () => {
  assert.match(entryGate, /<p\s+className=\"entryGateText\">/, 'EntryGate text paragraph missing');
  assert.match(entryGate, /<\/p>\s*\n\s*<div\s+className=\"entryGateHeart\"/, 'Heart should render after paragraph closes');
});

test('index.html includes share/seo metadata expected for submission', () => {
  assert.match(indexHtml, /<meta\s+name=\"description\"\s+content=/, 'Missing meta description');
  assert.match(indexHtml, /<meta\s+property=\"og:title\"\s+content=/, 'Missing og:title');
  assert.match(indexHtml, /<meta\s+property=\"og:description\"\s+content=/, 'Missing og:description');
  assert.match(indexHtml, /<meta\s+property=\"og:image\"\s+content=/, 'Missing og:image');
  assert.match(indexHtml, /<meta\s+name=\"twitter:card\"\s+content=/, 'Missing twitter:card');
  assert.match(indexHtml, /<link\s+rel=\"canonical\"\s+href=/, 'Missing canonical URL');
});

test('index.html includes local font preload hints', () => {
  assert.match(indexHtml, /rel=\"preload\"\s+href=\"\/fontsCSS\/Panchang-Light\.woff2\"\s+as=\"font\"/, 'Missing Panchang-Light preload');
  assert.match(indexHtml, /rel=\"preload\"\s+href=\"\/fontsCSS\/Panchang-Medium\.woff2\"\s+as=\"font\"/, 'Missing Panchang-Medium preload');
});
