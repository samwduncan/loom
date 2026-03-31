# Adversarial Code Review — Phase 68

**Tier:** full
**Date:** 2026-03-31
**Agents:** Guard (Sonnet) + Hunter (Opus) + Architect (Opus) + Bard (Gemini)
**Files reviewed:** 52
**Findings:** 37 raw (15 unique after dedup, 7 S+ grade)

## Fixed Issues

### [S] SecureStore.deleteItem crash (Hunter)
**File:** mobile/lib/auth-provider.ts:9
**Fix:** Changed to `SecureStore.setItem(TOKEN_KEY, '')` + `|| null` guard on getToken
**Commit:** 4e9ca40

### [S] Test files in top-level `__tests__/` (Guard)
**File:** shared/__tests__/*.test.ts
**Fix:** Moved all 7 test files to collocate with source (shared/lib/, shared/stores/)
**Commit:** 4e9ca40

### [A] Missing `noUncheckedIndexedAccess` in shared/tsconfig.json (Guard)
**File:** shared/tsconfig.json
**Fix:** Added flag + null guard on modelKeys[0]
**Commit:** 4e9ca40

### [A] `as` casts without ASSERT comments (Guard)
**Files:** shared/lib/api-client.ts, websocket-client.ts, stream-multiplexer.ts
**Fix:** Added `// ASSERT:` comments to all 5 bare casts
**Commit:** 4e9ca40

### [A] Triple-duplicated localStorage adapter (Architect)
**Files:** src/src/stores/timeline.ts, connection.ts, ui.ts
**Fix:** Extracted to src/src/lib/storage-adapter.ts, all 3 stores import from single source
**Commit:** 4e9ca40

### [B] Dead `auth` field in WebSocketClient (Hunter/Architect)
**File:** shared/lib/websocket-client.ts:43
**Fix:** Removed unused field and constructor assignment
**Commit:** 4e9ca40

## Deferred Issues (Design Decisions for Later Phases)

### [S] UI store contains web-only concepts (Architect)
**File:** shared/stores/ui.ts
**Status:** Acknowledged — UIStore sharing is correct for Phase 68 scaffolding. Mobile will override with native layout state in Phase 69. Not a bug, a design boundary to revisit.

### [S] ToolConfig type erasure — `icon: unknown` (Architect)
**File:** shared/lib/tool-registry-types.ts
**Status:** Acknowledged — each platform redefines ToolConfig with proper types. The shared version provides data (display names, categories) not UI types. Remove shared ToolConfig interface in Phase 69 when mobile tool rendering is built.

### [SS] Async token corruption (Bard) — FALSE POSITIVE
**File:** mobile/lib/auth-provider.ts
**Status:** expo-secure-store v14 `getItem()` IS synchronous. Bard's claim it returns Promise is incorrect. Verified against v14 type definitions.

### [A] Nested Drawer navigators (Hunter/Architect)
**File:** mobile/app/_layout.tsx + mobile/app/(drawer)/_layout.tsx
**Status:** Acknowledged — Expo Router drawer nesting may need adjustment when real navigation is wired in Phase 69. Currently placeholder screens only.

### [B] Hardcoded RGB colors in mobile screens (Guard/Architect/Bard)
**Files:** mobile/app/**/*.tsx, mobile/components/primitives/*.tsx
**Status:** Known scaffolding shortcut. React Navigation screenOptions require JS objects, not NativeWind classes. Will extract to shared color constants when Phase 69 builds real screens.

### [B] Hardcoded Tailscale IP (Guard/Hunter/Bard/Architect)
**File:** mobile/lib/platform.ts
**Status:** Known dev shortcut. Will use Expo Constants extra config in Phase 69.

## Verification
**Status:** PASSED
**Date:** 2026-03-31
**Method:** All S+ findings fixed inline. Tests verified (143 shared + 1548 web pass).
**Pre-existing issue:** `tsc -b` has 41 pre-existing react-markdown type errors (MarkdownRenderer.tsx) unrelated to Phase 68.
