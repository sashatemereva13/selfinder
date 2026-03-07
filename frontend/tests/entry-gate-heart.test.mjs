import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const componentPath = resolve('src/entryGate/EntryGate.jsx');
const cssPath = resolve('src/entryGate/EntryGate.css');

const componentFile = readFileSync(componentPath, 'utf8');
const cssFile = readFileSync(cssPath, 'utf8');

test('EntryGate renders glossy heart with dual orbit rings and beads', () => {
  assert.match(componentFile, /className=\"entryGateHeart\"/, 'Missing entryGateHeart root');
  assert.match(componentFile, /className=\"entryGateHeartField\"/, 'Missing heart field emitter');
  assert.match(componentFile, /className=\"entryGateHeartOuter\"/, 'Missing entryGateHeartOuter element');
  assert.match(componentFile, /className=\"entryGateHeartInner\"/, 'Missing entryGateHeartInner element');
  assert.match(componentFile, /className=\"entryGateHeartGlow\"/, 'Missing entryGateHeartGlow element');
  assert.match(componentFile, /className=\"entryGateHeartParticles\"/, 'Missing heart particle layer');
  assert.match(componentFile, /Array\.from\(\{ length:\s*10 \}\)/, 'Expected 10 heart particles');
  assert.match(componentFile, /className=\"entryGateOrbit entryGateOrbitA\"/, 'Missing first orbit ring');
  assert.match(componentFile, /className=\"entryGateOrbit entryGateOrbitB\"/, 'Missing second orbit ring');
  assert.match(componentFile, /className=\"entryGateOrbitBeads\"/, 'Missing orbit beads container');
  assert.match(componentFile, /Array\.from\(\{ length:\s*8 \}\)/, 'Expected 8 orbit beads');
});

test('EntryGate includes heart/orbit styles and spin animation', () => {
  assert.match(cssFile, /\.entryGate\s*\{[\s\S]*animation:\s*entryGateWorldBreath\s+4\.8s\s+ease-in-out\s+infinite;/, 'Environment should breathe with heart pulse');
  assert.match(cssFile, /\.entryGateHeart\s*\{/, 'Missing .entryGateHeart styles');
  assert.match(cssFile, /\.entryGateHeartField\s*\{[\s\S]*animation:\s*entryGateHeartPulse\s+4\.8s\s+ease-in-out\s+infinite;/, 'Heart field should pulse from heart');
  assert.match(cssFile, /\.entryGateHeartOuter\s*\{/, 'Missing .entryGateHeartOuter styles');
  assert.match(cssFile, /\.entryGateHeartInner\s*\{/, 'Missing .entryGateHeartInner styles');
  assert.match(cssFile, /\.entryGateHeartParticle\s*\{/, 'Missing heart particle style');
  assert.match(cssFile, /@keyframes\s+entryGateParticleOrbit\s*\{/, 'Missing particle orbit keyframes');
  assert.match(cssFile, /\.entryGateText::before\s*\{[\s\S]*animation:\s*entryGateTextHeartGlow\s+4\.8s\s+ease-in-out\s+infinite;/, 'Text glow should be heart-synced');
  assert.match(cssFile, /@keyframes\s+entryGateWorldBreath\s*\{/, 'Missing environment breathing keyframes');
  assert.match(cssFile, /@keyframes\s+entryGateTextHeartGlow\s*\{/, 'Missing text-heart glow keyframes');
  assert.match(cssFile, /\.entryGateOrbit\s*\{/, 'Missing .entryGateOrbit styles');
  assert.match(cssFile, /\.entryGateOrbitBead\s*\{/, 'Missing .entryGateOrbitBead styles');
  assert.match(cssFile, /--entry-bead-radius:\s*3\.8rem;/, 'Orbit beads should use a larger radius');
  assert.match(cssFile, /animation:\s*entryGateBeadOrbit\s+11\.4s\s+linear\s+infinite;/, 'Beads should orbit around heart center');
  assert.match(cssFile, /@keyframes\s+entryGateHeartFloat\s*\{/, 'Missing heart float animation');
  assert.match(
    cssFile,
    /@keyframes\s+entryGateHeartFloat[\s\S]*rotateY\(28deg\)[\s\S]*rotateY\(200deg\)[\s\S]*rotateY\(388deg\)/,
    'Heart should turn on Y axis over time'
  );
  assert.match(
    cssFile,
    /@keyframes\s+entryGateHeartFloat[\s\S]*rotateZ\(90deg\)/,
    'Heart should include a 90deg Z-axis turn'
  );
  assert.match(cssFile, /@keyframes\s+entryGateOrbitSpin\s*\{/, 'Missing orbit spin animation');
  assert.match(
    cssFile,
    /@keyframes\s+entryGateBeadOrbit[\s\S]*rotate\([^)]*360deg[^)]*\)/,
    'Missing full bead orbit keyframes'
  );
});
