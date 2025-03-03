import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import securityPlugin from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';
import nodePlugin from 'eslint-plugin-n';

export function createConfig(svelteConfig) {
  return ts.config(
    {
      plugins: {
        svelte: svelte,
        security: securityPlugin,
        sonarjs: sonarjs,
        unicorn: unicorn,
        promise: promise,
        n: nodePlugin
      }
    },
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
        // TypeScript rules
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/ban-ts-comment': 'warn',
        'no-empty': 'warn',
        'no-case-declarations': 'warn',

        // Security rules
        'security/detect-object-injection': 'error',
        'security/detect-non-literal-regexp': 'error',
        'security/detect-unsafe-regex': 'error',
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'error',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-possible-timing-attacks': 'error',
        'security/detect-pseudoRandomBytes': 'error',

        // SonarJS rules for code smells and bugs
        'sonarjs/no-duplicate-string': 'error',
        'sonarjs/cognitive-complexity': ['error', 15],
        'sonarjs/no-identical-functions': 'error',

        // Unicorn rules for better practices
        'unicorn/prevent-abbreviations': 'off', // This one can be too aggressive
        'unicorn/filename-case': ['error', { case: 'kebabCase' }],
        'unicorn/no-null': 'off', // TypeScript handles null checks well

        // Promise rules
        'promise/always-return': 'error',
        'promise/no-callback-in-promise': 'warn',

        // Node.js rules
        'n/no-deprecated-api': 'error',
        'n/no-missing-import': 'off', // TypeScript handles this
        'n/no-unpublished-import': 'off' // TypeScript handles this
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
