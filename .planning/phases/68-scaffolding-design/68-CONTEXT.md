# Phase 68: Scaffolding & Design - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver TWO outcomes: (1) a working Expo dev build installed on iPhone 16 Pro Max with shared business logic imported from both Vite and Metro, and (2) a Native App Soul document that locks the visual direction for all v3.0 phases. Phase 69 CANNOT start until the Soul doc is approved by swd.

</domain>

<decisions>
## Implementation Decisions

### Shared Code Extraction
- **D-01:** Full extraction to `shared/` (~20 files): types, Zustand store factories, API client, WebSocket client, stream multiplexer, tool registry
- **D-02:** Factory pattern for Zustand stores — `createTimelineStore(storageAdapter)`. Web passes localStorage, native passes MMKV. Each store becomes a factory function accepting a storage adapter.
- **D-03:** Auth abstracted via `AuthProvider` interface: `getToken()`, `setToken()`, `clearToken()`. Web implements with localStorage, native with iOS Keychain (`expo-secure-store`). API client and WebSocket client accept AuthProvider, not concrete storage.
- **D-04:** `shared/` gets its own test suite. Existing tests from `src/src/lib/` and `src/src/stores/` move with the code. Running tests in shared/ proves code works in isolation from either platform.
- **D-05:** Stream multiplexer transfers as-is (callback-based, zero DOM deps). The rAF + DOM mutation streaming renderer stays in `src/` (web-only). Native streaming renderer is Phase 69 scope.
- **D-06:** Explicit web regression gate: `vitest` full suite + `vite build` verification as Phase 68 exit criteria. Documented proof extraction didn't break the web app.

### Claude's Discretion
- WebSocket and API client configuration pattern (constructor injection vs global configure) — Claude picks what fits the existing code best during extraction

### Native App Soul Document
- **D-07:** Bard leads creative exploration, Claude formalizes into document, swd reviews and approves. swd reacts to proposals rather than writing from scratch.
- **D-08:** Format: written specs (3-5 page markdown) + annotated reference screenshots from ChatGPT iOS and Claude iOS. No Figma mockups.
- **D-09:** All v3.0 screens covered: session list, chat thread, composer, tool cards, permission request, sidebar drawer, settings, share sheet, notification UI, code block detail, search, pinned sessions
- **D-10:** 2 plans budgeted for Soul doc. Plan 1: Bard analyzes reference apps + proposes direction. Plan 2: Claude formalizes doc + swd reviews between sessions.
- **D-11:** Elevation direction: motion (spring physics on interactions) + depth/glass (layered surfaces with blur/shadows) + dynamic color (ambient shifts based on context). All three layers, applied contextually. Motion for interactions, depth for structure, color for mood.
- **D-12:** swd's vision: "essentially a copy of ChatGPT/Claude's app, but with much more dynamic interfaces — things moving, nice animations, beautiful color palettes, native support for all Loom features (git, file browser, monitoring)."

### Repo Structure
- **D-13:** npm workspaces from day 1. Root package.json declares workspaces for src/, mobile/, shared/, server/. Fallback to plain directory imports if Metro has issues.
- **D-14:** NativeWind v4 uses Tailwind v3 syntax (web uses Tailwind v4). No shared styling code — only logic shares via `shared/`.

### Apple Developer Enrollment
- **D-15:** Personal Apple Developer account ($99/year). Enrollment starts immediately (before Phase 68 code begins).
- **D-16:** SCAFF-05 (APNs push certs) is Phase 68's last task, gated on enrollment clearing. Scaffolding proceeds in parallel.

### EAS Build Strategy
- **D-17:** Development build profile (standalone app with Expo Dev Client). Connects to Metro bundler over Tailscale network.
- **D-18:** MacBook M1 Pro available ~30% of the time for local Xcode builds. EAS cloud builds are the primary path (8-15 min cycles). Most day-to-day development is JS hot reload (instant).

### NativeWind Validation
- **D-19:** Build 4-5 design system primitives: surface/card with depth, text hierarchy (heading/body/caption), button with states, list item, glass/blur surface. These validate typography, color, spacing, depth, and blur.
- **D-20:** Start with web app's OKLCH tokens and typography (Inter/JetBrains Mono) as baseline. Soul doc overrides the actual values when finalized. Parallel approach: validate pipeline now, apply design later.

### Expo Router
- **D-21:** Drawer + Stack navigation architecture. Sidebar drawer (session list) as root navigator, stack for chat screens. Matches ChatGPT/Claude iOS pattern.
- **D-22:** All v3.0 routes scaffolded as placeholders: session list, chat, settings, notifications, share. Each is a title + back button. Proves routing works and gives Phase 69+ clear starting points.

### Dev Workflow
- **D-23:** Expo Dev Client connects to Metro bundler on Linux server (100.86.4.57) over Tailscale. Same networking pattern as the web app.
- **D-24:** Debugging: console logs + React DevTools connected over network. No Flipper dependency.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Strategic Direction
- `.planning/ROADMAP.md` — Phase 68-73 definitions, success criteria, known risks
- `.planning/REQUIREMENTS.md` — SCAFF-01 through SCAFF-06 acceptance criteria
- `.planning/PROJECT.md` — Core value, architecture, constraints, key decisions

### Prior Research (Capacitor/iOS)
- `.planning/phases/67.1-ios-bug-fixes/PLATFORM-RESEARCH.md` — Competitor architecture analysis (ChatGPT, Claude, Discord — why they avoid WKWebView)
- `.planning/phases/67.1-ios-bug-fixes/LIBRARY-RESEARCH.md` — React Native component library ecosystem survey

### Design Vision
- `.planning/PROJECT_SOUL.md` — Original north star aesthetic vision (web app)
- `.planning/M3-POLISH-DEFERRED-CONTEXT.md` — Visual polish research (aurora, WebGL, grainient — useful for elevation layer)

### Constitution & Conventions
- `.planning/V2_CONSTITUTION.md` — Enforceable coding conventions (some transfer to native, some don't)

### Existing Shared Code
- `shared/modelConstants.js` — Already exists, will be expanded
- `src/src/stores/` — 5 Zustand stores (connection, file, stream, timeline, ui) — extraction source
- `src/src/lib/websocket-client.ts` — WebSocket client to extract
- `src/src/lib/api-client.ts` — API client to extract
- `src/src/lib/stream-multiplexer.ts` — Stream multiplexer to extract
- `src/src/lib/tool-registry.ts` — Tool registry to extract
- `src/src/lib/auth.ts` — Auth module to refactor with AuthProvider interface
- `src/src/types/` — 13 type files to extract

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 5 Zustand stores (`connection.ts`, `file.ts`, `stream.ts`, `timeline.ts`, `ui.ts`) — need factory refactor for cross-platform storage
- WebSocket client (`websocket-client.ts`) — needs URL resolver injection
- API client (`api-client.ts`) — needs configurable base URL
- Stream multiplexer (`stream-multiplexer.ts`) — callback-based, transfers as-is
- Tool registry (`tool-registry.ts`) — pluggable Map pattern, transfers as-is
- 13 type files in `src/src/types/` — platform-independent, transfer as-is
- Auth module (`auth.ts`) — needs AuthProvider interface refactor

### Established Patterns
- Zustand stores use `persist` middleware with localStorage — must become adapter-based
- WebSocket client uses `platform.ts` for URL resolution — must accept resolver injection
- Stream multiplexer is pure callback-based with zero DOM/React deps — ideal for sharing
- Tool registry uses Map pattern with pluggable tool handlers — platform-independent

### Integration Points
- Backend (port 5555) is platform-agnostic — WebSocket + REST API unchanged
- Native app connects to same backend over Tailscale (100.86.4.57:5555)
- Expo Dev Client connects to Metro bundler on Linux server over Tailscale
- npm workspaces at repo root coordinates shared/, src/, mobile/, server/

</code_context>

<specifics>
## Specific Ideas

- swd's vision for the native app: "essentially a copy of ChatGPT/Claude's app, but with much more dynamic interfaces — things moving, nice animations, beautiful color palettes, native support for all Loom features like git, file browser, monitoring"
- The web app's design evolved across 50+ phases and still feels flat. The native app's design must be cohesive from the start — design before code, not polish after.
- Prior frustration: implementations are "too flat, too big, too web-like." The Soul doc must explicitly define what makes Loom's native app feel alive vs static.
- Elevation layer: motion (spring physics on every interaction) + depth (glass surfaces, shadows, blur) + dynamic color (ambient shifts based on conversation context)
- Reference app analysis (ChatGPT iOS + Claude iOS) is the foundation — measure, don't guess

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:**
- Expo scaffolding works, EAS Build succeeds, dev build installs on iPhone
- Shared code compiles, both Vite and Metro resolve imports
- NativeWind styling works on primitives
- Web app builds with zero regressions

**Exceptional:**
- Shared code is **self-documenting** — another developer can read `shared/types/` and understand the data model without consulting the web app
- **Zustand store factories are validated** with tests proving the same store code works with localStorage (web) and MMKV (mobile) without modification
- **Native App Soul document is concrete** — not just principles, but: "Button press = light haptic + 200ms spring with damping 0.8", annotated ChatGPT/Claude screenshots with callouts, explicit anti-patterns list
- **One prototype component built and tested on device** — a simple message cell (Text + timestamp) proving the design-to-code pipeline works
- **Phase 69 is fully unblocked** — exits with explicit checklist: "Here are the imports, here's the design direction, here's the reference app comparison"

</quality_bar>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 68-scaffolding-design*
*Context gathered: 2026-03-31*
