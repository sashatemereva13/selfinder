import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexJsxPath = resolve('src/index.jsx');
const entryGatePath = resolve('src/frontpage/EntryGate.jsx');
const indexHtmlPath = resolve('src/index.html');
const apiBaseUrlPath = resolve('src/api/baseUrl.js');
const authContextPath = resolve('src/auth/AuthContext.jsx');
const chatApiPath = resolve('src/guide/chatApi.js');
const personalSpacePath = resolve('src/space/PersonalSpace.jsx');
const philosopherBadgePath = resolve('src/designElements/PhilosopherBadge.jsx');
const journeyLinesPath = resolve('src/content/journeyLines.js');

const indexJsx = readFileSync(indexJsxPath, 'utf8');
const entryGate = readFileSync(entryGatePath, 'utf8');
const indexHtml = readFileSync(indexHtmlPath, 'utf8');
const apiBaseUrl = readFileSync(apiBaseUrlPath, 'utf8');
const authContext = readFileSync(authContextPath, 'utf8');
const chatApi = readFileSync(chatApiPath, 'utf8');
const personalSpace = readFileSync(personalSpacePath, 'utf8');
const philosopherBadge = readFileSync(philosopherBadgePath, 'utf8');
const journeyLines = readFileSync(journeyLinesPath, 'utf8');

test('Tracker import is explicit to avoid case-insensitive resolver collisions', () => {
  assert.match(
    indexJsx,
    /import\s+UserPathTracker\s+from\s+"\.\/tracking\/UserPathTracker\.jsx";/,
    'UserPathTracker import should use explicit .jsx extension'
  );
});

test('EntryGate keeps heart visual outside paragraph semantics', () => {
  assert.match(entryGate, /<\/header>[\s\S]*?<div\s+className=\{`entryGateHeart/, 'Heart visual should render outside the text header block');
  assert.doesNotMatch(
    entryGate,
    /<p\b[^>]*>[\s\S]*?<div\s+className=\{`entryGateHeart[\s\S]*?<\/p>/,
    'Heart visual should not be nested inside a paragraph'
  );
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

test('frontend API calls use the shared environment-aware base URL', () => {
  assert.match(apiBaseUrl, /VITE_API_BASE_URL/, 'API helper should support VITE_API_BASE_URL');
  assert.match(apiBaseUrl, /window\.location\.hostname/, 'API helper should derive the dev host from the current location');

  for (const file of [authContext, chatApi, personalSpace, philosopherBadge, journeyLines]) {
    assert.doesNotMatch(file, /http:\/\/localhost:3001/, 'Feature files should not hardcode the backend URL');
  }
});

test('index.html does not request Panchang from Google Fonts', () => {
  assert.doesNotMatch(indexHtml, /family=Panchang/, 'Panchang should load from local assets, not Google Fonts');
});
