import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export const config = [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    plugins: {
      import: importPlugin
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        extraFileExtensions: ['.svelte']
      }
    }
  },
  {
    ignores: [
      '**/postcss.config.cjs',
      '**/tailwind.config.js',
      '**/eslint.config.js',
      '**/vite.config.ts',
      '**/svelte.config.js',
      '**/playwright.config.ts',
      '**/vitest.config.ts',
      '**/drizzle.config.ts'
    ]
  },
  {
    files: ['**/*.svelte'],
    ignores: ['.svelte-kit/*'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    },
    rules: {
      // Disable TypeScript-specific rules for Svelte files
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.svelte'],
    rules: {
      // Strict TypeScript rules
      // Temporarily disable strict rules until TS version is fixed
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type'
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          pathGroups: [
            {
              pattern: '@testing-library/**',
              group: 'external',
              position: 'before'
            },
            {
              pattern: 'vitest/**',
              group: 'external',
              position: 'after'
            }
          ]
        }
      ],
      'import/no-unresolved': 'off', // Turn off until module resolution is fixed
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
    rules: {
      // Relaxed rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off'
    },
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  {
    // Enforce import boundaries between packages
    files: ['apps/**/*.ts', 'apps/**/*.svelte'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message:
                'Please use package imports instead of relative paths across package boundaries'
            }
          ]
        }
      ]
    }
  }
];
