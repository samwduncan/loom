# Phase 76: Push Notifications - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 76-push-notifications
**Areas discussed:** Notification trigger logic, Permission approval flow, Deep link routing, Settings & granularity
**Mode:** --auto (all decisions auto-selected from recommended defaults)

---

## Notification Trigger Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Gate on WS disconnected OR backgrounded | Only send push when no active WS connection or app has been backgrounded >30s. Prevents duplicate notifications when user is actively viewing session. | ✓ |
| Always send push regardless of app state | Simpler implementation, but creates duplicate notifications alongside inline UI | |
| Send only when app is killed | Too restrictive — misses backgrounded scenario where user has switched to another app | |

**User's choice:** [auto] Gate on WS disconnected OR app backgrounded >30s
**Notes:** Bard flagged notification fatigue as a critical risk. Also added 5-second batching window for multiple simultaneous completions. Trigger events: session complete (success/error) and permission.request only — no progress milestones.

---

## Permission Approval from Notification

| Option | Description | Selected |
|--------|-------------|----------|
| Expo notification categories + MMKV queue | Action buttons (Approve/Deny) on notification. Store response in MMKV, drain queue on reconnect. Handles cold-start race condition. | ✓ |
| Push + require app open for approval | Simpler but defeats PUSH-04 requirement. User must open app to approve. | |
| Relay-based approval routing | Agent waits on relay, not WebSocket. Adds Phase 77 dependency. Premature coupling. | |

**User's choice:** [auto] Expo notification categories + MMKV queue + drain on reconnect
**Notes:** Bard flagged cold-start race condition as critical risk. Mitigation: generous agent timeout (120s default), MMKV persistence survives app kill, drain on WS reconnect. If approval arrives after timeout, show "Permission request expired" toast.

---

## Deep Link Routing

| Option | Description | Selected |
|--------|-------------|----------|
| getLastNotificationResponseAsync() + validation + fallback | Standard Expo pattern. Cold-start handled in root layout. Session validated before navigation. Fallback to session list + toast if session doesn't exist. | ✓ |
| Universal Links only | More reliable for cold-start but requires web domain configuration and AASA file hosting. Overkill for single-user app. | |
| Custom scheme without validation | Simpler but silently fails if session is deleted/expired. Poor UX. | |

**User's choice:** [auto] getLastNotificationResponseAsync() + session validation + fallback to session list
**Notes:** Anti-double-navigation via hasHandledColdStartNotification ref. Deep link scheme: loom://chat/{sessionId}. Expo Router handles warm launch automatically.

---

## Settings & Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Device-level MMKV + backend sync | Preferences in MMKV for instant local effect, synced to push_tokens table for server-side filtering. Best of both worlds. | ✓ |
| Device-level MMKV only | Simpler but backend can't filter — sends all pushes, app discards unwanted ones. Wastes APNs bandwidth. | |
| Backend-only storage | Single source of truth but requires network for preference changes. Sluggish UX. | |

**User's choice:** [auto] Device-level MMKV + backend sync
**Notes:** 4 modes: all (default), failures_and_permissions, permissions_only, none. New "Notifications" section in settings screen. Backend notification_mode column in push_tokens table. Mobile syncs on change and on registration.

---

## Claude's Discretion

- Notification sound selection (default vs custom)
- Badge count management strategy
- Exact notification body text formatting
- Retry logic for failed push delivery
- In-app notification banner for foregrounded but different-session scenario

## Deferred Ideas

- Dynamic Island integration (Phase 82)
- Critical alerts for permission requests (Apple entitlement needed)
- Multi-device notification sync testing
- Notification analytics / delivery tracking
- Session-type filtering in preferences
