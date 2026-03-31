---
phase: 68
slug: scaffolding-design
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-31
---

# Phase 68 — UI Design Contract

> Visual and interaction contract for NativeWind validation primitives and placeholder screens. Phase 68 is primarily infrastructure (shared code extraction, Expo scaffolding, Apple enrollment) with a design component (Native App Soul doc). This contract defines the **baseline tokens for NativeWind primitives** and **copywriting for placeholder screens**. The Soul doc produced in Phase 68 will override and extend these values for Phases 69-73.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | NativeWind v4.2.3 (NOT shadcn -- React Native, not web) |
| Preset | NativeWind preset (`nativewind/preset` in tailwind.config.js) |
| Component library | None (100% new native components, no web port -- Out of Scope) |
| Icon library | TBD by Soul doc (Phase 68 primitives use Text only, no icons) |
| Font (UI) | Inter (system fallback: System) |
| Font (Mono) | JetBrains Mono (system fallback: Courier) |

**Note:** The web app uses shadcn/Radix UI components. The native app does NOT use shadcn. All native components are built from scratch with NativeWind. These are separate codebases sharing only logic via `shared/`.

---

## Spacing Scale

Declared values (multiples of 4, inherited from web app's 4px grid):

| Token | Value | NativeWind Class | Usage |
|-------|-------|-----------------|-------|
| xs | 4px | `p-1`, `gap-1` | Icon gaps, inline padding |
| sm | 8px | `p-2`, `gap-2` | Compact element spacing, list item internal padding |
| md | 16px | `p-4`, `gap-4` | Card internal padding, default section padding, screen horizontal padding |
| lg | 24px | `p-6`, `gap-6` | Section gaps between content groups |
| xl | 32px | `p-8`, `gap-8` | Major section breaks |
| 2xl | 48px | `p-12`, `gap-12` | Page-level top/bottom padding |
| 3xl | 64px | `p-16`, `gap-16` | Reserved (splash, onboarding) |

Exceptions:
- Touch targets: 44pt minimum height for all interactive elements (Apple HIG). Use `min-h-[44px]` or `h-11` (44px).
- Safe area insets: Handled by `react-native-safe-area-context`, not spacing tokens. Use `<SafeAreaView>` or `useSafeAreaInsets()`.

---

## Typography

Font loading: Inter and JetBrains Mono installed via `expo-font` or bundled as assets in `mobile/assets/fonts/`. NativeWind `fontFamily` theme extension maps class names.

| Role | Size | Weight | Line Height | NativeWind Classes | Usage |
|------|------|--------|-------------|-------------------|-------|
| Caption | 12px | 400 (regular) | 1.33 (16px) | `text-xs font-normal` | Timestamps, metadata, badges, tool card labels, secondary info |
| Body | 15px | 400 (regular) | 1.6 (24px) | `text-[15px] font-normal` | Chat message body, list descriptions |
| Heading | 17px | 600 (semibold) | 1.29 (22px) | `text-[17px] font-semibold` | Screen titles, section headers, session names |
| Code | 14px | 400 (regular) | 1.43 (20px) | `text-sm font-mono` | Code blocks, monospace content |

**Rationale:** Sizes follow iOS Dynamic Type "Large" (default) scale. 15px body matches Apple HIG recommendation for readable content at arm's length. 17px heading matches iOS navigation bar title size. 12px caption is the minimum readable size on iOS (matching web constraint). The former 13px Label role is merged into Caption at 12px -- tool card labels and secondary info use Caption size.

**Weights:** Only 2 weights allowed in Phase 68 primitives: regular (400) and semibold (600). No medium (500), bold (700), or light (300) without Soul doc approval.

**tailwind.config.js theme extension:**
```js
fontSize: {
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['14px', { lineHeight: '20px' }],
  base: ['15px', { lineHeight: '24px' }],
  lg: ['17px', { lineHeight: '22px' }],
},
fontFamily: {
  sans: ['Inter'],
  mono: ['JetBrains Mono'],
},
```

---

## Color

All colors derived from the web app's OKLCH tokens (D-20). Converted to RGB for NativeWind v4 / Tailwind v3 compatibility (NativeWind does not support OKLCH natively). Soul doc may override these values entirely.

| Role | OKLCH Source | RGB Equivalent | NativeWind Token | Usage |
|------|-------------|----------------|-----------------|-------|
| **Dominant (60%)** | `oklch(0.20 0.010 32)` | `rgb(46, 42, 40)` | `surface-base` | Screen backgrounds, scroll areas |
| **Sunken** | `oklch(0.17 0.010 32)` | `rgb(38, 35, 33)` | `surface-sunken` | Drawer background, inset areas |
| **Secondary (30%)** | `oklch(0.23 0.008 32)` | `rgb(54, 50, 48)` | `surface-raised` | Cards, list items, elevated surfaces |
| **Overlay** | `oklch(0.27 0.007 32)` | `rgb(62, 59, 56)` | `surface-overlay` | Modals, popovers, context menus |
| **Accent (10%)** | `oklch(0.63 0.14 20)` | `rgb(196, 108, 88)` | `accent` | See reserved-for list below |
| **Text Primary** | `oklch(0.90 0.02 30)` | `rgb(230, 222, 216)` | `text-primary` | Body text, headings |
| **Text Secondary** | `oklch(0.76 0.01 30)` | `rgb(191, 186, 182)` | `text-secondary` | Subtitles, descriptions |
| **Text Muted** | `oklch(0.60 0.008 30)` | `rgb(148, 144, 141)` | `text-muted` | Timestamps, placeholder text |
| **Destructive** | `oklch(0.65 0.18 25)` | `rgb(210, 112, 88)` | `destructive` | Delete actions, error states |
| **Success** | `oklch(0.65 0.15 145)` | `rgb(82, 175, 108)` | `success` | Connection ok, tool completion |
| **Border Subtle** | `oklch(1 0 0 / 0.07)` | `rgba(255,255,255,0.07)` | `border-subtle` | Card edges, separators |
| **Border Interactive** | `oklch(1 0 0 / 0.34)` | `rgba(255,255,255,0.34)` | `border-interactive` | Input borders, button outlines |

**Accent reserved for (explicit list):**
1. Send button (composer)
2. Active session indicator (sidebar)
3. Primary CTA buttons only (not secondary actions)
4. Connection status dot (when connected)
5. Selected/focused tab indicator

**Accent is NOT for:** Navigation icons, card borders, text links (use text-primary), disabled states.

**tailwind.config.js colors extension:**
```js
colors: {
  surface: {
    sunken: 'rgb(38, 35, 33)',
    base: 'rgb(46, 42, 40)',
    raised: 'rgb(54, 50, 48)',
    overlay: 'rgb(62, 59, 56)',
  },
  accent: {
    DEFAULT: 'rgb(196, 108, 88)',
    hover: 'rgb(210, 122, 102)',
    muted: 'rgba(196, 108, 88, 0.15)',
    fg: 'rgb(46, 42, 40)',
  },
  text: {
    primary: 'rgb(230, 222, 216)',
    secondary: 'rgb(191, 186, 182)',
    muted: 'rgb(148, 144, 141)',
  },
  destructive: 'rgb(210, 112, 88)',
  success: 'rgb(82, 175, 108)',
  warning: 'rgb(192, 160, 72)',
  info: 'rgb(100, 150, 210)',
  border: {
    subtle: 'rgba(255, 255, 255, 0.07)',
    interactive: 'rgba(255, 255, 255, 0.34)',
  },
},
```

---

## Visual Focal Points

| Screen | Focal Point | Rationale |
|--------|-------------|-----------|
| Session list | Screen title ("Loom") and the most recent session card at the top of the list | User's eye enters at the title, drops to the first actionable item. The most recent session card uses `surface-raised` background to separate it from the `surface-base` scroll area. |
| NativeWind test screen | "Design Primitives" heading and the first rendered Surface Card | Validates NativeWind pipeline -- the card with shadow/blur is the visual proof point. |

---

## Copywriting Contract

Phase 68 placeholder screens need copy. These screens are navigation scaffolds that prove routing works -- they will be replaced by real implementations in Phase 69+.

| Element | Copy |
|---------|------|
| **Primary CTA** | Not applicable (Phase 68 has no user-facing CTAs -- scaffolding only) |
| **Session list placeholder heading** | Loom |
| **Session list placeholder body** | No sessions yet |
| **Chat screen placeholder heading** | Chat |
| **Chat screen placeholder body** | Select a session or start a new one |
| **Settings placeholder heading** | Settings |
| **Settings placeholder body** | Server and model configuration -- Phase 70 |
| **Notifications placeholder heading** | Notifications |
| **Notifications placeholder body** | Push notifications -- Phase 72 |
| **NativeWind test screen heading** | Design Primitives |
| **NativeWind test screen body** | Validating typography, color, spacing, depth, and blur |
| **Connection error (if test screen has network check)** | Cannot reach server. Check that Tailscale is connected and the backend is running on port 5555. |
| **Empty state: session list** | No sessions yet |
| **Empty state: chat (no session selected)** | Select a session or start a new one |
| **Empty state: settings** | Server and model configuration -- Phase 70 |
| **Empty state: notifications** | Push notifications -- Phase 72 |
| **Empty state: search** | No results |
| **Destructive actions** | None in Phase 68 (no data modification in placeholder screens) |

**Tone:** Minimal, lowercase-friendly, no exclamation marks. Match ChatGPT iOS placeholder energy -- informational, not enthusiastic. No emoji in placeholder copy.

---

## NativeWind Primitive Components (D-19)

Phase 68 builds 5 design system primitives to validate the NativeWind pipeline on device. These are the ONLY UI components built in this phase.

### 1. Surface Card
- Background: `bg-surface-raised`
- Border: `border border-border-subtle`
- Border radius: `rounded-xl` (12px)
- Padding: `p-4` (16px)
- Shadow: Platform shadow (`shadow-md` on iOS, maps to `shadowColor/shadowOffset/shadowOpacity/shadowRadius`)
- Usage: Wraps any elevated content (session items, tool cards, settings sections)

### 2. Text Hierarchy
- Heading: `text-lg font-semibold text-text-primary` (17px, 600, primary)
- Body: `text-base font-normal text-text-primary` (15px, 400, primary)
- Caption: `text-xs font-normal text-text-muted` (12px, 400, muted)
- All text uses `font-sans` (Inter)
- Code variant: `text-sm font-mono text-text-primary` (14px, 400, JetBrains Mono)

### 3. Button with States
- Height: `min-h-[44px]` (Apple HIG touch target)
- Padding: `px-6 py-4` (24px horizontal, 16px vertical)
- Background: `bg-accent` (primary CTA), `bg-surface-raised` (secondary)
- Text: `text-accent-fg font-semibold` (primary), `text-text-primary font-semibold` (secondary)
- Border radius: `rounded-xl` (12px, matching card radius)
- Pressed state: Opacity reduction to 0.7 via `activeOpacity={0.7}` on `TouchableOpacity` or `Pressable` with opacity style
- Disabled state: Opacity 0.4, no press handler

### 4. List Item
- Height: `min-h-[56px]` (comfortable touch target, larger than minimum 44px)
- Padding: `px-4 py-4` (16px all around)
- Background: `bg-surface-base` (default), `bg-surface-raised` on press
- Title: `text-base font-semibold text-text-primary` (15px, 600)
- Subtitle: `text-xs text-text-secondary` (12px, 400)
- Border bottom: `border-b border-border-subtle`
- Right chevron: Text `>` in `text-text-muted` (icon library TBD by Soul doc)

### 5. Glass/Blur Surface
- Background: Semi-transparent surface using React Native's `BlurView` from `expo-blur`
- Blur amount: `intensity={40}` (comparable to web's `--glass-blur: 16px`)
- Background tint: `tint="dark"`
- Overlay: `rgba(0, 0, 0, 0.35)` (matches web `--glass-overlay-bg`)
- Border: `border border-border-subtle`
- Border radius: `rounded-2xl` (16px)
- Usage: Navigation header overlay, modal backdrop, floating composer area

---

## Motion Tokens (Baseline)

Phase 68 validates that Reanimated works. Spring physics values for reference -- Soul doc will finalize.

| Animation | Config | Duration | Usage |
|-----------|--------|----------|-------|
| Card press | `{ damping: 15, stiffness: 150 }` | ~200ms settle | Touch feedback on cards, list items |
| Screen transition | `{ damping: 20, stiffness: 120 }` | ~300ms settle | Stack push/pop via Expo Router |
| Drawer open | `{ damping: 18, stiffness: 100 }` | ~400ms settle | Sidebar drawer slide |

All animations MUST respect `AccessibilityInfo.isReduceMotionEnabled` -- skip to final state with 0ms duration.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| NativeWind preset | `nativewind/preset` (built-in) | not required (first-party) |
| No third-party registries | N/A | N/A |

**Note:** shadcn is not applicable to React Native. The native app uses NativeWind classes directly on React Native core components (`View`, `Text`, `Pressable`, `ScrollView`). No component registry system.

---

## Design Scope Boundary

This UI-SPEC covers ONLY Phase 68's deliverables:
1. 5 NativeWind primitive components rendered on device
2. Placeholder screen copy for scaffolded routes
3. Baseline color/typography/spacing tokens in `mobile/tailwind.config.js`

The **Native App Soul document** (D-07 through D-12) produced during Phase 68 will define:
- Screen-by-screen visual specs for all v3.0 screens
- Animation philosophy and specific spring configs
- Icon library selection
- Elevation/depth/glass layering rules
- Dynamic color behavior
- Anti-patterns list
- Detailed component specs beyond these 5 primitives

The Soul doc becomes the authoritative visual contract for Phases 69-73, superseding this UI-SPEC's baseline values where they conflict.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
