# Phase 2: Enforcement + Testing Infrastructure - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated guards that block every banned pattern from the V2 Constitution at build time — custom ESLint rules, Vitest setup with coverage, and pre-commit hooks. No hardcoded colors, no whole-store subscriptions, no `any` types, no raw z-index can enter the codebase. TypeScript strict mode is already configured from Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Test coverage expectations
- Minimum coverage threshold: **80% lines/branches**, enforced as a gate
- Coverage gate **blocks commits** if coverage drops below threshold
- Phase 2 tests cover **Phase 1 deliverables only**: tokens.css loading, motion.ts exports, cn() utility, TokenPreview rendering (~5-8 tests)
- Future phase tests come when those phases land — no stubs or scaffolding for unbuilt code
- GSD executor agents run **full suite** (lint + typecheck + tests) before each commit — every commit is guaranteed green

### Pre-commit configuration
- Maximum acceptable pre-commit duration: **30 seconds**
- TypeScript check scope: **full project** (`tsc --noEmit`) — catches cross-file breakage
- Lint-staged **auto-fixes** fixable issues (unused imports, formatting) and re-stages automatically
- Bypass policy: **non-src commits can skip hooks** (docs, planning files, configs). Source code commits always go through the full gate.
- Pre-commit pipeline: lint staged files (with auto-fix) → full project typecheck → affected tests with coverage check

### ESLint rule edge cases
- Inline `style={{}}`: **banned with allowlist**. Allowed properties: width, height, transform, translate, opacity, clip-path (dynamic layout/animation only). All colors, fonts, spacing, borders must use tokens.
- `any` types: **banned with exception comment** pattern — `// ANY: [reason]` allows intentional use. Reason must be **10+ characters** and cannot contain placeholder text ("TODO", "fix later", "temp"). Tracks every instance. No blanket test file exemption.
- Non-null assertions (`!`): **same exception comment pattern** — `// ASSERT: [reason]` with same 10-char minimum. Consistent with `any` handling.
- Custom rules: **local plugin in the repo** (e.g., `eslint-rules/` directory). Not a published npm package. Rules are project-specific to the Constitution.
- className concatenation: **must flag** any `BinaryExpression` or `TemplateLiteral` inside a `className` prop that isn't wrapped in `cn()`. String concatenation for classNames is banned (Constitution).
- External store mutation: **ban `useXStore.setState`** calls in component files (Constitution 4.5). Store mutations must go through store actions only.
- CSS variable shadowing: **ban `:root` variable declarations** using token prefixes (`--surface-*`, `--accent-*`, `--text-*`, `--border-*`, `--z-*`, `--space-*`) outside of `tokens.css`. Prevents foundation rot via local shadowing.

### Claude's Discretion
- Exact ESLint rule implementation approach (AST visitors, regex patterns, etc.)
- Vitest configuration details (reporter format, watch mode settings)
- Husky hook scripts and lint-staged config structure
- Which Vitest/RTL versions to pin
- Test file organization (colocated vs. `__tests__/` directory)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/eslint.config.js`: ESLint skeleton already exists with flat config format, typescript-eslint, react-hooks, react-refresh, default export ban, prefer-const
- `src/tsconfig.app.json`: Already has strict: true, noUncheckedIndexedAccess, noUnusedLocals, noUnusedParameters — ENF-02 is effectively done
- `src/src/utils/cn.ts`: clsx + tailwind-merge utility — existing tests should cover this

### Established Patterns
- ESLint flat config format (not legacy `.eslintrc`) — new rules must use this format
- TypeScript project references (tsconfig.json → tsconfig.app.json + tsconfig.node.json)
- Tailwind v4 CSS-first configuration — no tailwind.config.js to lint against
- tsconfig.app.json already has `incremental: true` via tsBuildInfoFile — enables fast `tsc --noEmit` in pre-commit as codebase grows

### Integration Points
- Custom ESLint rules need to inspect JSX className attributes and style props
- Pre-commit hooks need to work with GSD's commit tooling (`gsd-tools.cjs commit`)
- Vitest needs path alias resolution matching `@/*` → `./src/*` from tsconfig

</code_context>

<specifics>
## Specific Ideas

- Exception comment pattern is consistent across `any` and non-null assertions: `// ANY: [reason]` and `// ASSERT: [reason]` — searchable, greppable, auditable
- Pre-commit auto-fix means developers (and GSD agents) never get blocked on trivial formatting issues
- 80% coverage is the floor, not the ceiling — quality phases may push higher naturally
- Full project typecheck on every commit prevents the "works on my file" class of cross-file type breakage

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-enforcement-testing-infrastructure*
*Context gathered: 2026-03-05*
