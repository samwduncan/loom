---
phase: 01-design-system-foundation
plan: 01
subsystem: ui
tags: [vite, react, typescript, tailwind-v4, fonts, eslint, css-custom-properties, oklch]

# Dependency graph
requires: []
provides:
  - Vite + React 19 + TypeScript project scaffold in src-v2/
  - Tailwind v4 CSS-first configuration with @tailwindcss/vite plugin
  - Self-hosted font loading (Inter Variable, Instrument Serif, JetBrains Mono Variable)
  - cn() utility (clsx + tailwind-merge) for className composition
  - Constitution-compliant directory structure
  - ESLint flat config with no-default-exports enforcement
  - CSS entry point with @theme and @theme inline semantic token mapping
  - Placeholder tokens.css for Plan 01-02 to replace
affects: [01-02, 01-03, 02-enforcement, 03-app-shell, all-subsequent-phases]

# Tech tracking
tech-stack:
  added: [vite-7, react-19, typescript-5.9, tailwindcss-4, @tailwindcss/vite, clsx, tailwind-merge, react-router-dom-7, eslint-9, typescript-eslint]
  patterns: [css-first-tailwind, named-exports-only, font-display-swap, oklch-color-tokens, @theme-inline-semantic-mapping]

key-files:
  created:
    - src-v2/vite.config.ts
    - src-v2/src/App.tsx
    - src-v2/src/main.tsx
    - src-v2/src/utils/cn.ts
    - src-v2/src/styles/index.css
    - src-v2/src/styles/base.css
    - src-v2/src/styles/tokens.css
    - src-v2/eslint.config.js
    - src-v2/public/fonts/inter-variable.woff2
    - src-v2/public/fonts/instrument-serif-regular.woff2
    - src-v2/public/fonts/instrument-serif-italic.woff2
    - src-v2/public/fonts/jetbrains-mono-variable.woff2
  modified:
    - src-v2/package.json
    - src-v2/tsconfig.app.json

key-decisions:
  - "React 19 used instead of 18 (Vite template ships 19 now, backwards compatible)"
  - "Placeholder tokens.css created with dark theme defaults for immediate build viability"
  - "ESLint kept react-hooks and react-refresh plugins from Vite scaffold alongside Constitution rules"

patterns-established:
  - "CSS-first Tailwind v4: no tailwind.config.js, all config via @theme and @theme inline in index.css"
  - "Named exports only: ESLint enforces Constitution 2.2 from commit 1"
  - "Font loading: self-hosted woff2 with font-display: swap, variable fonts where available"
  - "Semantic color mapping: @theme inline maps Tailwind utilities to CSS custom properties"
  - "cn() utility: all className composition uses clsx + tailwind-merge"

requirements-completed: [DS-05]

# Metrics
duration: 7min
completed: 2026-03-05
---

# Phase 1 Plan 01: V2 Project Scaffold Summary

**Vite + React 19 + Tailwind v4 CSS-first scaffold with self-hosted Inter/Instrument Serif/JetBrains Mono fonts, cn() utility, and ESLint Constitution enforcement**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-05T00:39:03Z
- **Completed:** 2026-03-05T00:46:47Z
- **Tasks:** 3
- **Files modified:** 28

## Accomplishments
- V2 project bootstrapped in src-v2/ with working Vite dev server, HMR, and backend proxy
- All three font families self-hosted with font-display: swap (Inter Variable 100-900, Instrument Serif regular+italic, JetBrains Mono Variable 100-800)
- Tailwind v4 CSS-first pipeline operational with @theme (static) and @theme inline (semantic) token mapping
- ESLint enforces no-default-exports (Constitution 2.2) from first commit

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold V2 project with Vite + React 18 + TypeScript + Tailwind v4** - `574f760` (feat)
2. **Task 2: Font loading and CSS entry point** - `c89932a` (feat)
3. **Task 3: ESLint skeleton for Constitution enforcement from day one** - `235dec1` (chore)

## Files Created/Modified
- `src-v2/vite.config.ts` - Vite config with React, Tailwind v4 plugin, proxy, @ alias
- `src-v2/tsconfig.app.json` - Strict TS with noUncheckedIndexedAccess, @/* paths
- `src-v2/src/main.tsx` - React 19 createRoot entry, imports styles/index.css
- `src-v2/src/App.tsx` - BrowserRouter with / and /dev/tokens routes (named export)
- `src-v2/src/utils/cn.ts` - clsx + tailwind-merge className composition utility
- `src-v2/src/styles/index.css` - Tailwind v4 entry with @theme and @theme inline
- `src-v2/src/styles/base.css` - @font-face declarations, body reset (14px Inter)
- `src-v2/src/styles/tokens.css` - Placeholder dark theme tokens for build viability
- `src-v2/eslint.config.js` - ESLint flat config with Constitution skeleton rules
- `src-v2/public/fonts/*.woff2` - 4 self-hosted font files

## Decisions Made
- **React 19 instead of 18:** Vite's latest template ships React 19. It is backwards compatible and is the current stable release. No impact on planned architecture.
- **Placeholder tokens.css:** Created minimal dark theme token values so the CSS pipeline works immediately. Plan 01-02 will replace with the full token system.
- **Kept Vite scaffold ESLint plugins:** The react-hooks and react-refresh plugins from the Vite template were preserved alongside Constitution rules for better DX.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate ESLint rule keys in plan**
- **Found during:** Task 3 (ESLint skeleton)
- **Issue:** Plan's ESLint config had duplicate `no-restricted-syntax` keys in the same rules object (only last one wins in JS)
- **Fix:** Consolidated to single `no-restricted-syntax` entry with the default export ban
- **Files modified:** src-v2/eslint.config.js
- **Verification:** `npx eslint src/` runs clean
- **Committed in:** 235dec1

**2. [Rule 3 - Blocking] Created placeholder tokens.css for CSS pipeline**
- **Found during:** Task 1 (Project scaffold)
- **Issue:** index.css imports tokens.css which Plan 01-02 will create, but build fails without it
- **Fix:** Created minimal tokens.css with dark theme CSS custom property defaults
- **Files modified:** src-v2/src/styles/tokens.css
- **Verification:** Dev server starts, Tailwind utilities resolve correctly
- **Committed in:** 574f760

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered
- Font download from GitHub required following redirects and extracting from release archives (not direct woff2 URLs)
- JetBrains Mono only ships variable font as TTF in releases; required woff2_compress conversion
- Instrument Serif download from Google Fonts returned HTML; used @fontsource npm package as fallback

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS entry point ready for Plan 01-02 to replace tokens.css with full OKLCH token system
- Directory structure ready for Plan 01-03 token preview page at /dev/tokens route
- ESLint skeleton ready for Phase 2 enforcement expansion
- All font families loading, ready for typography token definitions

## Self-Check: PASSED

All 13 created files verified present. All 3 task commits (574f760, c89932a, 235dec1) verified in git log.

---
*Phase: 01-design-system-foundation*
*Completed: 2026-03-05*
