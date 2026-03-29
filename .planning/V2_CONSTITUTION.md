# Loom V2 Constitution

**Status:** DRAFT
**Version:** 0.1
**Last Updated:** 2026-03-04

This document defines the enforceable coding conventions, banned patterns, and structural rules for the Loom V2 frontend rewrite. Every coding session MUST comply with these rules. Violations are build-time errors, not suggestions.

---

## Table of Contents

1. [File Structure](#1-file-structure)
2. [Component Conventions](#2-component-conventions)
3. [CSS & Styling Rules](#3-css--styling-rules)
4. [State Management](#4-state-management)
5. [TypeScript Rules](#5-typescript-rules)
6. [Testing Requirements](#6-testing-requirements)
7. [Design Token Contract](#7-design-token-contract)
8. [Error Handling](#8-error-handling)
9. [Accessibility Minimums](#9-accessibility-minimums)
10. [Performance Rules](#10-performance-rules)
11. [Motion & Animation](#11-motion--animation)
12. [Markdown & Rendering](#12-markdown--rendering)
13. [Touch Target & Focus Standards](#13-touch-target--focus-standards)

---

## 1. File Structure

### 1.1 Source Directory Layout

```
src/
  components/
    app-shell/           # AppShell, Header, ErrorBoundaries
    chat/
      view/              # ChatViewport, ChatMessagesPane
      subcomponents/     # TurnBlock, ActiveMessage, ScrollToBottomPill, etc.
      composer/          # ChatComposer, InputControls, ActivityStatusLine
      tools/             # ToolActionCard, tool-specific renderers
      styles/            # aurora-shimmer.css, streaming-cursor.css
    sidebar/             # Sidebar, SessionList, SidebarItem
    settings/            # SettingsModal, SettingsPane subcomponents
    shared/              # Button, Input, Modal, Toast — reusable primitives
  hooks/                 # Global custom hooks (useScrollAnchor, useMediaQuery, etc.)
  stores/                # Zustand stores: timeline.ts, stream.ts, ui.ts, connection.ts
  types/                 # Shared TypeScript types and discriminated unions
  utils/                 # Pure utility functions (formatTime, parseMarkdown, etc.)
  styles/                # Global CSS: index.css (tokens), base.css
  lib/                   # Third-party wrappers (WebSocket client, API client)
```

### 1.2 Naming Rules

| Entity | Convention | Example |
|--------|-----------|---------|
| Component files | PascalCase.tsx | `TurnBlock.tsx` |
| Hook files | camelCase starting with `use` | `useScrollAnchor.ts` |
| Store files | camelCase, singular noun | `timeline.ts`, `stream.ts` |
| Utility files | camelCase, descriptive verb/noun | `formatTime.ts`, `parseTokens.ts` |
| Type files | camelCase, descriptive | `messages.ts`, `websocket.ts` |
| CSS files | kebab-case | `aurora-shimmer.css` |
| Test files | Same as source + `.test` suffix | `TurnBlock.test.tsx` |
| Directories | kebab-case | `app-shell/`, `chat-composer/` |
| Constants files | camelCase or UPPER_SNAKE for values | `constants.ts` |

### 1.3 File Collocation Rules

- REQUIRED: A component's test file lives in the same directory as the component.
- REQUIRED: A component's styles (if component-specific CSS) live in a `styles/` subdirectory of the component's parent directory.
- BANNED: Test files in a top-level `__tests__/` directory. Tests collocate with source.
- BANNED: Barrel files (`index.ts` re-exports) except at the `components/shared/` level for design primitives. Deep barrel files obscure imports and break tree-shaking.

---

## 2. Component Conventions

### 2.1 File Structure Template

Every component file MUST follow this order:

```tsx
// 1. Imports (external, then internal, then types, then styles)
import { memo, useCallback } from 'react';
import { useTimelineStore } from '@/stores/timeline';
import type { TurnBlockProps } from './TurnBlock.types';
import './styles/turn-block.css'; // Only if component-specific CSS exists

// 2. Props type (exported, defined ABOVE the component)
export interface TurnBlockProps {
  turnId: string;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
}

// 3. Component definition (named export)
export const TurnBlock = memo(function TurnBlock({ turnId, isCollapsed, onToggle }: TurnBlockProps) {
  // ...
});
```

### 2.2 Export Rules

- REQUIRED: Named exports for all components. `export const MyComponent = ...`
- BANNED: Default exports. They produce inconsistent import names across the codebase and break refactoring tools.
- EXCEPTION: Page-level route components MAY use default exports if required by the router's lazy-loading API.

### 2.3 Props Naming

- REQUIRED: Props interface named `{ComponentName}Props`.
- REQUIRED: Props interface exported from the component file.
- BANNED: Inline props types. `function Foo({ x }: { x: string })` is not allowed. Extract to a named interface.
- REQUIRED: Callback props prefixed with `on`. `onClick`, `onToggle`, `onStreamComplete`.
- BANNED: Boolean props without `is`/`has`/`should` prefix. Use `isCollapsed`, not `collapsed`.

### 2.4 Component Size & Splitting

- GUIDELINE: Components exceeding 200 lines of JSX (not including imports/types/hooks) should be split.
- REQUIRED: If a component has 3+ distinct visual sections, each section is its own subcomponent.
- REQUIRED: Hook logic exceeding 50 lines is extracted to a custom hook in the same directory or `hooks/`.
- BANNED: God components. No single component may handle both layout orchestration AND business logic AND rendering. Split into Container (logic) + Presentation (rendering) when complexity warrants it.

### 2.5 Memoization

- REQUIRED: Every component in the message list (`TurnBlock`, `MessageComponent`, `ToolActionCard`) is wrapped in `React.memo` with a custom comparator if props include objects/arrays.
- REQUIRED: Callbacks passed to memoized children are wrapped in `useCallback`.
- BANNED: Premature memoization of leaf components (buttons, icons) that receive only primitive props.

---

## 3. CSS & Styling Rules

### 3.1 Color Specification

- **BANNED: All hardcoded Tailwind color utilities.**
  - `bg-gray-800`, `text-gray-500`, `border-gray-700` -- BANNED.
  - `bg-red-500`, `text-green-400`, `bg-blue-600` -- BANNED.
  - `bg-amber-900`, `text-amber-500`, `border-amber-700` -- BANNED.
  - ANY Tailwind utility containing a color name + number scale -- BANNED.

- **BANNED: Hardcoded hex values in className strings.**
  - `bg-[#1a1a1a]`, `text-[#f5e6d3]`, `border-[#3d2e25]` -- BANNED.

- **BANNED: Hardcoded hex/hsl values in inline style objects**, except for:
  - Values computed from JavaScript at runtime (e.g., `style={{ width: `${percentage}%` }}`).
  - Third-party library theme objects that require JS objects (xterm.js theme, Shiki colorReplacements). These MUST reference CSS variable values via a shared constants file.

- **REQUIRED: All colors via CSS custom properties.**
  - `bg-background`, `text-foreground`, `border-border/8` -- CORRECT.
  - `bg-card`, `bg-surface-raised`, `text-muted-foreground` -- CORRECT.
  - `bg-primary`, `text-primary`, `border-primary/20` -- CORRECT.
  - `bg-[hsl(var(--surface-base))]` for one-off opacity -- CORRECT.

### 3.2 Inline Styles

- BANNED: Inline `style={{}}` for colors, fonts, spacing, borders, or any visual property that CSS classes can handle.
- ALLOWED: Inline `style={{}}` ONLY for:
  - Dynamically computed dimensions: `style={{ width: calculatedWidth }}`.
  - CSS Grid template values driven by state: `style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}`.
  - Transform values from animation calculations: `style={{ transform: `translateY(${offset}px)` }}`.
  - CSS custom property overrides: `style={{ '--progress': `${percent}%` } as React.CSSProperties}`.

### 3.3 Z-Index

- BANNED: Arbitrary z-index values. No `z-[999]`, `z-[100]`, `z-50` (the raw Tailwind utility).
- REQUIRED: All z-index values reference the formal z-index dictionary defined in CSS custom properties.

**Z-Index Dictionary:**

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default document flow, chat messages |
| `--z-sticky` | 10 | Sticky headers, input area floating above messages |
| `--z-dropdown` | 20 | Dropdown menus, context menus, floating toolbars |
| `--z-scroll-pill` | 30 | Scroll-to-bottom pill, floating action buttons |
| `--z-overlay` | 40 | Backdrop overlays behind modals, omnibar blur |
| `--z-modal` | 50 | Modal dialogs, command palette, settings panel |
| `--z-toast` | 60 | Toast notifications (always above modals) |
| `--z-critical` | 9999 | Emergency: loading screens, fatal error overlays |

Usage in Tailwind: `z-[var(--z-modal)]` or in CSS: `z-index: var(--z-toast)`.

### 3.4 Spacing

- REQUIRED: Use Tailwind spacing utilities for all padding, margin, and gap values. `p-4`, `gap-3`, `mb-6`.
- BANNED: Arbitrary spacing values that don't map to the 4px grid. `p-[13px]`, `mt-[7px]` -- BANNED.
- ALLOWED: Arbitrary spacing ONLY when matching an external constraint (safe area insets, exact design spec values). Must include a comment explaining why.

### 3.5 Tailwind v4 / @theme Patterns [NEEDS REVIEW]

> Note: The current codebase uses Tailwind v3.4 with `tailwind.config.js`. If V2 migrates to Tailwind v4, the `@theme` directive in CSS replaces `tailwind.config.js` for token definitions. This section will be finalized once the Tailwind version decision is made.

- If Tailwind v4: All design tokens defined in `@theme {}` blocks in CSS. No `tailwind.config.js` for colors.
- If staying on Tailwind v3: Existing `tailwind.config.js` + `hsl(var(--token) / <alpha-value>)` pattern continues.

### 3.6 className Construction

- REQUIRED: Use `cn()` (clsx + tailwind-merge) for all conditional class composition.
- BANNED: String concatenation for className. `` className={`base ${isActive ? 'active' : ''}`} `` -- BANNED.
- BANNED: Ternary nesting deeper than one level in className.

```tsx
// CORRECT
className={cn(
  "px-3 py-2 rounded-md text-sm",
  "bg-surface-raised text-foreground",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}

// BANNED
className={`px-3 py-2 ${isActive ? 'bg-primary' : isHovered ? 'bg-card' : 'bg-surface-raised'}`}
```

---

## 4. State Management

### 4.1 Store Architecture

Loom V2 uses exactly 4 Zustand stores. No more, no fewer without Constitution amendment.

| Store | File | Responsibility | Update Frequency |
|-------|------|---------------|-----------------|
| `timeline` | `stores/timeline.ts` | Past messages array, session metadata, conversation list | Low (on message complete, session switch) |
| `stream` | `stores/stream.ts` | Active streaming state: isStreaming, toolCallStatus, thinkingState, accumulated text | High during streaming, idle otherwise |
| `ui` | `stores/ui.ts` | Sidebar open/closed, active modal, theme settings, layout state | Low (user interaction only) |
| `connection` | `stores/connection.ts` | WebSocket status, reconnection state, connection metadata | Low (connection events only) |

### 4.2 Selector Rules

- **BANNED: Subscribing to the entire store.** `const store = useTimelineStore()` -- BANNED.
- **REQUIRED: Always use selectors.** `const messages = useTimelineStore(state => state.messages)` -- CORRECT.
- REQUIRED: Selectors that compute derived data use `useShallow` or are memoized outside the component.
- REQUIRED: Selectors selecting multiple fields use `useShallow`:

```tsx
// CORRECT
const { isStreaming, toolCallStatus } = useStreamStore(
  useShallow(state => ({ isStreaming: state.isStreaming, toolCallStatus: state.toolCallStatus }))
);

// BANNED
const state = useStreamStore();
```

### 4.3 The Stream Hybrid: useRef for High-Frequency Updates

- REQUIRED: The active streaming text accumulation uses `useRef` + direct DOM mutation, NOT React state. The ref value flushes to Zustand only when streaming completes.
- REQUIRED: The streaming component reads from the ref via a `requestAnimationFrame` loop, not via state subscription.
- RATIONALE: At 100 tokens/sec, React's reconciler cannot keep up. DOM-direct mutation eliminates the VDOM diff entirely during streaming.

### 4.4 No React Context for Mutable State

- BANNED: React Context for any state that updates more than once per user interaction.
- ALLOWED: React Context for truly static or near-static values: theme config, feature flags, authenticated user object, toast dispatch function.
- RATIONALE: Context triggers re-renders in all consumers on every update. Zustand with selectors triggers re-renders only in components that select the changed slice.

### 4.5 Store Action Rules

- REQUIRED: All store mutations go through named action functions defined inside the store. No external `setState` calls.
- REQUIRED: Actions that affect multiple stores dispatch to each store independently. No cross-store imports inside store definitions.

```tsx
// CORRECT -- action inside the store
const useTimelineStore = create<TimelineState>((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
}));

// BANNED -- mutating from outside
useTimelineStore.setState({ messages: [...messages, newMsg] });
```

---

## 5. TypeScript Rules

### 5.1 Strict Mode

- REQUIRED: `"strict": true` in `tsconfig.json`. No exceptions, no overrides.
- REQUIRED: `"noUncheckedIndexedAccess": true`. Array access returns `T | undefined`.
- REQUIRED: `"exactOptionalPropertyTypes": true` in V2. [NEEDS REVIEW -- may be too aggressive for initial migration]

### 5.2 Banned Patterns

- **BANNED: `any` type.** No `any` in production code. Period.
  - EXCEPTION: Third-party library types that genuinely lack type definitions. Must include `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [reason]`.
  - EXCEPTION: Test files may use `any` for mock construction. Still discouraged.
- **BANNED: Non-null assertions (`!`).** `user!.name` -- BANNED. Use optional chaining (`user?.name`) or narrow the type first.
  - EXCEPTION: DOM refs after guaranteed mount. `inputRef.current!.focus()` in a `useEffect` with the ref as dependency. Must include `// ref guaranteed after mount` comment.
- **BANNED: Type assertions (`as`)** without a documented reason.
  - ALLOWED: `as const` for literal types.
  - ALLOWED: `as React.CSSProperties` for CSS custom property style objects.
  - ALL OTHER `as` casts require a `// SAFETY: [explanation]` comment on the same line.

### 5.3 Message Type Discrimination

All messages from the WebSocket/API MUST be typed as a discriminated union:

```tsx
type WSMessage =
  | { type: 'token'; data: { text: string; index: number } }
  | { type: 'tool_start'; data: { toolName: string; toolId: string; args: Record<string, unknown> } }
  | { type: 'tool_output'; data: { toolId: string; output: string; isError: boolean } }
  | { type: 'thinking'; data: { text: string; isComplete: boolean } }
  | { type: 'status'; data: { connectionState: ConnectionState } }
  | { type: 'error'; data: { code: string; message: string; recoverable: boolean } }
  | { type: 'session_meta'; data: { sessionId: string; model: string; tokenUsage: TokenUsage } };

// Usage -- exhaustive switch
function handleMessage(msg: WSMessage) {
  switch (msg.type) {
    case 'token': /* ... */ break;
    case 'tool_start': /* ... */ break;
    // ... every case handled
    default: {
      const _exhaustive: never = msg;
      console.warn('Unknown message type', _exhaustive);
    }
  }
}
```

[NEEDS REVIEW: The exact discriminated union types will be finalized after the Backend API Audit (Task #1) is complete. The structure above is illustrative.]

### 5.4 API Response Typing

- REQUIRED: Every API fetch call has a typed response. No untyped `fetch().then(r => r.json())`.
- REQUIRED: API response types live in `types/api.ts`.
- REQUIRED: Use a typed wrapper or generic fetcher:

```tsx
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}
```

### 5.5 Enum vs Union

- BANNED: TypeScript `enum`. Use string literal unions or `as const` objects.
- RATIONALE: Enums generate runtime JavaScript, produce opaque numeric values by default, and don't tree-shake.

```tsx
// BANNED
enum MessageRole { User = 'user', Assistant = 'assistant' }

// CORRECT
type MessageRole = 'user' | 'assistant' | 'system';

// ALSO CORRECT (when you need runtime iteration)
const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
type MessageRole = typeof MESSAGE_ROLES[number];
```

---

## 6. Testing Requirements

### 6.1 Coverage Rules

- REQUIRED: Every Zustand store has a test file.
- REQUIRED: Every component in `components/chat/` and `components/shared/` has a test file.
- REQUIRED: Every custom hook in `hooks/` has a test file.
- GUIDELINE: Layout/orchestrator components (`AppShell`) may skip tests if they contain no logic.

### 6.2 Test Framework

- Vitest + React Testing Library + jsdom.
- BANNED: Enzyme. BANNED: Shallow rendering. Render components as users see them.
- REQUIRED: `@testing-library/user-event` for interaction simulation (not `fireEvent`).

### 6.3 What to Test

| Test Category | What | Example |
|--------------|------|---------|
| Render | Component renders without crashing given valid props | `render(<TurnBlock {...defaultProps} />)` |
| Content | Correct text/elements appear for given state | `expect(screen.getByText('Thinking...')).toBeInTheDocument()` |
| Interaction | User actions produce expected state changes | `await user.click(toggleButton); expect(panel).toBeVisible()` |
| Edge Cases | Empty data, missing optional props, error states | `render(<TurnBlock messages={[]} />)` |
| Store Logic | Actions produce correct state transitions | `act(() => store.getState().addMessage(msg)); expect(store.getState().messages).toHaveLength(1)` |
| Hook Behavior | Custom hooks return correct values on input changes | `renderHook(() => useScrollAnchor(ref))` |

### 6.4 What NOT to Test

- BANNED: Testing implementation details (internal state variable names, effect ordering, render count).
- BANNED: Testing CSS/styling (use visual regression or Playwright for that).
- BANNED: Testing third-party library behavior (Zustand works, react-markdown works -- test YOUR integration).
- BANNED: Snapshot tests for components with dynamic content. Snapshots for design token CSS files are acceptable.

### 6.5 Test File Naming

- Component: `TurnBlock.test.tsx` (same directory as `TurnBlock.tsx`).
- Hook: `useScrollAnchor.test.ts` (same directory as `useScrollAnchor.ts`).
- Store: `timeline.test.ts` (same directory as `timeline.ts`).

---

## 7. Design Token Contract

All visual values used across the application are defined as CSS custom properties in a single `:root` block in `src/styles/index.css` (V2) or `src/index.css` (V1 during transition).

### 7.1 Surface Hierarchy

| Token | Role | V1 Value | Notes |
|-------|------|----------|-------|
| `--background` | Page background, deepest layer | `30 3.8% 10.2%` (#1b1a19) | Warm-tinted charcoal |
| `--surface-base` | Alias for --background | `30 3.8% 10.2%` | Explicit surface tier name |
| `--card` | Raised cards, panels, sidebar items | `30 3.0% 12.9%` (#222120) | +2.7% lightness from base |
| `--surface-raised` | Alias for --card | `30 3.0% 12.9%` | Explicit surface tier name |
| `--secondary` | Between raised and elevated | `30 2.8% 14.5%` (#252423) | Intermediate tier |
| `--popover` | Elevated modals, overlays, dropdowns | `30 2.4% 16.5%` (#2b2a29) | +6.3% lightness from base |
| `--surface-elevated` | Alias for --popover | `30 2.4% 16.5%` | Explicit surface tier name |
| `--muted` | Disabled/inactive backgrounds | `30 2.8% 14.5%` | Same as secondary |
| `--input` | Input field backgrounds | `30 3.0% 12.9%` | Same as raised surface |

### 7.2 Text Hierarchy

| Token | Role | V1 Value | Usage |
|-------|------|----------|-------|
| `--foreground` | Primary text | `0 10% 88%` (#e4dbd9) | Body text, headings, primary labels |
| `--foreground-secondary` | Mid-tone text | `0 5% 74%` (~#bdb9b9) | Secondary labels, timestamps, metadata |
| `--muted-foreground` | Dim text | `0 3% 59%` (#989494) | Placeholders, disabled text, subtle hints |
| `--card-foreground` | Text on card surfaces | `0 10% 88%` | Same as foreground (on raised surfaces) |
| `--popover-foreground` | Text on elevated surfaces | `0 10% 88%` | Same as foreground (on overlays) |
| `--primary-foreground` | Text on primary-colored backgrounds | `30 3.8% 10.2%` | Dark text on dusty rose buttons |
| `--destructive-foreground` | Text on destructive backgrounds | `0 10% 88%` | Light text on red backgrounds |

### 7.3 Accent & Semantic Colors

| Token | Role | V1 Value | Usage |
|-------|------|----------|-------|
| `--primary` | Primary accent (dusty rose) | `4 54.7% 62.7%` (#D4736C) | Buttons, links, focus rings, active states |
| `--accent` | Accent (same as primary in V1) | `4 54.7% 62.7%` | Interactive highlights |
| `--destructive` | Destructive actions | `0 50% 50%` (#bf4040) | Delete buttons, error states |
| `--ring` | Focus ring color | `4 54.7% 62.7%` | Focus-visible outline |
| `--border` | Border color (used at low opacity) | `0 0% 100%` | Applied as `border-border/8` (8% white) |

### 7.4 Rose Accent Variants

| Token | Role | V1 Value | Usage |
|-------|------|----------|-------|
| `--rose-accent` | Rose for decorative/functional accents | `4 54.7% 62.7%` | Tool pulse animation, streaming indicators |
| `--rose-text` | Lighter rose for readable text | `352 50% 75%` | Rose-tinted text, link hover states |
| `--rose-focus-glow` | Rose for focus glow effects | `4 54.7% 62.7%` | Box-shadow on focused inputs |
| `--rose-selection` | Rose for text selection | `4 54.7% 62.7%` | `::selection` background |

### 7.5 Status Colors

| Token | Role | V1 Value |
|-------|------|----------|
| `--status-connected` | Success/connected state | `140 35% 50%` |
| `--status-reconnecting` | Warning/reconnecting state | `35 50% 55%` |
| `--status-disconnected` | Disconnected state | `0 40% 50%` |
| `--status-error` | Error state | `0 45% 48%` |
| `--status-info` | Informational/link blue | `201 50% 61%` |

### 7.6 Diff Colors

| Token | Role | V1 Value |
|-------|------|----------|
| `--diff-added-bg` | Added lines background | `140 35% 12%` |
| `--diff-removed-bg` | Removed lines background | `0 35% 14%` |

### 7.7 FX Tokens (Ambient & Aurora)

| Token | Role | V1 Value |
|-------|------|----------|
| `--fx-gradient-rose` | Ambient gradient: rose | `0 40% 65%` |
| `--fx-gradient-violet` | Ambient gradient: violet | `270 35% 60%` |
| `--fx-gradient-teal` | Ambient gradient: teal | `180 30% 55%` |
| `--fx-gradient-amber` | Ambient gradient: warm amber | `30 40% 60%` |
| `--fx-ambient-speed` | Ambient cycle duration | `45s` |
| `--fx-ambient-opacity` | Ambient gradient max opacity | `0.04` |
| `--fx-aurora-speed` | Aurora shimmer cycle speed | `4s` |
| `--fx-aurora-blur` | Aurora shimmer blur radius | `6px` |
| `--fx-aurora-pulse-min` | Aurora shimmer min opacity | `0.3` |
| `--fx-aurora-pulse-max` | Aurora shimmer max opacity | `0.6` |

### 7.8 Glassmorphic Tokens

| Token | Role | V1 Value |
|-------|------|----------|
| `--glass-blur` | Blur radius for frosted surfaces | `16px` |
| `--glass-saturate` | Saturation boost for frosted surfaces | `1.4` |
| `--glass-bg-opacity` | Background opacity for glass surfaces | `0.7` |

### 7.9 Transition Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `100ms` | Active/press states |
| `--transition-normal` | `200ms` | Hover states, color transitions |
| `--transition-slow` | `300ms` | Layout changes, expand/collapse |

### 7.10 Z-Index Dictionary

(See Section 3.3 above for the full table.)

### 7.11 Typography

| Token/Value | Role |
|------------|------|
| `'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', 'Consolas', monospace` | Body/UI font (monospace-first identity) |
| `'Instrument Serif', Georgia, serif` | Editorial/display headers [NEEDS REVIEW -- not yet implemented in V1] |
| `'JetBrains Mono', monospace` | Code blocks (same family, distinct via background) |
| `13px` | Base font size |
| `1.5` | Base line height |
| `-0.01em` | Base letter spacing |

### 7.12 Spacing Scale

V2 follows Tailwind's 4px grid. No custom spacing tokens beyond the standard scale.

| Tailwind Class | Value | Common Usage |
|---------------|-------|-------------|
| `p-1` / `gap-1` | 4px | Tight internal spacing, icon gaps |
| `p-2` / `gap-2` | 8px | Standard internal padding |
| `p-3` / `gap-3` | 12px | Card internal padding |
| `p-4` / `gap-4` | 16px | Section spacing |
| `p-6` / `gap-6` | 24px | Between message groups |
| `p-8` / `gap-8` | 32px | Between conversation turns |

### 7.13 Border & Separator Conventions

- REQUIRED: All visible borders use `border-border` at low opacity: `border-border/8` (standard) or `border-border/12` (emphasized).
- BANNED: Borders using `border-gray-*` or hardcoded colors.
- REQUIRED: Horizontal separators between sections use `<div className="h-px bg-border/8" />`, not `<hr>`.
- REQUIRED: Border radius uses the design token scale: `rounded-sm` (calc(var(--radius) - 4px)), `rounded-md` (calc(var(--radius) - 2px)), `rounded-lg` (var(--radius)).

### 7.14 Token File Rule

- REQUIRED: ALL color tokens live in a single `:root` block in one CSS file.
- BANNED: Splitting color tokens across multiple CSS files.
- RATIONALE: During palette tuning, you must see all color values simultaneously to ensure harmony.

---

## 8. Error Handling

### 8.1 Three-Tier Error Boundary Pattern

Loom V2 implements 3 levels of React Error Boundaries:

| Level | Catches | Fallback UI | Recovery |
|-------|---------|-------------|---------|
| **App-level** | Uncaught errors in the entire React tree | Full-screen "Something went wrong" + reload button | Page reload |
| **Panel-level** | Errors in sidebar, chat view, or artifact panel independently | Panel-specific error card: "This panel encountered an error" + retry button | Panel re-mount |
| **Message-level** | Errors in individual `TurnBlock` / `MessageComponent` rendering | Inline "Failed to render this message" placeholder | Re-render attempt on click |

- REQUIRED: The app shell mounts an App-level ErrorBoundary at the root.
- REQUIRED: Each major panel (sidebar, chat viewport, artifact panel) has its own Panel-level ErrorBoundary.
- REQUIRED: Each `TurnBlock` in the message list is wrapped in a Message-level ErrorBoundary.
- RATIONALE: A malformed markdown fragment, unexpected tool output JSON, or race condition during reconnection must not crash the entire application.

### 8.2 Async Error Handling

- REQUIRED: All `async` functions in stores and hooks use try/catch.
- REQUIRED: Fetch errors are caught and dispatched to the toast system (transient) or displayed inline (persistent).
- BANNED: Swallowing errors silently. `catch (e) { /* do nothing */ }` -- BANNED.
- REQUIRED: Errors from WebSocket message handling are caught at the message handler level and dispatched to the appropriate UI feedback mechanism.

```tsx
// CORRECT
try {
  const sessions = await apiFetch<Session[]>('/api/sessions');
  useTimelineStore.getState().setSessions(sessions);
} catch (error) {
  toast.error('Failed to load sessions');
  console.error('Session fetch failed:', error);
}

// BANNED
const sessions = await fetch('/api/sessions').then(r => r.json()); // No error handling, untyped
```

### 8.3 Toast vs Inline Error Distinction

| Error Type | Display Mechanism | Duration | Example |
|-----------|-------------------|----------|---------|
| Transient / recoverable | Sonner toast | Auto-dismiss 4-5s | "Connection lost. Reconnecting..." |
| User-actionable | Sonner toast with action | Persistent until dismissed | "Session expired. [Sign in again]" |
| Fatal / permanent | Inline banner in message flow | Persistent | "Process crashed with exit code 1" |
| Network re-established | Sonner success toast | Auto-dismiss 3s | "Reconnected" |

### 8.4 Toast Rules

- REQUIRED: Toasts render via `ReactDOM.createPortal` to `document.body`. NEVER inside the scroll container.
- REQUIRED: Toast z-index uses `--z-toast` (60).
- RATIONALE: Toasts inside the scroll container alter scroll height, fighting the IntersectionObserver sentinel and causing unexpected scroll jumps during streaming.

---

## 9. Accessibility Minimums

### 9.1 ARIA Landmarks on Shell Regions

| Region | Role | Notes |
|--------|------|-------|
| Chat message container | `role="log"` + `aria-live="polite"` | Screen readers announce new messages without interrupting |
| Sidebar | `role="complementary"` + `aria-label="Conversation history"` | Identifies sidebar purpose |
| Chat input | `role="textbox"` + `aria-label="Message input"` | Identifies input purpose |
| Header | `role="banner"` | Standard landmark |
| Main content area | `role="main"` | Standard landmark |
| Modal dialogs | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` | Required for modal accessibility |

### 9.2 Keyboard Navigation

- REQUIRED: All interactive elements are focusable via Tab.
- REQUIRED: Modals implement focus trapping -- Tab cycles within the modal, not behind it.
- REQUIRED: Escape closes modals, dropdowns, and overlays.
- REQUIRED: Enter/Space activates buttons and toggles.
- REQUIRED: Arrow keys navigate within lists (sidebar session list, message list).
- GUIDELINE: Implement `Cmd+K` / `Ctrl+K` for the command palette (Phase 6).

### 9.3 prefers-reduced-motion Support

- REQUIRED: All animations respect `prefers-reduced-motion: reduce`.
- REQUIRED: When reduced motion is preferred, animations either:
  - Are disabled entirely (opacity fades replaced with instant transitions), OR
  - Use `duration: 0.01ms` to maintain the animation lifecycle (for `AnimatePresence`-style exit patterns) without visible motion.
- REQUIRED: The ambient gradient animation stops when `prefers-reduced-motion: reduce` is active (already implemented in V1).

### 9.4 Color Contrast

- REQUIRED: All text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text) against its background surface.
- REQUIRED: The rose text variant (`--rose-text`) passes WCAG AA on all surface tiers.
- GUIDELINE: Test with Chrome DevTools accessibility audit during each phase verification.

### 9.5 Screen Reader Announcements

- REQUIRED: Streaming status changes are announced via `aria-live="polite"` regions. Not every token -- only state transitions: "Started generating", "Generation complete", "Tool executing: read file".
- REQUIRED: Error toasts use `role="alert"` for immediate announcement.
- REQUIRED: Loading states have `aria-busy="true"` on the container.

---

## 10. Performance Rules

### 10.1 The Active Message Isolation Pattern

- REQUIRED: Only the currently streaming message component subscribes to the token stream. All past messages are rendered from static data and wrapped in `React.memo`.
- REQUIRED: Adding message N to the timeline MUST NOT re-render messages 1 through N-1.
- VERIFICATION: React DevTools Profiler showing zero re-renders on past messages during active streaming.

### 10.2 requestAnimationFrame Token Buffer

- REQUIRED: The network layer receives raw token chunks and pushes them into a buffer.
- REQUIRED: The UI layer consumes from the buffer in a `requestAnimationFrame` loop, batching tokens into smooth visual updates.
- BANNED: Updating React state on every individual token chunk.
- RATIONALE: At 50-100 tokens/sec, each state update triggers reconciliation. The rAF buffer decouples network frequency from render frequency.

### 10.3 CSS Containment on Streaming Messages

- REQUIRED: The actively streaming message element has `contain: content` applied via CSS class.
- RATIONALE: Prevents token-by-token DOM mutations from triggering ancestor layout recalculations. The browser can skip reflow for elements outside the contained subtree.

### 10.4 React 18 Concurrent Features

- REQUIRED: `useTransition` wraps message list updates -- marks past-message re-renders as non-urgent, keeping the input responsive.
- REQUIRED: `useDeferredValue` on the markdown AST -- raw text renders immediately while parsed/highlighted version catches up.
- REQUIRED: `startTransition` on session switching -- prevents UI freeze when loading long conversation histories.
- REQUIRED: `<Suspense>` boundaries at the panel level for lazy-loaded content (settings, artifact panel).

### 10.5 content-visibility for Past Messages

- REQUIRED: Past (non-streaming) message elements use `content-visibility: auto` with `contain-intrinsic-size` set to an estimated height.
- RATIONALE: Offloads rendering cost for off-screen messages to the browser without destroying DOM nodes, keeping scroll math intact.
- NOTE: If `content-visibility` proves insufficient for very long conversations (2000+ messages), escalate to `@tanstack/react-virtual`. This is a documented escape hatch, not a Phase 1 requirement.

### 10.6 Bundle Size Discipline

- BANNED: Importing full Framer Motion (`motion` package). Use the tiered approach: CSS-only first, LazyMotion + domAnimation for complex cases, full Motion lazy-loaded only for orchestrated sequences.
- REQUIRED: Syntax highlighting languages loaded dynamically per-language, not bundled. Shiki language grammars load on first encounter of that language.
- REQUIRED: Heavy components (Settings modal, Artifact panel, file explorer) are lazy-loaded with `React.lazy` + `<Suspense>`.

---

## 11. Motion & Animation

### 11.1 Tiered Animation Strategy

| Tier | Mechanism | Bundle Cost | Use For |
|------|-----------|-------------|---------|
| **Tier 1: CSS-only** | CSS `transition`, `@keyframes`, `animation` | 0KB | Hover states, opacity fades, color transitions, button press scale, expand/collapse via grid-rows |
| **Tier 2: tailwindcss-animate** | CSS classes: `animate-in`, `fade-in-0`, `slide-in-from-bottom-2` | 0KB (CSS plugin) | Message entrance, modal overlay fade, toast entrance |
| **Tier 3: LazyMotion + domAnimation** | Tree-shakeable Framer Motion subset | ~5KB | Complex multi-step animations (artifact panel spring, sidebar orchestration) [NEEDS REVIEW -- may not be needed if CSS covers all cases] |

### 11.2 Easing Tokens

| Name | Value | Usage |
|------|-------|-------|
| Default (Tailwind `ease-out`) | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions |
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Fast start, gentle decelerate -- panel slides |
| Spring approximation | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot for button press and micro-interactions |

### 11.3 Duration Scale

| Duration | Value | Usage |
|----------|-------|-------|
| Fast | `100ms` | Active/press states, icon swaps |
| Normal | `150-200ms` | Hover transitions, color changes |
| Slow | `300ms` | Layout changes, expand/collapse, modal transitions |
| Slower | `500ms` | Page-level transitions, artifact panel slide |

### 11.4 Animation Performance Rules

- **BANNED: Animating `height`, `width`, `top`, `left`, or `margin` during streaming.** These trigger layout recalculation that competes with the rAF token buffer.
- REQUIRED: Expand/collapse animations use CSS Grid `grid-template-rows: 0fr / 1fr` with `transition-[grid-template-rows]`.
- REQUIRED: Continuous animations (spinners, aurora) use `will-change: transform` and GPU-composited properties only (`transform`, `opacity`, `filter`).
- BANNED: `will-change` on hover transitions. Only on elements with continuous animation.
- REQUIRED: Toast animations use `position: fixed` via portal. Never inside the scroll container.

---

## 12. Markdown & Rendering

### 12.1 Parser Architecture

- REQUIRED: Use `react-markdown` with `remark` (GFM support) and `rehype` plugins.
- REQUIRED: Markdown parsing is debounced during streaming -- not on every token. Trigger on newline `\n`, sentence-end punctuation, or a 50ms idle window.
- REQUIRED: Custom remark plugins detect unclosed code blocks during streaming and inject closing tags so the UI renders the code block container immediately, preventing layout flash.

### 12.2 Code Block Requirements

- REQUIRED: Syntax highlighting via Shiki, loaded lazily per-language.
- REQUIRED: While a language grammar loads, code renders as plain monospaced text in the code block container (no flash of unstyled text, no layout shift).
- REQUIRED: Code blocks have a header bar showing the language label and a copy button.
- REQUIRED: The copy button shows "Copied!" feedback for 2 seconds after click.

### 12.3 Table Handling

- REQUIRED: Tables are wrapped in a horizontally scrollable container. Tables MUST NOT overflow the message width.
- REQUIRED: During streaming, table rendering is deferred until the closing `|` row is detected (or 100ms of no new `|` characters), preventing wild reflow as columns appear.

### 12.4 Long Content Handling

- REQUIRED: Long unbreakable strings (URLs, file paths, hashes) use `word-break: break-all` or `overflow-wrap: break-word`.
- REQUIRED: Inline code uses `overflow-x: auto` if it exceeds container width.
- REQUIRED: Links render with `target="_blank"` and `rel="noopener noreferrer"`.

---

## 13. Touch Target & Focus Standards

### 13.1 Mobile Touch Target Minimum (44px)

All interactive elements MUST have a minimum 44px touch target height on mobile (< 768px breakpoint).

**Tailwind pattern (for .tsx files):**
```
min-h-[44px] md:min-h-0
```
For icon-only buttons (square targets), add width:
```
min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0
```

**CSS pattern (for .css files):**
```css
@media (max-width: 767px) {
  .selector {
    min-height: 44px;
  }
}
```

**Rules:**
- Every `min-h-[44px]` MUST pair with `md:min-h-0` to revert on desktop
- Every CSS `min-height: 44px` MUST be inside `@media (max-width: 767px)`
- Use ONE sizing mechanism per element: min-height OR padding, never both (double-padding trap)
- Elements should use `flex items-center` to vertically center content within the taller target

### 13.2 Focus Ring Standard

All custom interactive elements MUST use the shadcn focus ring pattern.

**Tailwind pattern:**
```
focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
```

**CSS pattern:**
```css
.selector:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px oklch(from var(--ring) l c h / 0.5);
}
```

**Rules:**
- Components using `Button` from `ui/button.tsx` inherit the correct ring -- no action needed
- Custom interactive elements (divs with onClick, raw buttons) MUST add the ring explicitly
- BANNED: `focus-visible:ring-2` (2px too narrow), `box-shadow: 0 0 0 2px var(--accent-primary)` (non-standard)
- The `--ring` CSS custom property is the single source of truth for ring color
- **Exception:** `SkipLink.tsx` uses `focus:ring-2` (not `focus-visible:`) intentionally -- skip links must respond to all focus events including programmatic focus for accessibility

### 13.3 Reference Implementations

- **Touch target**: `SessionItem.tsx` line 161 (`min-h-[44px] md:min-h-0`)
- **Touch target (icon)**: `Sidebar.tsx` hamburger button (`min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0`)
- **Touch target (CSS)**: `tool-chip.css` (`@media (max-width: 767px) { .tool-chip { min-height: 44px; } }`)
- **Focus ring (Tailwind)**: `ui/button.tsx` (`focus-visible:ring-[3px] focus-visible:ring-ring/50`)
- **Focus ring (CSS)**: `tool-card-shell.css` (`.tool-card-shell-header:focus-visible`)

---

## Appendix A: Banned Patterns Quick Reference

| Pattern | Reason | Alternative |
|---------|--------|-------------|
| `bg-gray-*`, `text-gray-*`, `border-gray-*` | Bypasses token system | `bg-card`, `text-muted-foreground`, `border-border/8` |
| `bg-[#hexcolor]` | Hardcoded, unthemeable | `bg-[hsl(var(--token))]` or semantic class |
| `style={{ color: '#hex' }}` | Bypasses token system | `className="text-primary"` |
| `const store = useStore()` | Whole-store subscription | `useStore(state => state.slice)` |
| `any` type | Unsafe, hides bugs | Proper type or `unknown` |
| `as SomeType` (without comment) | Unsafe cast | Narrow the type, or add SAFETY comment |
| `enum Foo {}` | Runtime JS, no tree-shake | String literal union |
| `export default function` | Inconsistent imports | `export const Component = ...` |
| `z-[999]` or raw `z-50` | Outside z-index dictionary | `z-[var(--z-modal)]` |
| `p-[13px]` | Off the 4px grid | `p-3` (12px) or `p-4` (16px) |
| `catch (e) {}` | Silent error swallowing | Log + toast/display |
| `React.Context` for fast-changing state | Re-renders all consumers | Zustand with selectors |
| Animating `height`/`width` during streaming | Layout thrash | CSS Grid `grid-template-rows` |
| `will-change` on hover transitions | Unnecessary GPU memory | Only for continuous animations |
| String concatenation for className | Fragile, no merge | `cn()` utility |

---

## Appendix B: Linting & Enforcement [NEEDS REVIEW]

The following rules should be configured in ESLint / Biome to enforce the Constitution automatically:

1. **`@typescript-eslint/no-explicit-any`** -- error level. Enforces Section 5.2.
2. **`@typescript-eslint/no-non-null-assertion`** -- error level. Enforces Section 5.2.
3. **`no-restricted-syntax` for `enum`** -- error level. Enforces Section 5.5.
4. **`import/no-default-export`** -- error level (with route page exception). Enforces Section 2.2.
5. **Custom rule or grep-check: no hardcoded Tailwind color utilities** -- CI check. Enforces Section 3.1.
6. **Custom rule or grep-check: no `bg-[#` or `text-[#` patterns** -- CI check. Enforces Section 3.1.
7. **Custom rule: no whole-store Zustand subscription** -- custom lint rule or code review check. Enforces Section 4.2.

Exact ESLint/Biome config will be defined during Phase 1 setup.

---

## Appendix C: File Naming Quick Reference

```
src/
  components/
    chat/
      view/
        ChatViewport.tsx          # PascalCase component
        ChatViewport.test.tsx     # Collocated test
      subcomponents/
        TurnBlock.tsx
        TurnBlock.test.tsx
        ActiveMessage.tsx
        ActiveMessage.test.tsx
      composer/
        ChatComposer.tsx
        ChatComposer.test.tsx
      tools/
        ToolActionCard.tsx
        ToolActionCard.test.tsx
      styles/
        aurora-shimmer.css        # kebab-case CSS
        streaming-cursor.css
    shared/
      Button.tsx
      Button.test.tsx
      Modal.tsx
      index.ts                    # ONLY shared/ gets a barrel file
  hooks/
    useScrollAnchor.ts            # camelCase, use-prefixed
    useScrollAnchor.test.ts
  stores/
    timeline.ts                   # camelCase, singular noun
    timeline.test.ts
    stream.ts
    ui.ts
    connection.ts
  types/
    messages.ts                   # camelCase
    websocket.ts
    api.ts
  utils/
    formatTime.ts                 # camelCase
    parseTokens.ts
  styles/
    index.css                     # Global tokens + base styles
  lib/
    wsClient.ts                   # WebSocket client wrapper
    apiClient.ts                  # HTTP fetch wrapper
```

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-04 | 0.1 | Claude (Constitution Drafter) | Initial draft based on ARCHITECT_SYNC, UI_COMPONENT_ARCHITECTURE, V2_REWRITE_PLAYBOOK, CLOUDCLI_FEATURE_SYNTHESIS, chat-interface-standards, STACK, ARCHITECTURE research docs |

---

*This is a DRAFT. Items marked [NEEDS REVIEW] require team-lead approval before becoming enforceable.*
