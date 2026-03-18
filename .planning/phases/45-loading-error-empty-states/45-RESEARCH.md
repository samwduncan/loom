# Phase 45: Loading, Error & Empty States - Research

**Researched:** 2026-03-18
**Domain:** UI state management -- loading skeletons, error fallbacks, empty state design
**Confidence:** HIGH

## Summary

Phase 45 covers the systematic elimination of blank/void UI states across all async surfaces. The codebase already has partial coverage: some components have skeletons (SessionList, MessageList, GitPanel, Settings tabs), some have error states (FileTree, GitPanel, Settings), and some have empty states (ChangesView, ChatView). But the implementations are inconsistent -- three different animation approaches (skeleton-shimmer CSS class, animate-pulse Tailwind, skeleton-pulse keyframe), missing retry buttons in error states, and bare text strings where designed empty states should be.

The core task is normalization: create a unified `Skeleton` primitive with directional shimmer (the existing `skeleton-shimmer` class in sidebar.css), retrofit all skeletons to use it, upgrade bare-text empty states to designed components with icons + headings + guidance, and ensure every error state has a functional retry button.

**Primary recommendation:** Build two shared primitives (`Skeleton` component wrapping the existing shimmer class, `EmptyState` component with icon/heading/description/action slots), then sweep through all async surfaces to apply them consistently.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOAD-01 | Every async component shows a directional shimmer skeleton during loading (normalized animation) | Existing `skeleton-shimmer` class in sidebar.css provides the shimmer. Must replace `animate-pulse` usage in GitPanelSkeleton, SettingsTabSkeleton, FileTree, EditorSkeleton. Create `Skeleton` primitive. |
| LOAD-02 | Every fetch-component has error state with retry button and clear message | ErrorBoundary hierarchy exists for render errors. Need fetch-error states with retry for: SessionList (has error but no retry), HistoryView (shows error in empty-state div, no retry), FileTree (already has retry). Settings tabs already use SettingsTabSkeleton + inline error. |
| LOAD-03 | Terminal Suspense fallback uses skeleton component instead of text string | ContentArea.tsx line 38-44: `TerminalSkeleton` is a text string "Loading terminal..." -- replace with a proper skeleton matching terminal layout. |
| EMPTY-01 | File tree shows designed empty state when no project or no files | FileTree currently has a bare text "No files match filter" (line 99). Needs icon + heading + guidance for both no-project and no-files scenarios. |
| EMPTY-02 | Git panel shows designed empty states for Changes (no changes) and History (no commits) | ChangesView line 131: bare `<p>No changes</p>`. HistoryView line 88: bare `<p>No commits yet</p>`. Both use `git-empty-state` CSS class but lack icon/heading/guidance. |
| EMPTY-03 | Session list shows designed empty state when no sessions | SessionList line 191-198: has basic text + NewChatButton but lacks icon and guidance text. Also needs search-no-results (line 206-209) upgrade. |
| EMPTY-04 | Search results show "no matches" state with contextual guidance | CommandPalette line 72: `<Command.Empty>No results found</Command.Empty>` -- needs icon + guidance. ChatView SearchBar also needs empty state for message search. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2 | Component framework | Already in use |
| Tailwind CSS | 4.2 | Utility styling | Already in use, v4 with @theme inline |
| lucide-react | 0.577 | Icons for empty states | Already in use across codebase (20+ imports) |
| react-error-boundary | 6.1 | Render error catching | Already in use (3-tier hierarchy) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cn() utility | local | Class merging | All component className composition |
| sonner | installed | Toast notifications | Transient error feedback (already used) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Skeleton component | shadcn/ui Skeleton | shadcn Skeleton is just a div with animate-pulse -- less than what we need (shimmer). Not worth installing for a 5-line wrapper. |
| Custom EmptyState | Third-party empty state lib | No value -- empty states are simple composition of icon + text + button. |

**Installation:**
No new dependencies needed. Everything uses existing libraries.

## Architecture Patterns

### Recommended Project Structure
```
src/src/components/shared/
  Skeleton.tsx           # NEW -- reusable shimmer primitive
  EmptyState.tsx         # NEW -- icon + heading + description + action slot
  ErrorBoundary.tsx      # EXISTS
  ErrorFallback.tsx      # EXISTS
  InlineError.tsx        # NEW -- fetch-error component with retry button
```

### Pattern 1: Skeleton Primitive
**What:** A small `Skeleton` component that renders a `<div>` with the existing `skeleton-shimmer` class, accepting size/shape props.
**When to use:** Every loading state in every async component.
**Example:**
```typescript
// Wraps the existing skeleton-shimmer class from sidebar.css
// Normalizes all skeletons to use directional shimmer (not animate-pulse)
interface SkeletonProps {
  className?: string;
  /** Preset shapes */
  variant?: 'line' | 'circle' | 'block';
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer',
        variant === 'circle' && 'rounded-full',
        variant === 'block' && 'rounded-md',
        className,
      )}
      aria-hidden="true"
    />
  );
}
```

### Pattern 2: EmptyState Compound Component
**What:** A centered layout component with icon, heading, description, and optional action button.
**When to use:** Every surface that can be legitimately empty (no data, no results).
**Example:**
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;   // Lucide icon element
  heading: string;
  description?: string;
  action?: React.ReactNode; // Button or link
  className?: string;
}

export function EmptyState({ icon, heading, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6 text-center', className)}>
      <div className="text-muted">{icon}</div>
      <div>
        <p className="text-sm font-medium text-secondary-foreground">{heading}</p>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
```

### Pattern 3: InlineError (Fetch Error with Retry)
**What:** A compact error display for failed data fetches, distinct from ErrorBoundary (which catches render errors).
**When to use:** When a hook's `error` state is truthy. Replaces bare error text across the codebase.
**Example:**
```typescript
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 p-6 text-center', className)}>
      <AlertCircle className="size-5 text-destructive" />
      <p className="text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Mixed animation approaches in skeletons:** The codebase currently uses three different skeleton animations (`skeleton-shimmer` directional sweep, `animate-pulse` opacity throb, `skeleton-pulse` custom keyframe). LOAD-01 requires normalization to a single directional shimmer. All skeletons must use `skeleton-shimmer`.
- **Bare text empty states:** `<p>No changes</p>` without an icon, heading structure, or guidance text. Every empty state must communicate what the user can do next.
- **Error states without retry:** SessionList's error state (line 182-188) shows "Failed to load sessions" but has no retry button. HistoryView's error state (line 77-83) uses the same empty state div as the no-commits state. All error states need an actionable retry.
- **Text-string Suspense fallbacks:** The terminal's `"Loading terminal..."` text string (ContentArea.tsx line 41) violates LOAD-01. Use a skeleton that mimics the terminal layout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shimmer animation | Custom CSS keyframes per component | Existing `skeleton-shimmer` class from sidebar.css | Already exists, already tested, directional sweep animation |
| Icons for empty states | Custom SVG icons | lucide-react icons | Already used in 20+ files, tree-shakeable, consistent style |
| Error boundary hierarchy | Custom try/catch render wrappers | react-error-boundary (already installed) | Already has 3-tier hierarchy, reset/retry support |
| Toast notifications | Custom error notification system | sonner (already installed) | Already used for transient errors |

**Key insight:** This phase is NOT about building new infrastructure. It's about creating two small shared primitives (Skeleton, EmptyState) and then sweeping through ~12 components to replace inconsistent implementations with the standardized versions.

## Common Pitfalls

### Pitfall 1: Skeleton CLS (Cumulative Layout Shift)
**What goes wrong:** Skeleton dimensions don't match real content dimensions, causing visible layout shift when data loads.
**Why it happens:** Developers estimate sizes rather than matching exact component heights.
**How to avoid:** MessageListSkeleton already demonstrates the right approach -- it renders inside actual `MessageContainer` components to guarantee pixel-identical layout. Each skeleton should match the real component's outer container dimensions.
**Warning signs:** Visible "jump" when loading completes. Test by throttling network to slow-3G.

### Pitfall 2: Missing aria-label on skeleton containers
**What goes wrong:** Screen readers announce skeleton divs as empty or confusing content.
**Why it happens:** Skeletons are decorative but their parent containers need `role="status"` and `aria-label`.
**How to avoid:** Each skeleton wrapper gets `role="status" aria-label="Loading [thing]"`. Individual shimmer divs get `aria-hidden="true"`. SessionListSkeleton already does this correctly.
**Warning signs:** Axe audit flags missing accessible names.

### Pitfall 3: Error states that don't actually retry
**What goes wrong:** Retry button exists but doesn't call `refetch()` or triggers a stale closure.
**Why it happens:** The retry handler captures state from the initial render.
**How to avoid:** Wire retry to the hook's `refetch` or `retry` callback directly. Test by forcing a network error, clicking retry, and verifying the request fires.
**Warning signs:** Clicking retry does nothing or fetches stale data.

### Pitfall 4: Empty state shown during loading
**What goes wrong:** Component shows "No sessions yet" briefly before loading completes, then shows actual data.
**Why it happens:** `isLoading` starts as `false` or the empty-check runs before data is fetched.
**How to avoid:** Always check `isLoading` BEFORE checking `data.length === 0`. The render priority is: loading > error > empty > content.
**Warning signs:** Flash of empty state on initial render. SessionList already handles this correctly (line 181: `if (multiLoading) return <SessionListSkeleton />`).

### Pitfall 5: Mount-once panel skeleton conflict
**What goes wrong:** CSS show/hide panels (mount-once pattern) never re-render their Suspense fallback after first mount.
**Why it happens:** ContentArea mounts all panels once (line 82-87). After initial load, the panel is always mounted -- Suspense only triggers on first mount.
**How to avoid:** The terminal and git Suspense fallbacks only need to work on first load (lazy import). For data-level loading within those panels, each panel component handles its own loading state (GitPanel uses GitPanelSkeleton, TerminalPanel manages ws state). Don't confuse Suspense fallback with data-loading state.
**Warning signs:** N/A -- just be aware of the architecture.

## Code Examples

### Current Shimmer CSS (sidebar.css -- the canonical implementation)
```css
/* Source: src/src/components/sidebar/sidebar.css */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--surface-raised) 25%,
    var(--surface-overlay) 50%,
    var(--surface-raised) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--space-1);
}
```

### Current useFetch pattern (useSettingsData.ts -- the refetch wiring)
```typescript
// Source: src/src/hooks/useSettingsData.ts
// All settings hooks return { data, isLoading, error, refetch }
// Retry wiring: pass refetch to the InlineError component's onRetry prop
function useFetch<T>(url: string, initial: T) {
  // ... returns { data, isLoading, error, refetch }
}
```

### Lucide icons already available for empty states
```typescript
// Already imported in various files -- no new imports needed
import {
  FolderOpen,     // File tree empty state
  GitBranch,      // Git panel empty state
  MessageSquare,  // Session list empty state
  Search,         // Search no-results state
  FileText,       // File-related empty states
  AlertCircle,    // Error states
  RotateCcw,      // Retry action
} from 'lucide-react';
```

## Inventory of Surfaces to Update

### Loading States (LOAD-01, LOAD-02, LOAD-03)

| Surface | Current Loading | Current Error | Needs |
|---------|----------------|---------------|-------|
| SessionList | SessionListSkeleton (shimmer) | Red text, no retry | Normalize: shimmer OK. Add retry to error state. |
| MessageList | MessageListSkeleton (shimmer) | N/A (ErrorBoundary) | Shimmer OK. No change needed. |
| FileTree | animate-pulse blocks | Button retry exists | Replace animate-pulse with skeleton-shimmer. Error OK. |
| GitPanel | GitPanelSkeleton (animate-pulse) | CSS error with retry | Replace animate-pulse with skeleton-shimmer. Error OK. |
| HistoryView | skeleton-pulse keyframe | Text in empty-state div | Replace skeleton-pulse with skeleton-shimmer. Add retry to error. |
| Settings tabs | SettingsTabSkeleton (animate-pulse) | Inline per-tab | Replace animate-pulse with skeleton-shimmer. Error handling exists. |
| Terminal (Suspense) | Text string | N/A (TerminalOverlay) | Replace text with proper skeleton. |
| Editor (Suspense) | Text "Loading editor..." | N/A | Replace text with proper skeleton. |

### Empty States (EMPTY-01 through EMPTY-04)

| Surface | Current Empty State | Needs |
|---------|-------------------|-------|
| FileTree (no files) | "No files match filter" text | Icon (FolderOpen) + heading + guidance |
| FileTree (no project) | Not handled separately | Distinct empty state for no-project |
| ChangesView | "No changes" text | Icon (GitBranch/Check) + heading + description |
| HistoryView | "No commits yet" text | Icon (GitBranch) + heading + description |
| SessionList (no sessions) | Text + NewChatButton | Add icon (MessageSquare), improve layout |
| SessionList (no search results) | "No matching sessions" text | Icon (Search) + heading + guidance |
| CommandPalette | "No results found" text | Icon (Search) + heading + guidance |
| ChatView search | No explicit empty state | Add "No matching messages" with guidance |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Spinner/loading text | Shimmer skeletons | ~2022-present | Better perceived performance, communicates content shape |
| Blank void on no data | Designed empty states | ~2020-present | Guides users to take action, reduces confusion |
| `animate-pulse` opacity throb | Directional shimmer sweep | Industry trend | Shimmer communicates "loading" more clearly than pulse |

**Deprecated/outdated:**
- `animate-pulse` for skeletons: While Tailwind provides it, directional shimmer (gradient sweep) is the modern standard. The codebase already has the shimmer animation -- just not used everywhere.
- Text-string loading fallbacks: "Loading..." text strings are never acceptable for production UI.

## Open Questions

None. This phase is well-scoped with clear requirements and the existing codebase patterns are thoroughly understood.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library + jsdom |
| Config file | `src/vite.config.ts` (vitest config inline) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOAD-01 | All skeletons use shimmer class | unit | `cd src && npx vitest run src/src/components/shared/Skeleton.test.tsx -x` | No -- Wave 0 |
| LOAD-02 | Error states have retry buttons | unit | `cd src && npx vitest run src/src/components/shared/InlineError.test.tsx -x` | No -- Wave 0 |
| LOAD-03 | Terminal fallback is skeleton | unit | `cd src && npx vitest run src/src/components/content-area/view/ContentArea.test.tsx -x` | Yes (ContentArea.test.tsx exists) |
| EMPTY-01 | FileTree empty state has icon/heading | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | Yes |
| EMPTY-02 | Git empty states have icon/heading | unit | `cd src && npx vitest run src/src/components/git/ChangesView.test.tsx src/src/components/git/HistoryView.test.tsx -x` | Yes (both exist) |
| EMPTY-03 | SessionList empty state designed | unit | `cd src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | Yes |
| EMPTY-04 | Search "no results" state designed | unit | `cd src && npx vitest run src/src/components/command-palette/CommandPalette.test.tsx -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/shared/Skeleton.test.tsx` -- covers LOAD-01 (Skeleton primitive renders shimmer class)
- [ ] `src/src/components/shared/InlineError.test.tsx` -- covers LOAD-02 (InlineError renders message + retry)
- [ ] `src/src/components/shared/EmptyState.test.tsx` -- covers EMPTY-01 through EMPTY-04 (EmptyState renders icon/heading/description/action)

## CSS Architecture Note: Shimmer Class Location

The `skeleton-shimmer` class and `@keyframes shimmer` currently live in `sidebar.css`. Since Phase 45 uses this class across the entire app (not just sidebar), the shimmer CSS should be moved to a shared location. Two options:

1. **Move to `base.css`** -- makes it globally available without imports. Preferred since it's a design system primitive.
2. **Create `skeleton.css`** and import from `Skeleton.tsx` -- keeps it co-located with the component.

Recommendation: Move `@keyframes shimmer` and `.skeleton-shimmer` to `base.css` (after the reduced-motion media query). This is the cleanest approach since base.css already contains global animation overrides. Keep `sidebar.css` importing nothing new -- just remove the shimmer definitions that moved.

## Sources

### Primary (HIGH confidence)
- Codebase audit: All 12 components inspected directly via source files
- `sidebar.css` -- canonical shimmer animation implementation
- `ErrorBoundary.tsx` + `ErrorFallback.tsx` -- existing 3-tier error hierarchy
- `useSettingsData.ts` -- `useFetch<T>` pattern with refetch
- `V2_CONSTITUTION.md` -- Section 8 (Error Handling), Section 3.1 (token-based styling)
- `tokens.css` -- design token inventory (surfaces, text, status colors, spacing)
- `chat-interface-standards.md` -- Requirements 8.1, 16.2, 16.5

### Secondary (MEDIUM confidence)
- None needed -- all findings are from direct codebase inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything uses existing libraries
- Architecture: HIGH -- patterns derived from existing codebase conventions
- Pitfalls: HIGH -- identified from actual inconsistencies found during audit

**Research date:** 2026-03-18
**Valid until:** Indefinite -- this is a codebase-internal audit, not external library research
