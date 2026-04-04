---
status: partial
phase: 76-push-notifications
source: [76-01-SUMMARY.md, 76-02-SUMMARY.md, 76-03-SUMMARY.md, 76-04-SUMMARY.md]
started: 2026-04-04T17:00:00Z
updated: 2026-04-04T17:12:00Z
---

## Current Test

[testing paused — 10 items outstanding (blocked on EAS build with push entitlements)]

## Tests

### 1. Cold Start Smoke Test
expected: Kill and restart the Loom backend server. Server boots without errors, push_tokens table migration runs, push routes are accessible, and basic API calls work.
result: pass

### 2. Push Token REST Endpoints
expected: POST /api/push/register with a valid Expo push token registers the token (201 response). DELETE /api/push/register removes it. PATCH /api/push/preferences updates notification mode. All require JWT auth.
result: pass

### 3. Notification Settings Screen (Mobile)
expected: Open the mobile app drawer. A settings gear icon appears in the drawer footer. Tapping it navigates to a notification settings screen with 4 radio-style modes (All notifications, Failures + permissions, Permissions only, None). Selecting a mode shows an animated checkmark, persists to MMKV, and syncs to backend.
result: blocked
blocked_by: release-build
reason: "EAS build failed — provisioning profile missing push entitlements (aps-environment). Need --clear-credentials rebuild."

### 4. Settings Gear Icon & Navigation
expected: Drawer footer shows a gear icon with 44px touch target. Tapping navigates to settings/notifications route. Back navigation returns to previous screen.
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 5. Push Permission Request Flow
expected: On first launch (or after clearing app data), the app requests notification permissions via iOS system prompt. If granted, an Expo push token is registered with the backend. If denied, the settings screen shows a "Notifications Disabled" banner with a link to system settings.
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 6. AppState Foreground/Background WS Reporting
expected: When the mobile app moves to background, a WebSocket app-state message is sent to the server with foreground:false. When returning to foreground, foreground:true is sent. Server uses this for push gating (suppresses push if backgrounded < 30 seconds).
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 7. Per-Session Push Gating (Chat Screen)
expected: When viewing a specific chat session, the app reports the viewed session ID to the server. Push notifications for that session are suppressed while you're actively viewing it. Navigating away clears the viewing session.
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 8. Push Notification Delivery (Background)
expected: With the app backgrounded for >30 seconds, when an agent session completes or requires approval, an iOS push notification appears in the notification tray with a human-readable session name (not UUID).
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 9. Push Notification Deep Link (Tap to Open)
expected: Tapping a push notification in the notification tray opens the app and navigates directly to the relevant chat session. If the session no longer exists, a toast appears saying "Session no longer available".
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 10. In-App Notification Banner (Foreground)
expected: While the app is in the foreground, incoming push events show a glass-surface floating banner at the top of the screen (not a system notification). The banner has spring entrance animation and can be dismissed by swiping up.
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 11. Cold-Start Notification Handling
expected: If the app is fully closed and a push notification is tapped, the app launches, authenticates, and then navigates to the correct session. The module-level listener catches the response before React mounts. 120-second timeout accommodates the full cold-start flow.
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

### 12. Batch Coalescing (Rapid Completions)
expected: When multiple agent sessions complete within 5 seconds, they are coalesced into a single push notification (not one per completion). This is server-side behavior.
result: blocked
blocked_by: release-build
reason: "Blocked on EAS build with push entitlements"

## Summary

total: 12
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 10

## Gaps

[none yet]
