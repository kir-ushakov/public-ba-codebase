import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      security: securityPlugin,
    },
    rules: {
      ...eslintPluginTs.configs.recommended.rules,
      ...securityPlugin.configs.recommended.rules,
      ...prettierConfig.rules, // <- This fixes the original problem

      '@typescript-eslint/no-namespace': 'off',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },
];
