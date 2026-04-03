import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const componentPath = resolve('src/entryGate/EntryGate.jsx');
const cssPath = resolve('src/entryGate/EntryGate.css');

const componentFile = readFileSync(componentPath, 'utf8');
const cssFile = readFileSync(cssPath, 'utf8');

test('EntryGate renders simplified center core visual', () => {
  assert.match(componentFile, /className=\"entryGateHeart\"/, 'Missing entryGateHeart root');
  assert.match(componentFile, /className=\"entryGateCoreField\"/, 'Missing entryGateCoreField element');
  assert.match(componentFile, /className=\"entryGateCoreRing\"/, 'Missing entryGateCoreRing element');
  assert.match(componentFile, /className=\"entryGateCore\"/, 'Missing entryGateCore element');
});

test('EntryGate includes simplified core styles and motion', () => {
  assert.match(cssFile, /\.entryGate\s*\{[\s\S]*animation:\s*entryGateWorldBreath\s+4\.8s\s+ease-in-out\s+infinite;/, 'Environment should breathe with heart pulse');
  assert.match(cssFile, /\.entryGateHeart\s*\{/, 'Missing .entryGateHeart styles');
  assert.match(cssFile, /\.entryGateCoreField\s*\{/, 'Missing .entryGateCoreField styles');
  assert.match(cssFile, /\.entryGateCoreRing\s*\{/, 'Missing .entryGateCoreRing styles');
  assert.match(cssFile, /\.entryGateCore\s*\{/, 'Missing .entryGateCore styles');
  assert.match(cssFile, /animation:\s*entryGateCorePulse\s+3\.8s\s+ease-in-out\s+infinite;/, 'Core should pulse');
  assert.match(cssFile, /\.entryGateText::before\s*\{[\s\S]*animation:\s*entryGateTextHeartGlow\s+4\.8s\s+ease-in-out\s+infinite;/, 'Text glow should be heart-synced');
  assert.match(cssFile, /@keyframes\s+entryGateWorldBreath\s*\{/, 'Missing environment breathing keyframes');
  assert.match(cssFile, /@keyframes\s+entryGateTextHeartGlow\s*\{/, 'Missing text-heart glow keyframes');
  assert.match(cssFile, /@keyframes\s+entryGateCoreFloat\s*\{/, 'Missing core float animation');
  assert.match(cssFile, /@keyframes\s+entryGateCorePulse\s*\{/, 'Missing core pulse animation');
  assert.match(cssFile, /@keyframes\s+entryGateCoreRingPulse\s*\{/, 'Missing ring pulse animation');
});
