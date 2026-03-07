import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const messagePath = resolve('src/frontpage/Message.jsx');
const cssPath = resolve('src/buttons3D/FeelingLuckyButton.css');

const messageFile = readFileSync(messagePath, 'utf8');
const cssFile = readFileSync(cssPath, 'utf8');

test('Message modal root supports typo-safe class for styling', () => {
  assert.match(
    messageFile,
    /className=\"messageModal\s+messsageModal\"/,
    'Message modal should include both messageModal and messsageModal classes'
  );
});

test('Modal CSS styles both correct and typo-safe modal class names', () => {
  assert.match(
    cssFile,
    /\.messageModal,\s*\n\.messsageModal\s*\{/,
    'Expected combined modal selector for .messageModal and .messsageModal'
  );
});

test('Overlay fade animation has corresponding keyframes', () => {
  assert.match(cssFile, /animation:\s*fadeIn\s+0\.6s\s+ease;/, 'Overlay should animate with fadeIn');
  assert.match(cssFile, /@keyframes\s+fadeIn\s*\{/, 'Missing @keyframes fadeIn');
});
