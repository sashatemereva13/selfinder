import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const componentPath = resolve('src/frontpage/EntryGate.jsx');
const cssPath = resolve('src/frontpage/EntryGate.css');

const componentFile = readFileSync(componentPath, 'utf8');
const cssFile = readFileSync(cssPath, 'utf8');

test('EntryGate renders philosopher orb selection visuals', () => {
  assert.match(componentFile, /className=\{`entryGatePhiloGrid \$\{nudge \? "is-nudge" : ""\}`\}/, 'Missing philosopher grid root');
  assert.match(componentFile, /className=\"entryGatePhiloOrbField\"/, 'Missing orb field element');
  assert.match(componentFile, /className=\"entryGatePhiloOrbRing\"/, 'Missing orb ring element');
  assert.match(componentFile, /className=\"entryGatePhiloOrbCore\"/, 'Missing orb core element');
});

test('EntryGate includes orb styles and selection motion', () => {
  assert.match(cssFile, /\.entryGatePhiloGrid\s*\{/, 'Missing .entryGatePhiloGrid styles');
  assert.match(cssFile, /\.entryGatePhiloOrbField\s*\{/, 'Missing .entryGatePhiloOrbField styles');
  assert.match(cssFile, /\.entryGatePhiloOrbRing\s*\{/, 'Missing .entryGatePhiloOrbRing styles');
  assert.match(cssFile, /\.entryGatePhiloOrbCore\s*\{/, 'Missing .entryGatePhiloOrbCore styles');
  assert.match(cssFile, /animation:\s*entryGatePhiloOrbPulse\s+3\.8s\s+ease-in-out\s+infinite;/, 'Selected orb field should pulse');
  assert.match(cssFile, /\.entryGatePhiloOrbWrap\s*\{[\s\S]*animation:\s*entryGatePhiloOrbFloat\s+5\.8s\s+ease-in-out\s+infinite;/, 'Orb visual should float');
  assert.match(cssFile, /@keyframes\s+entryGatePhiloOrbFloat\s*\{/, 'Missing orb float animation');
  assert.match(cssFile, /@keyframes\s+entryGatePhiloOrbPulse\s*\{/, 'Missing orb pulse animation');
  assert.match(cssFile, /@keyframes\s+entryGatePhiloOrbRingPulse\s*\{/, 'Missing orb ring pulse animation');
});
