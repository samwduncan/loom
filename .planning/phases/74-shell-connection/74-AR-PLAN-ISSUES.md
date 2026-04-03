# Adversarial Plan Review — Phase 74

**Tier:** max
**Date:** 2026-04-03
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus), Bard (Gemini), Cody (Codex)
**Findings:** 7 S+ grade (cross-validated)

## S+ Issues (Must Fix)

### [S] CONN-06 requirement misattribution — Plan 04 claims CONN-06 but REQUIREMENTS.md assigns it to Phase 77
**Source:** Guard (SSS), Hunter (S), Architect (SS) | **Confidence:** High
**Plan:** 74-04
**Description:** Plan 04's requirements frontmatter lists CONN-06 and its objective says it delivers CONN-06. But REQUIREMENTS.md maps CONN-06 to Phase 77, and the ROADMAP Phase 74 scope omits CONN-06. Task 2 verifies pre-existing D-14 code but doesn't fully deliver the requirement (no UI indicator for interrupted streams).
**Suggested fix:** Remove CONN-06 from Plan 04 requirements frontmatter. Keep Task 2 as "verify D-14 data layer prerequisite for CONN-06 (Phase 77)" without claiming requirement delivery.

### [S] Server URL field is cosmetic — user-entered value silently discarded
**Source:** Guard (SS), Hunter (S), Architect (S) | **Confidence:** High
**Plan:** 74-02
**Description:** Auth screen has editable server URL field pre-filled with `100.86.4.57:5555`, but the actual API_BASE is hardcoded in `platform.ts` as `samsara.tailad2401.ts.net:5555`. Whatever the user types is ignored. Misleading for a developer-tool UX (D-05).
**Suggested fix:** Make the field `editable={false}` with visual disabled state showing the actual server URL. Or wire the entered URL into the auth flow. Option (a) is simpler and honest.

### [S] Drawer spring config commented but not actually applied
**Source:** Guard (S), Cody (SS) | **Confidence:** High
**Plan:** 74-03
**Description:** Plan 03 has a comment saying spring config is applied "via the drawer's animation config" but no `drawerAnimationSpec` or `gestureHandlerProps` is actually set. `@react-navigation/drawer` v7 uses timing animation by default, not spring. D-09 requires damping 20, stiffness 100 which is never configured.
**Suggested fix:** Add `drawerAnimationSpec` to screenOptions with explicit spring config: `{ open: { animation: 'spring', config: { damping: 20, stiffness: 100, mass: 1.0 } }, close: { ... } }`.

### [S] Font loading missing — Inter and JetBrains Mono will fall back to system font
**Source:** Guard (S), Architect (C) | **Confidence:** High
**Plan:** 74-01 / 74-02
**Description:** Theme hardcodes `fontFamily: 'Inter'` but no plan includes `useFonts` from `expo-font`. Without loading, fonts silently fall back to San Francisco on iOS. UI-SPEC says "Font loading via expo-font from mobile/assets/fonts/".
**Suggested fix:** Add `useFonts` call in root layout (Plan 02 Task 2), gated by splash screen. The existing isLoading state can cover fonts too.

### [S] postcss.config.js not in Plan 01 delete list (D-02 violation)
**Source:** Guard (S), Architect (B) | **Confidence:** High
**Plan:** 74-01
**Description:** D-02 explicitly says "Delete postcss.config.js from mobile/" but Plan 01 Task 1 only deletes global.css and tailwind.config.js. postcss.config.js omitted.
**Suggested fix:** Add `rm -f mobile/postcss.config.js` to Step 3 and add to acceptance criteria.

### [S] Auth error messages don't match useAuth hook output
**Source:** Hunter (S), Cody (A) | **Confidence:** High
**Plan:** 74-02
**Description:** Plan 02 specifies three error messages from UI-SPEC copywriting contract, but actual useAuth hook returns different strings. The component can't display messages the hook never produces.
**Suggested fix:** Auth screen should display `error` from useAuth verbatim, not custom strings. Remove the three hardcoded messages from the plan and let the hook's existing strings be the source of truth.

### [S] Plan 01 Task 2 verify command uses `node -e require()` on TypeScript file
**Source:** Guard (B), Hunter (A), Architect (A) | **Confidence:** High
**Plan:** 74-01
**Description:** Verify command `node -e "require('./theme/theme')"` fails because theme.ts uses ES module imports. Node.js can't require TypeScript.
**Suggested fix:** Replace with `grep -q "colors.surface.base" mobile/theme/theme.ts && grep -q "typography.heading" mobile/theme/theme.ts && echo "THEME PASS"`.

## Lower-Grade Notes

- **[A] @testing-library/react-native not installed in Plan 01 Wave 0** — Plan 04 Task 3 needs it but Plan 01 doesn't install it. Add to Plan 01 install step.
- **[A] Reduce motion not addressed** — UI-SPEC requires it but no plan implements `useReduceMotion`. Reanimated has built-in `useReducedMotion()` — executor can wire it.
- **[A] New Chat button missing project context** — useSessions().createSession needs projectName/projectPath. Use stub-session pattern or projects[0] default.
- **[A] DrawerContent stagger animation missing acceptance criteria** — No grep-verifiable check for stagger.
- **[A] Route /chat/new redirect may not resolve through nested groups** — Verify Expo Router resolves through (drawer)/(stack) hierarchy.
- **[B] PATTERNS-PLAYBOOK.md missing from Plan 03 read_first** — Listed as primary reference in CONTEXT.md but not in task read_first.
- **[B] Missing keyboard-controller mock in jest.setup.js** — Plan 02 uses it but Plan 01 doesn't mock it.
- **[B] VALIDATION.md task IDs stale (6 plans → 4 plans)** — Not usable for tracking.
- **[C] tailwind.config.js vs .ts extension inconsistency** — CONTEXT.md says .ts, Plan says .js.
- **[C] Plan 01 placeholder _layout.tsx has hardcoded colors** — Chicken-and-egg with theme. Mark as intentional temporary.

## False Positives (Rejected)

- **Bard SS: Missing heartbeat for CONN-05** — CONN-05 is "Connection banner shows when disconnected", not heartbeat. Shared WebSocketClient already handles keepalive. Rejected.
- **Bard SS: Protocol ambiguity for server URL** — platform.ts already handles protocol. The URL field is being made non-editable. Moot.
- **Cody SS-01: CONN-07 pre-flight check** — Already addressed in checker revision pass. Plan 02 now reads/verifies websocket-init.ts.
