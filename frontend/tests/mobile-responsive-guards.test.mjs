import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const entryGateCss = readFileSync(resolve('src/entryGate/EntryGate.css'), 'utf8');
const measureCss = readFileSync(resolve('src/measure/measure.css'), 'utf8');
const lunarCss = readFileSync(resolve('src/lunarCalendar/LunarCalendar.css'), 'utf8');
const tuneCss = readFileSync(resolve('src/tunein/frequencyPlayer.css'), 'utf8');
const levelsCss = readFileSync(resolve('src/levels/levels.css'), 'utf8');

test('Page-level containers allow vertical scrolling on mobile content overflow', () => {
  assert.match(entryGateCss, /\.entryGate\s*\{[\s\S]*overflow-x:\s*hidden;[\s\S]*overflow-y:\s*auto;/, 'entryGate should allow vertical scroll');
  assert.match(measureCss, /\.measure-page\s*\{[\s\S]*overflow-x:\s*hidden;[\s\S]*overflow-y:\s*auto;/, 'measure page should allow vertical scroll');
  assert.match(lunarCss, /\.lunarCalendar\s*\{[\s\S]*overflow-x:\s*hidden;[\s\S]*overflow-y:\s*auto;/, 'lunar calendar should allow vertical scroll');
});

test('Lunar top comment has safer mobile width', () => {
  assert.match(lunarCss, /\.luneComment\s*\{[\s\S]*width:\s*min\(560px,\s*calc\(100vw\s*-\s*1\.5rem\)\);/, 'luneComment width should be mobile-safe');
});

test('TuneIn mobile orb canvas height is constrained for controls visibility', () => {
  assert.match(tuneCss, /@media\s*\(max-width:\s*640px\)[\s\S]*\.orbContainer\s*\{[\s\S]*min-height:\s*300px;/, 'orb container should reduce min-height on mobile');
  assert.match(tuneCss, /@media\s*\(max-width:\s*640px\)[\s\S]*\.orbContainer\s+canvas\s*\{[\s\S]*height:\s*min\(340px,\s*42vh\)\s*!important;/, 'orb canvas should use tighter mobile height');
});

test('Levels back button uses safe-area-aware mobile offset', () => {
  assert.match(levelsCss, /@media\s*\(max-width:\s*768px\)[\s\S]*\.backButton\s*\{[\s\S]*top:\s*calc\(env\(safe-area-inset-top,\s*0px\)\s*\+\s*0\.55rem\);/, 'backButton should be safe-area-aware on mobile');
});
