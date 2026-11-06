const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// `prepare` runs when backend or frontend installs this package via file:.
// On a clean CI checkout, tsc is not on PATH yet, but the app's typescript
// package is already unpacked under that app's node_modules.
const candidates = [
  path.join(root, 'node_modules/typescript/lib/tsc.js'),
  path.join(root, '../backend/node_modules/typescript/lib/tsc.js'),
  path.join(root, '../frontend/node_modules/typescript/lib/tsc.js'),
];

const tsc = candidates.find(candidate => fs.existsSync(candidate));
if (!tsc) {
  console.error(
    'typescript was not found. Install dependencies in contracts, backend, or frontend.',
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [tsc, '-p', root], { stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
