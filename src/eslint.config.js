import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import loomRules from './eslint-rules/index.js';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint-rules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'loom': loomRules,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // React hooks rules
      ...reactHooks.configs.recommended.rules,

      // React refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Constitution Section 2.2: Named exports only
      'no-restricted-syntax': ['error', {
        selector: 'ExportDefaultDeclaration',
        message: 'Default exports are banned (Constitution 2.2). Use named exports.',
      }],

      // Prefer const
      'prefer-const': 'error',

      // No unused vars (Phase 2: error level)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Constitution custom rules — all at ERROR level
      'loom/no-hardcoded-colors': 'error',
      'loom/no-raw-z-index': 'error',
      'loom/no-classname-concat': 'error',
      'loom/no-whole-store-subscription': 'error',
      'loom/no-external-store-mutation': 'error',
      'loom/no-banned-inline-style': 'error',
      'loom/no-any-without-reason': 'error',
      'loom/no-non-null-without-reason': 'error',
      'loom/no-token-shadowing': 'error',
    },
  },
  // Override: Allow default exports in route/page files (Constitution 2.2 exception for React.lazy)
  {
    files: ['src/**/pages/**/*.tsx', 'src/**/routes/**/*.tsx', 'src/**/pages/**/*.ts', 'src/**/routes/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
);
