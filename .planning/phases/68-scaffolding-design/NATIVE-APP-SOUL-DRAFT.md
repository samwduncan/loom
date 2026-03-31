# Native App Soul Document -- Creative Direction Draft

**Author:** Bard (creative lead) with Claude (curation and structure)
**Date:** 2026-03-31
**Status:** Draft for swd review
**Purpose:** Creative direction for Loom's native iOS app (v3.0). Produced per D-07 through D-12.

---

## 1. Reference App Analysis

### 1.1 ChatGPT iOS (OpenAI)

**Navigation:**
- Root navigation is a sidebar drawer triggered by a hamburger icon (top-left) or swipe from left edge. Drawer slides in with a spring-dampened animation (approximately 300ms settle, slight overshoot). The main content dims with a translucent black overlay (opacity ~0.4).
- Stack navigation for chat screens: push transition is a horizontal slide with a stiff spring (approximately 250ms settle, minimal overshoot). Back gesture is an interactive edge-swipe that tracks the finger exactly with no lag.
- No tab bar. All navigation routes through the drawer (conversations, explore GPTs, settings).

**Message Density:**
- Flat message layout -- no bubbles for assistant messages. User messages get a subtle raised surface (gray rounded rectangle, approximately 8px corner radius).
- Assistant messages render flush to the left margin with no container. This creates generous breathing room.
- Vertical spacing between messages: approximately 16-20px. Spacing between turns (user->assistant): approximately 24px.
- Avatars: Small (28px) circular avatars at the top-left of each turn. GPT avatar uses the model icon (green circle for GPT-4). User avatar uses initials or profile image.
- Content column: Messages fill the full width minus safe area insets and approximately 16px horizontal padding. No artificial max-width constraint on mobile.

**Composer:**
- Bottom-anchored composer with a single-line text input that expands to multi-line on content. Background: slightly raised surface (lighter than the chat background). Corner radius: approximately 20px (pill-shaped when single line).
- Send button: Right-aligned, circular, filled with accent color (green/black depending on model). Appears only when text is present. Animates in with a quick scale spring.
- Placeholder text: "Message" in muted gray. Disappears immediately on focus (no animation).
- Attachment buttons (camera, file) sit to the left of the text field. Plus icon reveals a menu of attachment types.
- Composer area respects safe area insets at the bottom. Keyboard avoidance is perfectly smooth -- the composer slides up in sync with the iOS keyboard animation (approximately 250ms matching system timing, not a spring).

**Tool / Artifact Rendering:**
- Code blocks render in a dark surface with syntax highlighting. A "Copy code" button sits at the top-right of the code block. The block has approximately 12px corner radius and 16px internal padding.
- "Browsing the web," "Analyzing," and other tool actions appear as inline status lines with a spinner icon. Minimal visual weight -- text only, no card or container.
- Canvas/artifact mode pushes a half-sheet from the right side, creating a split view. The artifact surface is slightly elevated with a shadow.

**Color and Surface Treatment:**
- Background: Very dark, near-black with warm undertones (approximately #212121). Not pure black.
- Surfaces: Two-tier system. The background and a slightly lighter surface for user bubbles, the composer, and the drawer.
- Borders: Extremely subtle. Mostly relying on shadow and surface color differentiation rather than visible borders.
- Accent: A model-specific accent color (green for GPT-4, purple for GPT-4o, etc.) used sparingly -- model icon, send button, active states.
- Dark mode only on dark backgrounds. The overall impression is dense and focused.

**Typography:**
- Body text: Approximately 16px, regular weight, San Francisco (system font). Line height approximately 1.5.
- Code: Approximately 14px monospace (likely SF Mono or Menlo). Slightly tighter line height.
- Headings: Same font, semibold, no size increase for markdown H1-H3 in messages (they use weight differentiation, not size).
- Timestamps and metadata: Approximately 12px, muted gray.
- Overall feel: Dense, readable, not oversized. They trust the user to be literate.

**Motion:**
- Message appearance: New messages fade in with a very subtle opacity animation (approximately 150ms). No slide or spring on message appearance.
- Streaming: Text appears word-by-word with no per-word animation -- it just appends. The scroll follows smoothly.
- Drawer: Spring with noticeable but controlled overshoot. Feels physical.
- Send button: Scale-up spring on appearance (approximately 200ms).
- Screen transitions: Standard iOS push/pop with slight spring feel. Not overly custom.

**What Makes It Feel "Native":**
- System keyboard integration is flawless. No gap, no delay, no offset issues.
- Edge-swipe back gesture is indistinguishable from system behavior.
- Haptics on send (light impact), on long-press menu appearance (medium impact).
- Scroll physics match UIScrollView exactly -- rubber banding, momentum, deceleration.
- The app never "fights" the platform. Every interaction feels like it belongs on iOS.

---

### 1.2 Claude iOS (Anthropic)

**Navigation:**
- Sidebar drawer from the left, similar to ChatGPT. Triggered by hamburger icon or left-edge swipe.
- The drawer surface is a distinctly darker shade than the chat background, creating a clear depth separation.
- Stack navigation for chat screens with standard iOS push animation.
- Bottom area has a "New Chat" floating button when the drawer is open.

**Message Density:**
- Assistant messages: No bubble container. Text renders directly on the background surface. Clean and spacious.
- User messages: Contained in a subtle rounded rectangle (warm gray, approximately 10px corner radius). Right-aligned text alignment within the bubble.
- Message spacing is generous -- approximately 20-24px between turns. Claude's app feels more spacious than ChatGPT's.
- Avatars: Smaller and more subtle than ChatGPT. The Claude icon (terracotta/orange circle) appears at the top-left of assistant turns. User messages have no avatar.
- Content uses the full width with approximately 16px horizontal margins.

**Composer:**
- Rounded rectangle input field at the bottom. Background is a clearly distinct surface from the chat area (lighter/raised).
- Corner radius approximately 24px (more rounded than ChatGPT). Multi-line expansion is smooth.
- Send button: Right-aligned, terracotta/orange accent, circular. Visible only when text exists.
- A row of quick-action buttons below the input: camera, file attachment, use a tool.
- The composer area has a subtle top border or shadow to separate it from the message scroll area.

**Tool / Artifact Rendering:**
- Artifacts open in a slide-up modal/sheet from the bottom. The sheet has a handle at the top and can be swiped down to dismiss.
- Code blocks have syntax highlighting with a "Copy" button. Dark code surface against the chat background.
- Analysis/thinking blocks appear as collapsible sections with a disclosure triangle. "Thinking..." text with a pulsing animation.

**Color and Surface Treatment:**
- Background: Warm dark tone, distinctly warmer than ChatGPT. Not gray-dark but brown-dark (approximately the charcoal from Loom's palette).
- Claude's brand colors (terracotta, warm cream) are present but restrained. The accent is warmer than ChatGPT's green.
- Surface hierarchy: 3 distinct levels visible -- sunken drawer, base chat area, raised composer and user bubbles.
- The warmth of the palette is the single biggest differentiator from ChatGPT visually. It feels more human.

**Typography:**
- Body text: Approximately 16px, regular weight, system font. Similar density to ChatGPT.
- Markdown rendering: Better typographic hierarchy than ChatGPT. Headings are noticeably larger and bolder.
- Code: Monospace, dark surface, approximately 14px.
- The overall typographic feel is slightly more editorial -- better line length control and heading sizes.

**Motion:**
- Artifact/sheet presentation: Smooth spring slide-up (approximately 350ms).
- Thinking indicator: A subtle pulsing opacity animation on the "Thinking..." text (approximately 1.5s cycle).
- Drawer: Similar spring to ChatGPT, slightly more damped (less overshoot).
- Message appearance: Minimal animation -- content appears as it streams, no per-message entrance animation.
- Overall motion is conservative. Less playful than ChatGPT, more measured.

**What Makes It Feel "Native":**
- The warmth of the design language sets it apart. It feels less "tech product" and more "creative tool."
- Keyboard handling is smooth and system-synced.
- Long-press context menus use the native UIContextMenuInteraction API (blur background, haptic, spring presentation).
- The artifact sheet interaction (swipe to dismiss, spring physics) feels built with UIKit's sheet presentation API.
- Safe area handling is correct on all device sizes.

---

### 1.3 Key Differences and Insights

| Aspect | ChatGPT iOS | Claude iOS | Loom Direction |
|--------|-------------|------------|----------------|
| Palette warmth | Cool dark grays | Warm dark browns | **Warm** -- match Claude's warmth, extend with OKLCH depth |
| Message containers | User bubbles only | User bubbles only | User bubbles only -- assistant text is free-flowing |
| Avatar size | 28px, both roles | Smaller, assistant only | Small (24-28px), assistant only. User messages are self-evident. |
| Composer shape | Pill (20px radius) | Rounded rect (24px) | Rounded rect with glass effect (24px radius, blur backdrop) |
| Motion philosophy | Subtle but present | Conservative, measured | **Bold** -- spring physics on every interaction, beyond both apps |
| Surface depth | 2 tiers | 3 tiers | **4 tiers** (UI-SPEC baseline) with glass/blur layer |
| Color accent | Model-specific | Brand terracotta | **Dusty rose / terracotta** (aligned with PROJECT_SOUL) |
| Code blocks | Dark surface, copy | Dark surface, copy | Dark surface, copy + "Run in Terminal" action |
| Tool visualization | Inline text status | Collapsible sections | **Elevated cards** with status machine, spring expand/collapse |

---

## 2. Loom's Elevation Layer

Per D-11: Motion + Depth + Dynamic Color, contextually applied.

### 2.1 Motion (Spring Physics)

All motion in Loom uses spring physics via `react-native-reanimated`. No linear/ease animations except where matching iOS system timing is required (keyboard avoidance).

**Spring Configuration Reference:**

| Category | Damping | Stiffness | Mass | Approximate Settle | Use Case |
|----------|---------|-----------|------|---------------------|----------|
| **Micro** | 18 | 220 | 0.8 | ~150ms | Button press feedback, icon scale, toggle snap |
| **Standard** | 20 | 150 | 1.0 | ~250ms | Card press, list item press, send button appear/disappear |
| **Navigation** | 22 | 130 | 1.0 | ~300ms | Screen push/pop, sheet presentation, modal appear |
| **Drawer** | 20 | 100 | 1.0 | ~350ms | Sidebar drawer open/close, panel slide |
| **Expand** | 18 | 90 | 1.0 | ~400ms | Tool card expand/collapse, thinking disclosure, accordion |
| **Dramatic** | 15 | 70 | 1.2 | ~500ms | Permission request appearance, error state, first message in session |

**Key motion rules:**
1. Every interactive element responds to press with a Micro spring scale (0.97 on press, 1.0 on release).
2. Every appearance/disappearance uses at minimum a Standard spring with opacity + translateY.
3. Screen transitions use Navigation spring with horizontal translate.
4. Tool cards expand with the Expand spring, creating a satisfying unfold.
5. Permission requests and error states use the Dramatic spring to convey urgency and weight.
6. Streaming text does NOT animate per-character or per-word. Text appends and scroll follows smoothly.
7. All springs respect `AccessibilityInfo.isReduceMotionEnabled` -- replace with 0ms instant transitions.

**Gesture-driven motion:**
- Drawer swipe: The drawer tracks the finger position exactly (no lag). On release, it springs to open or closed based on velocity threshold (200 points/sec) and position (>40% open = spring open).
- Back swipe: Matches iOS system edge-swipe behavior. The screen follows the finger and springs back or completes based on velocity and distance.
- Swipe-to-delete on session list: Reveals a red "Delete" action surface. The item follows the finger, and the action surface springs into view.
- Pull-to-refresh: Uses a custom spring (damping: 25, stiffness: 120) for the pull indicator. Triggers at 60pt overscroll.

**Haptic pairing (every motion event has a paired haptic):**

| Event | Haptic | Timing |
|-------|--------|--------|
| Message sent | Impact Light | On send button press |
| Tool card complete | Success Notification | On status change to complete |
| Permission request appears | Warning Notification | On appearance animation start |
| Error occurs | Error Notification | On error state transition |
| Swipe threshold crossed | Selection (light) | When finger crosses action threshold |
| Drawer open/close snap | Impact Medium | When drawer reaches final position |
| Long-press menu appear | Impact Heavy | On context menu presentation |
| Pull-to-refresh trigger | Impact Light | When overscroll threshold reached |

---

### 2.2 Depth (Surface Hierarchy + Glass + Shadows)

Loom uses a 4-tier surface system (from UI-SPEC) extended with glass/blur for floating elements.

**Surface Tiers:**

| Tier | Token | RGB | Usage | Shadow |
|------|-------|-----|-------|--------|
| 0 (Sunken) | `surface-sunken` | `rgb(38, 35, 33)` | Drawer background, inset areas | None |
| 1 (Base) | `surface-base` | `rgb(46, 42, 40)` | Chat background, scroll areas | None |
| 2 (Raised) | `surface-raised` | `rgb(54, 50, 48)` | Cards, user message bubbles, list items on press | Subtle shadow (offset 0/2, blur 8, opacity 0.15) |
| 3 (Overlay) | `surface-overlay` | `rgb(62, 59, 56)` | Modals, popovers, context menus | Medium shadow (offset 0/4, blur 16, opacity 0.25) |
| Glass | N/A | Semi-transparent + blur | Navigation header, floating composer, command palette | Glass shadow (offset 0/8, blur 32, opacity 0.30) |

**Glass treatment specifications:**
- Blur intensity: 40 (expo-blur `BlurView` with `intensity={40}`)
- Background tint: `dark`
- Overlay color: `rgba(0, 0, 0, 0.35)`
- Border: 1px `border-subtle` (rgba(255,255,255,0.07))
- Corner radius: 16px (`rounded-2xl`)
- Glass should be used for elements that float over scrolling content: the navigation header (if not opaque), the floating composer bar, modal backdrops.

**Shadow specifications (iOS-specific, using shadow* props):**

```
Subtle:   { shadowColor: '#000', shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.15, shadowRadius: 8  }
Medium:   { shadowColor: '#000', shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.25, shadowRadius: 16 }
Heavy:    { shadowColor: '#000', shadowOffset: { width: 0, height: 8 },  shadowOpacity: 0.30, shadowRadius: 32 }
Glow:     { shadowColor: accent, shadowOffset: { width: 0, height: 0 },  shadowOpacity: 0.25, shadowRadius: 16 }
```

**When to use each depth level:**
- Tier 0: Surfaces that recede (drawer behind main content, inset code block backgrounds)
- Tier 1: Default canvas. Most content sits here.
- Tier 2: Interactive cards that the user can act on. Elevated to suggest affordance.
- Tier 3: Temporary surfaces that demand attention (modals, menus, permission dialogs).
- Glass: Surfaces that need to show the content flowing beneath them. Used sparingly for maximum impact.
- Glow shadow: Applied to the accent-colored send button and active connection indicator. Creates a subtle colored halo that draws the eye.

---

### 2.3 Dynamic Color

Color in Loom is not static. The palette responds to the state of the conversation.

**Context-driven color shifts:**

| State | Color Behavior | Implementation |
|-------|---------------|----------------|
| **Idle** (no active session) | Neutral palette -- surfaces at their default OKLCH values. No animation. | Default state, no interpolation needed. |
| **Streaming** (assistant is responding) | Subtle warmth increase. Surface-base shifts approximately 2% warmer on the OKLCH hue axis (toward 35 from 32). The accent color's opacity pulses gently (0.6 to 1.0 over 2.5s, sinusoidal). | Reanimated `useSharedValue` with `withRepeat(withTiming(...))` on the accent opacity. Background shift via Reanimated color interpolation. |
| **Thinking** (model is processing before responding) | The accent glow on the composer dims. A muted "thinking" color (text-muted at 60% opacity) pulses on the status indicator. Surfaces remain neutral. | Opacity pulse on status indicator. Composer accent dims to 0.4 opacity. |
| **Error** (connection lost, model error) | Background shifts cooler (hue toward 20, desaturated). The destructive color (`rgb(210, 112, 88)`) becomes the dominant accent temporarily. Border colors shift from subtle to interactive weight. | Background color interpolation over 500ms. Destructive color applied to status indicators. Borders become more visible for 3s then fade back. |
| **Permission request** | The permission card has a warm glow (accent shadow). The rest of the UI dims slightly (opacity 0.95 on non-card elements) to focus attention. | Card-level glow shadow. Slight dim on surrounding elements via a semi-transparent overlay. |
| **Tool executing** | The active tool card's border shifts from subtle to interactive. A very subtle "progress" shimmer moves across the card surface (horizontal gradient sweep, 2s cycle). | Reanimated horizontal gradient position animation. Border color transition. |

**Color transition rules:**
- All color transitions use `withTiming` at 500ms duration with `Easing.out(Easing.cubic)`. Springs are for position/scale; timing is for color.
- Color shifts are SUBTLE. The user should feel a mood change, not see a color change. If someone watching over your shoulder can notice the shift, it is too aggressive.
- Dynamic color is disabled when `isReduceMotionEnabled` is true. Surfaces stay at their default values.

---

## 3. Screen-by-Screen Direction

### 3.1 Session List (Drawer Content)

**Layout:**
- Full-height drawer, width approximately 300px (80% of screen width, capped at 320px).
- Background: `surface-sunken` (Tier 0) -- visually recedes behind the chat area.
- Top section: "Loom" heading (17px semibold, `text-primary`) with a "New Chat" button (accent background, 44px height, rounded-xl).
- Content: A ScrollView of session items, grouped by project. Project headers use Caption style (12px, muted).
- Bottom: Settings icon (44px touch target) and connection status indicator.

**Key Components:**
- Session item: List Item primitive (56px min-height, px-4 py-4). Title is session name (15px semibold, single line, truncated). Subtitle is relative time + model name (12px muted). Right side: unread indicator dot (accent color, 8px diameter) or nothing.
- Active session: Background shifts to `surface-raised` with a left accent border (3px, accent color). This is the only time accent is used for a structural border.
- Pinned sessions: Grouped at the top with a "Pinned" header (12px, muted). Pin icon (text-muted) to the right.
- Search: A search input at the top (below the heading), collapsed by default. Expands on tap with a glass background.

**Motion:**
- Drawer open/close: Drawer spring (damping 20, stiffness 100). Main content shifts right approximately 20px and dims.
- Session item press: Micro spring scale (0.97) + background color shift to `surface-raised` over 100ms.
- Session item appear (on first load): Staggered opacity + translateY animation. Each item delayed by 30ms (max 10 items animated, rest appear immediately).
- Swipe-to-delete: Standard spring reveal of destructive action surface.

**Color:**
- When streaming in the active session, the active session indicator dot pulses with the accent opacity animation (matching the global streaming state).

---

### 3.2 Chat Thread

**Layout:**
- Full-screen with navigation header at top (glass surface or opaque `surface-base`) and composer at bottom.
- Navigation header: Session title (17px semibold, centered), back arrow (left), model indicator (right -- small text showing "Claude" / "Gemini" / "Codex").
- Message area: FlatList/FlashList filling the space between header and composer. Content insets for safe area.
- Messages alternate: assistant (no container, flush left) and user (raised bubble, flush right, `surface-raised` background, rounded-2xl).

**Key Components:**
- Assistant message: Text directly on `surface-base`. Body text (15px regular, `text-primary`). Markdown rendered inline: headings, bold, italic, lists, links.
- User message: Rounded container (`surface-raised`, rounded-2xl, p-4). Text (15px regular, `text-primary`). Right-aligned in the layout but left-aligned text within the bubble.
- Message turn spacing: 24px between turns, 8px between consecutive messages from the same role.
- Avatar: 24px circular avatar at the top-left of assistant messages only. Uses the provider icon (Claude terracotta, Gemini blue, Codex green).
- Timestamp: Caption style (12px muted), shown on long-press or after 5-minute gaps between messages.

**Motion:**
- New message appearance (user sends): The user bubble springs in from the bottom with a Standard spring (opacity 0 to 1, translateY 20 to 0).
- New message appearance (assistant response starts): First token appears with a subtle fade-in (150ms opacity). No spring -- streaming content should just flow.
- Auto-scroll: Smooth scroll-to-bottom when new content arrives during streaming. If the user has scrolled up, a "scroll to bottom" pill appears at the bottom of the message area (glass surface, accent text, bounces once on appearance with a Standard spring).
- Scroll-to-bottom pill: Tapping it animates scroll to bottom and the pill fades out (100ms).

**Color:**
- During streaming, the global warmth shift applies to the chat background.
- Active streaming indicator: A thin (2px) accent-colored line at the bottom of the message area that pulses during streaming (opacity 0.3 to 0.8, 1.5s cycle). Disappears when streaming completes.

---

### 3.3 Composer

**Layout:**
- Fixed to the bottom of the chat screen, above the safe area inset.
- Background: Glass surface (blur backdrop showing the last messages underneath) OR opaque `surface-raised` if glass performance is insufficient on target device.
- Text input: Single-line expanding to multi-line (max 6 lines before scrolling internally). Placeholder: "Message" in `text-muted`.
- Left side: Attachment button (+) that expands to show file/camera options.
- Right side: Send button (circular, 36px, accent background when text present, `surface-raised` when empty). The send button scales in with a Micro spring when text first appears, and scales out when text is cleared.

**Key Components:**
- Text input: NativeWind-styled TextInput. 15px body text. Padding px-4 py-3. The input area has its own internal rounded container (rounded-2xl, border border-subtle).
- Send button: Circular, 36px diameter. Background transitions from `surface-raised` (inactive/empty) to `accent` (active/has text) with a color transition (200ms). The Glow shadow applies when active.
- Attachment menu: Slides up from the bottom with an Expand spring. Contains: Camera, Photo Library, File. Each item is a 44px-height list item.
- Status bar area: Below the input, a thin strip showing: token count (caption text), model name, connection status dot. This area is approximately 24px tall with Caption typography.

**Motion:**
- Keyboard avoidance: The entire composer slides up in perfect sync with the iOS keyboard animation. Use `react-native-keyboard-controller` to match the system timing exactly. This is NOT a spring -- it must match the system curve.
- Send: On send button press, the button scales down (Micro spring, 0.85) then immediately back (Micro spring, 1.0). Text clears. The input field contracts to single-line height with a Standard spring.
- Multi-line expansion: Input height changes with a Standard spring, never instant.
- Focus: When the input is focused, the border shifts from `border-subtle` to `border-interactive` with a 200ms color transition.

**Color:**
- During streaming (assistant is responding), the send button transforms into a stop button: background becomes `destructive`, icon changes to a square. Color transition 200ms.
- The glass backdrop creates a dynamic color effect inherently -- as the user scrolls, the colors behind the composer shift.

---

### 3.4 Tool Cards

**Layout:**
- Tool cards appear inline in the assistant message flow. Each card is a Surface Card (Tier 2, `surface-raised`, rounded-xl, p-4).
- Header: Tool icon (16px, text-muted) + tool name (Caption, 12px, semibold, text-secondary) + status indicator (8px dot: `accent` = running, `success` = complete, `destructive` = error) + elapsed time (Caption, muted).
- Collapsed state: Header only, showing tool name and status. 44px minimum height.
- Expanded state: Header + details. Details vary by tool type but always use Body text (15px) for content and Caption (12px) for labels.

**Tool types and their expanded content:**
- **Read/Write/Edit:** File path (monospace, 14px), line count or diff summary (Caption).
- **Bash/Execute:** Command string (monospace, 14px, in a `surface-sunken` inset), truncated output (body text, max 4 lines collapsed).
- **Search/Glob/Grep:** Pattern (monospace), match count, first 3 results (body text).
- **MCP tools:** Tool name, input params (key-value in Caption), output summary (body text).

**Motion:**
- Expand/collapse: The Expand spring (damping 18, stiffness 90) drives the height change. Content fades in with a 100ms delay after the expand begins.
- Status change (running -> complete): The status dot transitions color with a 200ms timing function. On completion, the `success` haptic fires.
- Grouped tool cards: When multiple tools execute in sequence, they stack with 8px spacing. A "3 tools" summary header can collapse the group. The group expand uses the Expand spring.
- Appearance: Each tool card slides in from the right with a Standard spring (translateX 30 -> 0, opacity 0 -> 1) as it first appears during streaming.

**Color:**
- Running state: The tool card's border shifts from `border-subtle` to `border-interactive`. The shimmer animation (from Dynamic Color section) plays across the card surface.
- Complete state: Border returns to `border-subtle`. A brief green flash (success color at 0.1 opacity as background) fades over 300ms.
- Error state: Border becomes `destructive` at 0.5 opacity. Background briefly shifts to `destructive` at 0.05 opacity.

---

### 3.5 Permission Request

**Layout:**
- Permission requests appear above the composer as an elevated card. This card sits at Tier 3 (overlay) with the Heavy shadow.
- Card content: Description of the request (Body text), the file path or command (monospace, `surface-sunken` inset), and two action buttons.
- Approve button: Accent background, "Approve" text (semibold, accent-fg). 44px height.
- Deny button: `surface-raised` background, "Deny" text (semibold, text-primary). 44px height.
- Both buttons sit side-by-side with 12px gap. Approve is on the right (primary action position for iOS).

**Motion:**
- Appearance: Dramatic spring (damping 15, stiffness 70). The card slides up from below the composer (translateY 60 -> 0) with opacity (0 -> 1). This is the most dramatic entrance animation in the app because it demands attention.
- Haptic: Warning notification haptic fires at the start of the entrance animation.
- Approve: On tap, the card scales down slightly (Micro spring, 0.95) and then slides down and fades out (Standard spring). Success haptic fires.
- Deny: Same exit animation as Approve but without the success haptic. A light impact haptic instead.
- If multiple permissions queue, they stack with a "2 more" indicator. Each new permission pushes the previous one down with a Navigation spring.

**Color:**
- The accent glow shadow applies to the entire permission card (not just the approve button). This creates a warm halo that draws the eye.
- The rest of the UI dims slightly (see Dynamic Color: Permission request state).
- The approve button has the Glow shadow on press.

---

### 3.6 Sidebar Drawer

See section 3.1 (Session List) for the drawer content. This section covers the drawer interaction itself.

**Layout:**
- The drawer is a full-height panel on the left side, overlaying the main content.
- Width: 300px (80% of screen, max 320px).
- The main content behind the drawer dims with a `rgba(0, 0, 0, 0.4)` overlay and shifts right approximately 20px (creating a parallax depth effect).

**Motion:**
- Open: Drawer spring (damping 20, stiffness 100). The drawer slides from left. The dim overlay fades in with the same timing.
- Close: Same spring in reverse. Tapping the dim overlay closes the drawer.
- Gesture: The drawer can be opened by swiping from the left edge (first 20px). The drawer tracks the finger during the swipe. On release, it springs to open or closed based on velocity (>200 pts/sec) and position (>40% open).
- The main content parallax shift is driven by the same gesture value (drawer position * 0.067 = shift amount).

**Color:**
- The drawer background is `surface-sunken` -- the darkest surface in the app. This makes the main content (surface-base) feel like it's floating above the drawer.

---

### 3.7 Settings

**Layout:**
- Full-screen pushed onto the navigation stack from the drawer.
- Navigation header: "Settings" (17px semibold, centered), back arrow.
- Content: ScrollView with grouped sections. Each section has a header (Caption, 12px, text-muted, uppercase) and items.
- Section items: List Item primitive (56px, px-4 py-4). Title left, value/toggle right.
- Sections (v3.0 scope): Server Connection (URL, status), Model Selection (current model, available models), Appearance (reserved for future), About (version, debug info).

**Motion:**
- Screen entrance: Navigation spring (horizontal slide from right).
- Toggle switch: Micro spring on the toggle thumb position change.
- Section items: Standard spring press feedback.

**Color:**
- Settings uses the standard surface hierarchy. No dynamic color shifts.
- Section headers use `text-muted`. Item values use `text-secondary`.

---

### 3.8 Share Sheet

**Layout:**
- Triggered by long-press context menu on a message -> "Share" action.
- Uses the native iOS UIActivityViewController. Loom does not build a custom share sheet.
- The content shared is: plain text of the message, or for code blocks, the code content with language annotation.

**Motion:**
- The native share sheet animates per iOS system behavior. Loom does not customize this.
- The context menu that triggers it uses the native `UIContextMenuInteraction` pattern (blur background, spring presentation, haptic).

**Color:**
- Native share sheet uses the system palette. No Loom customization needed.

---

### 3.9 Notification UI

**Layout:**
- Push notifications appear as standard iOS notification banners. Loom customizes the notification content extension:
  - Title: Session name
  - Body: The message or permission request summary
  - Category: For permission requests, "PERMISSION_REQUEST" with actions: "Approve" and "Deny"
- In-app notification banner (when app is foregrounded): A custom banner at the top of the screen, below the status bar.
  - Background: Glass surface (blur + dark overlay).
  - Content: Icon (provider avatar, 24px) + message text (Body, 15px) + dismiss timer (Caption, muted).
  - Height: Auto-sized to content, min 56px.

**Motion:**
- In-app banner entrance: Slides down from above the screen with a Navigation spring. Auto-dismisses after 4 seconds with a slide-up Standard spring.
- Tapping the banner navigates to the relevant session with a standard push transition.

**Color:**
- Permission notification banners have a warm accent tint (accent at 0.1 opacity as background).
- Error notification banners have a destructive tint.
- Standard notifications use the glass treatment with no color tinting.

---

### 3.10 Code Block Detail

**Layout:**
- Inline code blocks render within the message flow: `surface-sunken` background (darkest surface), rounded-xl, p-4.
- Header bar: Language label (Caption, 12px, text-muted) on the left, "Copy" button on the right (Caption, accent color, 44px touch target).
- Code content: Monospace font (JetBrains Mono, 14px), horizontal scroll for long lines.
- For long code blocks (>15 lines): A "Show more" / "Show less" toggle at the bottom (Caption, accent).
- Tapping a code block could open a full-screen detail view (Phase 73 scope) with syntax highlighting, line numbers, and a "Run in Terminal" action.

**Motion:**
- Show more / Show less: Expand spring on the height change.
- Copy action: The "Copy" text briefly changes to "Copied!" with a checkmark. Text transition is a quick fade (100ms). Returns to "Copy" after 2 seconds.
- Full-screen detail (Phase 73): Navigation spring push transition.

**Color:**
- Code surface uses `surface-sunken` to recede visually, emphasizing that code is "embedded" in the message, not floating above it.
- Syntax highlighting colors TBD by the syntax theme (Shiki integration in Phase 73). Initial implementation renders unstyled monospace.

---

### 3.11 Search

**Layout:**
- Triggered from the session list drawer. A search input appears at the top of the drawer, pushing the session list down.
- Input: Full-width text input with a glass background, rounded-2xl, magnifying glass icon on the left.
- Results: The session list filters in real-time as the user types. Matching text is highlighted with accent color background (accent at 0.15 opacity).
- Empty state: "No sessions match your search" (Body text, centered, text-muted).
- Cancel: "Cancel" text button to the right of the search input. Tapping it clears the search and collapses the input.

**Motion:**
- Search input expansion: Standard spring. The input slides down from the heading area, pushing the session list down.
- Filtering: Session items that don't match fade out (opacity 0, 150ms). Matching items reorder with layout animation (Standard spring).
- Cancel: Input collapses with Standard spring. Session list returns to full view.

**Color:**
- The search input uses the glass treatment (blur + semi-transparent) to distinguish it from the drawer surface.
- Highlighted matching text: accent color at 0.15 opacity as text background.

---

### 3.12 Pinned Sessions

**Layout:**
- Pinned sessions appear in a dedicated section at the top of the session list drawer.
- Section header: "Pinned" (Caption, 12px, text-muted, uppercase).
- Pinned items look identical to regular session items but with a pin icon (text-muted, 12px) to the right of the title.
- Maximum visible pinned items before scrolling: 5. Beyond that, the section scrolls independently or collapses with a "Show all" toggle.

**Motion:**
- Pinning a session: The session item animates from its current position to the pinned section using a layout animation (Navigation spring). This is a shared element transition -- the item physically moves up.
- Unpinning: Reverse -- the item animates from the pinned section back to its chronological position.
- Pin icon appearance: Micro spring scale (0 -> 1) when the item enters the pinned section.

**Color:**
- Pinned session items use the same surface treatment as regular items. The pin icon uses `text-muted`. No additional accent treatment -- pinned is a structural feature, not a visual highlight.

---

## 4. Anti-Patterns

These are explicit prohibitions for Loom's native app. Violating any of these is a defect.

### Structural Anti-Patterns

1. **No flat surfaces without depth cues.** Every interactive card must have either a shadow, a border, or a background color that distinguishes it from the surface behind it. A card that is invisible against its background is a bug.

2. **No instant state changes.** Every visual state transition must have either a spring animation or a timed transition. A button that changes color without animation, a card that appears without any entrance, a modal that pops in without a spring -- all bugs.

3. **No web-style hover states.** There is no hover on iOS. Use press states (scale down + haptic) instead. If a component has an `onHoverIn` handler, it is wrong.

4. **No touch targets below 44px.** Every button, every link, every interactive element must have a minimum tap area of 44x44 points. Use `hitSlop` on small visual elements if needed. Measure, do not estimate.

5. **No unsynchronized keyboard animations.** The composer must move in perfect sync with the iOS keyboard. If there is a gap, a jump, or a frame where the composer is not aligned with the keyboard, it is a bug. Use `react-native-keyboard-controller`, not `KeyboardAvoidingView`.

### Visual Anti-Patterns

6. **No pure black (#000000) backgrounds.** All backgrounds must use the warm dark palette from the UI-SPEC. Pure black is cold and harsh. The darkest surface (`surface-sunken` = `rgb(38, 35, 33)`) is warm charcoal.

7. **No visible borders as the only depth cue.** If a card's only visual separation from its background is a 1px border, it lacks depth. Borders supplement shadows and surface color changes -- they do not replace them.

8. **No uniform text weight.** If a screen has all text at the same weight (all regular or all semibold), it lacks hierarchy. Every screen must have at least two weights visible: semibold for headings/titles, regular for body/description.

9. **No gray accent color.** The accent color (dusty rose/terracotta `rgb(196, 108, 88)`) must be used for its reserved purposes. If the accent appears muted, washed out, or gray-shifted, it has lost its warmth. The accent must pop against the dark surfaces.

10. **No white text on light surfaces.** Text-primary (`rgb(230, 222, 216)`) is designed for dark surfaces. If it appears on anything lighter than `surface-raised`, it will have insufficient contrast. Check contrast ratios on every surface pairing.

### Interaction Anti-Patterns

11. **No silent interactions.** Every tap on an interactive element should produce haptic feedback. If a user taps a button and feels nothing, the interaction lacks physicality. The only exception is scrolling (scrolling is passive, not an action).

12. **No orphaned animations.** If an animation starts, it must complete or be interrupted gracefully. An animation that starts and then gets cut off by a state change (e.g., a spring expand interrupted by navigation) must cancel with a clean transition, not freeze mid-frame.

13. **No loading spinners without context.** Never show a generic spinner. Show what is loading: "Loading sessions...", "Connecting to server...", a skeleton of the content that will appear. The user should always know what they are waiting for.

14. **No stale state after backgrounding.** When the app returns to the foreground, it must sync state within 1 second. If the session list shows old data, if the connection indicator shows "connected" when disconnected, if a streaming message froze while backgrounded -- all bugs.

15. **No platform-fighting.** Never override iOS system behaviors. The status bar, the home indicator, the Dynamic Island, the notch safe areas, the system back gesture -- all must be respected. If Loom's UI fights the platform, it will feel hostile.

---

## 5. Elevation Examples

### 5.1 Sending a Message

The user types "explain this function" and taps Send.

1. **Press:** Send button scales to 0.85 with Micro spring (18/220). Impact Light haptic fires.
2. **Release:** Send button scales back to 1.0 with Micro spring. Message text clears from input.
3. **User bubble appearance:** The user message bubble springs in from below (translateY 20 -> 0, opacity 0 -> 1) with Standard spring (20/150). Input contracts to single-line with Standard spring.
4. **Scroll:** The message list scrolls down to show the new message.
5. **Streaming begins:** After approximately 200ms, the first assistant text appears. No entrance animation on the text itself -- it fades in with 150ms opacity. The streaming accent line at the bottom of the message area begins its pulse animation (opacity 0.3 to 0.8, 2.5s cycle).
6. **Dynamic color:** The background begins its subtle warmth shift (hue 32 -> 35 on OKLCH). The accent opacity pulse starts.
7. **Streaming ends:** The streaming accent line fades out (200ms). The background warmth reverts (500ms). The session item in the drawer updates its subtitle to the new message preview.

### 5.2 Tool Card Completing

A Read tool call finishes executing and transitions from "running" to "complete."

1. **Running state:** The tool card's border is `border-interactive`. A horizontal shimmer gradient sweeps across the card surface (2s cycle). The status dot is accent color.
2. **Completion:** The shimmer stops. The border transitions back to `border-subtle` (200ms). The status dot color transitions from accent to success (200ms). A brief green flash appears on the card background (success at 0.1 opacity, fades over 300ms).
3. **Haptic:** Success notification haptic fires at the moment of transition.
4. **Content update:** If the card is expanded, the tool output fades in with 100ms opacity. If collapsed, the status label updates from "Reading..." to "Read complete" (Caption text transition).

### 5.3 Permission Request Appearing

Claude wants to write to a file and the backend sends a permission request.

1. **Dimming:** The rest of the UI dims to 0.95 opacity (200ms timing transition).
2. **Card entrance:** The permission card slides up from below the composer with Dramatic spring (15/70, mass 1.2). This is the slowest, most physical animation in the app. translateY 60 -> 0, opacity 0 -> 1.
3. **Haptic:** Warning notification haptic fires as the card begins moving.
4. **Glow:** The card's accent glow shadow fades in over 300ms. The entire card has a warm halo.
5. **Attention hold:** The card stays prominent. The streaming continues behind it (visible through the dim overlay). The user can still scroll the chat.
6. **User taps Approve:** Approve button scales with Micro spring (0.85 -> 1.0). Success haptic fires. The card scales down slightly (0.95) and slides down with Standard spring (translateY 0 -> 60, opacity 1 -> 0). The dim overlay fades out (200ms). The tool card in the message stream updates to "Approved" status.

### 5.4 Drawer Opening

The user swipes from the left edge or taps the hamburger icon.

1. **Gesture tracking:** If swipe-triggered, the drawer tracks the finger position exactly. The main content shifts right proportionally (drawer position * 0.067). The dim overlay opacity tracks proportionally (drawer position / 300 * 0.4).
2. **Release / tap:** Drawer spring (20/100) drives the drawer to its open position (300px from left). The dim overlay reaches 0.4 opacity. The main content shifts 20px right.
3. **Haptic:** Impact Medium haptic fires when the drawer reaches its final open position (at the end of the spring settle).
4. **Session list animation:** Session items stagger in with a subtle opacity + translateY animation (30ms delay between items, Standard spring, max 10 items animated).
5. **Depth perception:** The `surface-sunken` drawer background is visibly darker than the `surface-base` main content. Combined with the main content's rightward shift and dim overlay, this creates a clear spatial hierarchy: drawer is behind, content is in front.

### 5.5 Error Occurring

The WebSocket connection drops unexpectedly.

1. **Color shift:** The background begins transitioning toward a cooler hue (hue 32 -> 20, 500ms timing). The overall palette feels slightly colder and more desaturated.
2. **Haptic:** Error notification haptic fires.
3. **Connection banner:** A banner slides down from the top of the screen with Navigation spring (22/130). Background: glass surface with destructive tint (destructive at 0.1 opacity). Text: "Connection lost. Reconnecting..." (Body text, text-primary).
4. **Status indicators:** The connection dot in the composer status bar transitions from success green to destructive red (200ms). The drawer's connection status updates similarly.
5. **Borders:** All borders on visible cards briefly flash to `border-interactive` weight (200ms transition) then slowly fade back to `border-subtle` (1s transition). This creates a momentary "alert" visual ripple across the UI.
6. **Reconnection:** When the connection re-establishes, the color shift reverses (hue 20 -> 32, 500ms). The banner slides up with Navigation spring. Success haptic fires. The connection dots transition back to success green.

---

## 6. Icon Direction

Phase 68 does not select the icon library (Soul doc formalization in Plan 06 will). Initial recommendations:

- **Primary candidate:** SF Symbols via `expo-symbols` -- native iOS icons that match system conventions perfectly. Approximately 6,000 symbols, all with weight/scale variants.
- **Fallback:** Lucide React Native (`lucide-react-native`) -- matches Loom web's existing Lucide usage. Approximately 1,500 icons. Tree-shakeable.
- **Preference:** SF Symbols for navigation and system UI elements (back arrow, settings gear, share icon). Lucide or custom icons for Loom-specific elements (tool card icons, provider logos).

---

## 7. Typography Refinement

Building on the UI-SPEC baseline, with adjustments informed by reference app analysis:

| Role | UI-SPEC Value | Refinement | Rationale |
|------|---------------|------------|-----------|
| Body | 15px / 1.6 lh | Keep as-is | Matches both reference apps' body text density |
| Heading | 17px / 1.29 lh | Keep as-is | Matches iOS navigation title convention |
| Caption | 12px / 1.33 lh | Keep as-is | Minimum readable size on iOS |
| Code | 14px / 1.43 lh | Keep as-is | Standard code size on mobile |
| Large Title | Not in UI-SPEC | **Add: 28px / 1.14 lh (34px), bold (700)** | For session list header "Loom", matching iOS Large Title convention. Used sparingly. |
| Subheading | Not in UI-SPEC | **Add: 13px / 1.38 lh (18px), regular** | For tool card labels, section metadata. Between Caption and Body. |

**Font weight expansion (post-Soul doc):** The UI-SPEC restricts to regular (400) and semibold (600). The Soul doc recommends adding:
- Bold (700): ONLY for Large Title. Nowhere else.
- All other text remains regular (400) or semibold (600).

---

## 8. Spacing Refinement

The UI-SPEC spacing scale is sound. One addition for message layout:

| Context | Value | Rationale |
|---------|-------|-----------|
| Between turns (user -> assistant) | 24px (lg) | Creates clear visual separation between conversation turns |
| Between consecutive same-role messages | 8px (sm) | Tight grouping for multi-message sequences |
| Message horizontal padding | 16px (md) | Matches both reference apps |
| Card internal padding | 16px (md) | Standard card padding from UI-SPEC |
| Tool card spacing (in a group) | 8px (sm) | Tight stacking to keep tools compact |
| Composer to keyboard | 0px | Flush against keyboard, separated by glass/surface color |
| Screen horizontal safe margin | 16px (md) | Standard iOS content margin |

---

## 9. Summary of Creative Direction

Loom's native app takes the solid, proven UX patterns from ChatGPT iOS and Claude iOS as its foundation, then pushes beyond them in three specific dimensions:

1. **Motion:** Where reference apps are conservative (subtle fades, standard transitions), Loom uses spring physics on every interaction. Every press, every appearance, every transition has physical weight and momentum. The app feels like it is made of physical objects with mass and elasticity.

2. **Depth:** Where reference apps use 2-3 surface levels, Loom uses 4 tiers plus a glass layer. Shadows, blur, and surface color create spatial hierarchy that makes the UI feel three-dimensional. The drawer is behind the content. Cards float above the surface. Glass elements reveal the world beneath them.

3. **Dynamic Color:** Where reference apps have static palettes, Loom's palette breathes. Streaming warms the surfaces. Errors cool and desaturate. Permission requests create focused halos. The app's mood is visible in its color. These shifts are subtle -- felt more than seen -- but they create an emotional connection to the tool's state that static colors cannot.

The result should be an app that feels alive, physical, and warm. Not a tech product but a crafted tool. Not a web app on a phone but a native instrument designed for the hand.

---

*This draft is Bard's creative direction proposal for swd's review. Plan 06 will formalize the approved direction into the official NATIVE-APP-SOUL.md document.*
