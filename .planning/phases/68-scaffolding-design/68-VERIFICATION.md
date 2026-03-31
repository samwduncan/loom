---
phase: 68-scaffolding-design
verified: 2026-03-31T15:30:00Z
status: gaps_found
score: 5/6 must-haves verified
gaps:
  - truth: "Apple Developer Program enrolled with APNs push notification certificates configured"
    status: failed
    reason: "SCAFF-05 is explicitly incomplete. Both tasks in Plan 07 are human-action checkpoints left undone. Enrollment status unknown, APNs key not created, EAS projectId still 'TBD_AFTER_EAS_INIT' in app.json."
    artifacts:
      - path: "mobile/app.json"
        issue: "projectId is 'TBD_AFTER_EAS_INIT' -- eas init has not been run"
    missing:
      - "Run 'eas login && eas init' to get real projectId, update mobile/app.json"
      - "Verify Apple Developer Program enrollment at developer.apple.com/account (must show Active)"
      - "Create APNs .p8 key at developer.apple.com > Certificates, Identifiers & Profiles > Keys"
      - "Upload APNs key to Expo project credentials at expo.dev"
      - "Verify with: cd mobile && eas credentials"
human_verification:
  - test: "EAS dev build installs and runs on iPhone 16 Pro Max"
    expected: "Dark background renders, drawer opens from left edge with 'Loom' and 'Settings', Metro bundler connects via Tailscale, hot reload works"
    why_human: "Requires physical device, EAS cloud build, and Apple Developer enrollment to complete"
  - test: "NativeWind design primitives render correctly on device"
    expected: "All 5 primitives (SurfaceCard, TextHierarchy, Button, ListItem, GlassSurface) match design spec: shadow/elevation on cards, 44px+ button targets, press states, blur effect on GlassSurface"
    why_human: "NativeWind rendering on physical iOS device cannot be verified programmatically"
  - test: "swd approval of Native App Soul document"
    expected: "swd reads .planning/NATIVE-APP-SOUL.md and confirms it gates Phase 69 start"
    why_human: "Design approval is a human judgment call; auto-approved checkpoint in summary is not genuine swd review"
---

# Phase 68: Scaffolding & Design Verification Report

**Phase Goal:** Developer has a working Expo dev build on iPhone 16 Pro Max with shared business logic, AND the visual direction is locked via a Native App Soul document before any UI code
**Verified:** 2026-03-31T15:30:00Z
**Status:** gaps_found (1 gap, 3 human verifications needed)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Developer can run `eas build --profile development` and install on iPhone 16 Pro Max | ? UNCERTAIN | Code scaffold complete, EAS config exists, BUT projectId is TBD stub and Apple Developer enrollment unconfirmed — needs human device verification |
| 2 | A test screen imports types and a Zustand store factory from `shared/` and renders data correctly on device | ? UNCERTAIN | Code wiring verified (mobile/stores/index.ts imports createTimelineStore, design-primitives screen exists) — device rendering needs human verification |
| 3 | Existing web app at `src/` builds and runs identically (zero regressions) | ✓ VERIFIED | 1548/1548 web tests pass, vite build exits 0, @loom/shared alias wired in vite.config.ts |
| 4 | NativeWind styling renders correctly on device | ? UNCERTAIN | tailwind.config.js token set verified, 5 primitives exist with correct classes — device rendering needs human |
| 5 | Apple Developer Program enrolled with APNs push notification certificates configured | ✗ FAILED | SCAFF-05 explicitly incomplete. Checklist created but human actions not performed. projectId still "TBD_AFTER_EAS_INIT". |
| 6 | Native App Soul document written and approved by swd | ? UNCERTAIN | .planning/NATIVE-APP-SOUL.md exists (626 lines, 38 sections), but swd approval checkpoint was auto-approved in parallel execution mode — not a genuine swd review |

**Score:** 1/6 fully verified (Truth 3). Truths 1, 2, 4 have solid code backing but need device testing. Truth 5 is a hard gap. Truth 6 needs genuine swd sign-off.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `shared/package.json` | @loom/shared package definition | ✓ VERIFIED | Contains `"name": "@loom/shared"`, zustand/immer as peerDeps |
| `shared/index.ts` | Barrel export for all shared code | ✓ VERIFIED | Exports all 13 type files and 5 store factories |
| `shared/stores/timeline.ts` | Timeline store factory | ✓ VERIFIED | `createTimelineStore(storage: StateStorage)` factory, 210 lines |
| `shared/stores/stream.ts` | Stream store factory | ✓ VERIFIED | `createStreamStore()` factory |
| `shared/stores/connection.ts` | Connection store factory | ✓ VERIFIED | `createConnectionStore(storage: StateStorage)` factory |
| `shared/stores/ui.ts` | UI store factory | ✓ VERIFIED | `createUIStore(storage: StateStorage)` factory |
| `shared/stores/file.ts` | File store factory | ✓ VERIFIED | `createFileStore()` factory |
| `shared/lib/auth.ts` | AuthProvider interface | ✓ VERIFIED | `export interface AuthProvider { getToken, setToken, clearToken }` |
| `shared/lib/api-client.ts` | API client factory | ✓ VERIFIED | `createApiClient({ auth, resolveUrl, onAuthRefresh })` factory |
| `shared/lib/websocket-client.ts` | WebSocket client | ✓ VERIFIED | Constructor accepts `{ resolveWsUrl, auth }`, 100+ lines |
| `shared/lib/stream-multiplexer.ts` | Stream multiplexer | ✓ VERIFIED | Zero DOM dependencies, copied from src/ |
| `shared/lib/tool-registry-types.ts` | Tool registry types | ✓ VERIFIED | Contains `ToolConfig` interface, no lucide-react imports |
| `shared/vitest.config.ts` | Shared test config | ✓ VERIFIED | `environment: 'node'`, `include: ['**/*.test.ts']` |
| `mobile/package.json` | Expo app package | ✓ VERIFIED | Contains `@loom/shared: "*"`, all Expo deps present |
| `mobile/app/_layout.tsx` | Root Drawer layout | ✓ VERIFIED | Imports `global.css`, `GestureHandlerRootView`, renders `Drawer` |
| `mobile/app/(drawer)/index.tsx` | Session list placeholder | ✓ VERIFIED | Contains "No sessions yet", "View Design Primitives" button |
| `mobile/app/(stack)/chat/[id].tsx` | Chat screen placeholder | ✓ VERIFIED | Exists at mobile/app/(stack)/chat/[id].tsx |
| `mobile/stores/index.ts` | Native store instances | ✓ VERIFIED | Imports all 5 factories from @loom/shared, exports hooks |
| `mobile/eas.json` | EAS Build config | ✓ VERIFIED | Contains `development` and `development-simulator` profiles |
| `mobile/tailwind.config.js` | NativeWind theme tokens | ✓ VERIFIED | surface/accent/text/border tokens from UI-SPEC |
| `mobile/components/primitives/SurfaceCard.tsx` | SurfaceCard component | ✓ VERIFIED | `bg-surface-raised`, `border-border-subtle`, `rounded-xl`, iOS shadow |
| `mobile/components/primitives/Button.tsx` | Button with 44px target | ✓ VERIFIED | `min-h-[44px]`, `bg-accent`, press opacity state |
| `mobile/components/primitives/GlassSurface.tsx` | Blur surface | ✓ VERIFIED | Imports and renders `BlurView` from expo-blur with intensity 40 |
| `mobile/app/(stack)/design-primitives.tsx` | Design test screen | ✓ VERIFIED | Heading "Design Primitives", imports all 5 primitives |
| `.planning/NATIVE-APP-SOUL.md` | Authoritative visual contract | ✓ VERIFIED | 626 lines, 38 sections, contains spring physics tables, all 12 screens, anti-patterns, "supersedes 68-UI-SPEC.md" header |
| `mobile/app.json` | Expo app config | ⚠️ STUB | `"projectId": "TBD_AFTER_EAS_INIT"` — eas init has not been run |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `shared/stores/timeline.ts` | `shared/types/session.ts` | `import.*Session.*from` | ✓ WIRED | Relative import in store file |
| `shared/stores/stream.ts` | `shared/types/stream.ts` | `import.*ThinkingState.*from` | ✓ WIRED | Relative import in store file |
| `package.json` | `shared/` | workspaces array | ✓ WIRED | `"workspaces": ["src", "mobile", "shared"]` |
| `src/src/stores/timeline.ts` | `shared/stores/timeline.ts` | `import { createTimelineStore }` | ✓ WIRED | `from '@loom/shared/stores/timeline'` confirmed |
| `src/src/lib/auth.ts` | `shared/lib/auth.ts` | `import type { AuthProvider }` | ✓ WIRED | Web lib imports from @loom/shared |
| `src/vite.config.ts` | `shared/` | `resolve.alias @loom/shared` | ✓ WIRED | `path.resolve(__dirname, '../shared')` present |
| `mobile/stores/index.ts` | `shared/stores/timeline.ts` | `import { createTimelineStore }` | ✓ WIRED | All 5 factories imported from @loom/shared |
| `mobile/lib/storage-adapter.ts` | `react-native-mmkv` | MMKV instance | ✓ WIRED | `import { MMKV }` + `new MMKV()` |
| `mobile/lib/auth-provider.ts` | `expo-secure-store` | SecureStore | ✓ WIRED | `import * as SecureStore from 'expo-secure-store'` |
| `mobile/components/primitives/SurfaceCard.tsx` | `mobile/tailwind.config.js` | NativeWind className | ✓ WIRED | `bg-surface-raised` resolves from config |
| `mobile/components/primitives/GlassSurface.tsx` | `expo-blur` | BlurView component | ✓ WIRED | `import { BlurView } from 'expo-blur'` |
| `.planning/NATIVE-APP-SOUL.md` | `68-UI-SPEC.md` | Supersedes statement | ✓ WIRED | "supersedes 68-UI-SPEC.md baseline values where they conflict" in document header |
| `mobile/app.json` | EAS projectId | eas init | ✗ NOT_WIRED | `"projectId": "TBD_AFTER_EAS_INIT"` — eas init never run |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| shared/ vitest suite passes | `npm run test:shared` | 7 test files, 143 tests passed | ✓ PASS |
| Web vitest suite passes (zero regressions) | `cd src && npx vitest run` | 149 test files, 1548 tests passed | ✓ PASS |
| Web vite production build succeeds | `cd src && npx vite build` | Built in 4.99s, exit 0 | ✓ PASS |
| @loom/shared workspace resolves | `npm ls @loom/shared` | `@loom/shared@0.0.1 -> ./shared` shown for both root and mobile | ✓ PASS |
| EAS dev build on device | requires cloud build + device | Cannot test programmatically | ? SKIP |
| NativeWind renders on device | requires physical iOS device | Cannot test programmatically | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCAFF-01 | 68-03 | Developer can build and install Expo dev build on iPhone 16 Pro Max | ? UNCERTAIN | Code scaffold complete; EAS projectId stub; actual device build/install is human-action |
| SCAFF-02 | 68-01, 68-02 | shared/ directory with types, store factories, WebSocket client, stream multiplexer, API client | ✓ SATISFIED | 13 types, 5 store factories, 5 lib modules all present and tested |
| SCAFF-03 | 68-03 | Native app (mobile/) with Expo Router, coexists with web (src/) | ✓ SATISFIED | mobile/ created with Drawer+Stack routing, web app unmodified, 1548 web tests pass |
| SCAFF-04 | 68-01, 68-02 | Both Vite and Metro resolve shared/ imports; web builds with zero regressions | ✓ SATISFIED | Vite alias configured, web build exits 0, 1548 tests pass |
| SCAFF-05 | 68-07 | Apple Developer Program enrolled with APNs certificates | ✗ BLOCKED | Plan 07 tasks are human-action checkpoints — neither completed. EAS projectId still TBD. |
| SCAFF-06 | 68-04 | NativeWind v4 configured with representative styling validated on device | ? UNCERTAIN | tailwind.config.js and 5 primitives verified in code; device rendering needs human verification |

**Orphaned requirements check:** REQUIREMENTS.md maps SCAFF-01 through SCAFF-06 to Phase 68. All six appear in plan frontmatter. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `mobile/app.json` | 24 | `"projectId": "TBD_AFTER_EAS_INIT"` | 🛑 Blocker | EAS build will fail until real projectId is set via `eas init` |
| `mobile/lib/auth-provider.ts` | 9 | `clearToken: () => { SecureStore.setItem(TOKEN_KEY, ''); }` | ⚠️ Warning | Plan specified `SecureStore.deleteItem()` (synchronous), but that API does not exist in expo-secure-store 14.x (only `deleteItemAsync`). The implemented fallback sets key to empty string, which differs from deletion: `getToken()` returns `'' || null` = `null` due to the `|| null` guard, so it is functionally correct but leaves a stale empty key rather than removing it. Low risk but semantically imprecise. |
| `shared/stores/*.test.ts`, `shared/lib/*.test.ts` | — | Test files are co-located in stores/ and lib/ directories (not `shared/__tests__/`) | ℹ️ Info | PLAN frontmatter and SUMMARY both claim `shared/__tests__/` location, but actual files are in `shared/stores/` and `shared/lib/`. The vitest config uses `include: ['**/*.test.ts']` so tests run correctly regardless. Functional non-issue, documentation inconsistency only. |

### Human Verification Required

#### 1. EAS Dev Build Installs and Runs on iPhone 16 Pro Max

**Test:**
1. Run `cd mobile && eas login` (Expo account auth)
2. Run `cd mobile && eas init` to link project and generate real projectId
3. Update `mobile/app.json` with real projectId from step 2
4. Register device: `eas device:create` (follow UDID prompts for iPhone 16 Pro Max)
5. Run `cd mobile && eas build --profile development --platform ios` (8-15 min cloud build)
6. Install via EAS build download link on device
7. Start Metro: `cd mobile && REACT_NATIVE_PACKAGER_HOSTNAME=100.86.4.57 npx expo start --dev-client`

**Expected:** Dark background (rgb(46, 42, 40)) renders, drawer opens from left edge with "Loom" and "Settings" items, settings placeholder shows "Server and model configuration -- Phase 70", hot reload works over Tailscale
**Why human:** Requires physical device, EAS cloud build, and Expo account authentication

#### 2. NativeWind Design Primitives Render Correctly on Device

**Test:**
1. After EAS build is running, navigate to session list placeholder
2. Tap "View Design Primitives" button
3. Visually inspect each primitive section against design spec

**Expected:**
- Typography: heading ~17px/semibold, body ~15px/regular, code in monospace
- SurfaceCard: visible shadow/elevation, raised background, subtle border
- Buttons: accent color (rgb(196, 108, 88)), 44px+ tappable, press opacity 0.7, disabled faded
- ListItems: press color shift to surface-raised, chevron visible, bottom border
- GlassSurface: blur effect renders, dark tint, content readable
- Surface palette: 4 progressive lightness levels visible

**Why human:** NativeWind className rendering on physical iOS cannot be verified programmatically

#### 3. swd Approves Native App Soul Document

**Test:**
1. Read `.planning/NATIVE-APP-SOUL.md`
2. Verify all 12 screens have actionable specs
3. Verify spring physics values (Damping/Stiffness/Mass table at line ~59)
4. Verify 15 anti-patterns are enforceable
5. Confirm document is sufficient for Phase 69 executor to build without ambiguity

**Expected:** Document approved as the visual authority for Phases 69-73; Phase 69 unblocked
**Why human:** Auto-approval in Plan 06 was a parallel executor shortcut — genuine swd design review needed before Phase 69 begins

### Gaps Summary

**1 hard gap (SCAFF-05):** Apple Developer enrollment and APNs configuration are external actions that were never performed. The Plan 07 executor created a checklist document and marked both tasks as "human-action pending." The EAS projectId in `mobile/app.json` remains the placeholder `"TBD_AFTER_EAS_INIT"`, confirming `eas init` was never run. This directly blocks EAS builds for physical device testing.

**1 code deviation (auth-provider clearToken):** The `clearToken()` implementation sets the SecureStore key to an empty string instead of deleting it, because `SecureStore.deleteItem()` does not exist in expo-secure-store 14.x (only `deleteItemAsync`). The `|| null` guard in `getToken()` makes this functionally equivalent for most callers, but it is semantically imprecise and could cause issues if a consumer checks key existence rather than value. This is a warning-level finding, not a blocker for Phase 69.

**3 items need human verification:** EAS build on device (SCAFF-01), NativeWind on device (SCAFF-06), and Soul document swd approval (Phase 68 design gate). The code supporting all three is complete and correct — only physical device testing and human sign-off are missing.

The phase goal is **substantially achieved** at the code level. The shared/ extraction, web app regression gate (1548 tests, vite build), mobile scaffold, 5 design primitives, and Soul document all exist and are verified. The remaining work is human-action items: Apple Developer enrollment (SCAFF-05) and device validation.

---

_Verified: 2026-03-31T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
