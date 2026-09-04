'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PUBLIC_API_SHAPE } = require('../dist/public-api.shape.js');

test('public API shape matches the committed snapshot', () => {
  const snapshotPath = path.join(__dirname, 'public-api.shape.json');
  const expected = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  assert.deepEqual(
    PUBLIC_API_SHAPE,
    expected,
    'DTO keys or enum wire values changed. If this is intentional and backward-compatible for cached PWAs, update test/public-api.shape.json. Removing fields or renaming enum values is a breaking change.',
  );
});
