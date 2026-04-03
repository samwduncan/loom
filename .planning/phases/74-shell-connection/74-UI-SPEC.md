---
phase: 74
slug: shell-connection
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-03
---

# Phase 74 -- UI Design Contract

> Visual and interaction contract for the app shell: auth flow, WebSocket lifecycle, drawer navigation, theme system, and safe area compliance. This contract inherits from the Soul doc (NATIVE-APP-SOUL.md) and Phase 68 UI-SPEC baseline, adapting values for Phase 74's scope. NativeWind is removed (D-01/D-02); all styling uses `StyleSheet.create` + typed Theme object.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | `StyleSheet.create` + typed `LoomTheme` object (D-01) |
| Preset | Not applicable (NativeWind removed per D-02) |
| Component library | None (100% custom React Native components) |
| Icon library | SF Symbols (`expo-symbols`) primary, Lucide (`lucide-react-native`) fallback |
| Font (UI) | Inter (system fallback: System) |
| Font (Mono) | JetBrains Mono (system fallback: Courier) |

**Styling pattern:** `createStyles(theme)` factory following Private Mind's pattern. Every component calls `createStyles((t) => ({ ... }))` to produce `StyleSheet.create` output with theme tokens injected. See RESEARCH.md Pattern 1 for full example.

**Dark mode only** -- no light mode (D-03). No `useColorScheme` branching.

---

## Spacing Scale

Declared values (multiples of 4, inherited from 68-UI-SPEC.md):

| Token | Value | Theme Key | Usage |
|-------|-------|-----------|-------|
| xs | 4px | `spacing.xs` | Icon gaps, inline padding |
| sm | 8px | `spacing.sm` | Compact element spacing, same-role message gaps |
| md | 16px | `spacing.md` | Card padding, screen horizontal margin, default spacing |
| lg | 24px | `spacing.lg` | Section padding, between-turn message gaps |
| xl | 32px | `spacing.xl` | Major section breaks |
| 2xl | 48px | `spacing['2xl']` | Page-level top/bottom padding |
| 3xl | 64px | `spacing['3xl']` | Reserved (splash, auth screen vertical centering) |

Exceptions:
- Touch targets: 44pt minimum height for ALL interactive elements (Apple HIG). Use `minHeight: 44`.
- Session list items: 56px min-height for comfortable touch (larger than 44px minimum).
- Safe area insets: Handled by `useSafeAreaInsets()`, not spacing tokens.

---

## Typography

Font loading via `expo-font` from `mobile/assets/fonts/`. Theme object maps all roles to complete `TextStyle` objects.

| Role | Size | Weight | Line Height | Theme Key | Usage in Phase 74 |
|------|------|--------|-------------|-----------|-------------------|
| Large Title | 28px | 700 (bold) | 1.14 (34px) | `typography.largeTitle` | "Loom" heading in drawer header ONLY |
| Heading | 17px | 600 (semibold) | 1.29 (22px) | `typography.heading` | Chat screen title, auth screen heading, navigation bar titles |
| Body | 15px | 400 (regular) | 1.6 (24px) | `typography.body` | Auth field labels, session titles in drawer list, empty state body, connection banner text |
| Caption | 12px | 400 (regular) | 1.33 (16px) | `typography.caption` | Session relative dates, connection status label, server URL hint |
| Subheading | 13px | 400 (regular) | 1.38 (18px) | `typography.subheading` | Composer placeholder text, secondary metadata |
| Code | 14px | 400 (regular) | 1.43 (20px) | `typography.code` | Token/URL input fields (monospace content) |

**Weight rules:**
- Bold (700): ONLY for Large Title ("Loom" in drawer header). Nowhere else.
- Semibold (600): Headings, button labels, session names.
- Regular (400): Body text, captions, input fields, descriptions.
- No other weights permitted (no 300, no 500).

**Source:** Soul doc Typography Overrides + 68-UI-SPEC.md baseline.

---

## Color

All values from `mobile/lib/colors.ts` (device-calibrated with wider RGB jumps for phone readability). These override the Soul doc's original values where they differ.

### Surface Hierarchy (60/30/10 Split)

| Role | RGB Value | Theme Key | Usage in Phase 74 |
|------|-----------|-----------|-------------------|
| **Sunken (Tier 0)** | `rgb(28, 26, 24)` | `colors.surface.sunken` | Drawer background |
| **Base (Tier 1) -- Dominant 60%** | `rgb(44, 40, 38)` | `colors.surface.base` | Chat screen background, auth screen background |
| **Raised (Tier 2) -- Secondary 30%** | `rgb(64, 60, 57)` | `colors.surface.raised` | Session list items on press, composer bar, input fields |
| **Overlay (Tier 3)** | `rgb(82, 78, 74)` | `colors.surface.overlay` | Connection banner glass backing |

### Semantic Colors

| Role | RGB Value | Theme Key | Usage in Phase 74 |
|------|-----------|-----------|-------------------|
| **Accent (10%)** | `rgb(196, 108, 88)` | `colors.accent` | See reserved-for list below |
| **Accent Foreground** | `rgb(46, 42, 40)` | `colors.accentFg` | Text on accent-colored buttons |
| **Destructive** | `rgb(210, 112, 88)` | `colors.destructive` | Auth error state text |
| **Success** | `rgb(82, 175, 108)` | `colors.success` | Connection status dot (connected) |

### Text Colors

| Role | RGB Value | Theme Key | Usage |
|------|-----------|-----------|-------|
| **Primary** | `rgb(230, 222, 216)` | `colors.text.primary` | Body text, headings, session names |
| **Secondary** | `rgb(191, 186, 182)` | `colors.text.secondary` | Session subtitles, auth field hints |
| **Muted** | `rgb(148, 144, 141)` | `colors.text.muted` | Timestamps, placeholder text, disabled text |

### Border Colors

| Role | RGB Value | Theme Key | Usage |
|------|-----------|-----------|-------|
| **Subtle** | `rgba(255,255,255,0.07)` | `colors.border.subtle` | Card edges, input borders (unfocused) |
| **Interactive** | `rgba(255,255,255,0.34)` | `colors.border.interactive` | Input borders (focused), active state borders |

### Dynamic Background States

| State | RGB Value | Theme Key | Trigger |
|-------|-----------|-----------|---------|
| **Idle** | `rgb(46, 42, 40)` | Via `IDLE_BG` | Default state |
| **Streaming** | `rgb(48, 43, 40)` | Via `STREAMING_BG` | Not in Phase 74 scope (Phase 75) |
| **Error** | `rgb(44, 42, 42)` | Via `ERROR_BG` | Connection error state |

### Accent Reserved-For List (Phase 74 Scope)

1. "Connect" button on auth screen (primary CTA)
2. "New Chat" button in drawer
3. Connection status dot (when connected)

**Accent is NOT for:** Navigation icons (use `text.secondary`), drawer background, input field borders, session list text, disabled states.

---

## Glass Treatment

| Property | Value | Source |
|----------|-------|--------|
| Blur intensity | 40 | `expo-blur` `BlurView intensity={40}` |
| Background tint | `dark` | Soul doc Glass Treatment |
| Overlay color | `rgba(0, 0, 0, 0.35)` | Soul doc |
| Border | 1px `border-subtle` | `rgba(255,255,255,0.07)` |
| Corner radius | 16px | `radii.lg` |

**Phase 74 glass usage:** Connection banner ONLY. Glass treatment applied to the disconnect/reconnecting banner overlay.

---

## Shadow Specifications

| Level | Config | Theme Key | Usage in Phase 74 |
|-------|--------|-----------|-------------------|
| Subtle | `shadowColor: '#000', offset: {0, 2}, opacity: 0.15, radius: 8` | `shadows.subtle` | Session list items |
| Medium | `shadowColor: '#000', offset: {0, 4}, opacity: 0.25, radius: 16` | `shadows.medium` | Auth card, composer bar |
| Heavy | `shadowColor: '#000', offset: {0, 8}, opacity: 0.30, radius: 32` | `shadows.heavy` | Connection banner |
| Glow | `shadowColor: accent, offset: {0, 0}, opacity: 0.25, radius: 16` | `shadows.glow(color)` | Connect button when active |

---

## Border Radii

| Token | Value | Theme Key | Usage |
|-------|-------|-----------|-------|
| sm | 8px | `radii.sm` | Small chips, status dots |
| md | 12px | `radii.md` | Cards, buttons, input fields |
| lg | 16px | `radii.lg` | Glass surfaces, connection banner |
| xl | 20px | `radii.xl` | Composer bar, auth card |
| full | 9999px | `radii.full` | Circular elements (status dot, send button) |

---

## Spring Configurations (Phase 74 Scope)

All motion uses springs from `mobile/lib/springs.ts`. No linear or ease animations except color transitions.

| Spring | Config | Usage in Phase 74 |
|--------|--------|-------------------|
| Micro | `damping: 18, stiffness: 220, mass: 0.8` (~150ms) | Button press feedback (Connect, New Chat, hamburger, session items) |
| Standard | `damping: 20, stiffness: 150, mass: 1.0` (~250ms) | Session item press, connection banner auto-dismiss |
| Navigation | `damping: 22, stiffness: 130, mass: 1.0` (~300ms) | Connection banner slide-down/slide-up entrance |
| Drawer | `damping: 20, stiffness: 100, mass: 1.0` (~350ms) | Drawer open/close, parallax shift |

**Color transitions:** `withTiming` at 500ms with `Easing.out(Easing.cubic)`. Springs are for position/scale; timing is for color.

**Reduce motion:** All springs replaced with 0ms instant transitions when `AccessibilityInfo.isReduceMotionEnabled` is true.

---

## Haptic Pairing (Phase 74 Scope)

Every interactive tap produces haptic feedback. No silent taps.

| Event | Haptic Type | Timing |
|-------|-------------|--------|
| Connect button press | Impact Light | On press |
| New Chat button press | Impact Light | On press |
| Session item tap | Impact Light | On press |
| Hamburger icon tap | Impact Light | On press |
| Drawer open/close snap | Impact Medium | When drawer reaches final position |
| Auth error | Error Notification | On error state display |
| Connection restored | Success Notification | On reconnect |

---

## Component Inventory (Phase 74 Screens)

### Screen 1: Auth Screen (D-05)

**Layout:** Full-screen, vertically centered content on `surface.base` background. Safe area respected top and bottom.

| Element | Spec |
|---------|------|
| Loom icon | Centered, 64px, `text.primary` color |
| Heading | "Connect to Loom" -- Heading style (17px semibold), `text.primary`, centered |
| Server URL field | Pre-filled `100.86.4.57:5555`, Code style (14px mono), `surface.raised` background, `border.subtle` border, `radii.md` corners, 44px min-height, `md` (16px) horizontal padding |
| Token field | Placeholder "JWT Token", Body style (15px regular), same styling as URL field, secure text entry |
| Connect button | "Connect" label, Heading weight (semibold), `accent` background, `accentFg` text, `radii.md` corners, 44px height, full width, Glow shadow when enabled |
| Error message | Below button, Caption style (12px), `destructive` color, hidden when no error |
| Keyboard avoidance | `react-native-keyboard-controller` KeyboardAvoidingView wraps content |

**States:**
- Default: Connect button enabled with `accent` background
- Connecting: Connect button shows "Connecting..." with opacity 0.7, disabled
- Error: Error message visible below button, fields retain entered values
- Success: Navigate to drawer shell (no visible transition on auth screen itself)

**Motion:** Connect button Micro spring on press (scale 0.97). Error message fades in with Standard spring (opacity 0 to 1, translateY 8 to 0).

### Screen 2: Drawer (D-07, D-08)

**Layout:** Full-height panel, width 300px (80% of screen, max 320px). Background `surface.sunken` (Tier 0).

| Element | Spec |
|---------|------|
| Drawer header | "Loom" Large Title (28px bold, `text.primary`), top-aligned with `lg` (24px) top padding + safe area inset |
| New Chat button | Below header, full-width minus `md` (16px) horizontal margin. 44px height, `accent` background, `accentFg` text, "New Chat" Heading weight, `radii.md` corners |
| Session list | FlatList of sessions below New Chat button. Each item: 56px min-height, `md` (16px) horizontal padding, `sm` (8px) vertical padding |
| Session item title | Body style (15px semibold), `text.primary`, single line, truncated with ellipsis |
| Session item date | Caption style (12px regular), `text.muted`, below title |
| Active session indicator | Left border 3px `accent`, background shifts to `surface.raised` |
| Connection status | Footer area, above safe area bottom inset. 8px dot (`success` when connected, `destructive` when disconnected, `text.muted` when connecting) + Caption text ("Connected" / "Disconnected" / "Reconnecting...") |
| Drawer overlay | `rgba(0, 0, 0, 0.4)` on main content when drawer is open |

**Motion:**
- Drawer open/close: Drawer spring (20/100, ~350ms)
- Parallax: Main content shifts 20px right via `useDrawerProgress` interpolation
- Session item press: Micro spring scale (0.97) + background transition to `surface.raised` (100ms color timing)
- Session item first load: Staggered opacity + translateY (30ms delay per item, max 10 animated)
- Drawer snap haptic: Impact Medium when drawer reaches fully open or fully closed position

### Screen 3: Chat Screen Placeholder (D-10)

**Layout:** Full-screen with header at top, empty state centered, composer shell at bottom. Background `surface.base`.

| Element | Spec |
|---------|------|
| Navigation header | 56px height, `surface.base` background (or Glass if performance allows). Hamburger icon (SF Symbol `line.3.horizontal`, 24px, `text.secondary`) left with `md` padding. Session title centered: Heading style (17px semibold, `text.primary`). Safe area top inset applied above header. |
| Empty state icon | Claude icon or Loom icon, 48px, centered, `text.muted` color at 0.6 opacity |
| Empty state text | "How can I help?" -- Body style (15px regular), `text.muted`, centered below icon with `sm` (8px) gap |
| Composer shell | Fixed bottom. `surface.raised` background, `radii.xl` top corners (20px). `md` (16px) horizontal padding, `sm` (8px) vertical padding. Safe area bottom inset below. |
| Composer input | Placeholder "Message" in `text.muted`. Body style (15px regular), `text.primary` for input text. `surface.base` background inside composer, `border.subtle` 1px border, `radii.md` corners. 44px min-height. |
| Send button | 36px diameter circle, `surface.raised` background (disabled state -- no text entered). Right side of composer input. |

**States:**
- Empty (default): Empty state centered, composer visible with disabled send button
- Keyboard open: Composer moves up with keyboard via `react-native-keyboard-controller`, empty state remains centered in visible area

**Motion:** Hamburger icon Micro spring on press. Keyboard avoidance matches iOS system curve exactly (not a spring).

### Screen 4: Connection Banner (D-12, D-13)

**Layout:** Fixed overlay at top of chat content. Does NOT push layout down. Glass surface.

| Element | Spec |
|---------|------|
| Banner container | Glass treatment (blur 40, dark tint, `rgba(0,0,0,0.35)` overlay). `radii.lg` (16px) corners. `md` (16px) horizontal margin from screen edges. `sm` (8px) top margin below safe area. Heavy shadow. |
| Status icon | 16px, pulsing opacity animation when reconnecting |
| Banner text | Body style (15px regular), `text.primary` | 
| Banner height | Auto-sized, min 44px, `sm` (8px) vertical padding, `md` (16px) horizontal padding |

**States:**
- Hidden (default): Not rendered. Cold-start guard prevents flash before first connection (D-13).
- Disconnected: Visible. Text: "Connection lost". Slides down with Navigation spring.
- Reconnecting: Visible. Text: "Reconnecting..." with pulsing status icon. Stays visible.
- Reconnected: Auto-dismisses. Slides up with Navigation spring. Success haptic fires.

**Cold-start guard:** Banner only appears after `hasConnectedOnce.current === true && !isConnected`. First connection sets the ref. No banner flash on app launch.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| **Auth screen heading** | Connect to Loom |
| **Auth screen URL label** | Server |
| **Auth screen URL placeholder** | 100.86.4.57:5555 |
| **Auth screen token label** | Token |
| **Auth screen token placeholder** | JWT Token |
| **Primary CTA (auth)** | Connect |
| **Auth CTA connecting state** | Connecting... |
| **Auth error: invalid token** | Invalid token. Check that the token is correct and the server is reachable. |
| **Auth error: server unreachable** | Cannot reach server. Check that Tailscale is connected and the backend is running on port 5555. |
| **Auth error: generic** | Connection failed. Try again. |
| **Drawer heading** | Loom |
| **New Chat button** | New Chat |
| **Empty state heading (chat)** | How can I help? |
| **Empty state body (no sessions)** | No sessions yet |
| **Composer placeholder** | Message |
| **Connection banner: disconnected** | Connection lost |
| **Connection banner: reconnecting** | Reconnecting... |
| **Connection status: connected** | Connected |
| **Connection status: disconnected** | Disconnected |
| **Connection status: reconnecting** | Reconnecting... |
| **Destructive actions** | None in Phase 74 (no session delete, no token clear UI) |

**Tone:** Minimal, direct, no exclamation marks, no emoji. Developer-tool energy. Error messages state the problem and suggest a fix.

---

## Interaction Contracts

### Auth Flow (CONN-01, CONN-02)

1. App launches -> check iOS Keychain for stored token
2. Token found -> attempt auto-connect (show splash/loading)
3. Token valid -> navigate to drawer shell (skip auth screen)
4. Token invalid or missing -> show auth screen
5. User enters server URL + token -> taps "Connect"
6. Success -> persist token to Keychain -> navigate to drawer shell
7. Failure -> show error message below button, fields retain values

### WebSocket Lifecycle (CONN-03, CONN-04, CONN-05, CONN-07)

1. Auth success -> `initializeWebSocket()` with token
2. WebSocket connects -> connection store updates, status dot turns green
3. WebSocket disconnects -> cold-start guard check -> show banner if `hasConnectedOnce`
4. Reconnection -> exponential backoff (handled by shared `WebSocketClient`)
5. Banner shows "Reconnecting..." with pulsing icon
6. Reconnect success -> banner auto-dismisses with slide-up animation + Success haptic
7. App backgrounds -> 30s grace period -> disconnect WebSocket
8. App foregrounds -> get fresh token from Keychain -> `wsClient.connect(token)`

### Drawer Navigation (NAV-01, NAV-02, NAV-03, NAV-04)

1. Swipe right from left edge (full-width swipe area) or tap hamburger -> drawer opens
2. Drawer tracks finger during swipe, springs to open/closed on release
3. Velocity > 200 pts/sec = spring to opposite state
4. Position > 40% open on release = spring open
5. Main content shifts right 20px (parallax) and dims with `rgba(0,0,0,0.4)` overlay
6. Tapping overlay or swiping left closes drawer
7. Tapping session item -> navigate to chat screen -> drawer auto-closes
8. All screens respect safe areas via `useSafeAreaInsets()`

---

## Visual Focal Points

| Screen | Focal Point | Rationale |
|--------|-------------|-----------|
| Auth screen | "Connect" button (accent, centered) | User's eye enters at heading, drops to the accent-colored CTA. The warm accent against dark surface creates a clear visual target. |
| Drawer | "New Chat" button (accent, top) + most recent session | Eye enters at "Loom" heading, drops to accent CTA, then to the first session item. Active session has left accent border. |
| Chat placeholder | "How can I help?" (centered) | Centered empty state draws the eye. Composer at bottom is secondary -- visual-only in this phase. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Not applicable | N/A | React Native project -- no shadcn, no component registries |

All components are built from scratch using React Native core components (`View`, `Text`, `Pressable`, `TextInput`, `FlatList`) + theme tokens. No third-party component registries.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
