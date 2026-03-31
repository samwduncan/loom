# Phase 68: Scaffolding & Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 68-scaffolding-design
**Areas discussed:** Shared code scope, Soul doc process & depth, Repo coexistence strategy, Apple Developer enrollment, EAS Build strategy, NativeWind validation scope, Expo Router structure, Dev workflow & tooling

---

## Shared Code Scope

### Extraction aggressiveness

| Option | Description | Selected |
|--------|-------------|----------|
| Full extraction (Recommended) | Types + store factories + API client + WebSocket + multiplexer + tool registry (~20 files). Validates sharing pipeline end-to-end. | ✓ |
| Conservative (types only) | Just types/ directory. Stores and API code extracted in Phase 69. | |
| Middle ground | Types + store factories + multiplexer (pure logic, zero deps). | |

**User's choice:** Full extraction
**Notes:** None

### Store extraction pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Factory pattern (Recommended) | createTimelineStore(storage) — stores accept storage adapter | ✓ |
| Adapter at integration | Store code stays as-is, each platform wraps with persist middleware | |

**User's choice:** Factory pattern
**Notes:** None

### WebSocket/API client config

| Option | Description | Selected |
|--------|-------------|----------|
| Constructor config object | Explicit deps, fully testable, no global state | |
| Global configure() | Simpler API, matches existing web app pattern | |
| You decide | Claude picks the pattern | ✓ |

**User's choice:** You decide (Claude's discretion)
**Notes:** None

### Web regression testing

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit gate (Recommended) | Dedicated task: run vitest + vite build + verify zero diffs | ✓ |
| Implicit (CI only) | Tests pass naturally, no dedicated step | |

**User's choice:** Explicit gate
**Notes:** None

### Additional shared code topics (user-requested)

**Testing shared code:** Shared/ gets its own test suite. Tests move with the extracted code.

**Auth/token handling:** AuthProvider interface abstraction. Web = localStorage, native = iOS Keychain (expo-secure-store).

**Streaming logic:** Stream multiplexer transfers (callback-based). rAF + DOM mutation renderer stays in web. Native streaming renderer is Phase 69 scope.

---

## Soul Doc Process & Depth

### swd involvement level

| Option | Description | Selected |
|--------|-------------|----------|
| Review & approve | Bard + Claude produce, swd reviews output | |
| Hands-on collaboration | swd participates in creative process | |
| Drive it yourself | swd writes core direction | |

**User's choice:** (Free text) "While I have a general vision, it's very hard to vocalize or put into a doc myself. Envisioning essentially a copy of ChatGPT/Claude's app, but with much more dynamic interfaces, things moving, nice animations, beautiful color palettes, native support for all features like git, file browser, monitoring."
**Notes:** Resolved to Bard leads creative, Claude formalizes, swd reviews & approves.

### Document format

| Option | Description | Selected |
|--------|-------------|----------|
| Written specs + reference screenshots (Recommended) | 3-5 page markdown, annotated screenshots from reference apps | ✓ |
| Written specs + Bard mockup renders | Above + AI-generated visual mockups | |
| Minimal: principles + reference collage | 1-2 page, relies on implementer judgment | |

**User's choice:** Written specs + reference screenshots
**Notes:** None

### Screen coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Core screens only (Recommended) | 6 screens covering Phases 69-72 | |
| All v3.0 screens | All screens through Phase 73 | ✓ |
| Just the chat experience | Session list + chat + composer only | |

**User's choice:** All v3.0 screens
**Notes:** None

### Time budget

| Option | Description | Selected |
|--------|-------------|----------|
| 1 plan (~1 session) | Fast but shallow on elevation | |
| 2 plans (~2 sessions) (Recommended) | Bard analysis + doc synthesis with review between | ✓ |
| 3+ plans | Deep design phase, risks design paralysis | |

**User's choice:** 2 plans
**Notes:** None

### Elevation direction

| Option | Description | Selected |
|--------|-------------|----------|
| Motion & spring physics | Movement-focused: springs, bounces, breathing | |
| Depth & glass surfaces | Spatial: blur, shadows, translucency, floating | |
| Dynamic color & ambient effects | Emotional: warm/cool shifts, aurora effects | |
| All of the above | All three layers applied contextually | ✓ |

**User's choice:** All of the above
**Notes:** Motion for interactions, depth for structure, color for mood

---

## Repo Coexistence Strategy

### Coexistence approach

| Option | Description | Selected |
|--------|-------------|----------|
| Plain directory imports (Recommended) | Relative paths, no monorepo tooling | |
| npm workspaces | Root declares workspaces, shared deps hoisted | ✓ |
| Turborepo + workspaces | Full monorepo tooling, cached builds | |

**User's choice:** npm workspaces (chose clean/organized over simple)
**Notes:** User asked "what's the cleanest solution, if it's more organized and will help us work better, let's go for it." Bard had recommended plain imports but user preferred organization. Fallback to plain imports if Metro has issues.

---

## Apple Developer Enrollment

### Enrollment status

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, already enrolled | Ready for APNs certs | |
| No, need to enroll | 24-48hr verification needed | ✓ |
| Not sure | Need to check | |

**User's choice:** Not enrolled, need to start
**Notes:** None

### Handling the 24-48hr wait

| Option | Description | Selected |
|--------|-------------|----------|
| Enroll now, scaffold in parallel (Recommended) | Start today, SCAFF-05 last task | ✓ |
| Defer SCAFF-05 to Phase 68.1 | Ship without push certs | |

**User's choice:** Enroll now, parallel
**Notes:** None

### Account type

| Option | Description | Selected |
|--------|-------------|----------|
| Personal ($99/year) | Individual account, simplest enrollment | ✓ |
| Organization | Requires D-U-N-S, longer process | |

**User's choice:** Personal
**Notes:** None

---

## EAS Build Strategy

### Mac availability

| Option | Description | Selected |
|--------|-------------|----------|

**User's choice:** (Free text) "MacBook M1 Pro available occasionally, about 70% of the time won't have access"
**Notes:** EAS cloud builds primary, local Xcode builds when MacBook available (~30%)

### Build profile

| Option | Description | Selected |
|--------|-------------|----------|
| Development build (Recommended) | Standalone app with Expo Dev Client, hot reload | ✓ |
| Simulator build first, device later | Faster initial setup, misses real device testing | |

**User's choice:** Development build
**Notes:** None

---

## NativeWind Validation Scope

### Validation components

| Option | Description | Selected |
|--------|-------------|----------|
| Design system primitives (Recommended) | 4-5 foundation components: surface, text, button, list item, glass | ✓ |
| One real screen | Simplified session list or chat screen | |
| Just a test screen | Colored boxes and text at various sizes | |

**User's choice:** Design system primitives
**Notes:** None

### Token source

| Option | Description | Selected |
|--------|-------------|----------|
| Web tokens as starting point | OKLCH colors, Inter/JetBrains Mono as defaults | |
| Wait for Soul doc | Build after Soul doc locks design | |
| Parallel: web tokens now, Soul doc overrides later | Validate pipeline now, apply design later | ✓ |

**User's choice:** Parallel approach
**Notes:** None

---

## Expo Router Structure

### Navigation architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Drawer + Stack (Recommended) | Sidebar drawer root, stack for chat. Matches ChatGPT/Claude iOS. | ✓ |
| Stack-only with modal drawer | Single stack, drawer as overlay | |
| Defer to Soul doc | Let design dictate navigation | |

**User's choice:** Drawer + Stack
**Notes:** None

### Route scaffolding scope

| Option | Description | Selected |
|--------|-------------|----------|
| All v3.0 routes as placeholders (Recommended) | Empty screens for all routes | ✓ |
| Minimum viable routes | Just root + one placeholder | |

**User's choice:** All v3.0 routes
**Notes:** None

---

## Dev Workflow & Tooling

### Device connection

| Option | Description | Selected |
|--------|-------------|----------|
| Tailscale (Recommended) | Metro on Linux, Dev Client on iPhone, Tailscale IP | ✓ |
| Local WiFi | Same network connectivity | |
| USB + Mac tunnel | Through MacBook when available | |

**User's choice:** Tailscale
**Notes:** Same pattern as web app (100.86.4.57)

### Debugging

| Option | Description | Selected |
|--------|-------------|----------|
| Console logs + React DevTools | Standard, works from Linux | ✓ |
| Flipper | More powerful, requires desktop app | |
| You decide | Claude picks based on Expo SDK 55 support | |

**User's choice:** Console logs + React DevTools
**Notes:** None

---

## Claude's Discretion

- WebSocket/API client configuration pattern (constructor injection vs global configure)

## Deferred Ideas

None — discussion stayed within phase scope
