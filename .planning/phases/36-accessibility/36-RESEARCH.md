# Phase 36: Accessibility - Research

**Researched:** 2026-03-17
**Domain:** Web Accessibility (WCAG 2.1 AA), ARIA, keyboard navigation, screen readers
**Confidence:** HIGH

## Summary

Phase 36 addresses 6 accessibility requirements (A11Y-01 through A11Y-06) that span ARIA labeling, keyboard navigation, focus management, screen reader announcements, reduced-motion support, and color contrast compliance. The existing codebase has a solid foundation: Radix UI primitives (via shadcn) already provide focus trapping in the Dialog component, the TabBar already uses `role="tablist"` with `aria-selected` and `aria-controls`, and the ConnectionBanner uses `role="alert"`. There are 11 CSS files with `@media (prefers-reduced-motion: reduce)` blocks, covering most custom animations.

The gaps are specific and well-scoped: (1) many interactive elements lack ARIA labels, (2) the TabBar needs roving tabindex for arrow-key navigation, (3) no live regions exist for streaming/tool events, (4) Tailwind's `animate-pulse`/`animate-spin` utilities are used in ~30 places without reduced-motion overrides, (5) several CSS files with `transition:` properties don't have reduced-motion blocks, (6) no a11y testing infrastructure exists (no axe-core, no eslint-plugin-jsx-a11y), and (7) OKLCH color contrast needs mathematical verification.

An existing Plan 01 already covers A11Y-01 and A11Y-02 (ARIA labels + keyboard navigation). Research here focuses on the remaining requirements and validating the existing plan's approach.

**Primary recommendation:** Split remaining work into 3-4 plans: focus management (A11Y-03), live regions for streaming (A11Y-04), reduced-motion global coverage (A11Y-05), and contrast audit (A11Y-06). Install `vitest-axe` for automated a11y testing.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| A11Y-01 | All interactive elements have appropriate ARIA roles and labels | Existing Plan 01 Task 1 covers this. Audit found ~30 components needing labels. Radix primitives (Dialog, Tabs, Select) already provide correct roles. |
| A11Y-02 | Full keyboard navigation across all panels | Existing Plan 01 Task 2 covers skip link + roving tabindex. File tree needs `role="tree"` + arrow key nav. Research confirms WAI-ARIA Tabs pattern for TabBar. |
| A11Y-03 | Focus management: modals trap focus, panels restore focus on close | Radix Dialog already traps focus. Command Palette (cmdk) traps focus. Quick Settings Popover (Radix) traps focus. Main gap: focus restoration on panel switch and image lightbox. |
| A11Y-04 | Screen reader announcements for streaming, tool completion, errors | No `aria-live` regions exist except `role="alert"` on ConnectionBanner. Need `aria-live="polite"` region for streaming status + tool events. Pattern: visually-hidden announcer component. |
| A11Y-05 | prefers-reduced-motion disables ALL animations | 11 CSS files have reduced-motion blocks. Gaps: `animate-pulse` Tailwind class (~30 uses), `animate-spin` (2 uses), `animate-in/animate-out` from tw-animate-css in Dialog, git-panel.css skeleton-pulse + spin keyframes, composer.css spin, file-tree transition, scroll-pill transitions. Need global reduced-motion override. |
| A11Y-06 | Color contrast meets WCAG AA across all surfaces | OKLCH colors need contrast ratio calculation. Key concern: `--text-muted` (L:0.60) on `--surface-base` (L:0.20) -- likely passes but needs verification. `--border-subtle` (7% white opacity) may not meet 3:1 for interactive borders. |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Radix UI | via shadcn | Focus trapping, ARIA roles for Dialog, Tabs, Select, etc. | Industry-standard accessible primitives |
| tailwindcss | v4 | Utility classes including `sr-only`, `focus-visible:` | Built-in a11y utilities |
| tw-animate-css | 1.4.0 | Animation utilities (animate-in, animate-out) | Already used by shadcn Dialog |

### Add for This Phase
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest-axe | ^1.0.0 | axe-core integration for Vitest | Automated WCAG violation detection in component tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vitest-axe | Manual ARIA audit only | vitest-axe catches issues humans miss; ~50KB dev dep, zero runtime cost |
| eslint-plugin-jsx-a11y | None | Good for catching missing alt/labels at lint time, but scope creep -- save for v1.4 |

**Installation:**
```bash
cd /home/swd/loom/src && npm install -D vitest-axe
```

## Architecture Patterns

### Pattern 1: Visually-Hidden Live Region Announcer
**What:** A component that renders an `aria-live="polite"` region, hidden visually but read by screen readers. Content updates trigger announcements.
**When to use:** Streaming status changes, tool completion events, error notifications.
**Example:**
```typescript
// src/src/components/a11y/LiveAnnouncer.tsx
import { useEffect, useRef, useState } from 'react';

export function LiveAnnouncer({ message }: { message: string }) {
  const [current, setCurrent] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!message) return;
    // Clear then set to ensure re-announcement of identical messages
    setCurrent('');
    timeoutRef.current = setTimeout(() => setCurrent(message), 100);
    return () => clearTimeout(timeoutRef.current);
  }, [message]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {current}
    </div>
  );
}
```

### Pattern 2: Global Reduced-Motion Override
**What:** A single CSS block that disables ALL animations and transitions when `prefers-reduced-motion: reduce` is active, applied at the root level.
**When to use:** Instead of adding reduced-motion blocks to every individual CSS file.
**Example:**
```css
/* In tokens.css or index.css -- GLOBAL reduced-motion override */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
**Why 0.01ms not 0ms:** Some browsers skip `animationend`/`transitionend` events with 0ms duration, breaking logic that depends on those events (like the ActiveMessage crossfade). 0.01ms fires events instantly while appearing instantaneous.

### Pattern 3: Roving Tabindex for Tab/List Navigation
**What:** Only the currently active/focused item has `tabIndex={0}`; all others have `tabIndex={-1}`. Arrow keys move focus.
**When to use:** TabBar, SessionList, FileTree, MentionPicker, SlashCommandPicker.
**Example:**
```typescript
function handleKeyDown(e: React.KeyboardEvent, items: string[], currentIndex: number) {
  let nextIndex = currentIndex;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      nextIndex = (currentIndex + 1) % items.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      nextIndex = (currentIndex - 1 + items.length) % items.length;
      break;
    case 'Home':
      nextIndex = 0;
      break;
    case 'End':
      nextIndex = items.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  document.getElementById(`tab-${items[nextIndex]}`)?.focus();
}
```

### Pattern 4: Focus Restoration on Close
**What:** When a popover/lightbox/panel closes, restore focus to the element that triggered it.
**When to use:** Image lightbox, export dropdown, context menus not using Radix.
**Example:**
```typescript
const triggerRef = useRef<HTMLElement | null>(null);

function openOverlay() {
  triggerRef.current = document.activeElement as HTMLElement;
  setIsOpen(true);
}

function closeOverlay() {
  setIsOpen(false);
  // Restore after React commit
  requestAnimationFrame(() => triggerRef.current?.focus());
}
```

### Anti-Patterns to Avoid
- **Div with onClick without role/tabIndex:** Every clickable `<div>` must have `role="button"` and `tabIndex={0}` with `onKeyDown` for Enter/Space. Better: use `<button>` elements.
- **aria-label on non-interactive elements:** Screen readers may ignore labels on `<div>` without a role. Always pair `aria-label` with a semantic role.
- **Double announcements:** Don't put `role="alert"` AND `aria-live="assertive"` on the same element -- `role="alert"` implies assertive live region.
- **Placeholder as label:** `placeholder` text disappears on input -- always use `aria-label` or visible `<label>`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus trapping | Custom focus trap loop | Radix Dialog (already used) | Edge cases: shadow DOM, iframe, dynamic content |
| WCAG contrast checking | Manual hex/oklch math | `oklch-contrast-calc` or browser DevTools | OKLCH perceptual contrast is non-trivial to compute |
| Accessible dropdown menus | Custom keyboard nav | Radix DropdownMenu (already have it) | Handles screen readers, virtual focus, typeahead |
| Skip link styling | Custom CSS | Tailwind `sr-only focus:not-sr-only` pattern | Battle-tested, no edge cases |

## Common Pitfalls

### Pitfall 1: CSS Display:None Hides from Assistive Tech
**What goes wrong:** The mount-once pattern uses `className="hidden"` (display:none) for inactive panels. Screen readers correctly ignore hidden panels, but focus can get trapped in a hidden panel if it was focused before tab switch.
**Why it happens:** Display:none removes elements from tab order but doesn't move focus.
**How to avoid:** When switching tabs, explicitly move focus to the newly active panel (e.g., `document.getElementById('panel-' + newTab)?.focus()`).
**Warning signs:** Pressing Tab after switching panels doesn't move focus into the new panel.

### Pitfall 2: Streaming Content Causes Screen Reader Verbosity
**What goes wrong:** If `aria-live` is set on the streaming message container, screen readers will attempt to read every text chunk as it arrives, creating an overwhelming flood of announcements.
**Why it happens:** `aria-live` re-announces whenever content changes.
**How to avoid:** Do NOT put `aria-live` on the message content area. Instead, use a separate announcer that fires discrete status messages: "Response started", "Using tool: Read file.tsx", "Response complete".
**Warning signs:** VoiceOver reading random sentence fragments during streaming.

### Pitfall 3: Tailwind animate-pulse Ignores prefers-reduced-motion
**What goes wrong:** Tailwind's `animate-pulse` utility is used ~30 times in skeleton components. Without a global override, these continue animating for reduced-motion users.
**Why it happens:** Tailwind v4's default animation utilities don't include reduced-motion variants.
**How to avoid:** Global `@media (prefers-reduced-motion: reduce)` block in tokens.css or base.css that sets `animation-duration: 0.01ms !important` on all elements.
**Warning signs:** Skeleton loading states still pulsing with reduced-motion enabled.

### Pitfall 4: OKLCH Contrast Calculation is Not Straightforward
**What goes wrong:** WCAG contrast ratios are defined for sRGB relative luminance, not OKLCH lightness. Two colors with seemingly different OKLCH L values might pass or fail in unexpected ways.
**Why it happens:** OKLCH lightness (L) is perceptual, not the same as sRGB relative luminance used in WCAG 2.1 contrast formula.
**How to avoid:** Convert OKLCH colors to sRGB, then compute relative luminance and contrast ratio using the standard formula: `(L1 + 0.05) / (L2 + 0.05)`.
**Warning signs:** Colors that "look" fine in OKLCH failing automated contrast checks.

### Pitfall 5: tw-animate-css Dialog Animations
**What goes wrong:** The shadcn Dialog uses `animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95` etc. from tw-animate-css. These may not have reduced-motion handling.
**Why it happens:** tw-animate-css v1.4.0 may or may not include a global reduced-motion block (needs verification at implementation time).
**How to avoid:** The global reduced-motion override in Pattern 2 above covers this regardless.

### Pitfall 6: xterm.js and CodeMirror are Third-Party Black Boxes
**What goes wrong:** Terminal (xterm.js) and code editor (CodeMirror 6) have their own accessibility stories. We cannot easily add ARIA labels inside them.
**Why it happens:** These are complex third-party renderers with their own DOM.
**How to avoid:** Focus on the wrapper elements. Add `aria-label="Terminal"` to the xterm container, `aria-label="Code editor: {filename}"` to the CodeMirror container. Both libraries have built-in a11y features -- don't fight them, complement them.

## Code Examples

### vitest-axe Integration
```typescript
// In a test file
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);

it('has no a11y violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Streaming Announcer Wiring
```typescript
// In ChatView or a parent, derive announcement from stream state
const isStreaming = useStreamStore((s) => s.isStreaming);
const toolCount = useStreamStore((s) => s.activeToolCalls.length);
const [announcement, setAnnouncement] = useState('');

useEffect(() => {
  if (isStreaming) setAnnouncement('Assistant is responding');
}, [isStreaming]);

useEffect(() => {
  if (!isStreaming && announcement) setAnnouncement('Response complete');
}, [isStreaming]);

// In JSX:
<LiveAnnouncer message={announcement} />
```

### Global Reduced-Motion CSS (comprehensive)
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### OKLCH to sRGB Contrast Check (for audit)
```typescript
// Utility for contrast ratio computation
// Convert OKLCH string to sRGB relative luminance, then apply WCAG formula
// In practice: use browser DevTools or a script that parses tokens.css
// and computes contrast for all text/surface pairs.

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
// WCAG AA: >= 4.5:1 for normal text, >= 3:1 for large text (18px+ or 14px+ bold)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-component reduced-motion blocks | Global `*` selector override | Common practice since ~2022 | One block covers everything; no gaps |
| Manual ARIA audits | axe-core automated testing | axe-core v4+ (stable since 2020) | Catches ~57% of WCAG violations automatically |
| `aria-live` on content areas | Dedicated announcer pattern | WAI-ARIA best practice | Prevents verbosity, gives control over what's announced |
| `tabindex="0"` on all list items | Roving tabindex | WAI-ARIA 1.1 pattern | Single Tab stop per widget, arrow keys within |

## Existing Coverage Assessment

### What Already Works (HIGH confidence)
- **Radix Dialog** (SettingsModal): Focus trapping, focus restoration, Escape to close, `aria-modal` -- all handled by Radix.
- **Radix Popover** (QuickSettings): Focus management handled by Radix.
- **cmdk** (CommandPalette): Keyboard navigation, screen reader support built-in.
- **TabBar**: Already has `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `aria-labelledby` cross-references to panels.
- **ContentArea panels**: Already have `role="tabpanel"` with `aria-labelledby`.
- **ConnectionBanner**: Already uses `role="alert"` for all states.
- **Sidebar**: Already has `role="complementary"` and `aria-label`.
- **Main content**: Already has `role="main"`.

### What Needs Work (specific gaps)
1. **~25 buttons** missing `aria-label` (icon-only buttons in git, editor, chat)
2. **TabBar** needs roving tabindex (currently all tabs are tabbable)
3. **SessionList** needs `role="listbox"` semantics
4. **FileTree** needs `role="tree"` / `role="treeitem"` + arrow key nav
5. **No live regions** for streaming events
6. **No skip-to-content link**
7. **~30 Tailwind `animate-pulse` uses** not covered by reduced-motion
8. **3 CSS files** with `@keyframes` lacking reduced-motion: git-panel.css (skeleton-pulse, spin), composer.css (composer-spin)
9. **Image Lightbox** likely needs focus trap + focus restoration
10. **Export dropdown** in ChatView is custom (not Radix) -- needs keyboard handling + focus restoration
11. **OKLCH contrast** unverified mathematically

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react |
| Config file | `src/vite.config.ts` (vitest config section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| A11Y-01 | All interactive elements have ARIA labels/roles | unit | `npx vitest run src/src/tests/a11y-audit.test.tsx -x` | No -- Wave 0 |
| A11Y-02 | Keyboard nav across all panels | unit | `npx vitest run src/src/tests/a11y-audit.test.tsx -x` | No -- Wave 0 |
| A11Y-03 | Focus trapping in modals, restoration on close | unit | `npx vitest run src/src/tests/a11y-focus.test.tsx -x` | No -- new plan |
| A11Y-04 | Screen reader announcements for streaming | unit | `npx vitest run src/src/tests/a11y-announcer.test.tsx -x` | No -- new plan |
| A11Y-05 | prefers-reduced-motion disables all animations | unit+manual | Manual: browser DevTools check | N/A |
| A11Y-06 | WCAG AA contrast ratios | unit | `npx vitest run src/src/tests/a11y-contrast.test.tsx -x` | No -- new plan |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose 2>&1 | tail -20`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run`
- **Phase gate:** Full suite green + `npx tsc --noEmit` + `npx eslint src/ --max-warnings=0`

### Wave 0 Gaps
- [ ] `npm install -D vitest-axe` -- axe-core integration for automated WCAG checks
- [ ] `src/src/tests/a11y-audit.test.tsx` -- covers A11Y-01, A11Y-02 (already in Plan 01)
- [ ] `src/src/tests/a11y-focus.test.tsx` -- covers A11Y-03 (focus management)
- [ ] `src/src/components/a11y/LiveAnnouncer.tsx` -- covers A11Y-04 (screen reader announcements)

## Open Questions

1. **tw-animate-css reduced-motion support**
   - What we know: tw-animate-css v1.4.0 provides animate-in/animate-out utilities used by shadcn Dialog. The global override pattern covers this regardless.
   - What's unclear: Whether tw-animate-css includes its own reduced-motion handling (may not matter with global override).
   - Recommendation: Apply global override; it's the safest approach and eliminates the question.

2. **xterm.js a11y capabilities**
   - What we know: xterm.js has an accessibility addon (`@xterm/addon-screen-reader-mode`) that provides a live region for terminal output.
   - What's unclear: Whether it's installed or configured in the Loom terminal integration.
   - Recommendation: Check if `@xterm/addon-screen-reader-mode` is available; if not, add `aria-label="Terminal"` to wrapper and consider the addon for future.

3. **CodeMirror 6 a11y**
   - What we know: CodeMirror 6 has built-in screen reader support and keyboard navigation. It announces content via ARIA.
   - What's unclear: Whether the current CM6 setup has all a11y extensions enabled.
   - Recommendation: Verify `@codemirror/view` accessibility mode is active. Add `aria-label` to wrapper div with current filename.

## Sources

### Primary (HIGH confidence)
- Codebase audit of `/home/swd/loom/src/src/` -- 30+ files checked for ARIA attributes, reduced-motion, live regions
- WAI-ARIA Authoring Practices 1.1 -- Tabs, Listbox, Tree View patterns (well-established specs)
- Radix UI documentation -- Dialog, Popover, Tabs primitives include focus management

### Secondary (MEDIUM confidence)
- WCAG 2.1 AA contrast formula -- standard, well-documented specification
- vitest-axe -- wrapper for axe-core, standard a11y testing approach
- Global reduced-motion pattern -- widely recommended by web.dev, MDN, a11y community

### Tertiary (LOW confidence)
- tw-animate-css reduced-motion behavior -- needs verification at implementation time
- xterm.js screen reader addon availability -- needs package check

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools are well-established, minimal new deps
- Architecture: HIGH -- patterns are WAI-ARIA standard practices
- Pitfalls: HIGH -- based on direct codebase audit, not speculation
- Contrast (A11Y-06): MEDIUM -- OKLCH-to-sRGB conversion needs implementation-time verification

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain, specs don't change)
