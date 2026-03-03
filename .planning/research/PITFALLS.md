# Domain Pitfalls

**Domain:** Visual redesign of existing React 18 / Tailwind CSS streaming chat UI
**Project:** Loom v1.1 Design Overhaul (charcoal + dusty rose palette replacing warm earthy)
**Researched:** 2026-03-03
**Confidence:** HIGH (verified against actual codebase audit + official docs + community sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, multi-day debugging sessions, or user-visible regressions across the entire app.

### Pitfall 1: The Hardcoded Color Hydra -- 51 Arbitrary Hex Values in Chat Components Alone

**What goes wrong:**
You update the CSS variables in `:root`, the Tailwind config colors look correct, and 60% of the app renders beautifully in the new charcoal + dusty rose palette. The other 40% still shows warm brown, amber, and terracotta because colors are hardcoded as Tailwind arbitrary values (`bg-[#1c1210]`, `text-[#c4a882]`, `border-[#3d2e25]/40`) directly in component JSX. These bypass the CSS variable system entirely.

**Why it happens:**
The existing Loom codebase has two color systems running in parallel:

1. **CSS variable system** (index.css `:root` variables -> Tailwind config -> semantic classes like `bg-background`, `text-foreground`, `border-border`) -- used by the base layout, body, and some UI primitives.

2. **Hardcoded arbitrary values** -- used extensively in chat-specific components. Actual codebase audit reveals:
   - **51 instances** of `[#hexcolor]` arbitrary values across 10 chat component files
   - `MessageComponent.tsx`: 17 hardcoded hex references (`#b85c3a`, `#dab8b8`, `#f5e6d3`, `#c4a882`, `#3d2e25`, `#b87333`, `#241a14`, `#1c1210`)
   - `CodeBlock.tsx`: 7 hardcoded hex references
   - `SystemStatusMessage.tsx`: 7 hardcoded hex references
   - `ThinkingDisclosure.tsx`: 6 hardcoded hex references
   - `DiffViewer.tsx`: 25+ hex values in a styles object
   - `streaming-cursor.css`: 2 hardcoded `#d4a574` (amber cursor color)
   - `useShikiHighlighter.ts`: 12 color mappings with hardcoded hex pairs
   - `ConnectionStatusDot.tsx`: 3 hardcoded status colors
   - `ScrollToBottomPill.tsx`: full color scheme hardcoded
   - **371 instances** of Tailwind gray/slate/neutral/zinc classes across 20+ files (inherited from CloudCLI, never tokenized)

Changing `:root` variables touches none of these. Each must be found and replaced individually.

**Consequences:**
- Visual inconsistency -- some panels are charcoal, adjacent panels are warm brown
- The error is invisible in isolation; you only see it when viewing the full app
- Every new component added during the redesign has a 50/50 chance of using the old pattern (copy-paste from existing code)

**Prevention:**
1. **Before changing any colors:** Run the full audit and create a tracking spreadsheet:
   ```bash
   # Arbitrary hex values in Tailwind classes
   grep -rn '\[#[0-9a-fA-F]\{6\}\]' src/ --include="*.tsx" --include="*.ts" --include="*.css"

   # Hardcoded hex in style objects / inline styles
   grep -rn "'#[0-9a-fA-F]\{6\}'" src/ --include="*.tsx" --include="*.ts"

   # Generic gray/slate/zinc/neutral Tailwind classes
   grep -rn 'gray-\|slate-\|zinc-\|neutral-\|stone-' src/ --include="*.tsx" --include="*.ts" --include="*.jsx"
   ```
2. **Create a color token map** before starting: old hex -> new CSS variable equivalent. Example:
   ```
   #1c1210 -> bg-background (--background)
   #2a1f1a -> bg-card (--card)
   #3d2e25 -> bg-secondary (--secondary)
   #c4a882 -> text-muted-foreground (--muted-foreground)
   #f5e6d3 -> text-foreground (--foreground)
   #d4a574 -> text-primary (--primary)
   #b85c3a -> text-destructive (--destructive)
   ```
3. **Replace hardcoded values with semantic tokens** during migration, not with new hardcoded values. The goal is to eliminate the dual-system, not just swap hex codes.
4. **Add an ESLint/grep CI check** that fails on `[#` in component files after migration.

**Detection:**
- Any chat component still showing warm brown/amber after the `:root` variables have been changed to charcoal/rose
- Visual screenshot diff between "what the palette says" and "what renders"
- Grep returning >0 for `\[#` in component files

**Phase to address:** Must be the FIRST wave of any color migration phase. Do the audit and token mapping before touching `:root` values.

---

### Pitfall 2: HSL Alpha-Value Contract Breakage During Variable Migration

**What goes wrong:**
After updating the CSS variables from warm earthy HSL values to charcoal/rose HSL values, Tailwind opacity modifiers (`bg-primary/50`, `text-accent/20`, `border-border/30`) silently stop working. Elements that should be semi-transparent render at full opacity. The border color defined in `index.css` as `hsl(var(--border) / 0.15)` becomes invisible or fully opaque depending on the error.

**Why it happens:**
The current Tailwind config uses the correct `<alpha-value>` pattern:
```js
background: "hsl(var(--background) / <alpha-value>)",
```
And the CSS variables store bare HSL channels:
```css
--background: 10 27.3% 8.6%;
```
This contract MUST be maintained during migration. Three ways it breaks:

1. **Including `hsl()` in the variable:** If someone writes `--background: hsl(0 0% 10%)` instead of `--background: 0 0% 10%`, the Tailwind config produces `hsl(hsl(0 0% 10%) / 0.5)` -- invalid CSS, silently ignored.

2. **Using commas in HSL values:** Modern CSS uses space-separated HSL (`0 0% 10%`), but legacy format uses commas (`0, 0%, 10%`). The slash-alpha syntax `hsl(0, 0%, 10% / 0.5)` is invalid in most browsers. The current codebase correctly uses space-separated values -- do not introduce commas.

3. **Nav design tokens use slash syntax directly:** The `--nav-glass-bg` variable is `18.8 23.5% 13.3% / 0.7` -- it bakes the alpha into the variable itself, bypassing the `<alpha-value>` system. These must be updated separately, and the embedded alpha must be verified against the new palette (a charcoal at 0.7 opacity looks very different from a warm brown at 0.7 opacity on a dark background).

**Consequences:**
- Glass/blur surfaces (mobile nav, composer) lose their translucency
- Borders at `border-border/15` become invisible (0.15 opacity on an already-subtle charcoal border) or fully opaque
- Hover states that rely on `bg-accent/10` for subtle highlight become invisible on near-black background
- Subtle surface hierarchy (background -> card -> secondary) collapses into flat black

**Prevention:**
1. **Validate every variable is bare channels** (no `hsl()` wrapper, no commas):
   ```css
   /* CORRECT */
   --background: 0 0% 10%;
   /* WRONG */
   --background: hsl(0 0% 10%);
   --background: 0, 0%, 10%;
   ```
2. **Test opacity modifiers immediately** after changing variables -- create a visual test page with:
   ```html
   <div class="bg-primary/10">10%</div>
   <div class="bg-primary/30">30%</div>
   <div class="bg-primary/50">50%</div>
   <div class="bg-primary/70">70%</div>
   <div class="bg-primary/100">100%</div>
   ```
3. **Recalculate all embedded-alpha tokens** for the new palette. The nav glass at 0.7 opacity on warm brown was calibrated visually -- the same 0.7 on charcoal will look different. Each must be tuned.
4. **Check the scrollbar colors** in `index.css` -- they use raw `hsl(34.5 35.9% 63.9% / 0.3)` (hardcoded, not via CSS variables). These must be manually updated.

**Detection:**
- Any surface that should be translucent appears opaque
- Glass/blur effects show no content behind them
- Border colors are invisible or too strong
- Browser DevTools shows `hsl(hsl(...) / 0.5)` in computed styles (invalid nested hsl)

**Phase to address:** The very first step of color variable migration. Create the opacity test page, update variables, verify, THEN proceed to component work.

---

### Pitfall 3: Animation Jank During Streaming -- GPU Layer Explosion

**What goes wrong:**
After adding micro-interactions (hover transitions, expand/collapse animations, message entry animations), the streaming experience degrades. During active streaming, token arrival causes visible stutter in running animations. The aurora shimmer on the thinking indicator hitches. Scroll becomes janky. On mobile, the UI becomes unresponsive for 200-500ms during animation starts.

**Why it happens:**
Three forces collide during streaming:

1. **CSS transitions on `all`:** The existing `index.css` applies `transition: all 150ms` to every button, link, input, and `[role="button"]`. During streaming, tool-call buttons animate their color changes, expand/collapse state changes trigger transitions on height AND background AND border simultaneously, and the streaming cursor element (which is a pseudo-element) triggers paint on every blink.

2. **`contain: content` conflicts with animations:** The `.message-streaming` class correctly uses `contain: content` to isolate layout during streaming. But if an animation inside that container changes height or triggers paint (e.g., a skeleton shimmer, a code block expand animation), the containment boundary forces a full repaint of the contained subtree rather than the compositor-only path.

3. **Aurora gradient GPU layer cost:** The aurora shimmer uses `@property --aurora-angle` for GPU-accelerated angle interpolation. This works well in isolation. But when multiple aurora elements exist simultaneously (thinking text + skeleton lines + aura glow = 3-5 elements), each creates its own GPU compositing layer. On mobile GPUs or iGPUs (AMD Radeon 780M), exceeding ~8-10 compositing layers causes the browser to fall back to CPU compositing, killing frame rate.

**Consequences:**
- Streaming text visibly stutters while animations run
- Aurora shimmer freezes momentarily when new message tokens trigger layout
- Mobile Safari becomes unresponsive during streaming + animation
- `will-change: transform` on many elements causes memory pressure on the Radeon 780M iGPU

**Prevention:**
1. **Remove `transition: all` and replace with specific properties:**
   ```css
   /* BAD -- transitions every property including layout-triggering ones */
   button { transition: all 150ms; }

   /* GOOD -- only transition visual properties */
   button { transition: background-color 150ms, color 150ms, opacity 150ms; }
   ```
2. **Pause non-essential animations during streaming:** Add a `.is-streaming` class to the chat container and use it to disable non-critical animations:
   ```css
   .is-streaming .message-transition { transition: none; }
   .is-streaming .hover-animation { transition-duration: 0ms; }
   ```
3. **Limit concurrent GPU layers:** Never have more than 2-3 aurora gradient elements visible simultaneously. When the streaming response begins (first token), remove skeleton/aura elements immediately rather than fading them out.
4. **Use `content-visibility: auto`** on off-screen completed messages to prevent paint cost:
   ```css
   .message-complete:not(:nth-last-child(-n+5)) {
     content-visibility: auto;
     contain-intrinsic-size: 0 120px;
   }
   ```
5. **Profile with Chrome DevTools Layers panel** during streaming -- if layer count exceeds 10, reduce `will-change` and composited animation usage.

**Detection:**
- Chrome DevTools Performance tab shows "Long Animation Frame" entries during streaming
- FPS drops below 30 during streaming (use FPS meter overlay)
- Aurora animations visibly hitch when tokens arrive
- Mobile users report "laggy" typing or scrolling during responses

**Phase to address:** Streaming UX phase must performance-test animations. Animation/micro-interaction phase must re-verify streaming performance after adding transitions.

---

### Pitfall 4: Scroll Behavior Regression -- Auto-Scroll vs. New Animations

**What goes wrong:**
After adding message entry animations (fade-in, slide-up) or expand/collapse transitions on tool calls, the auto-scroll system breaks. The IntersectionObserver sentinel fires incorrectly because animated elements change height during their transition, briefly pushing the sentinel in and out of the viewport. The scroll pill flickers. Auto-scroll sometimes fails to engage on new messages because the animated message starts at height:0 (before animation) and the sentinel hasn't moved yet.

**Why it happens:**
The existing `useScrollAnchor.ts` uses an IntersectionObserver with a `100px` rootMargin watching a sentinel div at the bottom of the message list. The observer fires when the sentinel enters/exits the viewport intersection. This system assumes content height changes are immediate (token appends change height in one frame). But CSS transitions introduce intermediate states:

1. A message entry animation that starts at `opacity: 0; transform: translateY(20px)` does not contribute to scroll height until the animation completes. The sentinel position doesn't change even though a new message was added.
2. A tool-call expand animation increases height from 0 to final over 200ms. Each intermediate frame changes `scrollHeight`, which can push the sentinel out of the viewport, triggering `isAtBottom: false` -> scroll pill appears -> sentinel moves back in -> `isAtBottom: true` -> scroll pill disappears. All within 200ms = flicker.
3. The `useChatSessionState.ts` has complex scroll-position preservation logic that uses `scrollTop`, `scrollHeight`, and timing-based `setTimeout` calls. CSS transitions that change `scrollHeight` over time break the assumptions in these calculations.

**Consequences:**
- Scroll-to-bottom pill appears and disappears rapidly (flicker) during tool-call animations
- Auto-scroll fails to track new messages that enter with animation
- After a tool-call expand animation, scroll position jumps by the animated height
- On message load/pagination, content shifts because height calculations assumed instant layout

**Prevention:**
1. **Never animate height for elements that affect scroll position during streaming.** Use `opacity` and `transform` only for entry animations -- these don't affect layout flow:
   ```css
   /* SAFE -- doesn't affect scroll height */
   .message-enter { opacity: 0; transform: translateY(8px); }
   .message-enter-active { opacity: 1; transform: translateY(0); transition: opacity 200ms, transform 200ms; }

   /* DANGEROUS -- changes scroll height over time */
   .message-enter { max-height: 0; }
   .message-enter-active { max-height: 500px; transition: max-height 300ms; }
   ```
2. **Debounce the scroll pill visibility** by 150ms to absorb animation-caused IntersectionObserver flicker.
3. **Disable entry animations during active streaming.** When `isStreaming === true`, new message elements should appear instantly without transition. Animations are for completed messages loaded from history.
4. **For tool-call expand/collapse:** Use `requestAnimationFrame` to read the pre-animation `scrollHeight`, then after the animation starts, compute the delta and adjust `scrollTop` to compensate:
   ```ts
   const preHeight = container.scrollHeight;
   // trigger expand animation
   requestAnimationFrame(() => {
     const postHeight = container.scrollHeight;
     if (wasAtBottom) {
       container.scrollTop += (postHeight - preHeight);
     }
   });
   ```
5. **Test scroll behavior with DevTools throttled to 4x CPU slowdown** -- animation-induced scroll bugs are often invisible at full speed but obvious when slowed down.

**Detection:**
- Scroll pill appears/disappears more than once per second
- Auto-scroll stops working after a tool-call expands
- Scroll position jumps when an animated element completes its transition
- `console.log` in IntersectionObserver callback fires >10 times during a single animation

**Phase to address:** Must be verified at the END of every phase that adds any animation or transition. Streaming UX phase and animation phase must both include scroll behavior regression testing.

---

### Pitfall 5: Contrast Ratio Failure on Charcoal Backgrounds

**What goes wrong:**
The new charcoal palette (#1a1a1a - #222222) has lower contrast with certain text colors than the previous warm brown palette (#1c1210 - #3d2e25). Colors that were readable on warm brown become unreadable on charcoal. Specifically: muted text, placeholder text, disabled states, border colors, and subtle UI hints fall below WCAG AA contrast ratios.

**Why it happens:**
The warm palette had inherent contrast advantages:
- `#f5e6d3` (cream text) on `#1c1210` (dark brown) = 12.7:1 contrast ratio
- `#c4a882` (muted gold) on `#1c1210` = 6.8:1 contrast ratio

The new charcoal palette changes the equation:
- `#f5e6d3` on `#1a1a1a` (charcoal) = 13.2:1 -- slightly better, fine
- `#c4a882` on `#1a1a1a` = 7.1:1 -- fine for normal text
- But dusty rose accent `#D4736C` on `#1a1a1a` = 4.2:1 -- FAILS WCAG AA for small text (requires 4.5:1)
- Muted dusty rose `#C97B7B` on `#222222` = 4.8:1 -- barely passes, uncomfortable to read
- Any text at reduced opacity (e.g., `text-muted-foreground/60` on charcoal) will fail even if the base color passes

The existing codebase uses extensive opacity modifiers for subtle UI: `text-[#c4a882]/50`, `text-[#c4a882]/30`, `text-[#c4a882]/60`, `border-[#c4a882]/30`. At those opacity levels on charcoal, effective contrast ratios plummet below 2:1.

**Consequences:**
- Timestamp text (`text-[10px] text-[#c4a882]/60`) becomes effectively invisible on charcoal
- Border lines at `/20` opacity vanish entirely on near-black backgrounds
- Placeholder text in the chat composer fails contrast
- Users with any vision impairment cannot read muted UI text
- Automated accessibility audits (Lighthouse, axe) flag dozens of failures

**Prevention:**
1. **Audit every opacity-modified text color against the new background.** Create a contrast ratio spreadsheet:
   ```
   Text color + opacity -> Effective hex -> Background hex -> Ratio -> Pass/Fail
   #D4736C at 100%      -> #D4736C       -> #1a1a1a        -> 4.2:1 -> FAIL (small text)
   #D4736C at 100%      -> #D4736C       -> #1a1a1a        -> 4.2:1 -> PASS (large text only)
   #c4a882 at 60%       -> ~#8b7e6d eff  -> #1a1a1a        -> 3.1:1 -> FAIL
   ```
2. **Increase the lightness of the dusty rose accent for text use.** Keep the saturated rose for decorative elements (accents, borders, icons) but use a lighter variant for readable text:
   ```css
   --accent: 5 40% 63%;           /* #D4736C -- decorative accent (icons, borders) */
   --accent-text: 5 35% 75%;     /* lighter rose for readable text on charcoal */
   ```
3. **Raise the floor for opacity modifiers.** On charcoal, nothing below `/40` opacity will be readable. Replace all `/30` text opacity with `/50` minimum, and `/20` border opacity with `/30` minimum.
4. **Use the Polypane or axe browser extension** to run contrast checks on every screen during development.
5. **The Tailwind Typography plugin (`prose-invert`)** must be checked -- it injects its own text colors that may not meet contrast on charcoal.

**Detection:**
- Running Chrome DevTools CSS overview shows colors below 4.5:1 contrast
- Any text that requires squinting on a laptop screen at normal viewing distance
- Lighthouse accessibility score drops below 90
- Users increase browser zoom to read UI text (compensation behavior)

**Phase to address:** Design system phase (when defining the new palette values). Must be verified again after every phase that adds new text elements.

---

### Pitfall 6: Z-Index Wars -- Modal/Toast/Dropdown Stacking Chaos

**What goes wrong:**
After adding toast notifications and error banners, they appear BEHIND modals, or modals appear behind the mobile nav, or dropdown menus are clipped by ancestor `overflow: hidden`. The login modal disappears behind the toast layer. The command menu renders inside the chat scroll container and gets clipped.

**Why it happens:**
The current codebase has an unmanaged z-index system with values scattered across components:

| Z-Index | Components Using It |
|---------|-------------------|
| `z-10` | Sidebar header sticky, CollapsibleSection sticky header, TurnToolbar sticky, relative content |
| `z-20` | Shell mobile overlay, ChatMessagesPane sticky header |
| `z-30` | TaskList dropdown, QuickSettingsPanel backdrop, ScrollToBottomPill |
| `z-40` | QuickSettingsPanel drawer |
| `z-50` | MobileNav, CreateTaskModal, modals (x12+), ChatComposer mobile, ImageLightbox, file mention dropdown, provider dropdown, SidebarModals (via portal) |
| `z-[60]` | ProjectCreationWizard |
| `z-[70]` | ProjectCreationWizard inner modal |
| `z-[100]` | TaskDetail, TaskMasterSetupWizard |
| `z-[110]` | MCP form modals (Claude, Codex) |
| `z-[200]` | PRDEditor |
| `z-[300]` | PRDEditor inner dialog |
| `z-[9999]` | Settings, CodeEditor loading state, LoginModal |

This is already a mess. Adding toast notifications requires finding a z-index that is:
- Above all modals (some at 9999)
- Above the mobile nav (z-50)
- Above dropdown menus (z-50)
- But below browser-native UI (select dropdowns, autofill)

There is no slot available without either going to `z-[10000]` (arms race) or restructuring.

Additionally, only `SidebarModals` uses `ReactDOM.createPortal` -- all other modals are rendered inline in their parent component's DOM position, meaning they're subject to ancestor `overflow: hidden` or `stacking context` traps.

**Consequences:**
- Toast notifications invisible behind settings modal
- Error banners clipped by scroll containers
- Mobile nav overlay bleeds through modal backdrops
- Any new modal or overlay requires trial-and-error to find a working z-index

**Prevention:**
1. **Establish a z-index scale document and enforce it:**
   ```
   Layer 0:  Content (default, z-auto)
   Layer 10: Sticky headers (within scroll containers)
   Layer 20: Floating UI (scroll pill, tooltips)
   Layer 30: Dropdowns and popovers
   Layer 40: Overlay backdrops
   Layer 50: Modals and dialogs
   Layer 60: Toast notifications
   Layer 70: Critical overlays (error states, login)
   ```
2. **Portal ALL overlay content to document.body.** Toasts, modals, dropdowns, and lightboxes should all use `createPortal(content, document.body)`. This escapes all ancestor stacking contexts and overflow clipping. Currently only SidebarModals does this.
3. **Eliminate the z-[9999] pattern.** The LoginModal, Settings, and CodeEditor all use this -- they should use the standard modal layer (z-50) once portalled to body.
4. **Use a toast library that portals by default** (Sonner, react-hot-toast). Do not build a custom toast system that renders inline.
5. **Create CSS custom properties for z-index layers:**
   ```css
   :root {
     --z-sticky: 10;
     --z-floating: 20;
     --z-dropdown: 30;
     --z-overlay: 40;
     --z-modal: 50;
     --z-toast: 60;
     --z-critical: 70;
   }
   ```

**Detection:**
- Open a modal, then trigger a toast -- toast should be visible above the modal backdrop
- Open a dropdown inside a scrollable panel -- dropdown should not be clipped
- Open the mobile nav, then a modal -- modal should be above the nav

**Phase to address:** Error handling/toast phase must establish the z-index scale. Every subsequent phase adding overlays must follow it.

---

## Moderate Pitfalls

Mistakes that cause multi-hour debugging or require rework of a single feature area.

### Pitfall 7: Component Cascade -- Visual Changes Breaking Adjacent Panels

**What goes wrong:**
Changing the sidebar background color causes the mobile nav to show a seam (different shade visible at the junction). Updating the chat composer's border-radius breaks the scroll container's bottom padding. Changing the header height shifts the entire chat message area, invalidating the IntersectionObserver's rootMargin calculations.

**Why it happens:**
The layout is a tightly coupled grid/flex system where components share edges:
- Chat composer is position-fixed on mobile (`max-sm:fixed max-sm:bottom-0`) with a shadow that overlaps the message area
- Mobile nav is position-fixed at the bottom with safe-area padding
- The sidebar uses a `fixed inset-0 z-50` overlay on mobile
- Chat messages pane uses the scroll container's full height minus header and composer
- Tool call expand/collapse changes the height of content inside the scroll container

Changing any dimension (padding, margin, border-width, border-radius) on one panel can:
1. Create visible gaps or overlaps at panel junctions
2. Change the scroll container's computed height, breaking scroll position calculations
3. Shift the IntersectionObserver sentinel's position relative to the viewport

**Prevention:**
1. **Test every color/spacing change at both desktop AND mobile breakpoints.** Use Chrome DevTools responsive mode at 375px (iPhone SE), 390px (iPhone 14), and 768px (tablet) in addition to desktop.
2. **After changing any dimension on the chat composer, sidebar, or header:** verify the scroll container's height by checking `container.clientHeight` equals `viewport - header - composer`.
3. **Keep a visual test checklist** of junction points:
   - Sidebar/chat boundary
   - Header/chat boundary
   - Chat messages/composer boundary
   - Mobile nav/chat boundary (with safe areas)
   - Modal backdrop/underlying content boundary
4. **Never change padding/margin on one side of a junction without checking the other side.**

**Detection:**
- 1px seam of wrong color visible between panels
- Scroll container has 1-2px of unintended space at bottom (or clips the last message)
- Mobile nav overlaps chat composer input

**Phase to address:** Every phase that changes any component dimensions. Required regression check.

---

### Pitfall 8: Dark Mode Consistency -- Third-Party Component Leakage

**What goes wrong:**
After migrating to the new charcoal palette, certain surfaces still show white/light backgrounds: CodeMirror gutter, xterm.js background, react-markdown code blocks, `<select>` dropdown options, the `prose` typography plugin colors, and any component that uses the CloudCLI-inherited `bg-white bg-gray-800` pattern (which applied both classes and relied on dark mode to pick one).

**Why it happens:**
Multiple independent color systems are in play:

1. **xterm.js terminal:** Renders to canvas, uses its own `ITheme` object in `shell/constants/constants.ts`. Currently set to VS Code dark theme colors (`#1e1e1e` background, not matching the warm or charcoal palette). Must be updated independently with hex values.

2. **CodeMirror editor:** Uses inline styles from `editorStyles.ts` with hardcoded hex values (`#111827`, `#1e1e1e`, `#1f2937`, `#374151`). Also uses the Shiki highlighter with a color mapping table in `useShikiHighlighter.ts` that maps VS Code colors to warm Loom colors. Both must be updated.

3. **Tailwind Typography (`prose-invert`):** The `@tailwindcss/typography` plugin applies its own color scale for headings, links, code blocks, and borders inside prose content. `prose-invert` uses a gray scale that may not match charcoal. Currently used in 6+ components for markdown rendering.

4. **CloudCLI dual-class pattern:** Many inherited components use `bg-white bg-gray-800` -- both classes are applied, and the browser applies the last one. With Tailwind's purge, this relies on class order in the generated CSS, which is NOT guaranteed. This pattern is fragile and may render white backgrounds unpredictably.

5. **`<select>` element styling:** Custom dropdown arrow uses an inline SVG with hardcoded `stroke='%23c4a882'` (URL-encoded warm gold). Select options use `background-color: hsl(var(--card))` -- this will update with the variable change, but the arrow SVG will not.

**Prevention:**
1. **Create a third-party theming checklist:**
   - [ ] xterm.js `ITheme` updated to charcoal hex values
   - [ ] CodeMirror `editorStyles.ts` hex values updated
   - [ ] Shiki color map in `useShikiHighlighter.ts` updated
   - [ ] DiffViewer styles object (25+ colors) updated
   - [ ] Typography plugin colors verified against charcoal
   - [ ] Select dropdown SVG arrow updated
   - [ ] `bg-white bg-gray-800` pattern replaced with `bg-card` or `bg-background`
2. **For xterm.js:** Define a charcoal-matching theme constant and apply it:
   ```ts
   const CHARCOAL_THEME: ITheme = {
     background: '#1a1a1a', // match --background
     foreground: '#e8e0d8', // match --foreground
     cursor: '#D4736C',     // dusty rose cursor
     // ... Catppuccin Mocha ANSI colors
   };
   ```
3. **For CodeMirror:** Use `EditorView.theme()` extension instead of `editorStyles.ts` string templates. Reference CSS custom properties where possible.
4. **For `prose` plugin:** Add custom overrides:
   ```js
   // tailwind.config.js
   typography: {
     DEFAULT: {
       css: {
         '--tw-prose-body': 'hsl(var(--foreground))',
         '--tw-prose-headings': 'hsl(var(--foreground))',
         '--tw-prose-code': 'hsl(var(--primary))',
         // etc.
       }
     }
   }
   ```
5. **Eliminate all `bg-white` occurrences** -- grep and replace with semantic token classes.

**Detection:**
- Open a terminal session -- background color doesn't match chat area
- View a code block in a chat message -- background is different shade than the message container
- Open a `<select>` dropdown -- options show white background
- Markdown links are blue instead of dusty rose

**Phase to address:** Design system phase for CSS variable + config changes. Terminal/editor theming as a separate dedicated wave. Typography plugin override in the markdown rendering wave.

---

### Pitfall 9: Responsive Breakpoint Regressions -- Desktop Changes Breaking Mobile

**What goes wrong:**
After restyling the chat composer for desktop (new border radius, padding, shadow), the mobile composer overflows the viewport, covers the mobile nav, or has broken safe-area padding. After adding expand/collapse animations on tool calls, mobile tool calls overflow horizontally. After changing the sidebar width, mobile sidebar doesn't close properly.

**Why it happens:**
The current codebase has extensive mobile-specific CSS in `index.css` (lines 351-436) and component-level responsive classes. The mobile layout has critical dependencies:

1. **Chat composer is position-fixed on mobile** (`max-sm:fixed max-sm:bottom-0`) with a shadow. Any change to its height affects the `--mobile-nav-total` calculation:
   ```css
   --mobile-nav-total: calc(var(--mobile-nav-height) + var(--mobile-nav-padding) + env(safe-area-inset-bottom, 0px));
   ```

2. **Mobile nav is position-fixed at the bottom** with safe-area insets for iOS notch devices. Changing padding or height on either the nav or the composer creates overlap.

3. **Touch device hover state overrides** (lines 439-477 in `index.css`) aggressively disable hover states with `!important`. If new components add hover-dependent UI (e.g., a hover-to-reveal toolbar), those will be invisible on touch devices.

4. **The `touch-action: manipulation`** on all mobile elements prevents double-tap-to-zoom but also affects scroll behavior in custom scroll containers. New scroll-based UI (e.g., horizontal scrollable code blocks) may not scroll on mobile.

5. **Safe area padding** is applied via CSS `env()` functions that only work in standalone/PWA mode. Testing in a regular mobile browser will not show safe-area issues.

**Prevention:**
1. **Test every visual change at 375px width (Chrome DevTools responsive mode) as a mandatory step.** Not optional, not "later."
2. **After any change to the chat composer or mobile nav:** verify that:
   - Composer input is fully visible above the mobile nav
   - Safe area padding is correct (test with DevTools "Device frame" option)
   - Keyboard appearance doesn't push content off-screen
3. **Audit new hover-dependent UI for touch compatibility.** Any element hidden behind `group-hover:opacity-100` must have an alternative reveal mechanism on touch (always visible, tap-to-toggle, etc.). The existing CSS already forces `group-hover:opacity-100` to always be visible on touch -- verify new hover UI inherits this.
4. **Test horizontal overflow** after any padding or width change. Add `overflow-x: hidden` to scroll containers that should not scroll horizontally.
5. **PWA safe-area testing** requires deploying to the server and testing on an actual iOS device in standalone mode, or using the iOS simulator. DevTools responsive mode does NOT simulate `env(safe-area-inset-bottom)`.

**Detection:**
- Mobile nav overlaps chat input
- Content extends beyond viewport width (horizontal scroll appears)
- Buttons or interactive elements have no visible feedback on touch devices
- Safe area insets show content behind the iPhone notch/Dynamic Island

**Phase to address:** Every phase must include mobile regression testing. The design system phase must define mobile-specific tokens. The streaming UX phase must verify mobile auto-scroll behavior.

---

### Pitfall 10: Bundle Size Creep from Animation Libraries

**What goes wrong:**
To add "professional" micro-interactions, a developer adds `framer-motion` (30KB gzipped), `@react-spring/web` (18KB gzipped), or GSAP (23KB gzipped). The bundle size grows by 50-100KB for animations that could be achieved with CSS transitions and 10 lines of CSS keyframes. On mobile connections, the extra 50-100KB adds 200-500ms to initial load.

**Why it happens:**
Animation libraries offer compelling DX: `<motion.div animate={{ opacity: 1 }}>` is more readable than managing CSS classes. But Loom's animation needs are achievable with CSS:
- Message entry: CSS `opacity` + `transform` transition (3 lines of CSS)
- Expand/collapse: CSS `max-height` or `grid-template-rows: 0fr/1fr` transition (5 lines)
- Hover states: Tailwind's built-in `hover:` classes
- Aurora shimmer: Already done with CSS `@property` + keyframes
- Skeleton loading: CSS `background-size` animation + gradient

The existing codebase has zero animation library dependencies. Adding one sets a precedent where future developers default to the library for every animation, compounding the size cost.

**Consequences:**
- 30-100KB added to the JS bundle for marginal DX improvement
- Tree-shaking doesn't help -- animation runtime is monolithic
- Future developers default to the library for trivial animations (scale, opacity, translate)
- Mobile performance degrades from parsing and executing the additional JS

**Prevention:**
1. **Do not add framer-motion, react-spring, GSAP, or any animation JS library.** The project constraint is CSS-based animations only.
2. **Use CSS `@keyframes` for complex animations** (already proven by aurora shimmer).
3. **Use Tailwind's `transition-*` utilities for simple state changes:**
   ```html
   <div class="transition-opacity duration-200 opacity-0 group-hover:opacity-100">
   ```
4. **For enter/exit animations requiring JS orchestration:** Use a lightweight pattern:
   ```ts
   // 400 bytes, not 30KB
   const [show, setShow] = useState(false);
   const [render, setRender] = useState(false);
   useEffect(() => {
     if (show) { setRender(true); requestAnimationFrame(() => setMounted(true)); }
     else { setMounted(false); setTimeout(() => setRender(false), 200); }
   }, [show]);
   ```
5. **If a library is absolutely needed**, use `@formkit/auto-animate` (2KB) which adds enter/exit animations to lists with zero configuration, rather than a full animation framework.

**Detection:**
- `framer-motion` or `@react-spring` appears in `package.json`
- Bundle analyzer shows animation library as >5% of total JS
- `import { motion }` appears in component files

**Phase to address:** Animation/micro-interaction phase. Establish the "CSS-only animations" constraint before implementation begins.

---

## Minor Pitfalls

Mistakes that cost a few hours or create technical debt but don't block progress.

### Pitfall 11: Prose/Typography Plugin Color Leakage

**What goes wrong:**
After updating the palette, markdown-rendered content (chat messages, tool outputs) has wrong link colors, code block backgrounds, or heading colors because the Tailwind Typography plugin has its own color system that doesn't read from CSS custom properties by default.

**Prevention:**
Override `prose` colors in `tailwind.config.js` using CSS custom properties. Apply `prose-invert` consistently across all markdown rendering points (currently 6+ components). Verify markdown code blocks, links, blockquotes, and table borders all use the new palette.

---

### Pitfall 12: Select Dropdown Arrow SVG Hardcoded Color

**What goes wrong:**
The `<select>` element dropdown arrow is a URL-encoded SVG with `stroke='%23c4a882'` (warm gold). After the palette change, the arrow color is wrong. It's easy to miss because select dropdowns are rarely tested.

**Prevention:**
Update the SVG stroke in `index.css` line 628 to use the new muted foreground color. Verify on both Chrome and Firefox (Firefox renders `<select>` differently).

---

### Pitfall 13: Scrollbar Color Hardcoded Outside Variables

**What goes wrong:**
The custom scrollbar thumb and track colors in `index.css` use raw `hsl(34.5 35.9% 63.9% / 0.3)` -- the warm gold muted-foreground value hardcoded directly. After updating CSS variables, scrollbars still show warm gold.

**Prevention:**
Replace hardcoded scrollbar colors with `hsl(var(--muted-foreground) / 0.3)` so they update automatically when the variables change. This appears in 4 places in `index.css` (lines 291, 304, 576, 594).

---

### Pitfall 14: `bg-black/50` Backdrop Color on Charcoal

**What goes wrong:**
Modal backdrops use `bg-black/50` (Tailwind's black at 50% opacity). On the warm brown palette, this created adequate contrast. On near-black charcoal (#1a1a1a), `bg-black/50` is barely visible -- the backdrop doesn't visually distinguish the modal from the background. Users may not realize a modal is open.

**Prevention:**
Increase backdrop opacity to `bg-black/70` or use a lighter tint like `bg-white/5` combined with `backdrop-blur-sm` for a frosted glass effect that works on dark backgrounds. Test that the backdrop is visually distinguishable from the base background.

---

### Pitfall 15: `transition: none` Global Reset Conflicting with New Animations

**What goes wrong:**
The existing `index.css` line 107 sets `transition: none` on ALL elements (`*`), then selectively re-enables transitions on specific elements. New components that expect Tailwind's default transition behavior (e.g., `transition-colors` utility) will not animate because the global `transition: none` overrides them.

**Prevention:**
Be aware that any Tailwind transition utility (`transition-colors`, `transition-opacity`, etc.) is overridden by the global `transition: none` in `index.css`. Either:
1. Add specific CSS selectors to the "re-enable transitions" list in `index.css`
2. Use inline `style={{ transition: '...' }}` for components that need transitions
3. Consider removing the global `transition: none` and instead applying it only where needed (this is a riskier change that could introduce unwanted transitions everywhere)

**Phase to address:** Must be understood before the animation phase begins. Decide on the transition strategy first.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Design system / CSS variables | HSL alpha-value contract breakage (#2) | Create opacity test page before and after variable changes |
| Design system / CSS variables | Contrast ratio failure on charcoal (#5) | Audit every text/background pair with contrast checker tool |
| Color sweep / component migration | Hardcoded color hydra (#1) | Run full grep audit, create token map, replace all 51+ instances |
| Color sweep / component migration | Third-party component leakage (#8) | Separate checklist for xterm, CodeMirror, Shiki, DiffViewer, Typography |
| Color sweep / component migration | Scrollbar and select SVG colors (#12, #13) | Include in migration checklist, easy to forget |
| Streaming UX | Animation jank during streaming (#3) | Profile FPS during streaming after adding any animation |
| Streaming UX | Auto-scroll vs. animations (#4) | Test scroll pill behavior with every new transition |
| Error handling / toasts | Z-index wars (#6) | Establish z-index scale before adding toast layer |
| Error handling / toasts | Backdrop contrast on charcoal (#14) | Test backdrop visibility on charcoal background |
| Micro-interactions / animations | Bundle size creep (#10) | CSS-only constraint, no animation libraries |
| Micro-interactions / animations | Global `transition: none` override (#15) | Understand the override system before writing animation CSS |
| Every phase | Component cascade at panel junctions (#7) | Check all junction points after any dimension change |
| Every phase | Responsive breakpoint regression (#9) | Mobile testing at 375px for every visual change |

---

## "Looks Done But Isn't" Checklist

- [ ] **Opacity modifiers work:** `bg-primary/50` renders semi-transparent, not full opacity (test with DevTools color picker on the computed value)
- [ ] **All 51+ hardcoded hex values replaced:** `grep -rn '\[#[0-9a-fA-F]\{6\}\]' src/` returns 0 matches (excluding comments)
- [ ] **Scrollbar colors match palette:** Custom scrollbar thumb is charcoal-tinted, not warm gold
- [ ] **Select dropdown arrow matches palette:** Dropdown chevron SVG stroke updated from `%23c4a882`
- [ ] **xterm.js terminal background matches:** Terminal background is charcoal, not `#1e1e1e` VS Code dark
- [ ] **CodeMirror editor matches:** Editor gutter and background are charcoal-palette, not `#111827` blue-gray
- [ ] **DiffViewer all 25+ colors updated:** All colors in the diff styles object match the new palette
- [ ] **Shiki syntax highlighting colors updated:** All 12 color mappings in `useShikiHighlighter.ts` reflect the new palette
- [ ] **No `bg-white` or `bg-gray-*` leakage:** `grep -rn 'bg-white\|bg-gray-' src/` returns 0 (excluding node_modules)
- [ ] **Contrast ratios pass WCAG AA:** Every text/background pair checked with contrast ratio tool, all >= 4.5:1 for normal text
- [ ] **Streaming performance stable:** FPS stays above 30 during streaming with animations enabled
- [ ] **Scroll pill doesn't flicker:** During tool-call expand animation, scroll pill appears at most once
- [ ] **Auto-scroll works during streaming:** New tokens scroll into view when user is at bottom
- [ ] **Auto-scroll pauses when user scrolls up:** User can read earlier messages without being yanked to bottom
- [ ] **Mobile composer visible:** Chat input is fully visible above mobile nav at 375px width
- [ ] **Mobile safe area correct:** Content doesn't extend behind notch/Dynamic Island (test on iOS device or simulator)
- [ ] **Toast above all modals:** Trigger toast while modal is open -- toast is visible
- [ ] **No animation library in bundle:** `grep -r 'framer-motion\|@react-spring\|gsap' package.json` returns 0
- [ ] **Prose content styled:** Markdown headings, links, code blocks, and blockquotes use new palette colors
- [ ] **Modal backdrops visible:** `bg-black/50` (or adjusted opacity) creates visible contrast on charcoal background
- [ ] **`transition: none` understood:** New animation CSS either accounts for the global override or the override has been restructured

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hardcoded color hydra (#1) | MEDIUM (2-4 hours) | Grep audit -> create sed script -> batch replace -> visual QA each file |
| HSL alpha contract broken (#2) | LOW (30 min) | Remove `hsl()` wrapper from variables, verify space-separated format |
| Animation jank during streaming (#3) | MEDIUM (2-3 hours) | Remove `transition: all`, add `is-streaming` class guard, limit GPU layers |
| Scroll behavior broken by animations (#4) | HIGH (4-8 hours) | Refactor animations to opacity/transform only, add debounce to scroll pill, compensate scrollTop during expand |
| Contrast ratio failures (#5) | MEDIUM (1-2 hours) | Audit with contrast tool, adjust lightness of affected colors, raise opacity floors |
| Z-index chaos (#6) | HIGH (4-6 hours) | Establish scale, portal all overlays to body, deduplicate z-indexes |
| Third-party color leakage (#8) | MEDIUM (2-3 hours) | Update each third-party config independently, visual QA each integration |
| Mobile breakpoint regression (#9) | MEDIUM (1-3 hours per regression) | Test at mobile breakpoints, fix individual components |
| Bundle size from animation library (#10) | LOW (1 hour) | Remove library, rewrite affected animations in CSS |
| Global `transition: none` conflicts (#15) | LOW-MEDIUM (1-2 hours) | Add selectors to override list or restructure global reset |

---

## Sources

- **Codebase audit of `/home/swd/loom/src/`** (PRIMARY source for all hardcoded color counts, z-index values, scroll behavior, and animation patterns) -- HIGH confidence
- [Tailwind CSS HSL opacity modifier docs](https://tailwindcss.com/docs/customizing-colors#using-css-variables) -- HIGH confidence (official docs)
- [WCAG 2.1 Contrast Requirements (Level AA)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) -- HIGH confidence (W3C standard)
- [MDN: CSS `contain` property](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) -- HIGH confidence
- [MDN: `content-visibility: auto`](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) -- HIGH confidence
- [Chrome DevTools: Analyze rendering performance](https://developer.chrome.com/docs/devtools/performance) -- HIGH confidence (official)
- [IntersectionObserver and CSS transitions interaction](https://github.com/w3c/IntersectionObserver/issues/478) -- MEDIUM confidence (spec discussion)
- [Tailwind Typography plugin customization](https://tailwindcss.com/docs/typography-plugin#customizing-the-css) -- HIGH confidence (official docs)
- [xterm.js ITheme interface](https://xtermjs.org/docs/api/terminal/interfaces/itheme/) -- HIGH confidence (official docs)
- [CodeMirror 6 Styling Guide](https://codemirror.net/examples/styling/) -- HIGH confidence (official docs)
- [React portals for modal/toast layering](https://react.dev/reference/react-dom/createPortal) -- HIGH confidence (official React docs)
- Framer Motion bundle size: [bundlephobia.com/package/framer-motion](https://bundlephobia.com/package/framer-motion) -- HIGH confidence
- [@formkit/auto-animate](https://auto-animate.formkit.com/) as lightweight alternative -- MEDIUM confidence

---

*Pitfalls research for: Visual redesign of React 18 / Tailwind CSS streaming chat UI -- Loom v1.1 Design Overhaul*
*Researched: 2026-03-03*
*Based on: Direct codebase audit of /home/swd/loom/src/ with grep-verified counts*
