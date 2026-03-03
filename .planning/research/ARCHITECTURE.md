# Architecture Patterns: Visual Redesign Integration

**Domain:** Brownfield React 18 visual redesign -- charcoal + dusty rose palette replacing warm earthy palette
**Researched:** 2026-03-03
**Confidence:** HIGH (based on direct codebase analysis of built v1.0 architecture)

---

## Recommended Architecture

The visual redesign integrates into the existing architecture through five integration layers, each with a specific transformation strategy. The core principle: **change values, not structures**. The v1.0 architecture was designed for exactly this kind of palette swap -- CSS variables abstract color from components. The redesign exploits this by working from the inside out: token values first, then hardcoded references, then new systems (toast, animation), then specialty surfaces (terminal, code).

### Integration Layer Map

```
Layer 1: CSS Variable Values (index.css :root)
  ↓ propagates to all semantic-alias components automatically
Layer 2: Hardcoded Color References (86 occurrences across 13 files)
  ↓ requires per-file find-and-replace
Layer 3: Specialty Surface Themes (xterm.js, Shiki, DiffViewer, scrollbars)
  ↓ requires JS theme object updates
Layer 4: New Component Systems (toast, activity status, animation)
  ↓ additive -- no existing code changes
Layer 5: Component Visual Polish (hover states, transitions, micro-interactions)
  ↓ CSS additions + minor JSX className changes
```

---

## Component Boundaries

### Existing Components: Change Classification

| Component | File | Change Type | Rationale |
|-----------|------|-------------|-----------|
| `ChatInterface` | `src/components/chat/view/ChatInterface.tsx` | **None** | Pure orchestrator -- no color references, delegates to subcomponents |
| `ChatMessagesPane` | `src/.../subcomponents/ChatMessagesPane.tsx` | **Visual-only** | Has `text-gray-500`, `text-gray-400`, `border-gray-200` hardcoded classes in loading indicators and "load more" UI |
| `TurnBlock` | `src/.../subcomponents/TurnBlock.tsx` | **Visual-only** | Has `border-amber-500`, `bg-amber-500/5`, `bg-gray-800/30`, `text-gray-500`, `text-gray-300` hardcoded. Also `border-[#3d2e25]/20` dividers |
| `MessageComponent` | `src/.../subcomponents/MessageComponent.tsx` | **Visual-only** | Heavy -- 11 hardcoded warm hex references (`#f5e6d3`, `#c4a882`, `#b85c3a`, `#3d2e25`, `#241a14`, `#b87333`, `#dab8b8`), plus `bg-amber-900/15`, `border-amber-700/20` |
| `ToolActionCard` | `src/.../subcomponents/ToolActionCard.tsx` | **Visual-only** | Uses `bg-gray-500`, `text-gray-300/400/500`, `bg-gray-900/30`, `border-gray-700/50`. Category tinting stays (blue/purple/gray semantically appropriate) |
| `ThinkingDisclosure` | `src/.../subcomponents/ThinkingDisclosure.tsx` | **Visual-only** | 6 hardcoded warm hex references (`#c4a882`, `#3d2e25`) |
| `CodeBlock (ShikiCodeBlock)` | `src/.../subcomponents/CodeBlock.tsx` | **Visual-only** | 7 hardcoded warm hex references (`#241a14`, `#c4a882`, `#1c1210`, `#f5e6d3`, `#a08a6e`, `#3d2e25`) |
| `ScrollToBottomPill` | `src/.../subcomponents/ScrollToBottomPill.tsx` | **Visual-only** | Fully hardcoded warm hex: `bg-[#2a1f1a]`, `border-[#c4a882]/30`, `text-[#f5e6d3]`, `hover:bg-[#3d2e25]` |
| `ConnectionStatusDot` | `src/.../subcomponents/ConnectionStatusDot.tsx` | **Visual-only** | Hardcoded status hex: `bg-[#6bbf59]`, `bg-[#d4a574]`, `bg-[#c15a4a]` -- should migrate to CSS variable status tokens |
| `SystemStatusMessage` | `src/.../subcomponents/SystemStatusMessage.tsx` | **Visual-only** | 6 hardcoded warm hex references in tier config |
| `TurnUsageFooter` | `src/.../subcomponents/TurnUsageFooter.tsx` | **Visual-only** | 1 hardcoded reference: `border-[#3d2e25]/30`, `text-[#c4a882]/50` |
| `DiffViewer` | `src/.../tools/components/DiffViewer.tsx` | **Visual-only** | Full `warmDiffStyles` JS theme object with 19 hardcoded warm hex values |
| `useShikiHighlighter` | `src/.../hooks/useShikiHighlighter.ts` | **Visual-only** | `WARM_COLOR_REPLACEMENTS` map with 12 hardcoded hex values mapping Dark+ to warm palette |
| `PreTokenIndicator` | `src/.../subcomponents/PreTokenIndicator.tsx` | **None** | Uses CSS classes from `aurora-shimmer.css` -- aurora colors are palette-independent (oklch rainbow) |
| `ThinkingShimmer` | `src/.../subcomponents/ThinkingShimmer.tsx` | **None** | Same as above -- aurora classes only |
| `ChatComposer` | `src/.../subcomponents/ChatComposer.tsx` | **Minor** | Orchestrator; any color is in child components. May need className updates for new composer styling |
| `ChatInputControls` | `src/.../subcomponents/ChatInputControls.tsx` | **Visual-only** | Uses semantic Tailwind classes (bg-muted, text-primary) plus some hardcoded green/orange/amber for permission states |
| `MobileNav` | `src/components/MobileNav.jsx` | **Visual-only** | Uses `nav-glass`, `mobile-nav-float` utility classes that read from CSS variable tokens. Token value change propagates automatically. Active tab styling needs attention |
| `Sidebar` + subcomponents | `src/components/sidebar/` | **Visual-only** | Bulk of sidebar uses inherited semantic classes. Individual subcomponents need audit |
| Terminal (`constants.ts`) | `src/components/shell/constants/constants.ts` | **Visual-only** | `TERMINAL_OPTIONS.theme` is a JS object with 20 hardcoded hex values for xterm.js ITheme |
| `index.css` | `src/index.css` | **Foundation** | All 22 CSS variables redefined. Plus 8 nav design tokens. Plus hardcoded scrollbar colors (3 instances). Plus select dropdown SVG arrow color |
| `streaming-cursor.css` | `src/.../styles/streaming-cursor.css` | **Visual-only** | Hardcoded `#d4a574` amber cursor color (2 instances) |
| `aurora-shimmer.css` | `src/.../styles/aurora-shimmer.css` | **None** | Rainbow oklch gradients are palette-independent by design |
| `tailwind.config.js` | Root | **Foundation** | Add new semantic tokens (toast, activity-status). Existing mapping structure stays identical |

### New Components (Additive)

| Component | Purpose | Mounts In | Communicates With |
|-----------|---------|-----------|-------------------|
| `ToastProvider` + `Toast` | Transient notification system | App root (portal) | WebSocketContext (connection errors), useChatRealtimeHandlers (session errors) |
| `ToastContainer` | Positions and stacks toasts | Fixed viewport overlay | ToastProvider context |
| `ActivityStatusLine` | Shows current tool execution | ChatInterface, above ChatComposer | useChatRealtimeHandlers (tool events), isLoading state |
| `StopButton` | Replaces send during streaming | ChatComposer | onAbortSession callback (already exists) |

---

## Integration Strategy: CSS Variable Migration

### The Problem

The :root block in `index.css` defines 22 semantic HSL variables with warm earthy values. These propagate automatically to any component using Tailwind semantic classes (`bg-background`, `text-foreground`, etc.). However, **86 occurrences across 13 files use hardcoded hex values** that bypass this system entirely.

### The Solution: Two-Pass Migration

**Pass 1: Redefine CSS variable values (instant full-app effect)**

Change only the HSL channel values in `:root`. Variable names stay identical. Every component using semantic Tailwind classes updates automatically.

```css
/* BEFORE (warm earthy) */
:root {
  --background: 10 27.3% 8.6%;          /* #1c1210 */
  --foreground: 33.5 63% 89.4%;         /* #f5e6d3 */
  --primary: 30.6 52.7% 64.3%;          /* #d4a574 -- amber */
  --accent: 21.9 45.6% 55.3%;           /* #c17f59 -- copper */
  --card: 18.8 23.5% 13.3%;             /* #2a1f1a */
  --secondary: 22.5 24.5% 19.2%;        /* #3d2e25 */
  --muted-foreground: 34.5 35.9% 63.9%; /* #c4a882 */
  --destructive: 16.2 52.1% 47.5%;      /* #b85c3a */
  --border: 34.5 35.9% 63.9%;           /* #c4a882 */
}

/* AFTER (charcoal + dusty rose) */
:root {
  --background: 0 0% 10.2%;             /* #1a1a1a -- charcoal base */
  --foreground: 0 0% 93%;               /* #ededed -- near-white text */
  --primary: 4 38% 63%;                 /* #D4736C -- dusty rose */
  --accent: 4 28% 60%;                  /* #C97B7B -- muted rose */
  --card: 0 0% 13.3%;                   /* #222222 -- surface 1 */
  --secondary: 0 0% 17%;                /* #2b2b2b -- surface 2 */
  --muted-foreground: 0 0% 55%;         /* #8c8c8c -- muted gray */
  --destructive: 0 60% 50%;             /* #cc3333 -- pure red */
  --border: 0 0% 22%;                   /* #383838 -- subtle border */
}
```

The exact HSL values above are illustrative. The actual values should be finalized during design system planning with visual verification. The point is: **only this block changes for Pass 1**.

**Pass 2: Replace hardcoded hex references**

The 86 hardcoded references fall into two categories:

| Category | Count | Strategy |
|----------|-------|----------|
| **Warm palette hex** (`#1c1210`, `#2a1f1a`, `#3d2e25`, `#c4a882`, `#d4a574`, `#f5e6d3`, `#241a14`, `#a08a6e`, `#b85c3a`, `#b87333`, `#dab8b8`) | ~80 | Replace with `hsl(var(--token-name))` or equivalent Tailwind semantic class |
| **Status/accent hex** (`#6bbf59`, `#c15a4a`) | ~6 | Already have CSS variable tokens (`--status-connected`, etc.) -- use `bg-status-connected` |

### Critical: What NOT to Change in Pass 1

- CSS variable **names** stay identical (no `--primary` to `--rose` rename)
- `tailwind.config.js` color mapping structure stays identical
- `hsl(var(--X) / <alpha-value>)` contract stays identical
- Component classNames using semantic aliases (`bg-background`, `text-foreground`) -- zero changes needed

---

## Integration Strategy: Animation System

### Current Animation Inventory

| Animation | Location | Mechanism | Performance |
|-----------|----------|-----------|-------------|
| Aurora rainbow shimmer | `aurora-shimmer.css` | CSS `@property --aurora-angle` + compositor thread | GPU-accelerated, zero main-thread cost |
| Streaming cursor blink | `streaming-cursor.css` | CSS `@keyframes cursor-blink` with `step-end` | Lightweight, no layout triggers |
| Turn expand/collapse | TurnBlock, ToolActionCard, ThinkingDisclosure | CSS Grid `gridTemplateRows: 0fr/1fr` with `transition` | Layout-contained, single reflow |
| Scroll pill entrance | ScrollToBottomPill | CSS `@keyframes pill-enter` (inline `<style>`) | Lightweight, runs once |
| Sidebar slide | `index.css` `.sidebar-transition` | CSS `transform + opacity` | GPU-accelerated |
| Spinner | `index.css` `@keyframes spin` | CSS `transform: rotate()` with `will-change` | GPU-accelerated |

### New Animation Needs

| Animation | Recommended Mechanism | Why |
|-----------|----------------------|-----|
| Toast enter/exit | CSS `@keyframes` with `translateX` slide + `opacity` fade | Must not interfere with streaming -- GPU-composited, no layout reflow. Define in `index.css` or a new `toast.css` |
| Hover state transitions | CSS `transition` on individual properties | Already partially in place (150ms cubic-bezier). Extend to new palette colors |
| Button press feedback | CSS `transform: scale(0.98)` on `:active` | Already in place for touch devices. Apply consistently |
| Status line slide-up | CSS Grid `gridTemplateRows: 0fr/1fr` | Same pattern as TurnBlock -- proven to work with streaming |
| Send-to-stop morph | CSS `transition` on `opacity` + `transform` | Swap icons with crossfade. No JS animation needed |

### Performance Rules for Animations + Streaming

1. **Never animate `height`, `width`, or `top`/`left` during streaming** -- these trigger layout recalculation that competes with `requestAnimationFrame` token batching
2. **Use CSS Grid 0fr/1fr for expand/collapse** -- established pattern in TurnBlock, ToolActionCard, ThinkingDisclosure, PreTokenIndicator. Browser optimizes this well
3. **Use `will-change: transform` sparingly** -- only on elements with continuous animation (spinner, aurora). Not on hover transitions
4. **`contain: content` on streaming messages** -- already in place via `.message-streaming` class. Keeps token DOM mutations from triggering ancestor reflows
5. **Toast animations must use `position: fixed` portal** -- rendering toasts inside the scroll container would cause scroll position shifts during streaming

### Where Animations Live

**CSS files (preferred for visual-only animations):**
- `src/index.css` -- global transitions, hover states, new utility classes
- `src/components/chat/styles/streaming-cursor.css` -- streaming cursor (update color only)
- `src/components/chat/styles/aurora-shimmer.css` -- no changes needed
- New: `src/components/toast/styles/toast.css` -- toast enter/exit keyframes

**Inline CSS-in-JS (for state-driven animations):**
- CSS Grid `gridTemplateRows` in `style={{}}` -- keep this pattern for expand/collapse (TurnBlock, ToolActionCard, ActivityStatusLine)
- ScrollToBottomPill inline `<style>` -- move keyframes to `index.css` during cleanup

**No JS animation libraries needed.** The existing CSS-only approach is working well and performs better than JS animation during streaming.

---

## Integration Strategy: Toast/Notification System

### Architecture Decision: Where Toasts Mount

```
App.tsx
├── AuthProvider
│   └── WebSocketProvider        <-- connection state lives here
│       ├── ToastProvider        <-- NEW: React Context for toast state
│       │   ├── AppContent
│       │   │   ├── Sidebar
│       │   │   └── MainContent
│       │   │       └── ChatInterface
│       │   │           ├── ChatMessagesPane
│       │   │           └── ChatComposer
│       │   └── ToastContainer   <-- NEW: Fixed-position portal (renders via portal)
```

**Why this position:**
- `ToastProvider` wraps inside `WebSocketProvider` so it can subscribe to connection state changes
- `ToastContainer` renders via `ReactDOM.createPortal` to `document.body` -- completely outside the scroll container
- Any component can call `useToast().show()` to trigger a notification
- The toast system does NOT interfere with streaming because it renders in a separate DOM subtree

### Toast → WebSocket Integration Points

| Event | Source | Toast Behavior |
|-------|--------|---------------|
| WebSocket disconnected | `WebSocketContext.connectionState === 'disconnected'` | Warning toast: "Connection lost. Reconnecting..." (persists until reconnected) |
| WebSocket reconnected | `connectionState` transition `'reconnecting' → 'connected'` | Success toast: "Reconnected" (auto-dismiss 3s) |
| Session error (non-fatal) | `useChatRealtimeHandlers` `session-error` event | Error toast with error summary (auto-dismiss 5s) |
| Process crash (fatal) | `useChatRealtimeHandlers` `session-error` with non-zero exit | Inline banner in message flow (NOT a toast -- uses existing `SystemStatusMessage` "error" tier) |

### State Management

```typescript
// Toast state is local to ToastProvider -- not in any existing context
type Toast = {
  id: string;
  tier: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismissMs?: number;  // undefined = persistent until dismissed
  timestamp: number;
};

// Context exposes:
type ToastContextType = {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  dismiss: (id: string) => void;
};
```

---

## Integration Strategy: Scroll Behavior

### Current Scroll Architecture (v1.0)

```
ChatMessagesPane (overflow-y-auto container)
  ├── [messages rendered in max-w-[720px] centered div]
  ├── AssistantThinkingIndicator (conditional)
  ├── ReconnectSkeletons (conditional)
  └── Sentinel div (1px, ref={sentinelRef})  <-- IntersectionObserver target

useScrollAnchor hook:
  - IntersectionObserver on sentinel div with 100px rootMargin
  - isAtBottom: true when sentinel is visible
  - isUserScrolledUp: true when user scrolls away from bottom
  - Auto re-engage: when sentinel becomes visible again, reset isUserScrolledUp

ScrollToBottomPill:
  - Absolute positioned in ChatMessagesPane container
  - Shows when isUserScrolledUp && newTurnCount > 0
  - Smooth scroll to bottom on click
```

### What Changes for v1.1

The scroll behavior architecture is **correct and does not need structural changes**. The visual redesign affects:

1. **ScrollToBottomPill styling** -- replace hardcoded warm hex with new palette tokens. Currently `bg-[#2a1f1a]`, `border-[#c4a882]/30`, `text-[#f5e6d3]` -- change to `bg-card`, `border-border/30`, `text-foreground`
2. **Scroll container padding** -- may adjust for new spacing/density, but `overflow-y-auto` container stays identical
3. **Scrollbar styling** -- `scrollbar-thin` class in `index.css` has hardcoded `hsl(34.5 35.9% 63.9% / 0.3)` -- update to use `var(--muted-foreground)` via CSS

### No Scroll Architecture Changes Needed

The IntersectionObserver-based scroll anchor with sentinel div is the correct modern pattern. The `requestAnimationFrame` streaming buffer is orthogonal to scroll behavior -- they don't interact. The `contain: content` on `.message-streaming` prevents streaming DOM changes from affecting scroll position calculations.

---

## Integration Strategy: Theme Token Organization

### Current Token System (22 semantic variables)

```
Surfaces:     --background, --card, --popover, --secondary, --muted
Text:         --foreground, --card-foreground, --popover-foreground,
              --secondary-foreground, --muted-foreground, --accent-foreground,
              --primary-foreground, --destructive-foreground
Accent:       --primary, --accent, --destructive
UI:           --border, --input, --ring, --radius
Status:       --status-connected, --status-reconnecting,
              --status-disconnected, --status-error
Nav:          --nav-glass-bg, --nav-glass-blur, --nav-glass-saturate,
              --nav-tab-glow, --nav-tab-ring, --nav-float-shadow,
              --nav-float-ring, --nav-divider-color, --nav-input-bg,
              --nav-input-focus-ring
Layout:       --mobile-nav-height, --mobile-nav-padding, --mobile-nav-total,
              --safe-area-inset-*, --header-*
```

### Proposed New Tokens for v1.1

| Token | Purpose | Why New |
|-------|---------|---------|
| `--toast-bg` | Toast notification background | Distinct from card -- slightly brighter surface for overlay feel |
| `--toast-border` | Toast border | May differ from --border for better overlay contrast |
| `--activity-bg` | Activity status line background | Subtle surface above composer, needs to be distinct but not distracting |
| `--code-bg` | Code block background | Currently hardcoded as `#1c1210` in CodeBlock and Shiki fallback -- should be tokenized |
| `--code-header-bg` | Code block header bar | Currently hardcoded as `#241a14` |
| `--diff-bg` | Diff viewer base background | Currently hardcoded in `warmDiffStyles` object |
| `--streaming-cursor` | Streaming cursor color | Currently hardcoded as `#d4a574` in `streaming-cursor.css` |

### Token Naming Convention

The existing convention follows shadcn/ui: `--{surface}` for backgrounds, `--{surface}-foreground` for text on that surface. New tokens should follow the same pattern. Do NOT create a separate naming scheme.

### Token File Organization

All tokens remain in a single `:root` block in `src/index.css`. Do NOT split into multiple CSS files -- the single-file approach means one place to see the entire palette, which is critical for a visual redesign where you're tuning many values simultaneously.

---

## Integration Strategy: Specialty Surfaces

### xterm.js Terminal Theme

**File:** `src/components/shell/constants/constants.ts`
**Current:** Default VS Code dark theme colors (not warm palette)
**Change:** Replace `TERMINAL_OPTIONS.theme` JS object values with Catppuccin Mocha palette

```typescript
// The object structure stays identical -- only hex values change
theme: {
  background: '#1a1a1a',   // match --background
  foreground: '#ededed',   // match --foreground
  cursor: '#D4736C',       // match --primary (dusty rose)
  cursorAccent: '#1a1a1a', // match --background
  selectionBackground: '#3a3a3a', // match --secondary
  // ANSI 16 colors: Catppuccin Mocha values
  black: '#45475a',
  red: '#f38ba8',
  green: '#a6e3a1',
  // ... etc
}
```

### Shiki Syntax Highlighting

**File:** `src/components/chat/hooks/useShikiHighlighter.ts`
**Current:** `WARM_COLOR_REPLACEMENTS` maps VS Code Dark+ hex to warm equivalents
**Change:** Update the replacement map values to match new charcoal palette

The Shiki `colorReplacements` API is perfect for this -- it maps exact hex input to exact hex output. Structure stays identical, values change.

### DiffViewer Theme

**File:** `src/components/chat/tools/components/DiffViewer.tsx`
**Current:** `warmDiffStyles.variables.dark` object with 19 warm hex values
**Change:** Update all values in the theme object. Structure stays identical.

### Scrollbar Colors

**File:** `src/index.css`
**Current:** Three hardcoded instances of `hsl(34.5 35.9% 63.9% / 0.3)` for scrollbar colors
**Change:** Replace with `hsl(var(--muted-foreground) / 0.3)` to auto-follow palette

---

## Component Refactoring: Build Order

The build order is driven by three constraints:
1. **Foundation before surfaces** -- CSS variables must be defined before components can reference them
2. **Streaming safety** -- no changes that break `requestAnimationFrame` buffer or `contain: content`
3. **Testability** -- each step produces a visually verifiable result

### Phase Ordering Rationale

```
Step 1: CSS Variable Redefinition (index.css :root)
  ↓ Unblocks: all semantic-class components update immediately
  ↓ Verifiable: bg-background, text-foreground change globally

Step 2: New Token Additions (index.css + tailwind.config.js)
  ↓ Unblocks: hardcoded hex replacement can use new tokens
  ↓ Verifiable: new classes available in Tailwind

Step 3: Hardcoded Hex Sweep (13 component files)
  ↓ Unblocks: full palette consistency
  ↓ Verifiable: grep for old hex values returns zero
  ↓ CRITICAL: Do NOT change component structure, only className strings

Step 4: Specialty Surface Themes (terminal, Shiki, DiffViewer, scrollbars)
  ↓ Unblocks: visual consistency in code/terminal/diff views
  ↓ Verifiable: terminal background matches app, code blocks match

Step 5: Toast System (new components)
  ↓ Unblocks: error handling phase
  ↓ Additive: no existing code modified
  ↓ Verifiable: toast appears on WebSocket disconnect

Step 6: Activity Status Line (new component)
  ↓ Unblocks: "current tool" display
  ↓ Additive: small integration point in ChatInterface
  ↓ Verifiable: status line shows during AI response

Step 7: Micro-interactions and Polish
  ↓ Depends on: all above complete
  ↓ Verifiable: hover states, transitions, density adjustments
```

### What Must NOT Be Changed

| Item | Why Protected |
|------|--------------|
| `requestAnimationFrame` streaming buffer in `useChatRealtimeHandlers` | Performance-critical path -- visual changes must not touch |
| `contain: content` on `.message-streaming` | Prevents layout thrash during streaming |
| IntersectionObserver in `useScrollAnchor` | Scroll behavior is correct -- visual changes only |
| IntersectionObserver in `ChatMessagesPane` for turn collapse | Working collapse/expand system -- visual changes only |
| `React.memo` + custom comparators on `TurnBlock` | Performance boundary -- must be preserved exactly |
| `useTurnGrouping` hook | Message grouping logic -- visual changes only |
| CSS Grid `gridTemplateRows: 0fr/1fr` expand/collapse pattern | Proven animation pattern -- reuse, don't replace |
| `WebSocketContext` message handling | Backend integration -- no visual changes |

---

## Data Flow: New Toast System

```
WebSocket closes unexpectedly
  ↓
WebSocketContext.onclose → setConnectionState('disconnected')
  ↓
useEffect in ToastProvider (watches connectionState)
  ↓
show({ tier: 'warning', message: 'Connection lost...', autoDismissMs: undefined })
  ↓
ToastProvider state updates → ToastContainer re-renders (portal)
  ↓
Toast slides in from right (CSS animation, position: fixed)
  ↓ [WebSocket reconnects]
ToastProvider detects 'connected' → auto-dismiss warning toast
  ↓
show({ tier: 'success', message: 'Reconnected', autoDismissMs: 3000 })
```

This flow is completely isolated from the streaming path. Toast re-renders do not trigger ChatMessagesPane re-renders because they render in a separate portal DOM subtree.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Style Objects for Colors

**What:** Using `style={{ color: '#D4736C' }}` instead of Tailwind classes or CSS variables.
**Why bad:** Bypasses the entire token system. Cannot be audited with grep. Cannot be changed in one place.
**Instead:** Always use `className="text-primary"` or `className="text-[hsl(var(--primary))]"` for one-off colors.

### Anti-Pattern 2: Adding JS Animation During Streaming

**What:** Using `framer-motion`, `react-spring`, or `requestAnimationFrame`-based JS animations for visual effects in the message flow.
**Why bad:** Competes with the streaming `requestAnimationFrame` buffer for main thread time. Creates jank during active AI responses.
**Instead:** Use CSS-only animations (`@keyframes`, `transition`, CSS Grid animate). The existing aurora shimmer proves this works -- it runs on the compositor thread with zero main-thread cost.

### Anti-Pattern 3: Toast Inside Scroll Container

**What:** Rendering toast notifications as children of `ChatMessagesPane` scroll container.
**Why bad:** Toast appear/dismiss changes scroll height, which fights the IntersectionObserver sentinel-based scroll anchor. User gets unexpected scroll jumps.
**Instead:** Render toasts via `ReactDOM.createPortal(toastContainer, document.body)` with `position: fixed`.

### Anti-Pattern 4: Changing Component Props for Visual Changes

**What:** Adding new props like `colorScheme` or `variant` to existing components to support the new palette.
**Why bad:** Breaks `React.memo` comparators (TurnBlock's custom comparator would need updating). Adds unnecessary re-render triggers.
**Instead:** Visual changes should be CSS-only where possible. If a component needs different styling, change its `className` strings directly -- don't route it through props.

### Anti-Pattern 5: Splitting CSS Variables Across Multiple Files

**What:** Putting toast tokens in `toast.css`, terminal tokens in `terminal.css`, etc.
**Why bad:** During a palette redesign, you need to see ALL color values simultaneously to ensure harmony. Splitting across files makes palette tuning a multi-file hunt.
**Instead:** ALL color tokens in one `:root` block in `index.css`. Animation keyframes can live in separate CSS files (they don't define colors).

---

## Scalability Considerations

| Concern | At Current State | At Full Redesign | Future |
|---------|-----------------|------------------|--------|
| **CSS variable count** | 30 tokens | ~37 tokens (7 new) | Manageable in single :root |
| **Hardcoded hex references** | 86 across 13 files | 0 (all migrated) | Enforce via lint rule |
| **Animation count** | 6 CSS animations | ~9 CSS animations | No performance concern -- all GPU-composited |
| **Toast render cost** | N/A | 0-3 visible toasts | Negligible -- portal, outside main tree |
| **Component re-renders** | Streaming-optimized | Unchanged | memo boundaries preserved |

---

## Sources

- Direct analysis of `/home/swd/loom/src/` built codebase (v1.0 complete)
- `src/index.css` lines 24-100 -- CSS variable definitions with warm palette values
- `tailwind.config.js` -- semantic alias mapping with `hsl(var(--X) / <alpha-value>)` contract
- `src/components/chat/view/subcomponents/TurnBlock.tsx` -- CSS Grid expand/collapse pattern
- `src/components/chat/view/subcomponents/ScrollToBottomPill.tsx` -- hardcoded warm hex example
- `src/components/chat/view/subcomponents/MessageComponent.tsx` -- heaviest hardcoded hex file
- `src/components/chat/hooks/useShikiHighlighter.ts` -- `WARM_COLOR_REPLACEMENTS` map
- `src/components/chat/tools/components/DiffViewer.tsx` -- `warmDiffStyles` theme object
- `src/components/shell/constants/constants.ts` -- xterm.js `TERMINAL_OPTIONS.theme`
- `src/components/chat/hooks/useScrollAnchor.ts` -- IntersectionObserver scroll tracking
- `src/components/chat/styles/aurora-shimmer.css` -- GPU-composited animation pattern
- `src/components/chat/styles/streaming-cursor.css` -- hardcoded cursor color
- `src/contexts/WebSocketContext.tsx` -- connection state for toast integration
- `.planning/phases/08-error-handling-and-status/08-CONTEXT.md` -- toast/status decisions

---

*Architecture research for: Loom v1.1 Design Overhaul (visual redesign integration)*
*Researched: 2026-03-03*
