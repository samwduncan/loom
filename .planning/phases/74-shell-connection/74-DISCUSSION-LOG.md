# Phase 74: Shell & Connection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 74-shell-connection
**Areas discussed:** Styling foundation, Auth flow UX, Drawer behavior, Connection resilience, Chat screen placeholder, Theme values, Testing strategy, NativeWind removal scope

---

## Styling Foundation

| Option | Description | Selected |
|--------|-------------|----------|
| StyleSheet + Theme | Drop NativeWind. Use Private Mind's createStyles(theme) pattern with typed Theme object. Soul doc values in single theme file. No TS errors, matches reference app. | ✓ |
| NativeWind (keep current) | Keep NativeWind v4. Fix 40 TS errors with wrapper types. Use className pattern. Familiar from web app but less animation-friendly. | |
| Hybrid approach | NativeWind for layout + StyleSheet for animated/dynamic values. Two systems per component. | |

**User's choice:** StyleSheet + Theme (Recommended)
**Notes:** Clean break from NativeWind eliminates TS error debt and matches Private Mind reference exactly.

### NativeWind Removal Follow-up

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it | Clean break. Remove nativewind, react-native-css-interop, tailwind.config from mobile/. One styling system. | ✓ |
| Keep installed, don't use | Leave in package.json but don't import. Safety net. | |

**User's choice:** Remove it (Recommended)

---

## Auth Flow UX

| Option | Description | Selected |
|--------|-------------|----------|
| Token input screen | Full-screen with Loom branding. Server URL (pre-filled Tailscale IP) + JWT token field + Connect button. Shows on first launch or invalid token. Developer-tool UX. | ✓ |
| Bottom sheet prompt | App launches to main shell. Bottom sheet slides up for token if missing. Less jarring but empty shell looks odd. | |
| Inline settings | No separate screen. Configure in Settings tab. Most minimal. | |

**User's choice:** Token input screen (Recommended)
**Notes:** Reconciles Phase 69 D-07 (auto-connect) with CONN-01 (login screen). It's a token input screen, not a credential form. Auto-connects on subsequent launches.

---

## Drawer Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Stub session list | Loom branding, New Chat button, flat list (title + date, no grouping/search/pin). Connection dot in footer. Full session management in Phase 76. | ✓ |
| Empty placeholder | Only New Chat button and connection status. No session list at all. | |
| Full session list | Complete Phase 76 session list now (grouping, search, pin, context menus). Scope creep risk. | |

**User's choice:** Stub session list (Recommended)
**Notes:** Functional but minimal. Enough to navigate between sessions. @react-navigation/drawer with slide type, parallax, Soul doc springs.

---

## Connection Resilience

| Option | Description | Selected |
|--------|-------------|----------|
| Carry forward all | Reuse Phase 69 D-27 through D-30 specs (background disconnect, MMKV persistence, glass banner, AppState listener). | ✓ |
| Simplify for Phase 74 | Only basic connect/reconnect/banner. Defer stream persistence and glass styling. | |
| Review them first | Show full D-27-D-30 text for manual review. | |

**User's choice:** Carry forward all (Recommended)

### Banner Position

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed overlay at top | Floats over content with glass blur. No layout shift. ChatGPT iOS pattern. | ✓ |
| Push content down | Inserts into layout, pushes everything down. More noticeable but jarring. | |

**User's choice:** Fixed overlay at top (Recommended)

### Cold Start Guard

| Option | Description | Selected |
|--------|-------------|----------|
| No banner until first failure | hasConnectedOnce useRef guard. No false-alarm flash on app open. | ✓ |
| Show banner immediately | Visible from launch until connection succeeds. | |

**User's choice:** No banner until first failure (Recommended)

---

## Chat Screen Placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state + composer shell | Claude icon + "How can I help?" + visual-only composer bar. Proves layout and keyboard avoidance. No message sending. | ✓ |
| Just header + empty area | Hamburger + title only. Pure navigation skeleton. | |
| Functional chat | Wire up actual messaging. Scope creep but lightens Phase 75. | |

**User's choice:** Empty state + composer shell (Recommended)

---

## Theme Values

| Option | Description | Selected |
|--------|-------------|----------|
| Soul doc values | Pull directly from NATIVE-APP-SOUL.md. Warm charcoal, dusty rose accent, Inter, JetBrains Mono, all springs, 4 surfaces. Dark mode only. | ✓ |
| Private Mind values + Loom colors | Copy PM's Theme type, swap in Loom colors. | |
| Define from scratch | Build fresh. More work, full control. | |

**User's choice:** Soul doc values (Recommended)

---

## Testing Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Jest + unit tests on logic | Test auth flow, WebSocket lifecycle, drawer state. Jest (Expo default). No component rendering tests. | ✓ |
| Vitest (match shared/) | Consistent with shared/ but needs extra RN config. | |
| Minimal / defer | Write tests later when there's more to test. | |

**User's choice:** Jest + unit tests on logic (Recommended)

---

## NativeWind Removal Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full cleanup | Remove deps, delete all Phase 69 components and routes. Keep hooks, lib, Expo config. Start fresh. | ✓ |
| Just remove package | Remove from deps, leave files to be replaced file-by-file. | |
| Archive Phase 69 code | Move to mobile/.archive/ for reference during rebuild. | |

**User's choice:** Full cleanup (Recommended)

---

## Claude's Discretion

- Theme object TypeScript structure
- Drawer header design (branding layout, icon)
- Connection banner text content
- Auth screen visual polish details
- NativeWind removal in babel/metro config

## Deferred Ideas

None -- discussion stayed within phase scope.
