const tsParser = (await import('@typescript-eslint/parser')).default;
const tsPlugin = (await import('@typescript-eslint/eslint-plugin')).default;
const angularPlugin = (await import('@angular-eslint/eslint-plugin')).default;
const angularTemplate = (await import('@angular-eslint/eslint-plugin-template')).default;
const prettierPlugin = (await import('eslint-plugin-prettier')).default;

export default [
  {
    files: ['frontend/src/app/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['frontend/tsconfig.json', 'frontend/e2e/tsconfig.json'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@angular-eslint': angularPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'arrow-body-style': 'off',
      'no-var': 'error', // Enforce let/const usage
      'prefer-const': 'error', // Prefer const for variables that aren't reassigned
      'prefer-arrow-callback': 'error', // Use arrow functions for callbacks
      'prefer-template': 'error', // Use template literals instead of string concatenation
      'no-console': 'warn', // Warn about console.log usage
      'no-debugger': 'error', // Disallow debugger statements
      'no-alert': 'warn', // Warn about alert usage
      'no-implicit-coercion': 'error', // Prevent type coercion
      eqeqeq: ['error', 'always'], // Enforce === and !==
      curly: ['error', 'all'], // Always use curly braces for control statements
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 100],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false,
        },
      ], // Disallow magic numbers
      'prefer-arrow-callback': 'error', // Enforce arrow functions for callbacks
      'consistent-return': 'error', // Enforce consistent return values from functions
      'no-unused-private-class-members': 'error',

      '@typescript-eslint/no-explicit-any': 'error', // Prevent usage of any type
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Unused variables warning
      '@typescript-eslint/consistent-type-imports': 'error', // Consistent imports
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-decorated-field',
            'protected-decorated-field',
            'private-decorated-field',
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            'constructor',
            'public-method',
            'protected-method',
            'private-method',
          ],
        },
      ],
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'warn',

      '@angular-eslint/component-selector': [
        'error',
        { prefix: 'ba', style: 'kebab-case', type: 'element' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { prefix: 'ba', style: 'camelCase', type: 'attribute' },
      ],
      '@angular-eslint/contextual-lifecycle': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/no-inputs-metadata-property': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/no-outputs-metadata-property': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/use-pipe-transform-interface': 'error',

      'prettier/prettier': ['error', { endOfLine: 'auto', printWidth: 100 }],
    },
  },
  {
    files: ['frontend/src/app/**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplate,
      prettier: prettierPlugin,
    },
    rules: {
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      'prettier/prettier': ['error'],
    },
  },
];
