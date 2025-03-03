import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export function createConfig(svelteConfig) {
  return ts.config(
    {
      ignores: [
        '**/dist/**',
        '**/node_modules/**',
        '**/.svelte-kit/**',
        '**/.vercel/**',
        'eslint.config.js',
        'svelte.config.js'
      ]
    },
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
    prettier,
    ...svelte.configs['flat/prettier'],
    {
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node
        }
      }
    },
    {
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-unused-expressions': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/ban-ts-comment': 'warn',
        'no-empty': 'warn',
        'no-case-declarations': 'warn'
      }
    },
    {
      files: ['**/*.cjs'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off'
      }
    },
    {
      files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
      languageOptions: {
        parserOptions: {
          projectService: true,
          extraFileExtensions: ['.svelte'],
          parser: ts.parser,
          svelteConfig
        }
      }
    }
  );
}

// Default config using empty svelte config
export const config = createConfig({});

export default createConfig;
