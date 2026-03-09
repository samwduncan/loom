---
phase: 11-markdown-code-blocks-ui-primitives
plan: 01
subsystem: ui
tags: [shadcn, radix-ui, react-markdown, shiki, tailwind-v4, oklch, design-tokens]

requires:
  - phase: 01-design-system-foundation
    provides: OKLCH tokens in tokens.css, @theme inline mappings, cn() utility

provides:
  - 9 shadcn/ui primitives restyled to OKLCH tokens (dialog, tooltip, scroll-area, collapsible, sonner, dropdown-menu, badge, separator, kbd)
  - react-markdown, remark-gfm, rehype-raw, shiki npm packages
  - components.json for shadcn CLI integration
  - lib/utils.ts re-export for shadcn compatibility
  - tw-animate-css for shadcn animation classes
  - Additional @theme inline token mappings (card, popover, accent-foreground, input)

affects: [11-02, 11-03, 12-chat-message-components, 13-tool-call-rendering, 14-composer-input-system]

tech-stack:
  added: [react-markdown@10.1.0, remark-gfm@4.0.1, rehype-raw@7.0.0, shiki@3.23.0, class-variance-authority, lucide-react, tw-animate-css, radix-ui, sonner]
  patterns: [shadcn-oklch-restyling, z-index-token-mapping]

key-files:
  created:
    - src/components.json
    - src/src/components/ui/dialog.tsx
    - src/src/components/ui/tooltip.tsx
    - src/src/components/ui/scroll-area.tsx
    - src/src/components/ui/collapsible.tsx
    - src/src/components/ui/sonner.tsx
    - src/src/components/ui/dropdown-menu.tsx
    - src/src/components/ui/badge.tsx
    - src/src/components/ui/separator.tsx
    - src/src/components/ui/kbd.tsx
    - src/src/lib/utils.ts
  modified:
    - src/package.json
    - src/src/styles/index.css

key-decisions:
  - "Hardcoded dark theme in sonner instead of next-themes (no Next.js in project)"
  - "Created lib/utils.ts re-export rather than changing components.json utils alias"
  - "Used z-[var(--z-overlay)] for dialog overlay, z-[var(--z-modal)] for dialog content, z-[var(--z-dropdown)] for dropdowns and tooltips"
  - "Removed Button dependency from DialogFooter since button component is not yet installed"
  - "Added 7 new @theme inline token mappings for shadcn compatibility (card, popover, accent-foreground, destructive-foreground, input)"

patterns-established:
  - "shadcn z-index override: Replace z-50 with z-[var(--z-*)] referencing design token tier"
  - "shadcn import fix: All components import cn from @/utils/cn, with @/lib/utils re-export for future shadcn additions"
  - "sonner OKLCH theming: CSS variables --normal-bg/text/border map to OKLCH design tokens"

requirements-completed: [DEP-01, DEP-02, UI-01, UI-02, UI-03]

duration: 7min
completed: 2026-03-07
---

# Phase 11 Plan 01: Dependencies & UI Primitives Summary

**Installed react-markdown/shiki/remark-gfm/rehype-raw, initialized shadcn/ui with 9 primitives restyled to OKLCH tokens with z-index design token enforcement**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-07T16:56:07Z
- **Completed:** 2026-03-07T17:02:40Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- All 4 markdown/syntax deps installed (react-markdown, remark-gfm, rehype-raw, shiki)
- shadcn/ui initialized with components.json, 8 primitives generated + 1 custom Kbd
- Every shadcn component restyled: zero HSL colors, zero raw z-index values, all OKLCH tokens
- Added 7 missing semantic token mappings to @theme inline for full shadcn compatibility
- All 386 existing tests pass, TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps + init shadcn** - deps already committed in prior 11-02 work (d565304, 02b66ef); components.json committed with component restyling
2. **Task 2: Restyle components + create Kbd** - `66b8c90` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/components.json` - shadcn/ui configuration with project path aliases
- `src/src/components/ui/dialog.tsx` - Modal dialog with z-[var(--z-modal)] overlay
- `src/src/components/ui/tooltip.tsx` - Tooltip with z-[var(--z-dropdown)]
- `src/src/components/ui/dropdown-menu.tsx` - Context/dropdown menu with z-[var(--z-dropdown)]
- `src/src/components/ui/scroll-area.tsx` - Custom scroll area with bg-border thumb
- `src/src/components/ui/collapsible.tsx` - Headless collapsible (Radix re-export)
- `src/src/components/ui/sonner.tsx` - Toast notifications with OKLCH token vars
- `src/src/components/ui/badge.tsx` - Badge with CVA variants
- `src/src/components/ui/separator.tsx` - Horizontal/vertical separator
- `src/src/components/ui/kbd.tsx` - Custom keyboard shortcut hint component
- `src/src/lib/utils.ts` - Re-export of cn() for shadcn compatibility
- `src/src/styles/index.css` - Added tw-animate-css import + 7 new token mappings
- `src/package.json` - Added all dependencies

## Decisions Made
- Hardcoded `theme="dark"` in sonner.tsx instead of using next-themes (project is not Next.js)
- Created `lib/utils.ts` re-export file rather than changing components.json utils alias -- cleaner for future shadcn additions
- Mapped z-index tiers: dialog overlay -> `--z-overlay` (40), dialog content -> `--z-modal` (50), dropdown/tooltip -> `--z-dropdown` (20)
- Removed `showCloseButton` prop and Button import from DialogFooter since Button component is not installed yet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed sonner importing from itself and next-themes**
- **Found during:** Task 2 (component restyling)
- **Issue:** Generated sonner.tsx imported `Toaster` from `@/components/ui/sonner` (itself) and `useTheme` from `next-themes` (not installed)
- **Fix:** Rewrote to import directly from `sonner` package, hardcoded dark theme
- **Files modified:** src/src/components/ui/sonner.tsx
- **Verification:** TypeScript compiles clean
- **Committed in:** 66b8c90

**2. [Rule 1 - Bug] Fixed dialog importing non-existent Button component**
- **Found during:** Task 2 (component restyling)
- **Issue:** dialog.tsx imported `Button` from `@/components/ui/button` which doesn't exist
- **Fix:** Removed Button import and showCloseButton prop from DialogFooter
- **Files modified:** src/src/components/ui/dialog.tsx
- **Verification:** TypeScript compiles clean
- **Committed in:** 66b8c90

**3. [Rule 3 - Blocking] shadcn CLI created literal `@/` directory**
- **Found during:** Task 1 (shadcn init)
- **Issue:** `npx shadcn add` created components in `src/@/components/ui/` instead of resolving the `@` alias
- **Fix:** Moved files to `src/src/components/ui/` and removed empty `@/` directory
- **Files modified:** File locations corrected
- **Verification:** All imports resolve, tsc passes
- **Committed in:** 66b8c90

**4. [Rule 1 - Bug] Missing React import in collapsible.tsx**
- **Found during:** Task 2 (component restyling)
- **Issue:** collapsible.tsx used `React.ComponentProps` without importing React
- **Fix:** Added `import * as React from "react"`, removed unnecessary "use client" directive
- **Files modified:** src/src/components/ui/collapsible.tsx
- **Committed in:** 66b8c90

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered
- Pre-commit hook blocked initial commit attempt because ESLint caught raw z-index (`z-50`) in generated components -- resolved by restyling before committing
- Dependencies (react-markdown, shiki, etc.) were already installed and committed in prior 11-02 work, so Task 1 package changes were already in HEAD

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 9 UI primitives available for Plans 02 and 03
- react-markdown, shiki, remark-gfm, rehype-raw ready for MarkdownRenderer (Plan 03)
- Shiki singleton already exists from prior 11-02 work (shiki-highlighter.ts, shiki-theme.ts)
- tw-animate-css imported for shadcn animation classes

---
*Phase: 11-markdown-code-blocks-ui-primitives*
*Completed: 2026-03-07*
