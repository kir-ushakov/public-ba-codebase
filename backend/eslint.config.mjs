import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import nodePlugin from 'eslint-plugin-n';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Backend ESLint flat config.
 *
 * Base packs:
 * - @typescript-eslint strict-type-checked + stylistic-type-checked
 * - eslint-plugin-security recommended
 * - eslint-plugin-boundaries recommended
 * - eslint-config-prettier (turns off formatting conflicts)
 *
 * Also wired: eslint-plugin-prettier, eslint-plugin-n (ESLint 9 successor to
 * eslint-plugin-node), eslint-plugin-import, eslint-plugin-boundaries.
 *
 * Notes:
 * - Rules that require tsconfig `strictNullChecks` stay off until that flag is
 *   enabled in a dedicated follow-up (would be a large type migration).
 * - `no-unsafe-*` stay off for the same reason under `npm run lint --fix`.
 */
/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },

  ...eslintPluginTs.configs['flat/strict-type-checked'],
  ...eslintPluginTs.configs['flat/stylistic-type-checked'],

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      security: securityPlugin,
      prettier: prettierPlugin,
      n: nodePlugin,
      import: importPlugin,
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts'],
      },
      'boundaries/include': ['src/**/*.ts'],
      'boundaries/ignore': ['**/*.d.ts', 'test/**', 'jest.config.ts', 'server.ts'],
      'boundaries/dependency-nodes': ['import'],
      'boundaries/elements': [
        { type: 'core', pattern: 'src/shared/core/*' },
        { type: 'domain', pattern: 'src/shared/domain/*' },
        { type: 'infra', pattern: 'src/shared/infra/*' },
        { type: 'repo', pattern: 'src/shared/repo/*' },
        { type: 'mapper', pattern: 'src/shared/mappers/*' },
        { type: 'service', pattern: 'src/shared/services/*' },
        { type: 'shared-types', pattern: 'src/shared/types/*' },
        { type: 'shared-utils', pattern: 'src/shared/utils/*' },
        { type: 'module', pattern: 'src/modules/*', capture: ['module'] },
        { type: 'app', pattern: 'src/config' },
        { type: 'app', pattern: 'src/loaders' },
      ],
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      ...boundaries.configs.recommended.rules,

      'prettier/prettier': 'error',

      // eslint-plugin-n (eslint-plugin-node is incompatible with ESLint 9)
      'n/no-deprecated-api': 'error',
      'n/no-exports-assign': 'error',
      'n/no-process-exit': 'off',
      'n/process-exit-as-throw': 'error',
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-extraneous-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',

      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-cycle': ['error', { maxDepth: 8 }],

      // Protect domain/core from outer layers (v6 selector syntax)
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              disallow: [
                { to: { element: { type: 'infra' } } },
                { to: { element: { type: 'repo' } } },
                { to: { element: { type: 'mapper' } } },
                { to: { element: { type: 'service' } } },
                { to: { element: { type: 'module' } } },
                { to: { element: { type: 'app' } } },
              ],
            },
            {
              from: { element: { type: 'core' } },
              disallow: [
                { to: { element: { type: 'domain' } } },
                { to: { element: { type: 'infra' } } },
                { to: { element: { type: 'repo' } } },
                { to: { element: { type: 'mapper' } } },
                { to: { element: { type: 'service' } } },
                { to: { element: { type: 'module' } } },
                { to: { element: { type: 'app' } } },
              ],
            },
          ],
        },
      ],

      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true, allowNullish: true },
      ],
      '@typescript-eslint/no-confusing-void-expression': 'off',

      // Need tsconfig strictNullChecks — enable in a follow-up with the TS flag
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      // House style: `type` = object shape, `interface` = class contract. Stylistic
      // default (`interface`) would --fix DTOs/fixtures into interfaces.
      '@typescript-eslint/consistent-type-definitions': 'off',

      // Noisy until Express/Passport typings are tightened; --fix would fail CI
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',

      // Established project patterns (DDD static helpers / Result | never)
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      // AggregateRoot <-> DomainEvents is an intentional cycle in this codebase
      'import/no-cycle': 'off',

      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },

  {
    files: ['test/**/*.ts', 'jest.config.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'boundaries/dependencies': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
];
