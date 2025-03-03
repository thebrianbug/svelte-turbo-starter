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
        ...globals.node,
        process: true
      },
      parserOptions: {
        // Optimize performance by being explicit about tsconfig paths
        project: true,
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
      '**/drizzle.config.ts',
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/.vercel/**',
      '**/output/**'
    ]
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    },
    rules: {
      // Svelte-specific TypeScript rules
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/promise-function-async': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.svelte'],
    rules: {
      // TypeScript rules
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: true,
          allowNumber: true,
          allowNullableObject: true,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false
        }
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false
        }
      ],
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // Import rules
      'import/no-unresolved': 'off', // Disable in favor of TypeScript's module resolution
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
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'import/no-mutable-exports': 'error'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
    rules: {
      // Relaxed rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
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
