# Phase 35: Quick Settings - Research

**Researched:** 2026-03-17
**Domain:** UI panel component, Zustand state management, keyboard shortcuts
**Confidence:** HIGH

## Summary

Phase 35 adds a quick settings panel accessible from the sidebar footer and via keyboard shortcut. The panel provides toggles for three display preferences: auto-expand tool calls, show thinking blocks, and show raw tool parameters. All three settings must apply immediately without page reload.

The existing codebase already has strong foundations: `thinkingExpanded` is already in the UI store with persist middleware (version 5), the Switch shadcn component is installed, keyboard shortcut patterns are well-established (`useCommandPaletteShortcut`, `useTabKeyboardShortcuts`), and DropdownMenu (Radix) is available. The main work is adding two new boolean fields to the UI store, wiring them through ToolCallGroup/ToolChip/ToolCardShell components, and building the quick settings panel UI.

**Primary recommendation:** Use a Radix Popover (installed via `radix-ui` package already in deps) anchored to a new button in the sidebar footer, with three Switch toggles. Add `autoExpandTools` and `showRawParams` to the UI store alongside existing `thinkingExpanded`. Keyboard shortcut: `Cmd+,` (standard settings shortcut).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UXR-05 | Quick settings panel is accessible from sidebar or keyboard shortcut | Sidebar footer button + Popover panel + `Cmd+,` shortcut; follows existing patterns from CommandPalette and Settings button |
| UXR-06 | Quick settings includes toggles: auto-expand tools, show thinking, show raw params | Three boolean fields in UI store (`thinkingExpanded` exists, add `autoExpandTools` + `showRawParams`); Switch component already installed |
| UXR-07 | Quick settings changes apply immediately without page reload | Zustand selector subscriptions + persist middleware = instant reactivity; existing pattern proven with `thinkingExpanded` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| radix-ui | ^1.4.3 | Popover primitive for panel | Already installed, used by DropdownMenu/Select/Switch |
| zustand | 5 | State management + persist | Existing UI store pattern, persist middleware handles localStorage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Switch | installed | Toggle controls | Already in `src/components/ui/switch.tsx` |
| shadcn Label | installed | Toggle labels | Already in `src/components/ui/label.tsx` |
| lucide-react | installed | Icons (Sliders, SlidersHorizontal) | Sidebar button icon |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Popover panel | DropdownMenu | DropdownMenu closes on any item click, bad for toggles |
| Popover panel | Slide-out drawer | Heavier, overkill for 3 toggles |
| Separate popover | Extend Settings modal | Defeats the "quick" purpose, too heavyweight |

## Architecture Patterns

### Recommended Project Structure
```
src/src/
  components/
    sidebar/
      QuickSettingsPanel.tsx       # Popover with 3 Switch toggles
      QuickSettingsPanel.test.tsx  # Unit tests
      Sidebar.tsx                 # Modified: add trigger button in footer
  hooks/
    useQuickSettingsShortcut.ts    # Cmd+, keyboard handler
    useQuickSettingsShortcut.test.ts
  stores/
    ui.ts                         # Modified: add autoExpandTools, showRawParams
  types/
    ui.ts                         # Modified: no changes needed (fields in store interface)
  components/chat/
    tools/ToolCallGroup.tsx        # Modified: consume autoExpandTools
    tools/ToolChip.tsx             # Modified: consume autoExpandTools
    view/AssistantMessage.tsx      # Modified: pass showRawParams
```

### Pattern 1: UI Store Extension
**What:** Add `autoExpandTools` and `showRawParams` booleans to UIState, persist them, bump version to 6.
**When to use:** This phase.
**Example:**
```typescript
// In stores/ui.ts
interface UIState {
  // ...existing fields...
  autoExpandTools: boolean;
  showRawParams: boolean;

  // ...existing actions...
  toggleAutoExpandTools: () => void;
  toggleShowRawParams: () => void;
}

// partialize adds both new fields
partialize: (state) => ({
  theme: state.theme,
  sidebarOpen: state.sidebarOpen,
  thinkingExpanded: state.thinkingExpanded,
  autoExpandTools: state.autoExpandTools,
  showRawParams: state.showRawParams,
}),

// Migration: version 5 -> 6
if (version < 6) {
  s = { ...s, autoExpandTools: false, showRawParams: false };
}
```

### Pattern 2: Popover Panel (not DropdownMenu)
**What:** Radix Popover stays open while user toggles multiple settings. DropdownMenu would close on each click.
**When to use:** Whenever a panel contains form controls that users interact with multiple times.
**Example:**
```typescript
// shadcn Popover needs to be added (not currently in ui/ directory)
// Install via: npx shadcn@latest add popover
// OR use Radix Popover primitive directly since radix-ui is installed

import { Popover as PopoverPrimitive } from 'radix-ui';
// PopoverPrimitive.Root, .Trigger, .Content, .Portal
```

### Pattern 3: Keyboard Shortcut Hook
**What:** Follow existing `useCommandPaletteShortcut` pattern for `Cmd+,`.
**When to use:** Adding global shortcuts.
**Example:**
```typescript
// Same guard pattern: skip terminal/codemirror, use e.code not e.key
// Cmd+, is standard for settings/preferences in macOS apps
// e.code === 'Comma' when metaKey/ctrlKey is held
```

### Pattern 4: Wiring autoExpandTools to Components
**What:** `autoExpandTools` controls whether ToolCallGroup starts expanded and whether individual ToolChips show their cards by default.
**When to use:** In AssistantMessage (historical) and ActiveMessage (streaming).
**Example:**
```typescript
// AssistantMessage.tsx
const autoExpandTools = useUIStore((state) => state.autoExpandTools);

// Pass to ToolCallGroup
<ToolCallGroup tools={partition.tools} errors={partition.errors}
  defaultExpanded={autoExpandTools} />

// Pass to standalone ToolChip
<ToolChip toolCall={partition.tool} defaultExpanded={autoExpandTools} />
```

### Pattern 5: Wiring showRawParams
**What:** When enabled, tool cards show raw JSON input/output below their formatted display.
**When to use:** Debugging/power-user mode.
**Example:**
```typescript
// In ToolCardShell or individual tool cards:
const showRawParams = useUIStore((state) => state.showRawParams);

// After formatted content, conditionally render:
{showRawParams && (
  <details className="mt-2 text-xs">
    <summary className="text-muted cursor-pointer">Raw Parameters</summary>
    <pre className="mt-1 overflow-x-auto p-2 bg-surface-sunken rounded text-mono text-xs">
      {JSON.stringify(input, null, 2)}
    </pre>
  </details>
)}
```

### Anti-Patterns to Avoid
- **Using DropdownMenu for toggles:** DropdownMenu closes on click. Use Popover.
- **Reading store with getState() in components:** Use selectors per Constitution 4.2.
- **Adding a new store for 3 booleans:** Extend existing UI store, not a new one.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle controls | Custom checkbox wrappers | shadcn Switch | Accessible, styled, already installed |
| Popover positioning | Manual absolute positioning | Radix Popover | Handles overflow, collision, portal |
| State persistence | localStorage read/write | Zustand persist middleware | Already configured, migration support |
| Keyboard shortcuts | Raw key matching | Existing pattern (metaKey/ctrlKey + code) | Terminal/editor guard already solved |

## Common Pitfalls

### Pitfall 1: Zustand Persist Version Bump
**What goes wrong:** Adding fields without bumping version = old localStorage missing new keys.
**Why it happens:** Persist middleware uses version for migration.
**How to avoid:** Bump to version 6, add migration that sets defaults for `autoExpandTools: false, showRawParams: false`.
**Warning signs:** New toggles always undefined after reload on existing installs.

### Pitfall 2: DropdownMenu vs Popover Confusion
**What goes wrong:** Using DropdownMenu causes panel to close after toggling one setting.
**Why it happens:** DropdownMenu is designed for action menus (select and dismiss).
**How to avoid:** Use Radix Popover which stays open until explicitly dismissed.
**Warning signs:** User has to reopen panel to toggle second setting.

### Pitfall 3: Keyboard Shortcut Conflicts
**What goes wrong:** `Cmd+,` might conflict with browser settings or other shortcuts.
**Why it happens:** Some apps claim `Cmd+,` at browser level.
**How to avoid:** Test in target browsers. Fallback: `Cmd+Shift+,` if conflicts found. The existing terminal/codemirror guard pattern handles editor conflicts.
**Warning signs:** Browser opens its own settings instead of Loom's quick settings.

### Pitfall 4: Selector Instability with New Store Fields
**What goes wrong:** Adding fields to store causes unnecessary re-renders.
**Why it happens:** Components selecting unrelated fields re-render when new fields change.
**How to avoid:** Each component selects only the fields it needs (already the pattern).
**Warning signs:** Message list re-renders when toggling unrelated quick setting.

### Pitfall 5: showRawParams in ToolCardShell vs Individual Cards
**What goes wrong:** Putting raw params display in ToolCardShell means ALL tool types show the same raw dump. Some cards already show relevant params in formatted form.
**Why it happens:** Unclear ownership of "raw" display.
**How to avoid:** Add raw params in ToolCardShell (single implementation point) below the children slot. The formatted card content already handles useful display; raw is an opt-in debug view below it.
**Warning signs:** Duplicate information shown when raw mode is on.

## Code Examples

### QuickSettingsPanel Component Structure
```typescript
// Source: Project patterns (Sidebar.tsx, Switch component)
import { Popover as PopoverPrimitive } from 'radix-ui';
import { SlidersHorizontal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/stores/ui';

export function QuickSettingsPanel() {
  const thinkingExpanded = useUIStore((s) => s.thinkingExpanded);
  const toggleThinking = useUIStore((s) => s.toggleThinking);
  const autoExpandTools = useUIStore((s) => s.autoExpandTools);
  const toggleAutoExpandTools = useUIStore((s) => s.toggleAutoExpandTools);
  const showRawParams = useUIStore((s) => s.showRawParams);
  const toggleShowRawParams = useUIStore((s) => s.toggleShowRawParams);

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button aria-label="Quick settings" type="button">
          <SlidersHorizontal size={18} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content side="top" align="start" sideOffset={8}>
          {/* Three toggle rows */}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
```

### UI Store Migration Pattern
```typescript
// Source: Existing ui.ts migration chain
if (version < 6) {
  s = { ...s, autoExpandTools: false, showRawParams: false };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Settings only in modal | Quick settings popover + full modal | This phase | Fast preference changes without modal overhead |
| thinkingExpanded only toggle (Brain icon) | Three toggles in unified panel | This phase | Thinking toggle moves to panel; Brain icon in ChatView can remain as a shortcut |

**Note on thinking toggle migration:** The Brain icon toggle in ChatView header currently controls `thinkingExpanded` directly. After this phase, both the Brain icon AND the quick settings panel control the same store field. No conflict -- both read/write the same Zustand field. Keep the Brain icon as-is for discoverability.

## Open Questions

1. **Popover component: install shadcn or use Radix directly?**
   - What we know: `radix-ui` is already installed (v1.4.3). shadcn Popover wraps it.
   - What's unclear: Project may prefer consistency of shadcn wrappers vs. lighter direct Radix use.
   - Recommendation: Install shadcn Popover (`npx shadcn@latest add popover`) for consistency with other ui/ components. It's a thin wrapper.

2. **Should the Brain icon in ChatView be removed?**
   - What we know: Quick settings panel will include thinking toggle. Brain icon duplicates it.
   - What's unclear: Whether duplication is good (discoverability) or bad (confusion).
   - Recommendation: Keep the Brain icon. It's a fast single-click toggle that power users rely on. The quick settings panel is for discovering all three settings together.

3. **What does "auto-expand tools" mean precisely?**
   - What we know: ToolCallGroup uses `defaultExpanded` (false for historical, true for streaming). ToolChip uses `defaultExpanded` (undefined by default, true only on error).
   - Recommendation: `autoExpandTools` = true means historical ToolCallGroups render expanded (not collapsed), and individual ToolChips start with their card visible. Streaming behavior unchanged (always expanded already).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UXR-05 | Panel opens from sidebar button and Cmd+, shortcut | unit | `cd src && npx vitest run src/src/components/sidebar/QuickSettingsPanel.test.tsx -x` | Wave 0 |
| UXR-05 | Keyboard shortcut hook | unit | `cd src && npx vitest run src/src/hooks/useQuickSettingsShortcut.test.ts -x` | Wave 0 |
| UXR-06 | Three toggles present and functional | unit | `cd src && npx vitest run src/src/components/sidebar/QuickSettingsPanel.test.tsx -x` | Wave 0 |
| UXR-06 | Store fields added with persistence | unit | `cd src && npx vitest run src/src/stores/ui.test.ts -x` | Exists (extend) |
| UXR-07 | Toggling applies immediately (no reload) | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | Exists (extend) |
| UXR-07 | Raw params display toggles on/off | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCardShell.test.tsx -x` | Exists (extend) |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/sidebar/QuickSettingsPanel.test.tsx` -- covers UXR-05, UXR-06
- [ ] `src/src/hooks/useQuickSettingsShortcut.test.ts` -- covers UXR-05
- [ ] Popover component: `npx shadcn@latest add popover` -- if using shadcn wrapper
- [ ] Extend `src/src/stores/ui.test.ts` -- new fields and migration
- [ ] Extend `src/src/components/chat/tools/ToolCallGroup.test.tsx` -- autoExpandTools wiring
- [ ] Extend `src/src/components/chat/tools/ToolCardShell.test.tsx` -- showRawParams rendering

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/src/stores/ui.ts` -- existing store with persist v5, thinkingExpanded pattern
- Project codebase: `src/src/components/ui/switch.tsx` -- Switch component (Radix-based)
- Project codebase: `src/src/components/sidebar/Sidebar.tsx` -- footer with Settings button pattern
- Project codebase: `src/src/components/chat/view/ThinkingDisclosure.tsx` -- globalExpanded prop pattern
- Project codebase: `src/src/components/chat/tools/ToolCallGroup.tsx` -- defaultExpanded pattern
- Project codebase: `src/src/components/chat/tools/ToolCardShell.tsx` -- tool card wrapper (raw params injection point)
- Project codebase: `src/src/components/command-palette/hooks/useCommandPaletteShortcut.ts` -- keyboard shortcut pattern

### Secondary (MEDIUM confidence)
- Radix UI Popover API -- standard Radix pattern, same package already installed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components already installed, patterns established
- Architecture: HIGH -- direct extension of existing patterns (thinkingExpanded, defaultExpanded, keyboard shortcuts)
- Pitfalls: HIGH -- well-understood Zustand persist migration, Radix Popover vs DropdownMenu is standard knowledge

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable patterns, no external dependencies changing)
