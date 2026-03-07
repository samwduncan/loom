# Phase 2: Enforcement + Testing Infrastructure - Research

**Researched:** 2026-03-05
**Domain:** ESLint custom rules, Vitest testing infrastructure, Git pre-commit hooks
**Confidence:** HIGH

## Summary

Phase 2 establishes automated guards that enforce the V2 Constitution at build time. The codebase already has a strong foundation: ESLint 9 flat config is in place with basic rules, TypeScript strict mode is fully configured (ENF-02 is effectively done), and the project structure is clean. The work centers on three pillars: (1) writing custom ESLint rules as a local plugin to catch Constitution-banned patterns, (2) installing Vitest with jsdom + React Testing Library and writing tests for Phase 1 deliverables, and (3) configuring Husky + lint-staged for pre-commit enforcement.

A critical structural challenge: the git repo root is `/home/swd/loom/` (root `package.json` is for the backend), but the V2 frontend lives in `/home/swd/loom/src/` with its own `package.json`. Husky must be installed at the git root, but lint-staged and all linting/testing tools must execute from the `src/` directory context. This requires careful hook scripting that `cd`s into `src/` before running commands, and lint-staged filtering to only process `src/` files.

**Primary recommendation:** Install Husky at repo root, lint-staged in `src/package.json`, custom ESLint rules as a local `eslint-rules/` directory inside `src/`, Vitest 4.x with @vitest/coverage-v8. Pre-commit hook script changes directory to `src/` and runs lint-staged, then full-project `tsc --noEmit`, then `vitest run --coverage`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Minimum coverage threshold: **80% lines/branches**, enforced as a gate
- Coverage gate **blocks commits** if coverage drops below threshold
- Phase 2 tests cover **Phase 1 deliverables only**: tokens.css loading, motion.ts exports, cn() utility, TokenPreview rendering (~5-8 tests)
- Future phase tests come when those phases land -- no stubs or scaffolding for unbuilt code
- GSD executor agents run **full suite** (lint + typecheck + tests) before each commit -- every commit is guaranteed green
- Maximum acceptable pre-commit duration: **30 seconds**
- TypeScript check scope: **full project** (`tsc --noEmit`) -- catches cross-file breakage
- Lint-staged **auto-fixes** fixable issues (unused imports, formatting) and re-stages automatically
- Bypass policy: **non-src commits can skip hooks** (docs, planning files, configs). Source code commits always go through the full gate.
- Pre-commit pipeline: lint staged files (with auto-fix) -> full project typecheck -> affected tests with coverage check
- Inline `style={{}}`: **banned with allowlist**. Allowed properties: width, height, transform, translate, opacity, clip-path. All colors, fonts, spacing, borders must use tokens.
- `any` types: **banned with exception comment** pattern -- `// ANY: [reason]` allows intentional use. Reason must be **10+ characters** and cannot contain placeholder text ("TODO", "fix later", "temp"). No blanket test file exemption.
- Non-null assertions (`!`): **same exception comment pattern** -- `// ASSERT: [reason]` with same 10-char minimum.
- Custom rules: **local plugin in the repo** (e.g., `eslint-rules/` directory). Not a published npm package.
- className concatenation: **must flag** any `BinaryExpression` or `TemplateLiteral` inside a `className` prop that isn't wrapped in `cn()`. String concatenation for classNames is banned.
- External store mutation: **ban `useXStore.setState`** calls in component files. Store mutations must go through store actions only.
- CSS variable shadowing: **ban `:root` variable declarations** using token prefixes (`--surface-*`, `--accent-*`, `--text-*`, `--border-*`, `--z-*`, `--space-*`) outside of `tokens.css`.

### Claude's Discretion
- Exact ESLint rule implementation approach (AST visitors, regex patterns, etc.)
- Vitest configuration details (reporter format, watch mode settings)
- Husky hook scripts and lint-staged config structure
- Which Vitest/RTL versions to pin
- Test file organization (colocated vs. `__tests__/` directory)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENF-01 | Custom ESLint rules enforcing all Constitution banned patterns (hardcoded colors, z-index, className concat, store subscriptions, any/non-null, inline style, default exports) | Local plugin pattern verified; AST visitor approach documented; 10+ rules needed |
| ENF-02 | TypeScript strict mode with noUncheckedIndexedAccess | **Already complete** -- tsconfig.app.json has strict:true, noUncheckedIndexedAccess:true, noUnusedLocals, noUnusedParameters. Only need to verify `tsc --noEmit` passes. |
| ENF-03 | Vitest 4.x + React Testing Library 16.x with jsdom, coverage reporter, tests for Phase 1 deliverables | Vitest 4.0.18 current; RTL 16.3.2 supports React 19; @vitest/coverage-v8 for thresholds |
| ENF-04 | Pre-commit hook via lint-staged + husky blocking bad commits | Husky 9.1.7 at repo root; lint-staged 16.3.2 in src/; hook script with src/ cd pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.0.18 | Test runner | Vite-native, shares config with Vite, Vitest 4.x for Vite 7.x compat |
| @vitest/coverage-v8 | ^4.0.18 | Coverage provider | V8-native, zero-config, fastest option |
| @testing-library/react | ^16.3.2 | Component testing | Standard RTL, supports React 19, user-centric testing |
| @testing-library/jest-dom | ^6.6.3 | DOM matchers | Adds `toBeInTheDocument()`, `toBeVisible()`, etc. to Vitest |
| @testing-library/user-event | ^14.6.1 | Interaction simulation | Constitution requires user-event over fireEvent |
| jsdom | ^26.1.0 | DOM environment | Standard jsdom for Vitest, lighter than happy-dom for our needs |
| husky | ^9.1.7 | Git hooks | De facto standard for git hooks in JS projects |
| lint-staged | ^16.3.2 | Staged file runner | Runs linters only on staged files, auto-stages fixes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/testing-library__jest-dom | N/A | Not needed | jest-dom 6.x ships its own types when using vitest path |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @vitest/coverage-v8 | @vitest/coverage-istanbul | Istanbul is slower but more accurate for edge cases; V8 is sufficient for our needs |
| jsdom | happy-dom | happy-dom is faster but less spec-compliant; jsdom is safer for RTL |
| husky | simple-git-hooks | simpler but lacks ecosystem integration; husky is well-documented |
| lint-staged | nano-staged | nano-staged is faster but less maintained; lint-staged is battle-tested |

**Installation (from `src/` directory):**
```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom lint-staged
```

**Installation (from repo root `/home/swd/loom/`):**
```bash
npm install -D husky
npx husky init
```

## Architecture Patterns

### Critical: Repo Root vs Frontend Directory Structure

```
/home/swd/loom/                  # Git repo root, backend package.json
  .husky/
    pre-commit                    # Husky hook script (runs from repo root)
  package.json                    # Root package.json (backend) -- husky goes here
  src/                            # V2 frontend project
    package.json                  # Frontend package.json -- lint-staged, vitest here
    eslint.config.js              # ESLint flat config with local plugin
    eslint-rules/                 # NEW: Local ESLint plugin directory
      index.js                    # Plugin entry point (exports rules object)
      no-hardcoded-colors.js      # Custom rule
      no-raw-z-index.js           # Custom rule
      no-classname-concat.js      # Custom rule
      ...
    vitest.config.ts              # NEW: Vitest configuration
    vitest-setup.ts               # NEW: Test setup file
    src/
      utils/
        cn.ts
        cn.test.ts                # NEW: Collocated test
      lib/
        motion.ts
        motion.test.ts            # NEW: Collocated test
      styles/
        tokens.css
        tokens.test.ts            # NEW: Token loading test
      components/
        dev/
          TokenPreview.tsx
          TokenPreview.test.tsx    # NEW: Component render test
```

### Pre-commit Hook Architecture

The `.husky/pre-commit` script must handle the split directory structure:

```bash
#!/usr/bin/env sh

# Check if any staged files are in src/ (frontend code)
STAGED_SRC=$(git diff --cached --name-only --diff-filter=ACMR | grep '^src/' || true)

if [ -z "$STAGED_SRC" ]; then
  # No src/ files staged -- skip frontend checks (docs, planning, configs)
  exit 0
fi

# Run lint-staged from the frontend directory
cd src
npx lint-staged

# Full project typecheck
npx tsc -b --noEmit

# Run tests with coverage check
npx vitest run --coverage
```

### ESLint Local Plugin Pattern (Flat Config)

```typescript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import loomRules from './eslint-rules/index.js';

export default tseslint.config(
  // ... existing config ...
  {
    plugins: {
      'loom': loomRules,
    },
    rules: {
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
);
```

### Local Plugin Entry Point

```javascript
// eslint-rules/index.js
import noHardcodedColors from './no-hardcoded-colors.js';
import noRawZIndex from './no-raw-z-index.js';
// ... etc

export default {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-raw-z-index': noRawZIndex,
    // ... etc
  },
};
```

### Anti-Patterns to Avoid
- **Installing Husky in `src/`:** Husky MUST be at the git repo root where `.git/` lives. It modifies `.git/hooks/`.
- **Running `tsc` on staged files only:** TypeScript must check the full project (`tsc --noEmit`) to catch cross-file breakage. Staged-only checks miss broken imports.
- **Using `no-restricted-syntax` for everything:** AST selectors are powerful but limited -- they cannot inspect string content within node values. Complex rules (regex matching in className values, comment pattern validation) require full custom rules with `context.sourceCode`.
- **Snapshot tests for CSS tokens:** Constitution explicitly bans snapshot tests for dynamic content. Token CSS file tests should verify specific property existence, not snapshot the whole file.
- **Blanket test file exemption for `any`:** CONTEXT.md explicitly rejects this. Test files use the same `// ANY: [reason]` pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage thresholds | Custom threshold checker | Vitest `coverage.thresholds` config | Built-in, fails CI automatically |
| Staged file detection | Custom git diff parser | lint-staged | Handles partial staging, stash backup, auto-restaging |
| Git hook installation | Manual `.git/hooks/` script | Husky | Survives `git clean`, team-shareable via `prepare` script |
| DOM matchers | Custom assertion helpers | @testing-library/jest-dom | `toBeInTheDocument()`, `toBeVisible()`, `toHaveClass()` etc. |
| User interaction simulation | `fireEvent` | @testing-library/user-event | Simulates real user behavior (focus, blur, typing sequence) |

**Key insight:** The only things that need custom implementation are the ESLint rules -- these are project-specific to the Constitution and no existing plugin covers the exact pattern set.

## Common Pitfalls

### Pitfall 1: Husky in Monorepo Subdirectory
**What goes wrong:** Husky is installed in `src/` but `.git/` is at the repo root. Hooks never fire.
**Why it happens:** `npx husky init` only works when run from the directory containing `.git/`.
**How to avoid:** Install Husky in root `package.json`. Add a `prepare` script: `"prepare": "husky"`. The pre-commit script then `cd src && npx lint-staged`.
**Warning signs:** `npx husky init` says "not a git repository" or hooks don't trigger on commit.

### Pitfall 2: lint-staged Auto-Fix Re-staging Race
**What goes wrong:** lint-staged auto-fixes a file, re-stages it, but the coverage check runs on the unfixed version.
**Why it happens:** Pipeline ordering matters. lint-staged must complete (including re-staging) before typecheck and tests run.
**How to avoid:** Run lint-staged as the FIRST step in the pre-commit hook. Then run typecheck. Then run tests. Don't put typecheck/tests inside lint-staged config -- put them as separate steps in the hook script.
**Warning signs:** Tests fail on committed code that passes when run manually.

### Pitfall 3: ESLint Flat Config Plugin Registration
**What goes wrong:** Custom rules throw "Definition for rule 'loom/xxx' was not found."
**Why it happens:** In flat config, plugins must be objects with a `rules` property. Not a path string, not a factory function.
**How to avoid:** Export the plugin as `{ rules: { 'rule-name': ruleModule } }`. Register as `plugins: { 'loom': importedPlugin }`.
**Warning signs:** ESLint startup errors mentioning undefined rules.

### Pitfall 4: Vitest Path Alias Resolution
**What goes wrong:** Tests fail with "Cannot find module '@/utils/cn'" even though the app works fine.
**Why it happens:** Vitest needs its own `resolve.alias` configuration or must inherit from `vite.config.ts`.
**How to avoid:** Either define `vitest.config.ts` that imports from `vite.config.ts` using `mergeConfig`, or add the test config directly to `vite.config.ts` with `/// <reference types="vitest/config" />`. The path alias `@` -> `./src` is already in `vite.config.ts` and Vitest will inherit it.
**Warning signs:** Module not found errors in tests only.

### Pitfall 5: Pre-commit Duration Exceeding 30s
**What goes wrong:** Full vitest suite + tsc + lint takes too long, developers bypass with `--no-verify`.
**Why it happens:** Coverage instrumentation adds overhead. Full project typecheck grows with codebase.
**How to avoid:** Use `vitest run --reporter=dot` (minimal output). TypeScript incremental builds (`tsBuildInfoFile` already configured). lint-staged processes only changed files. Consider `vitest run --changed` to only run affected tests.
**Warning signs:** Commit times stretching past 20 seconds.

### Pitfall 6: JSX AST Node Access for Custom Rules
**What goes wrong:** Custom rule visitors for `JSXAttribute` don't fire because ESLint's default parser doesn't understand JSX.
**Why it happens:** The typescript-eslint parser handles JSX, but you need `jsx: true` in parser options (already configured via `tseslint.configs.recommended`).
**How to avoid:** Verify that `tseslint.configs.recommended` includes JSX parsing. Test rules against actual JSX files. The JSX AST nodes are: `JSXAttribute`, `JSXExpressionContainer`, `JSXOpeningElement`, `JSXSpreadAttribute`.
**Warning signs:** Visitor functions never called, rules appear to do nothing.

### Pitfall 7: Coverage Including Test Files
**What goes wrong:** Coverage reports inflated because test files themselves are included in coverage calculation.
**Why it happens:** Default coverage includes everything. Must explicitly exclude test files.
**How to avoid:** Set `coverage.include: ['src/**/*.{ts,tsx}']` and `coverage.exclude: ['**/*.test.{ts,tsx}', '**/vitest-setup.ts']`.
**Warning signs:** 100% coverage on test files, misleading total numbers.

## Code Examples

### Vitest Configuration (vitest.config.ts or in vite.config.ts)

```typescript
// Option A: Add to existing vite.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/vitest-setup.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
      ],
      reporter: ['text', 'text-summary', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  // ... existing server config
});
```

### Vitest Setup File (vitest-setup.ts)

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### TypeScript Config Update for Vitest Types

```json
// tsconfig.app.json -- add vitest globals type
{
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### Example Custom ESLint Rule: no-hardcoded-colors

```javascript
// eslint-rules/no-hardcoded-colors.js
// Bans Tailwind color utilities (bg-gray-800, text-red-500, etc.)
// and hardcoded hex in className (bg-[#1a1a1a])

const TAILWIND_COLOR_PATTERN = /\b(?:bg|text|border|ring|outline|shadow|divide|from|via|to|decoration|accent|caret|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,4}\b/;

const HEX_IN_CLASSNAME_PATTERN = /\b(?:bg|text|border|ring|outline)-\[#[0-9a-fA-F]{3,8}\]/;

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban hardcoded Tailwind color utilities and hex values in className (Constitution 3.1)',
    },
    messages: {
      tailwindColor: 'Hardcoded Tailwind color "{{match}}" is banned. Use semantic tokens (bg-surface-raised, text-foreground, etc.).',
      hexInClass: 'Hardcoded hex "{{match}}" in className is banned. Use CSS custom properties via semantic Tailwind utilities.',
    },
    schema: [],
  },
  create(context) {
    function checkStringForColors(node, value) {
      const tailwindMatch = value.match(TAILWIND_COLOR_PATTERN);
      if (tailwindMatch) {
        context.report({ node, messageId: 'tailwindColor', data: { match: tailwindMatch[0] } });
      }
      const hexMatch = value.match(HEX_IN_CLASSNAME_PATTERN);
      if (hexMatch) {
        context.report({ node, messageId: 'hexInClass', data: { match: hexMatch[0] } });
      }
    }

    return {
      // Check JSX className="..." string literals
      'JSXAttribute[name.name="className"] Literal'(node) {
        if (typeof node.value === 'string') {
          checkStringForColors(node, node.value);
        }
      },
      // Check template literals in className
      'JSXAttribute[name.name="className"] TemplateLiteral TemplateElement'(node) {
        checkStringForColors(node, node.value.raw);
      },
      // Check cn() call arguments
      'CallExpression[callee.name="cn"] Literal'(node) {
        if (typeof node.value === 'string') {
          checkStringForColors(node, node.value);
        }
      },
      'CallExpression[callee.name="cn"] TemplateLiteral TemplateElement'(node) {
        checkStringForColors(node, node.value.raw);
      },
    };
  },
};
```

### Example Custom ESLint Rule: no-classname-concat

```javascript
// eslint-rules/no-classname-concat.js
// Bans string concatenation in className props (Constitution 3.6)
// Must use cn() utility instead

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban string concatenation in className props. Use cn() utility (Constitution 3.6)',
    },
    messages: {
      concat: 'String concatenation in className is banned. Use cn() utility.',
      templateLiteral: 'Template literal in className is banned. Use cn() utility.',
    },
    schema: [],
  },
  create(context) {
    return {
      // className={`...${...}...`} -- template literal directly in className
      'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral'(node) {
        context.report({ node, messageId: 'templateLiteral' });
      },
      // className={"a" + "b"} -- binary expression concatenation
      'JSXAttribute[name.name="className"] > JSXExpressionContainer > BinaryExpression[operator="+"]'(node) {
        context.report({ node, messageId: 'concat' });
      },
    };
  },
};
```

### Example Custom ESLint Rule: no-whole-store-subscription

```javascript
// eslint-rules/no-whole-store-subscription.js
// Bans useXStore() without selector (Constitution 4.2)

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban whole-store Zustand subscriptions. Must use selector (Constitution 4.2)',
    },
    messages: {
      noSelector: 'Whole-store subscription "{{name}}()" is banned. Use a selector: {{name}}(state => state.field).',
    },
    schema: [],
  },
  create(context) {
    const STORE_HOOKS = ['useTimelineStore', 'useStreamStore', 'useUIStore', 'useConnectionStore'];

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          STORE_HOOKS.includes(node.callee.name) &&
          node.arguments.length === 0
        ) {
          context.report({
            node,
            messageId: 'noSelector',
            data: { name: node.callee.name },
          });
        }
      },
    };
  },
};
```

### Husky Pre-commit Hook

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Only run frontend checks if src/ files are staged
STAGED_SRC=$(git diff --cached --name-only --diff-filter=ACMR | grep '^src/' || true)

if [ -z "$STAGED_SRC" ]; then
  echo "No src/ files staged -- skipping frontend checks"
  exit 0
fi

echo "Running pre-commit checks on src/ files..."

# Step 1: lint-staged (auto-fixes and re-stages)
cd src
npx lint-staged --concurrent false

# Step 2: Full project typecheck
echo "Running typecheck..."
npx tsc -b --noEmit

# Step 3: Tests with coverage
echo "Running tests..."
npx vitest run --coverage --reporter=dot
```

### lint-staged Configuration (in src/package.json)

```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

### Example Test: cn() Utility

```typescript
// src/src/utils/cn.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('px-3', 'py-2')).toBe('px-3 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-3', 'px-4')).toBe('px-4');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles empty call', () => {
    expect(cn()).toBe('');
  });
});
```

### Example Test: motion.ts Exports

```typescript
// src/src/lib/motion.test.ts
import { describe, it, expect } from 'vitest';
import {
  SPRING_GENTLE,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  EASING,
  DURATION,
} from './motion';

describe('motion constants', () => {
  it('exports three spring configs with stiffness and damping', () => {
    for (const spring of [SPRING_GENTLE, SPRING_SNAPPY, SPRING_BOUNCY]) {
      expect(spring).toHaveProperty('stiffness');
      expect(spring).toHaveProperty('damping');
      expect(spring.stiffness).toBeGreaterThan(0);
      expect(spring.damping).toBeGreaterThan(0);
    }
  });

  it('SPRING_GENTLE has lowest stiffness', () => {
    expect(SPRING_GENTLE.stiffness).toBeLessThan(SPRING_SNAPPY.stiffness);
    expect(SPRING_GENTLE.stiffness).toBeLessThan(SPRING_BOUNCY.stiffness);
  });

  it('exports CSS easing values as valid cubic-bezier strings', () => {
    for (const value of Object.values(EASING)) {
      expect(value).toMatch(/^cubic-bezier\(.+\)$/);
    }
  });

  it('exports duration values as positive numbers', () => {
    for (const value of Object.values(DURATION)) {
      expect(value).toBeGreaterThan(0);
      expect(typeof value).toBe('number');
    }
  });

  it('duration scale is ordered: fast < normal < slow < spring', () => {
    expect(DURATION.fast).toBeLessThan(DURATION.normal);
    expect(DURATION.normal).toBeLessThan(DURATION.slow);
    expect(DURATION.slow).toBeLessThan(DURATION.spring);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eslintrc.json` | `eslint.config.js` (flat config) | ESLint 9 (2024) | Already using flat config -- good |
| Published ESLint plugins on npm | Local plugins via inline import | ESLint 9 flat config | Can define custom rules without npm publish |
| Jest + Enzyme | Vitest + RTL + user-event | 2023-2024 | Vitest is Vite-native, faster, same API |
| `fireEvent` from RTL | `@testing-library/user-event` | 2022+ | user-event simulates real browser behavior |
| Vitest 3.x | Vitest 4.x | Dec 2025 | Requires Vite >=6.0, Node >=20 (we have both) |
| Husky v4 (complex) | Husky v9 (simple) | 2023 | Simple `.husky/pre-commit` scripts, `prepare` in package.json |
| jest-dom standalone | @testing-library/jest-dom/vitest | 2024 | Built-in Vitest integration, auto-extends expect |

**Deprecated/outdated:**
- Enzyme: Abandoned, incompatible with React 19. Use RTL.
- jest-dom without `/vitest` import: Old approach required manual type extensions.
- Husky v4: Complex `.huskyrc` config. V9 uses simple shell scripts.

## Complete ESLint Rule Inventory

Based on CONTEXT.md decisions and Constitution requirements, here is the full list of custom rules needed:

| Rule Name | Constitution Section | Detection Method | Complexity |
|-----------|---------------------|-----------------|------------|
| `no-hardcoded-colors` | 3.1 | Regex on string values in className/cn() | Medium |
| `no-raw-z-index` | 3.3 | Regex for `z-[number]` and Tailwind `z-N` utilities | Low |
| `no-classname-concat` | 3.6 | AST: BinaryExpression/TemplateLiteral in className | Low |
| `no-whole-store-subscription` | 4.2 | AST: CallExpression with 0 args matching store hook names | Low |
| `no-external-store-mutation` | 4.5 | AST: MemberExpression `.setState` on store identifiers | Low |
| `no-banned-inline-style` | 3.2 | AST: JSXAttribute style prop, check property names against allowlist | Medium |
| `no-any-without-reason` | 5.2 | Extend `@typescript-eslint/no-explicit-any` with comment check | Medium-High |
| `no-non-null-without-reason` | 5.2 | Extend `@typescript-eslint/no-non-null-assertion` with comment check | Medium-High |
| `no-token-shadowing` | CONTEXT.md | CSS file inspection: `:root` with token-prefixed vars outside tokens.css | Medium |

**Rules handled by existing/standard ESLint rules (not custom):**
- Default export ban: Already configured via `no-restricted-syntax` in eslint.config.js
- `prefer-const`: Already configured
- `@typescript-eslint/no-unused-vars`: Already configured (upgrade to error level)

**Approach recommendation for `any`/non-null rules:** Rather than writing rules from scratch, configure `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-non-null-assertion` at error level, then write wrapper custom rules that check for the exception comment pattern (`// ANY: [reason]` / `// ASSERT: [reason]`). The custom rule can use `context.sourceCode.getCommentsBefore()` or check the same line for trailing comments matching the pattern.

## Open Questions

1. **Vitest `--related` in lint-staged**
   - What we know: `vitest related` runs tests related to changed files. This is ideal for pre-commit.
   - What's unclear: Whether `vitest related --run` combined with `--coverage` properly calculates coverage thresholds against the full codebase or only the related tests.
   - Recommendation: Use `vitest run --coverage` in the hook (full suite). With only 5-8 tests in Phase 2, this will complete in under 5 seconds. Revisit `--related` when the test suite grows past 30 seconds.

2. **ESLint rule file format (.js vs .ts)**
   - What we know: ESLint flat config supports ESM imports. The project is `"type": "module"`.
   - What's unclear: Whether eslint-rules can be `.ts` files (ESLint doesn't natively run TS).
   - Recommendation: Write rules as `.js` files with JSDoc type annotations. ESLint loads rules at config time (before any build step), so TypeScript files would need compilation. Plain JS with JSDoc is the standard approach for custom rules.

3. **`tsc -b` vs `tsc --noEmit` for pre-commit**
   - What we know: `tsc -b` uses project references (tsconfig.json references tsconfig.app.json + tsconfig.node.json). `tsc --noEmit` checks a single config.
   - What's unclear: Whether `tsc -b` respects `--noEmit` (it does, documented in TS 5.x).
   - Recommendation: Use `npx tsc -b --noEmit` to check both app and node configs. This catches errors in vite.config.ts as well as app code.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (test block) or `src/vitest.config.ts` |
| Quick run command | `cd src && npx vitest run --reporter=dot` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENF-01 | ESLint rules catch banned patterns | unit | `cd src && npx eslint src/ --max-warnings=0` | N/A (lint, not test) |
| ENF-01 | Custom rules produce errors on violations | unit (rule tests) | `cd src && npx vitest run src/eslint-rules/` | Wave 0 |
| ENF-02 | TypeScript strict mode passes | typecheck | `cd src && npx tsc -b --noEmit` | N/A (compiler check) |
| ENF-03 | Vitest runs with coverage | unit | `cd src && npx vitest run --coverage` | Wave 0 |
| ENF-04 | Pre-commit blocks bad code | integration/manual | Attempt `git commit` with banned pattern | Manual verify |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=dot`
- **Per wave merge:** `cd src && npx vitest run --coverage && npx eslint src/ && npx tsc -b --noEmit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/vitest-setup.ts` -- jest-dom imports, cleanup
- [ ] Vitest config in `src/vite.config.ts` (or separate `src/vitest.config.ts`)
- [ ] `src/src/utils/cn.test.ts` -- cn utility tests
- [ ] `src/src/lib/motion.test.ts` -- motion constants tests
- [ ] `src/src/styles/tokens.test.ts` -- token CSS loading tests
- [ ] `src/src/components/dev/TokenPreview.test.tsx` -- component render test
- [ ] `src/eslint-rules/` directory with all custom rules
- [ ] `.husky/pre-commit` hook script
- [ ] lint-staged config in `src/package.json`
- [ ] npm install for all dev dependencies (vitest, RTL, husky, lint-staged)

## Sources

### Primary (HIGH confidence)
- ESLint official docs: Custom Rules (https://eslint.org/docs/latest/extend/custom-rules) -- rule structure, AST visitors, context API
- ESLint official docs: Configure Plugins (https://eslint.org/docs/latest/use/configure/plugins) -- local plugin pattern for flat config
- ESLint official docs: Selectors (https://eslint.org/docs/latest/extend/selectors) -- AST selector syntax for no-restricted-syntax
- Vitest official docs: Getting Started (https://vitest.dev/guide/) -- Vitest 4.x requires Vite >=6.0, Node >=20
- Vitest official docs: Coverage (https://vitest.dev/guide/coverage) -- v8 provider, reporter config
- Vitest official docs: Coverage Config (https://vitest.dev/config/coverage) -- threshold configuration syntax
- Husky official docs: Get Started (https://typicode.github.io/husky/get-started.html) -- v9 init, prepare script
- lint-staged GitHub (https://github.com/lint-staged/lint-staged) -- config format, auto-staging, glob patterns

### Secondary (MEDIUM confidence)
- npm registry: vitest 4.0.18 (https://www.npmjs.com/package/vitest) -- current version verified
- npm registry: lint-staged 16.3.2 (https://www.npmjs.com/package/lint-staged) -- current version verified
- npm registry: husky 9.1.7 (https://www.npmjs.com/package/husky) -- current version verified
- @testing-library/react 16.3.2 supports React 19 (GitHub issues + npm verified)
- Vitest + RTL + jsdom setup pattern (multiple dev.to articles, consistent approach)

### Tertiary (LOW confidence)
- @testing-library/jest-dom version (6.6.3 cited from search results, verify on install)
- @testing-library/user-event version (14.6.1 cited, verify on install)
- jsdom version (26.1.0 cited, Vitest may bundle its own)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm/official docs, well-established tools
- Architecture: HIGH -- repo structure thoroughly analyzed, monorepo hook pattern well-documented
- ESLint custom rules: HIGH -- flat config local plugin pattern verified against official docs, AST visitor API documented
- Pitfalls: HIGH -- based on verified structural analysis (husky root vs src/) and documented limitations
- Test examples: MEDIUM -- code patterns based on verified API but not yet executed

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days -- stable tools, no fast-moving APIs)
