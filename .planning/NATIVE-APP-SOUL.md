# Loom Native App Soul

> The authoritative visual contract for Loom's React Native iOS app (v3.0 Phases 69-73).
> This document supersedes 68-UI-SPEC.md baseline values where they conflict.
> Formalized from Bard's creative direction (NATIVE-APP-SOUL-DRAFT.md) with input from
> ChatGPT iOS and Claude iOS reference analysis.

---

## North Star

Loom's native app is a **crafted instrument for the hand** -- not a web app squeezed onto a phone, not a generic chat wrapper, but a purpose-built iOS tool where every interaction has physical weight and every surface has spatial depth. The app breathes with the conversation: warming when Claude streams a response, cooling when errors strike, focusing attention when permissions demand action.

Where ChatGPT iOS and Claude iOS prove that drawer-based AI chat works beautifully on iPhone, Loom pushes beyond them in three dimensions: **motion density** (spring physics on every interaction, not just gestures), **surface depth** (4 tiers plus glass, not 2-3 flat levels), and **dynamic color** (palette shifts tied to conversation state, not static themes). The result is an app that feels alive -- a physical object with mass, elasticity, and warmth.

swd's vision: "essentially a copy of ChatGPT/Claude's app, but with much more dynamic interfaces -- things moving, nice animations, beautiful color palettes, native support for all Loom features."

---

## Design Principles

### 1. Every Interaction Has a Physical Response
No silent taps. Every button press produces a spring scale + haptic. Every state transition animates. Every appearance has an entrance. The app is made of objects with mass and elasticity, not pixels that teleport.

**Example:** Tapping the send button scales it to 0.85 with a Micro spring (150ms settle), fires an Impact Light haptic, then springs back to 1.0. The user message bubble springs in from below. The composer contracts. Nothing is instant.

### 2. Surfaces Exist in Space
The UI has real depth. Cards float above the canvas. The drawer recedes behind the content. Glass surfaces reveal the world beneath them. Shadows, blur, and surface color create a spatial hierarchy that makes structure visible without explicit borders.

**Example:** The permission card enters at Tier 3 (overlay) with a Heavy shadow and accent glow, while the rest of the UI dims to 0.95 opacity. The card physically exists above the conversation, demanding attention through spatial prominence.

### 3. Color Responds to Context
The palette is not static. It breathes with the conversation state. Streaming warms the surfaces. Errors cool and desaturate. Permission requests create focused halos. These shifts are subtle -- felt more than seen -- but they create an emotional connection to the tool's state.

**Example:** When Claude begins streaming, the background shifts +3 degrees warmer on the OKLCH hue axis (32 to 35) over 500ms, and the accent color's opacity begins a gentle sinusoidal pulse (0.6 to 1.0 over 2.5s). When streaming ends, everything reverts.

### 4. Respect the Platform, Then Exceed It
iOS system behaviors are sacred: status bar, home indicator, Dynamic Island, edge-swipe back, scroll physics, keyboard animation. Loom never fights these. But within those constraints, Loom adds elevation that system apps lack -- deeper springs, richer surfaces, dynamic color that iOS itself does not do.

**Example:** The drawer opens with a spring that matches iOS feel (Drawer spring, 350ms settle) and the edge-swipe tracks the finger exactly. But behind the drawer, the main content shifts 20px right with a parallax effect and the overlay dims proportionally -- details that iOS stock components skip.

### 5. Warmth Over Coldness
Loom's palette is warm charcoal and dusty rose, never cool gray and blue. The typeface is Inter, not SF Pro -- because Loom has its own identity. Every color choice favors warmth. The darkest surface is `rgb(38, 35, 33)`, not `#000000`. The accent is `rgb(196, 108, 88)`, not blue.

**Example:** Side by side with ChatGPT iOS (cool dark grays, green accent), Loom feels distinctly warmer. Side by side with Claude iOS (warm browns, terracotta accent), Loom is a close sibling but with deeper surfaces and more motion.

---

## Elevation Layer

Per D-11: Motion + Depth + Dynamic Color, contextually applied. Motion for interactions, depth for structure, color for mood.

### Motion

All motion in Loom uses spring physics via `react-native-reanimated`. No linear or ease animations except where matching iOS system timing is required (keyboard avoidance).

#### Spring Configuration Reference

| Category | Damping | Stiffness | Mass | Settle Time | Use Case |
|----------|---------|-----------|------|-------------|----------|
| **Micro** | 18 | 220 | 0.8 | ~150ms | Button press feedback, icon scale, toggle snap |
| **Standard** | 20 | 150 | 1.0 | ~250ms | Card press, list item press, send button appear/disappear |
| **Navigation** | 22 | 130 | 1.0 | ~300ms | Screen push/pop, sheet presentation, modal appear |
| **Drawer** | 20 | 100 | 1.0 | ~350ms | Sidebar drawer open/close, panel slide |
| **Expand** | 18 | 90 | 1.0 | ~400ms | Tool card expand/collapse, thinking disclosure, accordion |
| **Dramatic** | 15 | 70 | 1.2 | ~500ms | Permission request appearance, error state, first message in session |

#### Motion Rules

1. Every interactive element responds to press with a Micro spring scale (0.97 on press, 1.0 on release).
2. Every appearance/disappearance uses at minimum a Standard spring with opacity + translateY.
3. Screen transitions use Navigation spring with horizontal translate.
4. Tool cards expand with the Expand spring, creating a satisfying unfold.
5. Permission requests and error states use the Dramatic spring to convey urgency and weight.
6. Streaming text does NOT animate per-character or per-word. Text appends and scroll follows smoothly.
7. All springs respect `AccessibilityInfo.isReduceMotionEnabled` -- replace with 0ms instant transitions.

#### Gesture-Driven Motion

- **Drawer swipe:** Tracks finger position exactly (no lag). On release, springs to open or closed based on velocity threshold (200 pts/sec) and position (>40% open = spring open).
- **Back swipe:** Matches iOS system edge-swipe behavior. Screen follows finger and springs back or completes based on velocity and distance.
- **Swipe-to-delete:** Reveals red "Delete" action surface. Item follows finger, action surface springs into view.
- **Pull-to-refresh:** Custom spring (damping 25, stiffness 120) for pull indicator. Triggers at 60pt overscroll.

#### Haptic Pairing

Every motion event has a paired haptic. No visual state change without tactile feedback.

| Event | Haptic Type | Timing |
|-------|-------------|--------|
| Message sent | Impact Light | On send button press |
| Tool card complete | Success Notification | On status change to complete |
| Permission request appears | Warning Notification | On appearance animation start |
| Error occurs | Error Notification | On error state transition |
| Swipe threshold crossed | Selection (light) | When finger crosses action threshold |
| Drawer open/close snap | Impact Medium | When drawer reaches final position |
| Long-press menu appear | Impact Heavy | On context menu presentation |
| Pull-to-refresh trigger | Impact Light | When overscroll threshold reached |

---

### Depth

Loom uses a 4-tier surface system extended with glass/blur for floating elements.

#### Surface Tiers

| Tier | Token | RGB | Usage | Shadow |
|------|-------|-----|-------|--------|
| 0 (Sunken) | `surface-sunken` | `rgb(38, 35, 33)` | Drawer background, inset areas, code block backgrounds | None |
| 1 (Base) | `surface-base` | `rgb(46, 42, 40)` | Chat background, scroll areas, default canvas | None |
| 2 (Raised) | `surface-raised` | `rgb(54, 50, 48)` | Cards, user message bubbles, list items on press | Subtle shadow |
| 3 (Overlay) | `surface-overlay` | `rgb(62, 59, 56)` | Modals, popovers, context menus, permission cards | Medium shadow |
| Glass | N/A | Semi-transparent + blur | Nav header, floating composer, command palette, search input | Heavy shadow |

#### Shadow Specifications (iOS `shadow*` props)

```
Subtle:  { shadowColor: '#000', shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.15, shadowRadius: 8  }
Medium:  { shadowColor: '#000', shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.25, shadowRadius: 16 }
Heavy:   { shadowColor: '#000', shadowOffset: { width: 0, height: 8 },  shadowOpacity: 0.30, shadowRadius: 32 }
Glow:    { shadowColor: accent, shadowOffset: { width: 0, height: 0 },  shadowOpacity: 0.25, shadowRadius: 16 }
```

#### Glass Treatment

- **Blur intensity:** 40 (`expo-blur` BlurView with `intensity={40}`)
- **Background tint:** `dark`
- **Overlay color:** `rgba(0, 0, 0, 0.35)`
- **Border:** 1px `border-subtle` (`rgba(255,255,255,0.07)`)
- **Corner radius:** 16px (`rounded-2xl`)
- **Usage:** Elements that float over scrolling content -- navigation header, floating composer bar, modal backdrops, search input in drawer.

#### Depth Rules

- Tier 0: Surfaces that recede (drawer behind main content, inset code block backgrounds).
- Tier 1: Default canvas. Most content sits here.
- Tier 2: Interactive cards the user can act on. Elevated to suggest affordance.
- Tier 3: Temporary surfaces that demand attention (modals, menus, permission dialogs).
- Glass: Surfaces that need to show content flowing beneath them. Used sparingly for maximum impact.
- Glow shadow: Applied to the accent-colored send button and active connection indicator. Creates a subtle colored halo.

---

### Dynamic Color

Color in Loom is not static. The palette responds to the state of the conversation.

#### Context-Driven Color Shifts

| State | Color Behavior | Implementation |
|-------|---------------|----------------|
| **Idle** | Neutral palette at default OKLCH values. No animation. | Default state, no interpolation. |
| **Streaming** | Subtle warmth increase. Surface-base shifts ~2% warmer on OKLCH hue axis (32 to 35). Accent opacity pulses (0.6 to 1.0 over 2.5s, sinusoidal). | `useSharedValue` with `withRepeat(withTiming(...))` on accent opacity. Background via Reanimated color interpolation. |
| **Thinking** | Accent glow on composer dims. Muted "thinking" color (text-muted at 60% opacity) pulses on status indicator. Surfaces remain neutral. | Opacity pulse on status indicator. Composer accent dims to 0.4 opacity. |
| **Error** | Background shifts cooler (hue toward 20, desaturated). Destructive color (`rgb(210, 112, 88)`) becomes dominant accent temporarily. Borders shift to interactive weight. | Background color interpolation over 500ms. Destructive color on status indicators. Borders visible for 3s then fade. |
| **Permission request** | Permission card has warm glow (accent shadow). Rest of UI dims slightly (opacity 0.95 on non-card elements). | Card-level glow shadow. Slight dim via semi-transparent overlay. |
| **Tool executing** | Active tool card border shifts from subtle to interactive. Subtle "progress" shimmer sweeps across card surface (horizontal gradient, 2s cycle). | Reanimated horizontal gradient position animation. Border color transition. |

#### Color Transition Rules

- All color transitions use `withTiming` at 500ms duration with `Easing.out(Easing.cubic)`. Springs are for position/scale; timing is for color.
- Color shifts are SUBTLE. The user should feel a mood change, not see a color change. If someone watching over your shoulder notices the shift, it is too aggressive.
- Dynamic color is disabled when `isReduceMotionEnabled` is true. Surfaces stay at default values.

---

## Screen Specifications

### Session List

The session list lives inside the sidebar drawer and is the primary navigation surface.

**Layout:**
- Full-height drawer, width ~300px (80% of screen width, capped at 320px).
- Background: `surface-sunken` (Tier 0) -- visually recedes behind the chat area.
- Top section: "Loom" heading (Large Title: 28px bold, `text-primary`) with "New Chat" button (accent background, 44px height, rounded-xl).
- Content: ScrollView of session items, grouped by project. Project headers use Caption style (12px, muted).
- Bottom: Settings icon (44px touch target) and connection status indicator.

**Components:**
- **Session item:** 56px min-height, px-4 py-4. Title: session name (15px semibold, single line, truncated). Subtitle: relative time + model name (12px muted). Right: unread indicator dot (accent, 8px) or nothing.
- **Active session:** Background shifts to `surface-raised` with left accent border (3px, accent color). Only structural use of accent as border.
- **Pinned sessions:** Grouped at top with "Pinned" header (12px, muted, uppercase). Pin icon (text-muted) to the right.
- **Search:** Collapsed search input below heading. Expands on tap with glass background. Full-width, rounded-2xl, magnifying glass icon left.

**Motion:**
- Drawer open/close: Drawer spring (20/100, ~350ms). Main content shifts right ~20px and dims.
- Session item press: Micro spring scale (0.97) + background color shift to `surface-raised` over 100ms.
- Session item appear (first load): Staggered opacity + translateY (30ms delay per item, max 10 animated).
- Swipe-to-delete: Standard spring reveal of destructive action surface.

**Color:**
- When streaming in active session, the active indicator dot pulses with accent opacity animation.

---

### Chat Thread

The primary content surface where conversations happen.

**Layout:**
- Full-screen with navigation header at top and composer at bottom.
- Navigation header: Session title (17px semibold, centered), back arrow (left), model indicator (right -- small text: "Claude" / "Gemini" / "Codex").
- Message area: FlatList/FlashList filling space between header and composer. Content insets for safe area.
- Messages alternate: assistant (no container, flush left) and user (raised bubble, `surface-raised`, rounded-2xl).

**Components:**
- **Assistant message:** Text directly on `surface-base`. Body text (15px regular, `text-primary`). Markdown rendered inline: headings, bold, italic, lists, links.
- **User message:** Rounded container (`surface-raised`, rounded-2xl, p-4). Text (15px regular, `text-primary`). Right-aligned in layout, left-aligned text within bubble.
- **Turn spacing:** 24px between turns, 8px between consecutive same-role messages.
- **Avatar:** 24px circular at top-left of assistant messages only. Provider icon (Claude terracotta, Gemini blue, Codex green).
- **Timestamp:** Caption (12px muted), shown on long-press or after 5-minute gaps.

**Motion:**
- User message appearance: Standard spring (opacity 0 to 1, translateY 20 to 0).
- Assistant response start: First token fades in (150ms opacity). No spring -- streaming content flows.
- Scroll-to-bottom pill: Glass surface, accent text. Bounces once on appearance with Standard spring. Tapping animates scroll to bottom, pill fades out (100ms).

**Color:**
- During streaming, the global warmth shift applies to chat background.
- Streaming indicator: thin (2px) accent-colored line at bottom of message area, pulsing (opacity 0.3 to 0.8, 1.5s cycle). Disappears when streaming completes.

---

### Composer

The message input area, fixed to the bottom of the chat screen.

**Layout:**
- Fixed bottom, above safe area inset.
- Background: Glass surface (blur backdrop showing last messages) OR opaque `surface-raised` if glass performance insufficient.
- Text input: Single-line expanding to multi-line (max 6 lines before internal scroll). Placeholder: "Message" in `text-muted`.
- Left: Attachment button (+) expanding to file/camera options.
- Right: Send button (circular, 36px, accent background when text present, `surface-raised` when empty).

**Components:**
- **Text input:** 15px body text. Padding px-4 py-3. Internal rounded container (rounded-2xl, border border-subtle).
- **Send button:** 36px diameter. Background transitions `surface-raised` to `accent` (200ms) when text appears. Glow shadow when active.
- **Attachment menu:** Slides up with Expand spring. Items: Camera, Photo Library, File. Each 44px height.
- **Status bar:** Below input, ~24px tall. Caption text showing: token count, model name, connection status dot.

**Motion:**
- Keyboard avoidance: Perfect sync with iOS keyboard via `react-native-keyboard-controller`. NOT a spring -- matches system curve exactly.
- Send: Button scales down (Micro spring, 0.85) then back (1.0). Text clears. Input contracts to single-line with Standard spring.
- Multi-line expansion: Height changes with Standard spring, never instant.
- Focus: Border shifts `border-subtle` to `border-interactive` (200ms color transition).

**Color:**
- During streaming, send button transforms to stop button: background becomes `destructive`, icon changes to square (200ms color transition).
- Glass backdrop creates inherent dynamic color as content scrolls behind composer.

---

### Tool Cards

Inline cards within the assistant message flow showing tool execution status.

**Layout:**
- Surface Card (Tier 2, `surface-raised`, rounded-xl, p-4) inline in message flow.
- Header: Tool icon (16px, text-muted) + tool name (Caption, 12px, semibold, text-secondary) + status dot (8px: accent=running, success=complete, destructive=error) + elapsed time (Caption, muted).
- Collapsed: Header only, 44px min height.
- Expanded: Header + details. Body text (15px) for content, Caption (12px) for labels.

**Tool type details:**
- **Read/Write/Edit:** File path (monospace 14px), line count or diff summary.
- **Bash/Execute:** Command (monospace 14px, `surface-sunken` inset), truncated output (max 4 lines collapsed).
- **Search/Glob/Grep:** Pattern (monospace), match count, first 3 results.
- **MCP tools:** Tool name, input params (key-value Caption), output summary.

**Motion:**
- Expand/collapse: Expand spring (18/90, ~400ms). Content fades in with 100ms delay after expand starts.
- Status change (running to complete): Status dot color transition (200ms). Success haptic fires.
- Grouped cards: 8px spacing. "N tools" summary header collapses group. Group expand uses Expand spring.
- Appearance: Card slides in from right with Standard spring (translateX 30 to 0, opacity 0 to 1).

**Color:**
- Running: Border shifts to `border-interactive`. Shimmer animation sweeps across card (2s cycle).
- Complete: Border returns to `border-subtle`. Brief green flash (success at 0.1 opacity, fades 300ms).
- Error: Border becomes `destructive` at 0.5 opacity. Background briefly `destructive` at 0.05 opacity.

---

### Permission Request

The highest-priority UI element -- demands immediate user attention.

**Layout:**
- Appears above composer as elevated card. Tier 3 (overlay) with Heavy shadow.
- Content: Description (Body text), file path or command (monospace, `surface-sunken` inset), two action buttons.
- Approve button: Accent background, "Approve" (semibold, accent-fg), 44px height.
- Deny button: `surface-raised` background, "Deny" (semibold, text-primary), 44px height.
- Buttons side-by-side, 12px gap. Approve on right (primary action position for iOS).

**Motion:**
- Appearance: Dramatic spring (15/70, mass 1.2). Card slides up from below composer (translateY 60 to 0, opacity 0 to 1). The most dramatic entrance animation in the app.
- Haptic: Warning notification at entrance animation start.
- Approve: Micro spring (0.95), then slides down and fades out (Standard spring). Success haptic.
- Deny: Same exit animation, Impact Light haptic instead of Success.
- Multiple permissions: Stack with "N more" indicator. Each new permission pushes previous down (Navigation spring).

**Color:**
- Accent glow shadow on entire permission card (warm halo).
- Rest of UI dims to 0.95 opacity (Dynamic Color: Permission state).
- Approve button gets Glow shadow on press.

---

### Sidebar Drawer

The container for the session list and primary navigation mechanism.

**Layout:**
- Full-height panel on left side, overlaying main content.
- Width: 300px (80% of screen, max 320px).
- Main content behind drawer dims with `rgba(0, 0, 0, 0.4)` overlay and shifts right ~20px (parallax depth effect).

**Motion:**
- Open: Drawer spring (20/100, ~350ms). Dim overlay fades in with same timing.
- Close: Same spring in reverse. Tapping dim overlay closes drawer.
- Gesture: Opens from left edge (first 20px). Drawer tracks finger during swipe. On release, springs to open/closed based on velocity (>200 pts/sec) and position (>40% open).
- Parallax: Main content shift driven by gesture value (drawer position * 0.067).

**Color:**
- Drawer background is `surface-sunken` -- the darkest surface. Main content (`surface-base`) floats above it.

---

### Settings

Configuration screen for server, model, and app settings.

**Layout:**
- Full-screen pushed onto navigation stack from drawer.
- Navigation header: "Settings" (17px semibold, centered), back arrow.
- Content: ScrollView with grouped sections. Section header (Caption, 12px, text-muted, uppercase). Section items: List Item (56px, px-4 py-4). Title left, value/toggle right.
- Sections (v3.0 scope): Server Connection (URL, status), Model Selection (current, available), Appearance (reserved), About (version, debug info).

**Motion:**
- Screen entrance: Navigation spring (horizontal slide from right).
- Toggle switch: Micro spring on thumb position change.
- Section items: Standard spring press feedback.

**Color:**
- Standard surface hierarchy. No dynamic color shifts. Section headers use `text-muted`. Item values use `text-secondary`.

---

### Share Sheet

Native iOS sharing integration for messages and code.

**Layout:**
- Triggered by long-press context menu on a message, selecting "Share."
- Uses native iOS `UIActivityViewController`. No custom share sheet.
- Shared content: Plain text of message, or for code blocks, code content with language annotation.

**Motion:**
- Native share sheet animates per iOS system behavior. No customization.
- Context menu trigger uses native `UIContextMenuInteraction` (blur background, spring presentation, haptic).

**Color:**
- Native share sheet uses system palette. No Loom customization.

---

### Notification UI

Push notifications and in-app notification banners.

**Layout:**
- **Push notifications:** Standard iOS banners. Custom notification content extension:
  - Title: Session name
  - Body: Message or permission request summary
  - Category: "PERMISSION_REQUEST" with "Approve" and "Deny" actions for permission requests
- **In-app banner** (when foregrounded): Custom banner below status bar.
  - Background: Glass surface (blur + dark overlay).
  - Content: Provider icon (24px) + message text (Body, 15px) + dismiss timer (Caption, muted).
  - Height: Auto-sized, min 56px.

**Motion:**
- In-app banner entrance: Navigation spring slide-down from above screen. Auto-dismisses after 4 seconds with slide-up Standard spring.
- Tapping banner navigates to relevant session with standard push transition.

**Color:**
- Permission banners: warm accent tint (accent at 0.1 opacity background).
- Error banners: destructive tint.
- Standard banners: glass treatment, no tinting.

---

### Code Block Detail

Syntax-highlighted code rendering within messages.

**Layout:**
- Inline within message flow: `surface-sunken` background (darkest surface), rounded-xl, p-4.
- Header bar: Language label (Caption, 12px, text-muted) left, "Copy" button right (Caption, accent, 44px touch target).
- Content: Monospace (JetBrains Mono, 14px), horizontal scroll for long lines.
- Long blocks (>15 lines): "Show more" / "Show less" toggle (Caption, accent).
- Full-screen detail (Phase 73 scope): syntax highlighting, line numbers, "Run in Terminal" action.

**Motion:**
- Show more / Show less: Expand spring on height change.
- Copy action: "Copy" text changes to "Copied!" with checkmark (100ms fade). Returns after 2 seconds.
- Full-screen detail (Phase 73): Navigation spring push transition.

**Color:**
- `surface-sunken` to visually recede -- code is "embedded" in the message, not floating above it.
- Syntax highlighting colors TBD (Shiki integration in Phase 73). Initial renders as unstyled monospace.

---

### Search

Session search within the drawer.

**Layout:**
- Triggered from session list drawer. Search input at top, pushing session list down.
- Input: Full-width, glass background, rounded-2xl, magnifying glass icon left.
- Results: Session list filters in real-time. Matching text highlighted with accent background (accent at 0.15 opacity).
- Empty state: "No sessions match your search" (Body text, centered, text-muted).
- Cancel: "Cancel" text button right of search input. Clears and collapses.

**Motion:**
- Input expansion: Standard spring. Slides down from heading, pushing session list.
- Filtering: Non-matching items fade out (opacity 0, 150ms). Matching items reorder with layout animation (Standard spring).
- Cancel: Input collapses with Standard spring.

**Color:**
- Search input uses glass treatment (blur + semi-transparent) to distinguish from drawer surface.
- Highlighted text: accent at 0.15 opacity as background.

---

### Pinned Sessions

Quick-access sessions at the top of the session list.

**Layout:**
- Dedicated section at top of session list drawer.
- Header: "Pinned" (Caption, 12px, text-muted, uppercase).
- Items identical to regular sessions with pin icon (text-muted, 12px) to right of title.
- Max 5 visible before scrolling or "Show all" toggle.

**Motion:**
- Pin action: Session item animates from current position to pinned section (Navigation spring, shared element transition).
- Unpin: Reverse -- item animates back to chronological position.
- Pin icon: Micro spring scale (0 to 1) when entering pinned section.

**Color:**
- Same surface treatment as regular items. Pin icon uses `text-muted`. No accent treatment -- pinning is structural, not visual.

---

## Typography Overrides

Building on 68-UI-SPEC.md baseline with two additions from reference app analysis:

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Large Title | 28px | Bold (700) | 1.14 (34px) | Session list header "Loom" ONLY. Matches iOS Large Title convention. |
| Subheading | 13px | Regular (400) | 1.38 (18px) | Tool card labels, section metadata. Between Caption and Body. |

**Weight expansion:** Bold (700) is permitted ONLY for Large Title. All other text remains Regular (400) or Semibold (600) per UI-SPEC baseline.

All other typography values (Body 15px, Heading 17px, Caption 12px, Code 14px) inherit from 68-UI-SPEC.md without modification.

---

## Color Overrides

No color value changes from 68-UI-SPEC.md baseline. The accent color (`rgb(196, 108, 88)` -- dusty rose/terracotta) and the 4-tier warm charcoal surface palette are confirmed as correct for the native app.

**Accent reserved-for list confirmed (from UI-SPEC):**
1. Send button (composer)
2. Active session indicator (sidebar)
3. Primary CTA buttons only
4. Connection status dot (when connected)
5. Selected/focused tab indicator

**One addition:** Glow shadow uses the accent color (`shadowColor: accent`) on the send button and active connection indicator.

---

## Icon Direction

- **Primary:** SF Symbols via `expo-symbols` -- native iOS icons matching system conventions. ~6,000 symbols with weight/scale variants.
- **Fallback:** Lucide React Native (`lucide-react-native`) -- matches web app's existing Lucide usage. ~1,500 tree-shakeable icons.
- **Rule:** SF Symbols for navigation and system UI (back arrow, settings gear, share icon, search). Lucide or custom icons for Loom-specific elements (tool card icons, provider logos).

---

## Spacing Additions

One addition to the UI-SPEC spacing scale for message layout:

| Context | Value | Token | Rationale |
|---------|-------|-------|-----------|
| Between turns (user to assistant) | 24px | `gap-6` | Clear visual separation between conversation turns |
| Between same-role messages | 8px | `gap-2` | Tight grouping for multi-message sequences |
| Message horizontal padding | 16px | `px-4` | Matches both reference apps |
| Tool card group spacing | 8px | `gap-2` | Compact tool stacking |
| Composer to keyboard | 0px | -- | Flush against keyboard, separated by surface color |
| Screen horizontal safe margin | 16px | `px-4` | Standard iOS content margin |

---

## Anti-Patterns

These are explicit prohibitions. Violating any of these is a defect.

### Structural

1. **No flat surfaces without depth cues.** Every interactive card must have a shadow, border, or distinguishing background. A card invisible against its background is a bug.

2. **No instant state changes.** Every visual state transition must have a spring or timed transition. A button that changes color without animation, a card that appears without entrance, a modal without spring -- all bugs.

3. **No web-style hover states.** There is no hover on iOS. Use press states (scale down + haptic). If a component has `onHoverIn`, it is wrong.

4. **No touch targets below 44px.** Every interactive element: 44x44 point minimum. Use `hitSlop` on small visual elements. Measure, do not estimate.

5. **No unsynchronized keyboard animations.** Composer must move in perfect sync with iOS keyboard. Any gap, jump, or misaligned frame is a bug. Use `react-native-keyboard-controller`, not `KeyboardAvoidingView`.

### Visual

6. **No pure black (#000000) backgrounds.** All backgrounds use the warm dark palette. Darkest surface: `surface-sunken` = `rgb(38, 35, 33)`. Pure black is cold and harsh.

7. **No visible borders as the only depth cue.** If a card's only separation from its background is a 1px border, it lacks depth. Borders supplement shadows and surface color -- they do not replace them.

8. **No uniform text weight.** Every screen must have at least two weights visible: semibold for headings/titles, regular for body. All-same-weight text lacks hierarchy.

9. **No gray accent color.** The accent (`rgb(196, 108, 88)`) must pop against dark surfaces. If it appears muted, washed out, or gray-shifted, it has lost its warmth.

10. **No white text on light surfaces.** Text-primary (`rgb(230, 222, 216)`) is designed for dark surfaces. On anything lighter than `surface-raised`, contrast is insufficient.

### Interaction

11. **No silent interactions.** Every tap on an interactive element produces haptic feedback. Exception: scrolling (passive, not an action).

12. **No orphaned animations.** Every started animation must complete or be interrupted gracefully. A spring interrupted by navigation must cancel cleanly, not freeze mid-frame.

13. **No loading spinners without context.** Never show a generic spinner. Show what is loading: "Loading sessions...", "Connecting to server...", or a content skeleton.

14. **No stale state after backgrounding.** When the app returns to foreground, state syncs within 1 second. Old data in session list, "connected" when disconnected, frozen streaming -- all bugs.

15. **No platform-fighting.** Never override iOS system behaviors: status bar, home indicator, Dynamic Island, notch safe areas, system back gesture. If Loom fights the platform, it feels hostile.

---

## Reference App Comparison

| Aspect | ChatGPT iOS | Claude iOS | Loom |
|--------|-------------|------------|------|
| **Palette warmth** | Cool dark grays | Warm dark browns | Warm -- matches Claude's warmth, extends with OKLCH depth |
| **Message containers** | User bubbles only | User bubbles only | User bubbles only -- assistant text free-flowing |
| **Avatar** | 28px, both roles | Smaller, assistant only | 24px, assistant only. User messages self-evident. |
| **Composer shape** | Pill (20px radius) | Rounded rect (24px) | Rounded rect with glass effect (24px radius, blur backdrop) |
| **Motion philosophy** | Subtle but present | Conservative, measured | Bold -- spring physics on every interaction |
| **Surface depth** | 2 tiers | 3 tiers | 4 tiers + glass layer |
| **Accent usage** | Model-specific (green, purple) | Brand terracotta | Dusty rose/terracotta (aligned with PROJECT_SOUL) |
| **Code blocks** | Dark surface, copy | Dark surface, copy | Dark surface, copy + "Run in Terminal" (Phase 73) |
| **Tool visualization** | Inline text status | Collapsible sections | Elevated cards with state machine, spring expand/collapse |
| **Dynamic color** | Static | Static | State-responsive -- streaming, error, permission shifts |
| **Keyboard** | Perfect iOS sync | Perfect iOS sync | Perfect iOS sync (react-native-keyboard-controller) |
| **Haptics** | Light/medium on key actions | On send, long-press | On every interaction -- comprehensive pairing table |

**What Loom copies:** Drawer + stack navigation, user-bubble/assistant-flat message layout, composer bottom-fixed with keyboard sync, edge-swipe back gesture, system scroll physics.

**What Loom improves upon:** Motion density (springs everywhere vs selective), surface depth (4 tiers + glass vs 2-3), dynamic color (state-responsive vs static), haptic coverage (every interaction vs key actions only), tool card visualization (elevated cards vs inline text).

**What Loom skips:** ChatGPT's model-specific accent colors (Loom has one accent), Claude's bottom "New Chat" float in drawer (Loom uses top-positioned button).

---

## Elevation Examples

### Sending a Message

1. **Press:** Send button scales to 0.85 (Micro spring 18/220). Impact Light haptic.
2. **Release:** Button scales to 1.0. Text clears.
3. **Bubble:** User message springs in from below (translateY 20 to 0, opacity 0 to 1, Standard spring 20/150). Input contracts to single-line.
4. **Scroll:** Message list scrolls to show new message.
5. **Streaming begins:** ~200ms later, first assistant text fades in (150ms opacity). Streaming accent line pulses (opacity 0.3 to 0.8, 2.5s cycle).
6. **Dynamic color:** Background warms (hue 32 to 35). Accent opacity pulse starts.
7. **Streaming ends:** Accent line fades out (200ms). Warmth reverts (500ms). Drawer session subtitle updates.

### Tool Card Completing

1. **Running:** Border `border-interactive`. Shimmer gradient sweeps (2s cycle). Status dot accent.
2. **Completion:** Shimmer stops. Border to `border-subtle` (200ms). Status dot accent to success (200ms). Green flash (success at 0.1, fades 300ms).
3. **Haptic:** Success notification at transition.
4. **Content:** Expanded: output fades in (100ms). Collapsed: label updates "Reading..." to "Read complete."

### Permission Request Appearing

1. **Dim:** Rest of UI to 0.95 opacity (200ms).
2. **Card entrance:** Dramatic spring (15/70, mass 1.2). translateY 60 to 0, opacity 0 to 1.
3. **Haptic:** Warning notification as card begins moving.
4. **Glow:** Accent glow shadow fades in (300ms). Warm halo around card.
5. **Hold:** Card stays prominent. Streaming continues behind dim overlay. User can scroll chat.
6. **Approve:** Button Micro spring (0.85 to 1.0). Success haptic. Card scales 0.95, slides down (Standard spring), fades out. Dim overlay fades (200ms).

### Drawer Opening

1. **Gesture:** Drawer tracks finger exactly. Content shifts right proportionally (position * 0.067). Dim overlay opacity tracks proportionally (position / 300 * 0.4).
2. **Release:** Drawer spring (20/100) to 300px. Overlay reaches 0.4. Content shifts 20px.
3. **Haptic:** Impact Medium when drawer reaches final position.
4. **Session list:** Items stagger in (opacity + translateY, 30ms delay, Standard spring, max 10 animated).
5. **Depth:** `surface-sunken` drawer visibly darker than `surface-base` content. Combined with shift + dim = clear spatial hierarchy.

### Error Occurring

1. **Color shift:** Background transitions cooler (hue 32 to 20, 500ms timing).
2. **Haptic:** Error notification.
3. **Banner:** Slides down from top (Navigation spring 22/130). Glass surface with destructive tint (0.1 opacity). Text: "Connection lost. Reconnecting..."
4. **Status:** Connection dot transitions success to destructive (200ms).
5. **Borders:** All visible card borders flash to `border-interactive` (200ms) then fade to `border-subtle` (1s). Visual "alert" ripple.
6. **Recovery:** Color reverses (hue 20 to 32, 500ms). Banner slides up. Success haptic. Dots return to success.

---

*Formalized: 2026-03-31*
*Source: NATIVE-APP-SOUL-DRAFT.md (Bard creative direction)*
*Authority: This document is the visual contract for v3.0 Phases 69-73.*
*Supersedes: 68-UI-SPEC.md baseline values where they conflict.*
