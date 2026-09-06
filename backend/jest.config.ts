import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^.*/integrations/google/services/index\\.js$':
      '<rootDir>/test/__mocks__/google-drive-services.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // uuid ships ESM-only; Jest must transform it (same idea as frontend jest.config).
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    'node_modules[/\\\\]uuid[/\\\\].+\\.js$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  // createApp() leaves open handles (session / Passport); exit after the suite.
  forceExit: true,
};

export default config;
