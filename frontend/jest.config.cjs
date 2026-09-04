const { createCjsPreset } = require('jest-preset-angular/presets');

const presetConfig = createCjsPreset({
  tsconfig: '<rootDir>/tsconfig.spec.json',
});

/** @type {import('jest').Config} */
module.exports = {
  ...presetConfig,
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/e2e/', '<rootDir>/e2e-live/'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@angular/common/locales/.*\\.js$|uuid|mime))',
  ],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
