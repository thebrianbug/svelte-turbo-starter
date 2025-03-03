import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import turbo from 'eslint-config-turbo';

export const config = [
  // Base configs
  js.configs.recommended,
  ...ts.configs.recommended,
  ...ts.configs.strictTypeChecked,
  ...svelte.configs['flat/recommended'],
  turbo, // Adds Turborepo-specific rules
  prettier, // Disables ESLint rules that conflict with Prettier

  // Plugin configurations
  {
    plugins: {
      import: importPlugin
    }
  },

  // Global settings
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        process: true
      },
      parserOptions: {
        project: true,
        extraFileExtensions: ['.svelte']
      }
    }
  },

  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
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

  // Svelte files configuration
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.svelte'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Import rules - simplified but keeping essential ones
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
          alphabetize: { order: 'asc' }
        }
      ],
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error'
    }
  },

  // Test files configuration
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off'
    },
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
];
