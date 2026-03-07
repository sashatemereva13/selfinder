import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const modalPath = resolve('src/levels/LevelModal.jsx');
const modalFile = readFileSync(modalPath, 'utf8');

test('LevelModal is portaled to document.body to avoid offset fixed overlay', () => {
  assert.match(
    modalFile,
    /import\s*\{\s*createPortal\s*\}\s*from\s*"react-dom";/,
    'LevelModal should import createPortal'
  );

  assert.match(
    modalFile,
    /createPortal\([\s\S]*document\.body\s*\)/,
    'LevelModal should render into document.body'
  );
});
