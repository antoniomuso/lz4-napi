import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/**',
      '.yarn/**',
      'target/**',
      'npm/**',
      'artifacts/**',
      'dist/**',
      'index.js',
      'index.d.ts',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'space-before-function-paren': 0,
      'no-useless-constructor': 0,
      'no-undef': 2,
      'no-console': [2, { allow: ['error', 'warn', 'info', 'assert'] }],
      'comma-dangle': ['error', 'only-multiline'],
      'no-unused-vars': 0,
      'no-var': 2,
      'one-var-declaration-per-line': 2,
      'prefer-const': 2,
      'no-const-assign': 2,
      'no-duplicate-imports': 2,
      'no-use-before-define': [2, { functions: false, classes: false }],
      eqeqeq: [2, 'always', { null: 'ignore' }],
      'no-case-declarations': 0,
      'no-empty': 0,
      'no-restricted-syntax': [
        2,
        {
          selector:
            'BinaryExpression[operator=/(==|===|!=|!==)/][left.raw=true], BinaryExpression[operator=/(==|===|!=|!==)/][right.raw=true]',
          message: "Don't compare for equality against boolean literals",
        },
      ],
      'import/no-duplicates': 2,
      'import/first': 2,
      'import/newline-after-import': 2,
      'import/order': [
        2,
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
        extraFileExtensions: ['.mjs'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      'no-undef': 0,
      'no-redeclare': 0,
      'no-useless-constructor': 0,
      'no-dupe-class-members': 0,
      'no-case-declarations': 0,
      'no-duplicate-imports': 0,
      'no-use-before-define': 0,
      'no-unused-vars': [2, { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      '@typescript-eslint/adjacent-overload-signatures': 2,
      '@typescript-eslint/await-thenable': 2,
      '@typescript-eslint/consistent-type-assertions': 2,
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'no-public',
            constructors: 'no-public',
            methods: 'no-public',
            properties: 'no-public',
            parameterProperties: 'explicit',
          },
        },
      ],
      '@typescript-eslint/method-signature-style': 2,
      '@typescript-eslint/no-floating-promises': 2,
      '@typescript-eslint/no-implied-eval': 2,
      '@typescript-eslint/no-for-in-array': 2,
      '@typescript-eslint/no-inferrable-types': 2,
      '@typescript-eslint/no-invalid-void-type': 2,
      '@typescript-eslint/no-misused-new': 2,
      '@typescript-eslint/no-misused-promises': 2,
      '@typescript-eslint/no-namespace': 2,
      '@typescript-eslint/no-non-null-asserted-optional-chain': 2,
      '@typescript-eslint/only-throw-error': 2,
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 2,
      '@typescript-eslint/prefer-for-of': 2,
      '@typescript-eslint/prefer-nullish-coalescing': 2,
      '@typescript-eslint/switch-exhaustiveness-check': 2,
      '@typescript-eslint/prefer-optional-chain': 2,
      '@typescript-eslint/prefer-readonly': 2,
      '@typescript-eslint/prefer-string-starts-ends-with': 0,
      '@typescript-eslint/no-array-constructor': 2,
      '@typescript-eslint/require-await': 2,
      '@typescript-eslint/return-await': 2,
      '@typescript-eslint/ban-ts-comment': [
        2,
        { 'ts-expect-error': false, 'ts-ignore': true, 'ts-nocheck': true, 'ts-check': false },
      ],
      '@typescript-eslint/naming-convention': [
        2,
        {
          selector: 'memberLike',
          format: ['camelCase', 'PascalCase'],
          modifiers: ['private'],
          leadingUnderscore: 'forbid',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        2,
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/member-ordering': [
        2,
        {
          default: [
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-static-method',
            'protected-static-method',
            'private-static-method',
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],
    },
  },
  prettier,
]
