# Phase 16: Sidebar & Global Polish - Research

**Researched:** 2026-03-03
**Domain:** CSS/Tailwind styling, React component layout, sidebar UX patterns
**Confidence:** HIGH

## Summary

Phase 16 is a pure styling and layout phase -- no new libraries are needed. All changes use existing Tailwind CSS utilities, CSS custom properties from the design system (Phase 10), and React component patterns already established in the codebase. The work involves: (1) adding time-based session grouping logic to the sidebar, (2) increasing session list density, (3) enhancing the collapsed sidebar strip, (4) restyling settings/modals/dialogs with charcoal+rose palette, and (5) applying consistent palette treatment to mobile navigation.

**Primary recommendation:** Group sessions by time category at the `SidebarProjectSessions` level using a pure utility function, restyle all non-chat surfaces to eliminate blue-600 and hardcoded color artifacts, and use the existing `nav-glass` pattern for modal glassmorphism.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Sessions grouped by time categories: Today, Yesterday, Last 7 Days, Older
- Group headers are collapsible with chevron toggle and session counts
- Active session highlighted with 2px dusty rose left border + subtle bg-accent tint (replaces current green dot)
- Compact single-line density: session name + tiny timestamp on one line, ~28-30px per row (like Claude.ai sidebar)
- Provider logo remains as small inline icon
- Collapsed strip shows navigation icons only: expand, new session, settings, update indicator
- Smooth width animation from 48px to 288px (w-72) over ~200ms with content fade-in after width settles
- Collapsed strip width stays at current 48px
- No keyboard shortcut for toggle -- deferred to ADV-01
- Settings keeps full-screen overlay pattern, restyled with charcoal surfaces and rose accents
- Replace blue-600 settings icon and save button with dusty rose primary color
- All modal/dialog backdrops use glassmorphic blur: backdrop-blur-xl with bg-background/60
- Confirmation dialogs (delete session, delete project) get both palette swap AND layout refresh
- Dusty rose as primary action color across all modals/settings (replacing blue-600)
- Keep floating glassmorphic bottom bar style -- just apply charcoal+rose palette treatment
- Active tab uses rose pill behind icon+label (replacing current primary color highlight)
- Mobile sidebar gets same time-grouping treatment as desktop (Today/Yesterday/Older)
- Keep separate mobile-optimized card style for session items -- don't converge with desktop ghost buttons

### Claude's Discretion
- Exact animation easing curves and timing
- Group header typography and spacing
- Session item hover/focus states on desktop
- Modal border radius and shadow intensity
- Mobile safe-area handling details

### Deferred Ideas (OUT OF SCOPE)
- Keyboard shortcut for sidebar toggle (Cmd/Ctrl+B) -- belongs in ADV-01
- Session search and filtering -- belongs in ADV-02
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIDE-01 | Sidebar fully restyled with charcoal palette, density improvements, and tighter spacing | Compact density pattern (~28-30px rows), design token usage, existing bg-background/80 sidebar surface |
| SIDE-02 | Settings panel fully matches charcoal + rose theme -- no gray/blue/white artifacts | Settings.tsx audit shows blue-600 on icon + save button, bg-background/95 backdrop needs glassmorphic treatment |
| SIDE-03 | Mobile navigation matches charcoal + rose theme at 375px+ viewports | MobileNav.jsx audit shows nav-glass already applied; active pill needs rose treatment instead of primary/8 |
| SIDE-04 | All modals and dialogs use charcoal palette with glassmorphic blur backgrounds | SidebarModals.tsx audit shows bg-black/60 backdrop-blur-sm on confirmations; needs upgrade to backdrop-blur-xl + bg-background/60 |
| SIDE-05 | Session list grouped by time categories (Today, Yesterday, Last 7 Days, Older) | New groupSessionsByTime utility function; integration at SidebarProjectSessions level |
| SIDE-06 | Active session shows 2px dusty rose left border with subtle bg-accent tinted background | Replace current green-500 dot indicator in SidebarSessionItem with border-l-2 border-primary + bg-accent/10 |
| SIDE-07 | Sidebar collapses to icon-only strip with session icons | SidebarCollapsed.tsx needs new-session button and content fade-in animation on expand |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.x | Utility classes for all styling | Already in use throughout project |
| React | 18.x | Component structure | Already in use |
| lucide-react | latest | Icon set | Already in use for all sidebar/settings icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS Custom Properties | N/A | Design system tokens (--background, --primary, --accent, etc.) | All color references |
| cn() utility | N/A | Conditional class merging | All dynamic styling |

### Alternatives Considered
None -- this phase uses only existing tools. No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/sidebar/
│   ├── hooks/useSidebarController.ts     # State management (exists)
│   ├── utils/utils.ts                    # Utility functions (exists, add grouping)
│   └── view/subcomponents/
│       ├── SidebarProjectSessions.tsx     # Add time-group wrapper
│       ├── SidebarSessionItem.tsx         # Density + active indicator
│       ├── SidebarCollapsed.tsx           # Expanded icon strip
│       ├── SidebarContent.tsx             # Width animation
│       ├── SidebarFooter.tsx              # Blue artifact cleanup
│       └── SidebarModals.tsx              # Glassmorphic backdrop
├── components/settings/view/
│   └── Settings.tsx                       # Charcoal+rose restyle
├── components/MobileNav.jsx              # Rose pill active state
└── utils/dateUtils.ts                     # Add getTimeCategory()
```

### Pattern 1: Time-Based Session Grouping
**What:** Group sessions into time buckets (Today, Yesterday, Last 7 Days, Older) using a pure utility function
**When to use:** In SidebarProjectSessions, wrapping the flat session list
**Example:**
```typescript
// src/utils/dateUtils.ts
type TimeCategory = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Older';

export function getTimeCategory(dateString: string, now: Date): TimeCategory {
  const date = new Date(dateString);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'Last 7 Days';
  return 'Older';
}

export function groupSessionsByTime<T extends { lastActivity?: string; createdAt?: string }>(
  sessions: T[],
  now: Date,
): Map<TimeCategory, T[]> {
  const groups = new Map<TimeCategory, T[]>();
  const order: TimeCategory[] = ['Today', 'Yesterday', 'Last 7 Days', 'Older'];
  order.forEach(cat => groups.set(cat, []));

  for (const session of sessions) {
    const dateStr = session.lastActivity || session.createdAt || '';
    const category = getTimeCategory(dateStr, now);
    groups.get(category)!.push(session);
  }

  // Remove empty groups
  for (const [key, value] of groups) {
    if (value.length === 0) groups.delete(key);
  }

  return groups;
}
```

### Pattern 2: Collapsible Group Header
**What:** A lightweight inline header with chevron toggle, group name, and session count
**When to use:** Between time-grouped session clusters in the sidebar
**Example:**
```tsx
// Inline within SidebarProjectSessions -- no need for separate component
<button
  onClick={() => toggleGroup(category)}
  className="flex items-center gap-1.5 px-2 py-1 w-full text-left"
>
  <ChevronRight className={cn(
    'w-3 h-3 text-muted-foreground transition-transform duration-150',
    isGroupExpanded && 'rotate-90'
  )} />
  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
    {category}
  </span>
  <span className="text-[10px] text-muted-foreground/60 ml-auto">
    {sessions.length}
  </span>
</button>
```

### Pattern 3: Active Session Indicator (Rose Left Border)
**What:** Replace the green dot with a 2px dusty rose left border and subtle accent background
**When to use:** On the active/selected session item
**Example:**
```tsx
// SidebarSessionItem desktop variant
<Button
  variant="ghost"
  className={cn(
    'w-full justify-start p-2 h-auto font-normal text-left hover:bg-accent/50 transition-colors duration-200',
    isSelected && 'border-l-2 border-primary bg-accent/10',
  )}
>
```

### Pattern 4: Glassmorphic Modal Backdrop
**What:** Consistent backdrop for all modals using the nav-glass pattern
**When to use:** All confirmation dialogs and settings overlay
**Example:**
```tsx
// Replace: bg-black/60 backdrop-blur-sm
// With:    bg-background/60 backdrop-blur-xl
<div className="fixed inset-0 bg-background/60 backdrop-blur-xl flex items-center justify-center z-[var(--z-modal)] p-4">
```

### Pattern 5: Sidebar Width Animation
**What:** Smooth expand/collapse with CSS transition on width, content fade-in after width settles
**When to use:** SidebarContent wrapper
**Example:**
```tsx
// CSS approach using transition on width
<div
  className={cn(
    'h-full flex flex-col bg-background/80 backdrop-blur-sm transition-[width] duration-200 ease-out overflow-hidden',
    isCollapsed ? 'w-12' : 'md:w-72'
  )}
>
  {/* Content fades in after expand completes */}
  <div className={cn(
    'transition-opacity duration-150 delay-100',
    isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
  )}>
    {/* Sidebar content */}
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Hardcoded colors:** Never use `bg-blue-600`, `text-green-500`, `bg-red-50` etc. Use design system tokens: `bg-primary`, `text-primary`, `bg-destructive/10`
- **Inline dark mode classes:** The codebase has patterns like `bg-red-100 bg-red-900/30` (both light and dark in same string) -- replace with token-based classes that work in dark mode automatically
- **Separate mobile/desktop session grouping logic:** Use the same `groupSessionsByTime` utility for both mobile and desktop rendering paths
- **JavaScript-driven animations for sidebar width:** CSS transitions on `width` are smooth and GPU-accelerated; no need for `requestAnimationFrame` or JS animation libraries

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time category calculation | Custom date math | Simple comparison against midnight/yesterday/week-ago boundaries | Edge cases with timezones, DST changes |
| Glassmorphic blur | Custom CSS | Existing `nav-glass` CSS class pattern + Tailwind `backdrop-blur-xl` | Consistency with Phase 14 patterns |
| Icon set | Custom SVGs | lucide-react icons already used throughout | Consistency, size optimization |
| Scroll area | Custom scrollbar | Existing `ScrollArea` component from shadcn/ui | Already handles overflow, custom scrollbar styling |

**Key insight:** This phase is entirely about visual consistency and layout refinement. Every pattern needed already exists somewhere in the codebase -- the work is standardizing and propagating those patterns.

## Common Pitfalls

### Pitfall 1: Session Time Field Inconsistency
**What goes wrong:** Sessions might use different date fields (`lastActivity`, `createdAt`, `timestamp`) for their time
**Why it happens:** Multiple session providers (Claude, Codex, Gemini) may structure data differently
**How to avoid:** Check the `createSessionViewModel` utility in `src/components/sidebar/utils/utils.ts` -- it normalizes session data. Use `sessionView.sessionTime` which is already the resolved timestamp
**Warning signs:** Sessions appearing in wrong time groups or all falling into "Older"

### Pitfall 2: Blue-600 Artifact Scatter
**What goes wrong:** Missing a `blue-600` or `blue-500` reference in settings/modals leaves visual inconsistency
**Why it happens:** Hardcoded color references are spread across 20+ files (72 total occurrences detected)
**How to avoid:** Phase 16 scope is limited to sidebar, settings, modals, and mobile nav files only. Do a targeted sweep of the specific files being modified. Other files (DiffViewer, LoginForm, etc.) are out of scope.
**Warning signs:** Blue accents visible on settings icon, save button, update badges, or MCP form buttons

### Pitfall 3: Mobile Safe Area Inset Gaps
**What goes wrong:** Content gets clipped behind notch/home indicator on iOS devices
**Why it happens:** `env(safe-area-inset-bottom)` is not always applied or has 0 fallback
**How to avoid:** The existing `pb-safe-area-inset-bottom` pattern in MobileNav and Settings footer is correct -- preserve it during restyling
**Warning signs:** Bottom buttons unreachable on iPhone 14/15 in Safari

### Pitfall 4: Sidebar Expand Animation Glitch
**What goes wrong:** Content appears before width animation completes, causing visual jank
**Why it happens:** Opacity transition isn't delayed relative to width transition
**How to avoid:** Use `transition-opacity duration-150 delay-100` so content fades in ~100ms after the 200ms width animation starts. On collapse, remove the delay so content fades out immediately.
**Warning signs:** Text/icons visible in a narrow sliver during expand animation

### Pitfall 5: Collapsed Group State Reset
**What goes wrong:** Collapsed time groups reset to expanded when sessions update
**Why it happens:** Group collapse state is stored in component state but re-renders discard it
**How to avoid:** Store collapsed groups in a `Set<TimeCategory>` state variable in the parent component, not in the group header itself
**Warning signs:** Groups unexpectedly expanding when `currentTime` updates every 60 seconds

## Code Examples

### Current Files Requiring Changes

#### 1. SidebarSessionItem.tsx (SIDE-01, SIDE-06)
**Current:** Green dot active indicator, two-line layout, ~40px row height
**Target:** Rose left border, single-line compact layout, ~28-30px row height
**Key changes:**
- Remove green-500 dot div entirely
- Desktop: Replace `Button variant="ghost"` with a simpler div, reduce padding to `px-2 py-1`
- Add `border-l-2 border-primary bg-accent/10` when `isSelected`
- Single line: session name + timestamp on same line with `flex items-center gap-2`
- Provider logo inline at start, timestamp pushed to end with `ml-auto`

#### 2. SidebarProjectSessions.tsx (SIDE-05)
**Current:** Flat `sessions.map()` rendering
**Target:** Grouped by time category with collapsible headers
**Key changes:**
- Import and call `groupSessionsByTime(sessions, currentTime)`
- Render groups with inline header buttons
- Track collapsed groups in local state
- Preserve "New Session" and "Show more" buttons outside of groups

#### 3. SidebarCollapsed.tsx (SIDE-07)
**Current:** Expand, Settings, and Update buttons only
**Target:** Add New Session button, refine styling
**Key changes:**
- Add `Plus` icon button for new session (needs `onNewSession` prop)
- Keep existing buttons, ensure consistent spacing
- Use `nav-divider` between icon groups

#### 4. Settings.tsx (SIDE-02)
**Current:** `blue-600` on settings icon and save button, `bg-background/95` backdrop
**Target:** Primary (dusty rose) color for accents, glassmorphic backdrop
**Key changes:**
- Replace `text-blue-600` on SettingsIcon with `text-primary`
- Replace `bg-blue-600 hover:bg-blue-700` on save button with `bg-primary hover:bg-primary/90`
- Replace `bg-background/95` modal backdrop with `bg-background/60 backdrop-blur-xl`

#### 5. SidebarModals.tsx (SIDE-04)
**Current:** `bg-black/60 backdrop-blur-sm` on confirmation dialogs, hardcoded red-100/red-900 colors
**Target:** `bg-background/60 backdrop-blur-xl`, design system token colors
**Key changes:**
- Update both delete confirmation and session delete confirmation backdrops
- Replace `bg-red-100 bg-red-900/30` with `bg-destructive/10`
- Replace `border-red-200 border-red-800` with `border-destructive/20`
- Replace `bg-red-50 bg-red-900/20` warning boxes with `bg-destructive/5 border-destructive/20`

#### 6. MobileNav.jsx (SIDE-03)
**Current:** Active tab uses `bg-primary/8 bg-primary/12` pill
**Target:** Rose pill with slightly more presence
**Key changes:**
- Update active pill to `bg-primary/15` for more visible rose tint
- Verify nav-glass already produces charcoal glassmorphic effect (it does -- Phase 14 tokens)
- Minimal changes needed as MobileNav is already well-styled

#### 7. SidebarFooter.tsx (blue artifact cleanup)
**Current:** `text-blue-500`, `bg-blue-50/80`, `bg-blue-900/15` on update banner
**Target:** Use status tokens or primary color
**Key changes:**
- Replace blue update indicator colors with `text-primary` / `bg-primary/10`

#### 8. SidebarContent.tsx (sidebar width animation)
**Current:** Static `md:w-72` width, no animation
**Target:** Animated width transition from collapsed to expanded
**Key changes:**
- This may need to be handled at the AppContent level since collapsed/expanded currently renders entirely different components (SidebarCollapsed vs SidebarContent)
- Alternative: Unify into a single component that animates width, with content opacity transition

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat session list | Time-grouped (ChatGPT, Claude.ai) | 2024-2025 | Standard UX pattern users expect |
| Colored dot indicators | Left border accent | ChatGPT/Claude.ai 2024 | Cleaner, more professional |
| Opaque modal backdrops | Glassmorphic blur | 2023-2024 | Modern, premium feel |
| Full sidebar or hidden | Collapsible icon strip | VS Code, Cursor | Better space management |

## Open Questions

1. **Sidebar animation architecture**
   - What we know: Currently renders SidebarCollapsed OR SidebarContent as entirely separate components (conditional in Sidebar.tsx)
   - What's unclear: Whether to unify into one animatable component or animate the swap
   - Recommendation: Keep the current two-component approach but wrap in a container with CSS width transition. The collapsed component renders in the narrow state, the expanded in the wide state. Use CSS `overflow: hidden` during transition. This avoids a complex refactor while achieving the visual effect.

2. **Session time field reliability**
   - What we know: `createSessionViewModel` already normalizes session time
   - What's unclear: Whether all providers populate this field consistently
   - Recommendation: The grouping function should fall back to "Older" for sessions with invalid/missing dates

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | N/A |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | N/A |

*Already written to `.planning/config.json` under `tooling` key.*

## Sources

### Primary (HIGH confidence)
- Codebase analysis of all 12 sidebar components, Settings, MobileNav, and related hooks
- Existing CSS custom properties in src/index.css (Phase 10/14 design tokens)
- Current component structure and prop interfaces

### Secondary (MEDIUM confidence)
- ChatGPT/Claude.ai sidebar patterns (based on general knowledge of these products)
- VS Code activity bar pattern for collapsed sidebar

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing tools
- Architecture: HIGH - direct codebase analysis of all affected files
- Pitfalls: HIGH - identified from actual code patterns and data flow

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable -- internal codebase patterns)
