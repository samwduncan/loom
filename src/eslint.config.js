import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import loomRules from './eslint-rules/index.js';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint-rules/**', 'e2e/**', 'playwright.config.ts', 'test-results/**', 'playwright-report/**', 'src/components/ui/dialog.tsx', 'src/components/ui/sonner.tsx', 'src/components/ui/dropdown-menu.tsx', 'src/components/ui/tooltip.tsx', 'src/components/ui/badge.tsx', 'src/components/ui/popover.tsx'] },
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
  // Override: Allow setState/getState in test files (Zustand testing requires direct store access)
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'loom/no-external-store-mutation': 'off',
    },
  },
  // Override: Allow getState in init/wiring modules (infrastructure, not components)
  {
    files: ['src/lib/websocket-init.ts'],
    rules: {
      'loom/no-external-store-mutation': 'off',
    },
  },
  // Override: Prevent cross-store imports (Constitution 4.5 — no store-to-store dependencies)
  {
    files: ['src/stores/*.ts'],
    ignores: ['src/stores/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['./*', '@/stores/*'],
          message: 'Store files must not import from other store files (Constitution 4.5). Cross-store orchestration belongs in hooks or event handlers.',
        }],
      }],
    },
  },
);
