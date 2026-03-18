# Phase 44: Foundation - Research

**Researched:** 2026-03-18
**Domain:** Settings refactor, dead UI cleanup, CSS spring token generation
**Confidence:** HIGH

## Summary

Phase 44 is a housekeeping phase with three independent tracks: (1) landing a settings data hook refactor, (2) removing dead UI from the codebase, and (3) generating CSS `linear()` spring easing tokens. The critical finding is that **FOUND-01 work is approximately 90% complete** -- the WIP files already contain a generic `useFetch<T>` hook, discriminated union `ModalState`, and deep-merge persist in connection store. What remains is committing that work, verifying edge cases, and minor cleanup.

For FOUND-03 (spring tokens), the `spring-easing` npm package provides a `CSSSpringEasing` function that takes spring physics parameters (mass, stiffness, damping, velocity) and outputs a tuple of `[linear() easing string, computed duration]`. This maps directly to the project's existing `SPRING_GENTLE`, `SPRING_SNAPPY`, and `SPRING_BOUNCY` configs. A build-time script (or one-shot generation) produces the CSS custom properties -- no runtime dependency needed.

**Primary recommendation:** Split into two plans: Plan 01 lands the WIP settings refactor + dead UI removal (mostly done, needs commit + verification). Plan 02 generates spring tokens via `spring-easing` and adds them to tokens.css.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Settings refactor: generic `useFetch<T>`, connection store deep merge persist, ModalState discriminated union | WIP changes already implement all three. See "WIP Analysis" section for detailed status. |
| FOUND-02 | Remove all dead UI: no placeholder fields, fake data, or unused controls | Dead UI inventory identified: PanelPlaceholder (unused), PlaceholderView (unused), removed density display, removed defaultModel from AgentsTab. See "Dead UI Inventory". |
| FOUND-03 | CSS spring tokens from existing spring configs as `linear()` values in tokens.css | `spring-easing` npm package maps directly. See "CSS Spring Token Generation" section. |
</phase_requirements>

## WIP Analysis (CRITICAL -- Work Already Done)

The git working tree shows 16 modified files implementing FOUND-01. All 49 settings tests pass. Here is the precise status of each change:

### FOUND-01: Settings Refactor -- COMPLETE in WIP

| Change | File(s) | Status | Notes |
|--------|---------|--------|-------|
| Generic `useFetch<T>` hook | `useSettingsData.ts` | DONE | Eliminates ~120 lines of duplicated fetch/abort/state logic. `useApiKeys`, `useCredentials`, `useGitConfig` now delegate to `useFetch<T>`. `useAgentStatuses` and `useMcpServers` keep inline logic (Promise.all / response transform). |
| `ModalState` discriminated union | `types/ui.ts` | DONE | Changed from `{ type: string; props: Record<string, unknown> }` to `{ type: 'settings'; initialTab?: SettingsTabId }`. Future modal types are added as union members. |
| `initialTab` support in SettingsModal | `SettingsModal.tsx` | DONE | Reads `modalState.initialTab`, uses as `defaultValue` with `key` prop for re-mount on tab change. |
| Connection store deep merge persist | `stores/connection.ts` | DONE | Added `merge` function that spreads persisted `modelId` over current state defaults, preventing partialize from clobbering ephemeral fields. Also fixed `reconnectAttempts` nullish coalescing. |
| Removed fake `defaultModel` field | `types/settings.ts`, `AgentsTab.tsx`, `useSettingsData.ts` | DONE | `PROVIDER_DEFAULT_MODELS` map and `defaultModel` field deleted. These were client-side fake data not backed by API. |
| Removed density display | `AppearanceTab.tsx` | DONE | Read-only density label removed (non-functional, no setter). |
| Fixed code font CSS quoting | `AppearanceTab.tsx` | DONE | Multi-word font names now wrapped in quotes for `--font-code`. |
| `useEffect` deps fix | `AppearanceTab.tsx` | DONE | Removed `// eslint-disable-line` suppression; effect now depends on `[theme.fontSize, theme.codeFontFamily]`. |
| CredentialsSection loading state | `CredentialsSection.tsx` | DONE | Changed `if (isLoading) return null` to `return <SettingsTabSkeleton />`. |
| McpTab prop drilling | `McpTab.tsx` | DONE | `ProviderSection` now receives data as props instead of calling hooks internally. |
| SettingsTabSkeleton cleanup | `SettingsTabSkeleton.tsx` | DONE | Removed unnecessary `cn()` wrapping of static class strings. |
| AgentsTab error state | `AgentsTab.tsx` | DONE | Added error display with retry button (was missing). |
| McpTab text-size fix | `McpTab.tsx` | DONE | Changed `text-[10px]` to `text-xs` (Constitution compliance). |
| ApiKeysTab date fix | `ApiKeysTab.tsx` | DONE | `Math.max(0, ...)` prevents negative day counts. |
| Test updates | 4 test files | DONE | All 49 tests pass. |

**What remains for FOUND-01:** Commit the WIP changes and verify with lint + TypeScript check.

### FOUND-02: Dead UI Removal -- PARTIALLY DONE in WIP

The WIP already removed:
- `defaultModel` fake data from AgentsTab (client-side labels not backed by API)
- Density read-only display from AppearanceTab (no setter, non-functional)

**Additional dead UI to remove (not yet in WIP):**

| Item | File | Evidence | Action |
|------|------|----------|--------|
| `PanelPlaceholder` component | `content-area/view/PanelPlaceholder.tsx` | Zero imports anywhere in codebase (was for unbuilt panels, all panels now exist) | Delete file |
| `PlaceholderView` component | `shared/PlaceholderView.tsx` + test | Only imported by its own test file. Route placeholders replaced by real views in M1/M2. | Delete both files |

**Items that are NOT dead UI (keep):**
- `BinaryPlaceholder` -- actively used by CodeEditor for binary files
- `SettingsTabSkeleton` -- actively used as loading state
- `GitPanelSkeleton` -- actively used as loading state
- `ProofOfLife` -- dev route, intentionally kept
- `TokenPreview` -- dev route, intentionally kept
- `density` field in `ThemeConfig` type -- data model field, used by store even if no UI control yet

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Zustand | ^5.0.11 | State management with persist middleware | Installed |
| Vitest | 4.0.18 | Test framework | Installed |
| TypeScript | ~5.9.3 | Type checking | Installed |

### New Dependency
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| spring-easing | ^2.3.3 | Generate CSS `linear()` values from spring physics | Dev dependency for one-shot token generation script |

**Installation:**
```bash
cd src && npm install -D spring-easing
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `spring-easing` npm | Hand-roll spring solver | spring-easing is 3KB, well-tested, handles edge cases (settling detection, duration calc). Hand-rolling a spring ODE solver for a one-shot script is wasteful. |
| `spring-easing` npm | Online generator (kvin.me/css-springs) | Online generators use perceptual duration/bounce, not stiffness/damping. Our configs already use stiffness/damping. |
| Build-time script | Runtime generation | Runtime is unnecessary overhead. These values are static constants. Generate once, paste into tokens.css. |

## CSS Spring Token Generation (FOUND-03)

### How `linear()` Spring Easing Works

The CSS `linear()` function accepts a list of comma-separated values (typically 30-80 points) that define an easing curve. For spring physics, a simulator samples the spring at discrete time intervals, producing values that overshoot and settle. Browser support: 96%+ (Chrome 113+, Firefox 112+, Safari 17.2+).

### Mapping Project Springs to `spring-easing`

The project's `motion.ts` defines springs as `{ stiffness, damping, mass? }`. The `spring-easing` library uses `spring(mass, stiffness, damping, velocity)`:

| Project Config | spring-easing Parameter | Value |
|---------------|------------------------|-------|
| `SPRING_GENTLE` | `spring(1, 120, 14, 0)` | Sidebar slide, panel transitions |
| `SPRING_SNAPPY` | `spring(1, 300, 20, 0)` | Button press, toggle snap |
| `SPRING_BOUNCY` | `spring(1, 180, 12, 0)` | Playful entrance, notification pop |

Default mass is 1 (project configs omit it), velocity is 0 (starting from rest).

### Generation Approach

**Recommended: One-shot Node script as devDependency**

```typescript
// scripts/generate-spring-tokens.ts (or .mjs)
import { CSSSpringEasing } from 'spring-easing';

const springs = {
  gentle: 'spring(1, 120, 14, 0)',
  snappy: 'spring(1, 300, 20, 0)',
  bouncy: 'spring(1, 180, 12, 0)',
};

for (const [name, easing] of Object.entries(springs)) {
  const [easingStr, duration] = CSSSpringEasing({
    easing,
    numPoints: 64,    // Good balance of accuracy vs. CSS size
    decimal: 3,
    quality: 0.9,
  });
  console.log(`--ease-spring-${name}: linear(${easingStr});`);
  console.log(`--duration-spring-${name}: ${duration}ms;`);
}
```

Run once, paste output into `tokens.css`. No build pipeline changes needed.

### Expected Output Format (in tokens.css)

```css
/* -- Spring Easing Tokens (generated from motion.ts configs) -- */
--ease-spring-gentle: linear(0, 0.009, 0.035, ...);  /* ~64 points */
--duration-spring-gentle: 800ms;
--ease-spring-snappy: linear(0, 0.022, 0.082, ...);
--duration-spring-snappy: 500ms;
--ease-spring-bouncy: linear(0, 0.012, 0.046, ...);
--duration-spring-bouncy: 700ms;
```

### Integration with Existing Token System

The new tokens sit alongside existing motion tokens in `tokens.css`:

```css
/* Existing (keep) */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Legacy approximation */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--duration-spring: 500ms;

/* New (add) */
--ease-spring-gentle: linear(...);
--duration-spring-gentle: ...ms;
--ease-spring-snappy: linear(...);
--duration-spring-snappy: ...ms;
--ease-spring-bouncy: linear(...);
--duration-spring-bouncy: ...ms;
```

The `--ease-spring` cubic-bezier can be kept for backward compatibility or replaced. Phase 47 (Spring Physics) will consume the new tokens.

### Tailwind v4 Integration

Tailwind v4 reads CSS custom properties from `@theme` directives. The new tokens can be exposed via `index.css`:

```css
@theme inline {
  --ease-spring-gentle: var(--ease-spring-gentle);
  /* etc. */
}
```

Or consumed directly in `transition-timing-function: var(--ease-spring-gentle)` without Tailwind utility classes.

## Architecture Patterns

### Pattern 1: Generic Fetch Hook with Mutation Composition
**What:** A single `useFetch<T>(url, initial)` handles fetch lifecycle (abort, loading, error, refetch). Domain hooks compose it with mutations.
**When to use:** Any settings tab that fetches from a single endpoint.
**Already implemented in WIP.**

### Pattern 2: Discriminated Union Modal State
**What:** `ModalState = { type: 'settings'; initialTab?: SettingsTabId } | { type: 'confirm-delete'; ... }` instead of `{ type: string; props: Record<string, unknown> }`.
**When to use:** Type-safe modal dispatching. Each modal type has its own typed props.
**Already implemented in WIP.**

### Pattern 3: Deep Merge Persist
**What:** Zustand persist `merge` function that spreads persisted partial state over current defaults, preventing rehydration from clobbering ephemeral fields.
**When to use:** Any store where `partialize` saves a subset of a nested object.
**Already implemented in WIP for connection store.**

### Anti-Patterns to Avoid
- **Don't add spring-easing as a runtime dependency.** It's only needed for one-shot generation. Install as devDependency, run script, paste output, done.
- **Don't delete files that look unused without checking imports and tests.** `BinaryPlaceholder` looks like a "placeholder" but is actively used.
- **Don't modify the `--ease-spring` cubic-bezier token.** Other components may reference it. Add new tokens alongside, deprecate later.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring ODE solver for CSS | Custom RK4 integrator | `spring-easing` CSSSpringEasing | Handles settling detection, duration calculation, `linear()` formatting. 3KB dev dep. |
| Generic fetch with abort | Copy-paste per hook | `useFetch<T>` (already in WIP) | 5 hooks shared the same 30-line pattern. |

## Common Pitfalls

### Pitfall 1: Zustand Persist Rehydration Clobbering
**What goes wrong:** `partialize` saves `{ providers: { claude: { modelId } } }`. On rehydration, the shallow merge replaces the full `providers` object, losing `status`, `reconnectAttempts`, `error`.
**Why it happens:** Zustand's default merge is shallow (`Object.assign`).
**How to avoid:** Custom `merge` function that deep-spreads persisted partial over current defaults. **Already fixed in WIP.**
**Warning signs:** Store fields reset to `undefined` after page refresh.

### Pitfall 2: linear() Browser Support Fallback
**What goes wrong:** `linear()` is not supported in older Safari versions (< 17.2, released Dec 2023).
**Why it happens:** The function is relatively new (CSS Easing Level 2).
**How to avoid:** Keep the existing `--ease-spring: cubic-bezier(...)` as fallback. Components can use `transition-timing-function: var(--ease-spring-gentle, var(--ease-spring))` for graceful degradation.
**Warning signs:** Animations snap instantly on older browsers.

### Pitfall 3: spring-easing Parameter Order
**What goes wrong:** Project configs use `{ stiffness, damping }` but `spring-easing` expects `spring(mass, stiffness, damping, velocity)` -- mass comes FIRST.
**Why it happens:** Different conventions. Framer Motion uses `{ stiffness, damping, mass }`, spring-easing uses positional args.
**How to avoid:** Map explicitly: `spring(${mass ?? 1}, ${stiffness}, ${damping}, 0)`.

### Pitfall 4: Deleting "Placeholder" Files That Are Active
**What goes wrong:** `BinaryPlaceholder` or `SettingsTabSkeleton` get deleted because the name contains "placeholder".
**Why it happens:** Grep for "placeholder" returns both dead and active files.
**How to avoid:** Always verify zero imports before deleting. `BinaryPlaceholder` IS actively imported by `CodeEditor.tsx`.

## Code Examples

### Generic Fetch Hook (already in WIP)
```typescript
// Source: src/src/hooks/useSettingsData.ts (WIP)
function useFetch<T>(url: string, initial: T) {
  const [state, setState] = useState<FetchState<T>>({ data: initial, isLoading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    apiFetch<T>(url, {}, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setState({ data, isLoading: false, error: null }); })
      .catch((err) => { if (!controller.signal.aborted) setState((prev) => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Fetch failed' })); });
  }, [url]);

  useEffect(() => { refetch(); return () => { abortRef.current?.abort(); }; }, [refetch]);
  return { ...state, refetch };
}
```

### Spring Token Generation Script
```typescript
// Source: Derived from spring-easing docs + project motion.ts configs
import { CSSSpringEasing } from 'spring-easing';

const SPRINGS = {
  gentle: { mass: 1, stiffness: 120, damping: 14 },
  snappy: { mass: 1, stiffness: 300, damping: 20 },
  bouncy: { mass: 1, stiffness: 180, damping: 12 },
} as const;

for (const [name, { mass, stiffness, damping }] of Object.entries(SPRINGS)) {
  const [easing, duration] = CSSSpringEasing({
    easing: `spring(${mass}, ${stiffness}, ${damping}, 0)`,
    numPoints: 64,
    decimal: 3,
    quality: 0.9,
  });
  console.log(`  --ease-spring-${name}: linear(${easing});`);
  console.log(`  --duration-spring-${name}: ${duration}ms;`);
}
```

### Discriminated Union ModalState (already in WIP)
```typescript
// Source: src/src/types/ui.ts (WIP)
export type ModalState =
  | { type: 'settings'; initialTab?: SettingsTabId };
// Future: | { type: 'confirm-delete'; targetId: string; targetName: string }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cubic-bezier()` spring approximation | `linear()` with sampled spring curve | CSS Easing Level 2, browsers Dec 2023+ | True spring overshoot/settle in pure CSS |
| Framer Motion LazyMotion for springs | CSS `linear()` + `transition` | 2024-2025 trend | Zero JS runtime cost for spring animations |
| `{ type: string; props: Record<string, unknown> }` | Discriminated unions | TypeScript best practice | Compile-time exhaustiveness checking |

## Open Questions

1. **numPoints calibration**
   - What we know: 64 points is a common recommendation, ~800 bytes per token
   - What's unclear: Whether 32 points would be visually indistinguishable for these specific springs
   - Recommendation: Generate at 64, visually inspect. If 32 looks identical, reduce to save ~400 bytes per token. Total CSS overhead is small either way (~2.4KB for 3 tokens at 64 points).

2. **Keep or replace `--ease-spring` cubic-bezier**
   - What we know: It's used as `transition-timing-function` in some components
   - What's unclear: How many components reference it directly
   - Recommendation: Keep it. Phase 47 can migrate consumers to the new tokens.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Generic useFetch hook, ModalState union, connection store deep merge | unit | `cd src && npx vitest run src/hooks/useSettingsData.test.ts src/components/settings/ src/stores/ui.test.ts -x` | Yes (all pass in WIP) |
| FOUND-02 | No dead UI visible | manual-only | Visual inspection after file deletion | N/A -- verify deleted files have no imports |
| FOUND-03 | Spring CSS tokens exist and parse | unit | `cd src && npx vitest run src/lib/motion.test.ts -x` | Partially -- motion.test.ts exists but needs spring token validation |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/motion.test.ts` -- Add test verifying `--ease-spring-gentle`, `--ease-spring-snappy`, `--ease-spring-bouncy` are valid `linear()` values (or verify in tokens.test.ts)
- [ ] Verify `PanelPlaceholder` and `PlaceholderView` deletion doesn't break any imports

## Sources

### Primary (HIGH confidence)
- Project source code -- direct file reads of all 16 modified WIP files
- Vitest test execution -- 49/49 settings tests pass
- Git diff analysis -- complete change inventory

### Secondary (MEDIUM confidence)
- [spring-easing v2.3.3 docs](https://spring-easing.okikio.dev/functions/cssspringeasing) -- CSSSpringEasing API, parameter format
- [Josh W. Comeau: Springs and Bounces in Native CSS](https://www.joshwcomeau.com/animation/linear-timing-function/) -- linear() fundamentals, browser support
- [Chrome Developers: CSS linear() easing](https://developer.chrome.com/docs/css-ui/css-linear-easing-function) -- Spec reference, browser support data
- [pqina.nl: CSS Spring Animation with linear()](https://pqina.nl/blog/css-spring-animation-with-linear-easing-function/) -- Stiffness/damping approach validation

### Tertiary (LOW confidence)
- [kvin.me CSS Spring Generator](https://www.kvin.me/css-springs) -- Visual reference for spring curves (uses perceptual params, not directly usable)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new runtime dependencies, spring-easing is dev-only
- Architecture: HIGH -- WIP code already implements all patterns, verified with passing tests
- Pitfalls: HIGH -- identified from direct code analysis and Zustand persist docs

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain, no fast-moving dependencies)
