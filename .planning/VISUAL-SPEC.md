# Loom Visual Design Spec

Authoritative reference for all visual implementation. When in doubt, this document wins.

Last updated: 2026-04-06
Review scores: Codex 6/10 (pre-fix baseline). Target: 9/10.

---

## 1. Color Palette

### 1.1 Surfaces (Warm Charcoal — B channel always lowest)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `surface.deep` | `#080807` | `8,8,7` | Code blocks, terminal bg, deepest wells |
| `surface.sunken` | `#0c0c0a` | `12,12,10` | App base, drawer bg |
| `surface.base` | `#131310` | `19,19,16` | Panel bg, sidebar |
| `surface.raised` | `#1e1e18` | `30,30,24` | Cards, composer, user bubbles |
| `surface.input` | `#28281f` | `40,40,31` | Input wells, code block headers |
| `surface.overlay` | `#32322a` | `50,50,42` | Modals, popovers, sheets |

Rule: each step is 10-12 lightness units apart. Never use pure black (#000).

### 1.2 Brand Accent: Warm Orange (The Visual Protagonist)

The brand orange is the star of the show. It should be the first color you notice, the thing that makes Loom look like Loom. Use it boldly — not just on buttons but on key metrics, active indicators, and brand moments.

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#eb8f36` | Primary CTAs, send button, active tab, model indicator, key metrics |
| `accent.bright` | `#f0a654` | Hover/highlight state |
| `accent.dim` | `#c96d2e` | Press/active state |
| `accent.muted` | `rgba(235,143,54, 0.15)` | Tinted backgrounds (New Chat, active session, brand surfaces) |
| `accent.fg` | `#141410` | Text on accent (dark — orange is light) |

**Where accent should appear beyond buttons:**
- Active session highlight in drawer
- Running session pulse dot
- Key metric values (token burn rate, active sessions count)
- Model indicator text
- Streaming progress line on code blocks
- Empty state greeting accent word
- Brand "L" logo mark

### 1.3 Category Colors (4 Core + 1 Provider)

Reduced from 8 to 4. When everything is a color, nothing pops.
File operations (Read, Write, Glob) use `text.secondary` — they're the default, they don't need a color.

| Category | Vivid | Muted (15% opacity) | Assigned to |
|----------|-------|---------------------|-------------|
| Green | `#34d399` | `rgba(52,211,153, 0.12)` | Shell/terminal (Bash), monitoring, health |
| Orange | `#f59e0b` | `rgba(245,158,11, 0.15)` | Edits, Git, file mutations |
| Blue | `#3b82f6` | `rgba(59,130,246, 0.15)` | Web (WebFetch), search (Grep, Glob), deploy, info |
| Pink | `#ec4899` | `rgba(236,72,153, 0.15)` | Agent delegation, orchestration |
| Coral | `#c6613f` | `rgba(198,97,63, 0.15)` | Claude provider badge only |

**Killed:** Purple (→ text.secondary), Cyan (→ Blue), Teal (→ Green).

**Tool → Color mapping:**

| Tool | Color | Rationale |
|------|-------|-----------|
| Bash | Green | Shell = green (universal) |
| Read | `text.secondary` | Default operation, no color needed |
| Write | `text.secondary` | Default operation, no color needed |
| Glob | Blue | Search operations |
| Grep | Blue | Search operations |
| Edit | Orange | Mutation = attention |
| WebFetch | Blue | Web operations |
| WebSearch | Blue | Web operations |
| Agent | Pink | Orchestration |
| Think | Brand accent | Brand moment |

### 1.4 Provider Colors

| Provider | Vivid | Muted | Badge text |
|----------|-------|-------|------------|
| Claude | `#c6613f` | `rgba(198,97,63, 0.15)` | "Claude" |
| Codex | `#34d399` | `rgba(52,211,153, 0.12)` | "Codex" |
| Gemini | `#3b82f6` | `rgba(59,130,246, 0.15)` | "Gemini" |

### 1.5 Status Colors (Vivid — these are signals)

| Status | Color | Glow shadow |
|--------|-------|-------------|
| Success/Online | `#10b981` | `0 0 8px rgba(16,185,129, 0.4)` |
| Warning/Idle | `#f59e0b` | `0 0 6px rgba(245,158,11, 0.3)` |
| Error/Offline | `#ef4444` | `0 0 6px rgba(239,68,68, 0.3)` |
| Info/Syncing | `#3b82f6` | `0 0 6px rgba(59,130,246, 0.3)` |

### 1.6 Text (Warm Whites — Bumped Contrast)

| Token | Value | Contrast on sunken | Usage |
|-------|-------|-------------------|-------|
| `text.primary` | `#f5f4ed` | 17:1 | Headlines, body, interactive labels |
| `text.secondary` | `#c8c6ba` | 11:1 | Descriptions, timestamps, file tool names, metadata |
| `text.muted` | `#9c9a90` | 6.5:1 (AA pass) | Placeholders, section headers, status labels |
| `text.faint` | `#6a6860` | 3.5:1 (decorative only) | Divider labels, non-essential hints |

**Key change from previous:** `text.muted` bumped from #827e78 (4.5:1, barely AA) to #9c9a90 (6.5:1, comfortably AA). Tool names and labels are now readable at arm's length.

**Rule:** Never use `text.faint` for anything a user needs to read. It's for decoration only.

### 1.7 Borders (Warm Off-White Base)

| Token | Value | Usage |
|-------|-------|-------|
| `border.strong` | `rgba(222,220,209, 0.25)` | Card edges, input borders, composer |
| `border.default` | `rgba(222,220,209, 0.15)` | List item dividers, section separators |
| `border.subtle` | `rgba(222,220,209, 0.08)` | Decorative, barely-there edges |

All borders: 0.5px (StyleSheet.hairlineWidth). Never 1px unless explicitly glass treatment.

---

## 2. Typography

### 2.1 Type Scale (4-tier hierarchy — fix for Codex finding #1)

| Tier | Name | Size | Weight | Line Height | Letter Spacing | Font | Usage |
|------|------|------|--------|-------------|----------------|------|-------|
| 1 | `headline` | 20px | 600 | 26px (1.3x) | -0.3px | Inter-SemiBold | Screen titles, section headers |
| 2 | `body` | 16px | 400 | 22px (1.4x) | 0px | Inter-Regular | Messages, descriptions, primary content |
| 3 | `label` | 13px | 500 | 18px (1.4x) | -0.1px | Inter-Medium | Tool names, session titles, button text, nav items |
| 4 | `meta` | 11px | 400 | 15px (1.4x) | 0.3px | Inter-Regular | Timestamps, provider badges, section sub-labels |

Additional:
- `code`: 14px / 20px, JetBrains Mono Regular
- `largeTitle`: 28px / 31px, Inter-SemiBold, -0.5px tracking (used sparingly)

Rule: **every text element must map to one of these 4 tiers.** No one-off sizes.

### 2.2 Font Stack

- UI: Inter (all weights via expo-font)
- Code: JetBrains Mono
- Fallback: -apple-system, SF Pro Text, system-ui

---

## 3. Spacing (Strict 8px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon-to-text gap, inline chip padding |
| `sm` | 8px | Internal component padding, list item gaps |
| `md` | 16px | Card padding, screen horizontal margins, section gaps |
| `lg` | 24px | Section separators, screen vertical padding |
| `xl` | 32px | Major section breaks |
| `2xl` | 48px | Screen-level spacing |

Rules:
- Outer screen padding: always 16px horizontal
- Card internal padding: always 16px
- List item vertical padding: 12px (exception: 8px + 4px top/bottom = 12px total on 8px grid)
- Message gap: 16px (not 20px)
- Button gap: 8px
- Component-to-component: 16px

---

## 4. Radii

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Inline code, tiny badges |
| `sm` | 6px | Provider badges, tool icon bg |
| `md` | 8px | Code blocks, tool detail cards |
| `lg` | 12px | Cards, buttons, session items, inputs |
| `xl` | 16px | Permission cards, notification banners |
| `input` | 24px | Composer pill |
| `pill` | 9999px | Send button, avatars, status dots |

---

## 5. Shadows (exactly 2)

| Name | Value | Usage |
|------|-------|-------|
| `subtle` | `0 -2px 8px rgba(0,0,0,0.08)` | Composer |
| `sheet` | `0 4px 16px rgba(0,0,0,0.12)` | Bottom sheets, modals, permission cards |

---

## 6. Glass Treatment

Applied to interaction chrome that floats above content:

| Component | Background | Blur | Border |
|-----------|-----------|------|--------|
| Composer | `rgba(30,30,24, 0.75)` | `blur(20px)` | `border.strong` |
| Tab bar | `rgba(12,12,10, 0.80)` | `blur(24px)` | `border.default` top |
| Chat header | `rgba(19,19,16, 0.80)` | `blur(20px)` | `border.default` bottom |
| Bottom sheet | `rgba(30,30,24, 0.96)` | `blur(30px)` | `border.default` top |
| Notification banner | `rgba(30,30,24, 0.75)` | `blur(20px)` | `border.subtle` |
| Drawer overlay | `rgba(10,10,8, 0.96)` | `blur(30px)` | none |

All glass surfaces get `inset 0 0.5px 0 rgba(255,255,255,0.04)` top rim highlight.

Future: Replace with `expo-glass-effect` / Liquid Glass on iOS 26+.

---

## 7. Component Specs

### 7.1 Model Indicator (Fix for Codex finding #2)

**Do NOT use filled pill.** iOS-native pattern:

```
Layout: text label + chevron-down icon
Text: "Claude Opus" — label tier (13px, 500, Inter-Medium)
Color: text.secondary (default), accent (when picker open)
Chevron: 12px, text.muted, rotates 180deg on open
Position: nav bar center
Touch: 44px hit area, micro spring scale
```

No background fill. No glow. Just text.

### 7.2 Tool Chip (Color-coded)

```
Layout: [icon-bg] [tool-name] [status-indicator]
Shape: pill (border-radius: 9999px)
Background: category muted color (e.g., purple-muted for Read)
Icon bg: same category muted, 22x22px, radius sm (6px)
Icon: 14px, category vivid color
Name: label tier (13px, 500), category vivid color
Status: spinner (invoked), pulsing dot (executing), check (resolved), x (rejected)
Executing shimmer: name text opacity 0.3→1→0.3, 1.5s cycle
Border: 0.5px, border.subtle
Press: micro spring 0.97, selection haptic
```

### 7.3 Tool Detail Sheet

```
Header: [icon 20px, category vivid] [tool-name, category vivid] ... [status badge]
Status badge: [dot 8px + label, status color]
Surface: overlay tier
Divider: 0.5px, border.default
Arguments: meta tier labels, body tier values
Code values: JetBrains Mono
```

### 7.4 Session Item

```
Layout: [text-column] [running-dot?] [provider-badge?]
Active: bg accent.muted + text label weight 500
Running dot: 8px, accent, pulsing opacity 0.4→1, 750ms
Provider badge: 10px meta, category muted bg, category vivid text, radius 4px
Swipe-to-delete: destructive bg, "Delete" text
Press: micro spring 0.97, selection haptic
Stagger entrance: 30ms delay per item, max 10
```

### 7.5 Permission Card

```
Surface: overlay tier
Icon: 28x28, warning yellow muted bg, warning yellow icon
Title: label tier, text.primary
Description: body tier, text.secondary
Buttons: 44px height, radius lg (12px)
  - Deny: surface.raised bg, text.primary
  - Allow: accent bg, accent.fg text
Entrance: dramatic spring, scale 0.95→1, translateY 10→0
Haptic: warning on mount
```

### 7.6 Composer

```
Shape: 48px height, 24px radius pill
Surface: glass (see section 6)
Placeholder: "Ask anything..." — body tier, text.muted
Send button: 36x36px pill, accent bg, accent.fg icon (ArrowUp 16px)
  Empty state: surface.raised bg, text.muted icon
  With text: accent bg, accent.fg icon
Stop button: destructive bg, white Square icon
Status bar: below composer, label tier, text.muted
Model pill: text only (see 7.1)
```

### 7.7 Notification Banner

```
Surface: glass (see section 6)
Shape: radius xl (16px)
Tint layer: 10% opacity, colored by type:
  - permission_request: warning yellow
  - session_error: destructive red
  - session_complete: success green
  - batched: info blue
Icon dot: 24px pill, same color as tint
Title: 15px, 600 weight, text.primary
Body: 13px, 400 weight, text.secondary
Entrance: navigation spring, translateY -80→0
Auto-dismiss: 4s standard, 8s permission
Swipe-up dismiss gesture
```

### 7.8 Code Block

```
Container: surface.deep bg, radius md (8px), border 0.5px border.subtle
Header: surface.raised bg, border-bottom 0.5px border.subtle
  Language: meta tier, text.muted, uppercase
  Copy: accent icon (Copy 14px) → success icon (Check 14px) for 2s
Code: JetBrains Mono 14px, horizontal scroll
Streaming: 2px accent line at bottom, pulsing opacity 0.3→0.8
Syntax colors: purple (keywords), blue (functions), green (strings), orange (numbers)
```

### 7.9 Metrics Cards

```
Grid: 2 columns, 8px gap
Card: surface.raised bg, radius lg (12px), border 0.5px border.strong
Icon: 32x32, radius sm (8px), category muted bg, category vivid icon
Label: meta tier, text.muted, uppercase
Value: headline tier (20px, 600), category vivid color
Delta: meta tier, success green (up) / destructive red (down)
Bar: 4px height, radius 2px, surface.input bg, category vivid fill
```

### 7.10 Status Dots

```
Size: 8px, pill radius
Online: success green + glow shadow
Idle: warning yellow + glow shadow
Error: destructive red + glow shadow
Offline: text.muted, no glow
Pulse animation (online/executing only): opacity 0.4→1, 750ms, infinite reverse
```

---

## 8. Animation

### 8.1 Springs

| Name | Config | Usage |
|------|--------|-------|
| `micro` | damping: 20, stiffness: 300 | Button press (scale 0.97) |
| `standard` | damping: 20, stiffness: 180 | Entrance fade/slide |
| `navigation` | damping: 28, stiffness: 260 | Screen transitions, banner entrance |
| `dramatic` | damping: 16, stiffness: 140 | Permission card entrance |

### 8.2 Timing

- Color transitions: 500ms, Easing.out(cubic)
- Shimmer: 1.5s cycle, withRepeat
- Stagger: 30ms per item, max 10 items
- Chevron rotation: 200ms ease-out

### 8.3 Haptics

| Event | Feedback |
|-------|----------|
| Button press | `Impact.Light` (selection) |
| Swipe delete | `Impact.Medium` (transition) |
| Permission appear | `Notification.Warning` |
| Approve action | `Notification.Success` |
| Tab/nav switch | `Impact.Light` (selection) |

---

## 9. Aurora / Atmospheric (Future)

Three animated blobs with `blur(80px)`, positioned fixed behind app content:

| Blob | Color | Opacity | Size | Position | Animation |
|------|-------|---------|------|----------|-----------|
| Warm | `rgb(224,136,64)` | 0.22 | 300px | Top-left | 16s drift |
| Teal | `rgb(77,184,168)` | 0.12 | 320px | Top-right | 20s drift |
| Warm secondary | `rgb(224,136,64)` | 0.10 | 250px | Bottom-center | 24s drift |

Only visible on screens with dark backgrounds (chat, empty state). Disabled during streaming for performance.

---

## 10. Anti-Patterns (Never Do)

1. **No pure black (#000000)** — always warm charcoal
2. **No pure white borders** — always warm off-white rgba base
3. **No equal RGB channels** — B channel must be lowest (warm rule)
4. **No one-off font sizes** — every text maps to the 4-tier scale
5. **No arbitrary spacing** — 8px grid only (4, 8, 16, 24, 32, 48)
6. **No filled accent pills** for navigation — iOS uses text labels
7. **No 1px borders** — 0.5px (hairlineWidth) everywhere
8. **No neon colors** — jewel tones (saturated but deep)
9. **No cool grays** — all grays have warm undertone
10. **No shadow inflation** — exactly 2 shadow tiers, no more
