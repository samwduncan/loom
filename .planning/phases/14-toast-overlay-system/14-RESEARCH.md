# Phase 14: Toast & Overlay System - Research

**Researched:** 2026-03-03
**Domain:** Toast notifications, overlay portals, z-index architecture, glassmorphic styling
**Confidence:** HIGH

## Summary

Phase 14 establishes formal overlay infrastructure: a toast notification system (Sonner), a unified z-index scale, portal-based overlay rendering, and glassmorphic blur styling for floating elements. The codebase currently has 15+ distinct z-index values scattered across components (z-10 through z-[9999]) with no formal scale, 4 existing `createPortal` calls (all in SidebarModals.tsx), and extensive but inconsistent use of `backdrop-blur-sm` on modals, sidebar, and nav elements.

Sonner is the industry-standard React toast library -- lightweight (~5KB), zero dependencies, CSS-customizable, built-in dark theme support. It renders via its own portal by default, supports `classNames` for full Tailwind integration, and provides typed toast variants (success, error, warning, info) that map directly to the existing status color tokens.

**Primary recommendation:** Install Sonner, define a 7-tier z-index scale as CSS custom properties, create a shared `#overlay-root` portal target, and migrate all existing modals to portal rendering in a systematic wave-based approach.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Position: bottom-right, standard app notification placement
- Animation: slide up + fade in, fade out on dismiss (Sonner default)
- Auto-dismiss: 2-4 seconds per roadmap spec
- Visual: glassmorphic blur treatment (semi-transparent charcoal + backdrop-blur)
- Blur intensity: match nav glass tokens (--glass-blur: 16px, --glass-saturate: 1.4)
- Color variants: status-connected green (success), status-reconnecting amber (warning), status-error red (error), rose accent (info)
- Must not block the chat interface
- Single shared portal root (#overlay-root) at document.body level for all overlays
- Glassmorphic blur applied to: toasts and dropdowns
- Modals keep solid dark overlay (bg-black/60 + blur-sm) for strong focus isolation
- Existing modals standardized to use portal root and consistent backdrop pattern
- Glass tokens already exist: --glass-blur, --glass-saturate, --glass-bg-opacity
- Formalize z-index scale as CSS custom properties
- Must cover: sticky headers, dropdowns, modals, toasts, critical overlays
- All existing z-index ad-hoc values migrated to the formal scale
- WebSocket disconnect triggers warning toast, reconnect triggers success toast (TOST-03)

### Claude's Discretion
- Exact z-index tier values and naming convention
- Toast stacking behavior when multiple toasts fire simultaneously
- Sonner configuration details (theme customization, rich content support)
- WebSocket toast debouncing logic (avoid rapid fire on flaky connections)
- Dropdown glassmorphism specifics (which dropdowns, blur intensity)
- Migration order for existing modals to portal root

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOST-01 | Toast notifications (Sonner) for transient events -- bottom-right, auto-dismiss 2-4s, charcoal + rose theme | Sonner setup with `position="bottom-right"`, `duration={3000}`, custom `toastOptions` using glass tokens and status colors |
| TOST-02 | Formal z-index scale via CSS custom properties -- consistent layering | 7-tier scale covering all identified z-index usage patterns (sticky through critical) |
| TOST-03 | WebSocket disconnect = warning toast, reconnect = success toast | WebSocketContext.tsx onopen/onclose handlers with debounce logic to prevent rapid-fire toasts |
| TOST-04 | Floating elements use glassmorphic blur -- NOT scrolling content | Glass tokens ready; toasts + dropdowns get blur; modals keep solid backdrop; scrolling content untouched |
| TOST-05 | All overlay elements use ReactDOM.createPortal to document.body -- no stacking context conflicts | #overlay-root div in index.html; all modals/overlays migrated to portal rendering |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sonner | ^2.x (latest) | Toast notifications | De facto React toast standard; 5KB, zero deps, CSS-first theming, dark mode native, Tailwind classNames support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-dom (createPortal) | ^18.2 (already installed) | Overlay portal rendering | All fixed/absolute overlay elements that need to escape stacking contexts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sonner | react-hot-toast | Sonner has better animation, CSS customization, and Tailwind integration; react-hot-toast more minimal but less customizable |
| Sonner | @radix-ui/react-toast | Radix is headless (more work to style); Sonner is opinionated with sensible defaults matching Loom's needs |

**Installation:**
```bash
npm install sonner
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── ui/
│       └── toast-provider.tsx    # Sonner <Toaster /> wrapper with Loom theming
├── lib/
│   └── toast.ts                  # Re-export of sonner's toast() with project defaults
├── hooks/
│   └── useWebSocketToasts.ts     # WebSocket state → toast notifications
└── index.css                     # z-index scale variables + glass token refinements
```

### Pattern 1: Sonner Provider Setup
**What:** Mount `<Toaster />` at the app root level, outside all React context providers for z-index independence
**When to use:** Once, in the root layout (App.tsx or main.jsx)
**Example:**
```typescript
// Source: Context7 /emilkowalski/sonner
import { Toaster } from 'sonner';

// In App.tsx, after all providers but before </AuthProvider> closing
<Toaster
  position="bottom-right"
  duration={3000}
  theme="dark"
  toastOptions={{
    className: 'loom-toast',
    style: {
      background: `hsl(var(--surface-elevated) / var(--glass-bg-opacity))`,
      backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
      border: '1px solid hsl(var(--border) / 0.08)',
      color: 'hsl(var(--foreground))',
    },
    classNames: {
      success: 'loom-toast-success',
      error: 'loom-toast-error',
      warning: 'loom-toast-warning',
      info: 'loom-toast-info',
    },
  }}
/>
```

### Pattern 2: Z-Index Scale via CSS Custom Properties
**What:** Define a formal tier system so all layers reference tokens instead of magic numbers
**When to use:** Replace every ad-hoc z-index value in the codebase
**Example:**
```css
:root {
  /* Z-index scale -- 7 tiers */
  --z-base: 0;           /* Default content flow */
  --z-sticky: 10;        /* Sticky headers (TurnToolbar, ChatComposer mobile) */
  --z-dropdown: 20;      /* Dropdown menus (CommandMenu, ProviderDropdown, branch picker) */
  --z-scroll-pill: 30;   /* Scroll-to-bottom pill, floating action buttons */
  --z-overlay: 40;       /* Sidebar overlay backdrop (mobile) */
  --z-modal: 50;         /* Modals, dialogs, full-screen editors */
  --z-toast: 60;         /* Toast notifications (always above modals) */
  --z-critical: 9999;    /* Login modal, emergency overlays (preserve existing behavior) */
}
```

### Pattern 3: Portal Root Element
**What:** Add a dedicated `#overlay-root` div at the body level for consistent portal rendering
**When to use:** All overlay components (modals, toasts already handle via Sonner, image lightboxes)
**Example:**
```html
<!-- index.html -->
<body>
  <div id="root"></div>
  <div id="overlay-root"></div>
  <!-- Sonner renders its own portal to document.body automatically -->
</body>
```

```typescript
// Reusable portal helper
import ReactDOM from 'react-dom';

function OverlayPortal({ children }: { children: React.ReactNode }) {
  const overlayRoot = document.getElementById('overlay-root');
  if (!overlayRoot) return null;
  return ReactDOM.createPortal(children, overlayRoot);
}
```

### Pattern 4: WebSocket Toast Integration with Debounce
**What:** Fire toasts on WebSocket state transitions with debounce to prevent rapid-fire on flaky connections
**When to use:** Custom hook consuming WebSocketContext
**Example:**
```typescript
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from '../contexts/WebSocketContext';

export function useWebSocketToasts() {
  const { connectionState } = useWebSocket();
  const prevState = useRef(connectionState);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const prev = prevState.current;
    prevState.current = connectionState;

    // Only toast on transitions, not initial state
    if (prev === connectionState) return;

    // Debounce: clear pending toast if state changes rapidly
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (connectionState === 'connected' && prev === 'reconnecting') {
        toast.success('Connection restored');
      } else if (connectionState === 'reconnecting') {
        toast.warning('Connection lost. Reconnecting...');
      }
    }, 1000); // 1s debounce prevents rapid fire

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [connectionState]);
}
```

### Anti-Patterns to Avoid
- **Inline z-index magic numbers:** Never use `z-[100]` or `zIndex: 1000` -- always reference `var(--z-tier)` or the Tailwind alias
- **Portaling to document.body directly for modals:** Use `#overlay-root` for consistency (Sonner is exempt -- it manages its own portal)
- **Glassmorphic blur on scrolling content:** Only apply `backdrop-blur` to floating/fixed elements; scrolling content gets solid backgrounds
- **Toast for persistent errors:** Toasts auto-dismiss; persistent errors (process crash, exit code) should use inline banners, not toasts (STRM-08 in Phase 17)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification state + animation | Sonner | Handles stacking, animation, dismissal, accessibility, types, promises, custom styling |
| Toast portal rendering | Manual createPortal for toasts | Sonner (auto-portals) | Sonner creates its own portal to document.body -- no additional portal code needed for toasts |
| Animation timing | Manual CSS keyframe timings for toast enter/exit | Sonner defaults | Sonner's built-in slide-up + fade animations match the locked design decision |
| Toast accessibility | Manual aria-live region management | Sonner | Sonner handles aria-live="polite", role="status" automatically |

**Key insight:** Sonner handles the hardest parts (animation choreography, stacking, portal, accessibility). The implementation work is primarily CSS theming and z-index architecture -- don't over-engineer the toast wrapper.

## Common Pitfalls

### Pitfall 1: Z-Index Stacking Context Traps
**What goes wrong:** An overlay with z-50 appears behind content with z-10 because a parent element creates a new stacking context (transform, opacity, filter, etc.)
**Why it happens:** CSS stacking contexts are inherited -- a z-index only competes within its stacking context
**How to avoid:** Portal all overlays to `#overlay-root` (outside the React tree), ensuring they share the root stacking context
**Warning signs:** Overlay renders correctly in isolation but disappears behind content in the full app

### Pitfall 2: Sonner Style Specificity Wars
**What goes wrong:** Sonner's default styles override custom theme, or Tailwind utilities don't apply
**Why it happens:** Sonner injects its own stylesheet; specificity conflicts with Tailwind
**How to avoid:** Use `toastOptions.style` for CSS variable references (inline styles win specificity) and `toastOptions.classNames` with `!important` sparingly. Alternatively, use `unstyled: true` for full control.
**Warning signs:** Toasts show default white/dark Sonner theme instead of glassmorphic charcoal

### Pitfall 3: WebSocket Toast Spam on Flaky Connections
**What goes wrong:** Rapid connect/disconnect cycles produce a flood of toasts
**Why it happens:** WebSocket reconnects every 3 seconds on failure; each cycle could fire 2 toasts
**How to avoid:** 1s debounce on state transitions, skip initial "connected" toast (only toast on re-connection after disconnect)
**Warning signs:** Stack of 5+ identical "Connection lost" toasts appearing

### Pitfall 4: Backdrop-Blur Performance on Low-End Devices
**What goes wrong:** Glassmorphic blur causes jank on mobile or low-powered devices
**Why it happens:** `backdrop-filter: blur()` is GPU-intensive, especially with large overlay areas
**How to avoid:** Use `will-change: backdrop-filter` on persistent glass elements; keep blur radius reasonable (16px is fine); apply `@media (prefers-reduced-motion: reduce)` fallback that removes blur
**Warning signs:** Frame drops when opening modals or showing toasts on mobile

### Pitfall 5: Portal Target Missing on SSR/Tests
**What goes wrong:** `document.getElementById('overlay-root')` returns null during server-side rendering or in test environments
**Why it happens:** Portal target div only exists in index.html; not available in Node.js test environment
**How to avoid:** Null-check the portal target; fallback to `document.body` if `#overlay-root` is missing; in tests, create a mock div
**Warning signs:** Console errors about null portal target; tests failing on portal components

## Code Examples

### Sonner Toaster with Loom Glass Theming
```typescript
// Source: Context7 /emilkowalski/sonner + Loom design tokens
import { Toaster } from 'sonner';

export function LoomToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      duration={3000}
      theme="dark"
      visibleToasts={4}
      toastOptions={{
        style: {
          background: 'hsl(var(--surface-elevated) / var(--glass-bg-opacity))',
          backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
          border: '1px solid hsl(var(--border) / 0.08)',
          color: 'hsl(var(--foreground))',
          fontSize: '13px',
          fontFamily: 'inherit',
        },
        classNames: {
          success: 'border-l-2 !border-l-[hsl(var(--status-connected))]',
          error: 'border-l-2 !border-l-[hsl(var(--status-error))]',
          warning: 'border-l-2 !border-l-[hsl(var(--status-reconnecting))]',
          info: 'border-l-2 !border-l-[hsl(var(--rose-accent))]',
        },
      }}
    />
  );
}
```

### Calling Toast Variants
```typescript
import { toast } from 'sonner';

// Success (green left border)
toast.success('Connection restored');

// Warning (amber left border)
toast.warning('Connection lost. Reconnecting...');

// Error (red left border)
toast.error('Failed to save session');

// Info (rose left border)
toast.info('New version available');
```

### Z-Index Migration Example
```css
/* Before (scattered magic numbers) */
.command-menu { z-index: 1000; }
.modal { z-index: 9999; }
.sticky-header { z-index: 10; }

/* After (formal scale) */
.command-menu { z-index: var(--z-dropdown); }
.modal { z-index: var(--z-modal); }
.sticky-header { z-index: var(--z-sticky); }
```

## Z-Index Audit (Current State)

Complete inventory of z-index usage across the codebase:

| Value | Components | Proposed Tier |
|-------|-----------|---------------|
| z-10 | TurnToolbar (sticky), CollapsibleSection (sticky), MicButton tooltip, ShellMinimalView, TaskList dropdown | --z-sticky (10) |
| z-20 | ChatMessagesPane (sticky date), ShellMinimalView buttons, ScrollToBottomPill | --z-scroll-pill (30) |
| z-30 | QuickSettingsPanel backdrop, ScrollToBottomPill, TaskList dropdown | --z-scroll-pill (30) |
| z-40 | QuickSettingsPanel drawer | --z-overlay (40) |
| z-50 | All modals (SidebarModals, ConfirmAction, NewBranch, ImageLightbox, CreateTask, NextTaskBanner, TaskList, PRDEditor, VersionUpgrade, MobileNav, ComposerDropdown, ProviderDropdown, GitPanelHeader, AppContent sidebar overlay, ChatComposer mobile, Tooltip) | --z-modal (50) or --z-dropdown (20) depending on type |
| z-[60] | ProjectCreationWizard | --z-modal (50) |
| z-[70] | ProjectCreationWizard nested confirm | --z-modal (50) |
| z-[100] | TaskDetail, TaskMasterSetupWizard | --z-modal (50) |
| z-[110] | CodexMcpFormModal, ClaudeMcpFormModal (nested in Settings) | --z-modal (50) |
| z-[200] | PRDEditor | --z-modal (50) |
| z-[300] | PRDEditor nested confirm | --z-modal (50) |
| zIndex: 1000 | CommandMenu (inline style) | --z-dropdown (20) |
| z-[9999] | LoginModal, Settings, CodeEditor, CodeEditorLoadingState | --z-critical (9999) |

**Key observation:** Most z-[N>50] values exist because components compete for "on top" position without a formal scale. With portals + a formal scale, most can collapse to --z-modal (50).

## Existing Modal Inventory (Portal Migration Targets)

| Component | File | Current Portal? | Current z-index | Backdrop Style |
|-----------|------|-----------------|-----------------|----------------|
| SidebarModals (delete project) | SidebarModals.tsx | YES (document.body) | z-50 | bg-black/60 backdrop-blur-sm |
| SidebarModals (delete session) | SidebarModals.tsx | YES (document.body) | z-50 | bg-black/60 backdrop-blur-sm |
| SidebarModals (ProjectCreationWizard) | SidebarModals.tsx | YES (document.body) | z-[60] (wizard internal) | Wizard handles |
| SidebarModals (Settings) | SidebarModals.tsx | YES (document.body) | z-[9999] (settings internal) | bg-background/95 |
| ConfirmActionModal | ConfirmActionModal.tsx | NO | z-50 | bg-black/60 backdrop-blur-sm |
| NewBranchModal | NewBranchModal.tsx | NO | z-50 | bg-black/60 backdrop-blur-sm |
| VersionUpgradeModal | VersionUpgradeModal.tsx | NO | z-50 | bg-black/50 backdrop-blur-sm |
| ImageLightbox | ImageLightbox.tsx | NO | z-50 | bg-black/80 backdrop-blur-sm |
| ImageViewer | ImageViewer.tsx | NO | z-50 | bg-black bg-opacity-50 |
| LoginModal | LoginModal.jsx | NO | z-[9999] | bg-black bg-opacity-50 |
| CodeEditor (fullscreen) | CodeEditor.tsx | NO | z-[9999] | bg-black/50 |
| CreateTaskModal | CreateTaskModal.jsx | NO | z-50 | bg-black/50 backdrop-blur-sm |
| TaskDetail | TaskDetail.jsx | NO | z-[100] | bg-black/50 |
| TaskMasterSetupWizard | TaskMasterSetupWizard.jsx | NO | z-[100] | bg-black/50 |
| NextTaskBanner modals | NextTaskBanner.jsx | NO | z-50 | bg-black/50 backdrop-blur-sm |
| PRDEditor | PRDEditor.jsx | NO | z-[200] | bg-black/50 |
| Settings | Settings.tsx | NO | z-[9999] | bg-background/95 |
| QuickSettingsPanel | QuickSettingsPanel.jsx | NO | z-30/40/50 | bg-background/80 backdrop-blur-sm |
| CodexMcpFormModal | CodexMcpFormModal.tsx | NO | z-[110] | bg-black/50 |
| ClaudeMcpFormModal | ClaudeMcpFormModal.tsx | NO | z-[110] | bg-black/50 |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-toastify (heavy, complex) | Sonner (lightweight, CSS-first) | 2023-2024 | Sonner became the default recommendation for React toasts |
| Random z-index values | CSS custom property scales | Industry pattern | Eliminates z-index wars, maintainable layering |
| Direct document.body portals | Dedicated portal root elements | React best practice | Consistent stacking context, easier cleanup |

## Open Questions

1. **Toast z-index and Sonner's internal rendering**
   - What we know: Sonner renders its own portal to document.body and applies its own z-index
   - What's unclear: Exact z-index Sonner uses internally; may need CSS override to match our --z-toast scale
   - Recommendation: Inspect Sonner's rendered HTML after install; override via `[data-sonner-toaster] { z-index: var(--z-toast) !important; }` if needed

2. **Dropdown glassmorphism scope**
   - What we know: Context says "Glassmorphic blur applied to: toasts and dropdowns"
   - What's unclear: Which dropdowns? CommandMenu, ProviderDropdown, branch picker, TaskList sort dropdown, composer mention dropdown
   - Recommendation: Apply glass treatment to all dropdown-class elements (CommandMenu, ProviderDropdown, ComposerProviderPicker, branch picker in GitPanelHeader)

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | -- |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | -- |

*Written to `.planning/config.json` under `tooling` key for executor use.*

## Sources

### Primary (HIGH confidence)
- Context7 `/emilkowalski/sonner` -- Toaster setup, position, duration, styling, classNames, icons, promise toasts, types
- Codebase analysis -- z-index audit (all 50+ occurrences), modal inventory (20+ components), WebSocketContext.tsx state machine, index.css glass tokens, existing portal patterns

### Secondary (MEDIUM confidence)
- React documentation -- createPortal best practices, stacking context behavior
- CSS spec -- backdrop-filter performance characteristics, stacking context creation rules

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Sonner is well-documented, verified via Context7 with 67 code snippets
- Architecture: HIGH -- Based on direct codebase analysis of all relevant files
- Pitfalls: HIGH -- Identified from known CSS stacking context rules and WebSocket reconnection patterns in the codebase

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable domain, low churn)
