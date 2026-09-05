import path from 'node:path';

function toPosix(filePath) {
  return filePath.replaceAll('\\', '/');
}

function quote(file) {
  return `"${file.replaceAll('"', '\\"')}"`;
}

function prettierFiles(pkgDir, files) {
  const root = process.cwd();
  const relFiles = files
    .map(file => toPosix(path.relative(root, path.resolve(file))))
    .filter(file => file.length > 0 && !file.endsWith('package-lock.json'));
  if (relFiles.length === 0) {
    return [];
  }
  const config = quote(toPosix(path.join(pkgDir, '.prettierrc')));
  return [
    `npx --prefix ${pkgDir} prettier --write --ignore-unknown --no-error-on-unmatched-pattern --config ${config} ${relFiles.map(quote).join(' ')}`,
  ];
}

export default {
  // Prettier only in the hook: safe auto-format. Full ESLint stays in CI (lint:check).
  'frontend/**/*.{ts,js,json,html,scss}': files => prettierFiles('frontend', files),
  'backend/**/*.{ts,js,json}': files => prettierFiles('backend', files),
};
