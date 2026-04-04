/**
 * MMKV-backed push notification preferences and token persistence.
 *
 * Created by Plan 02 (parallel wave 1). This file provides the shared
 * interface for notification mode selection and push token caching.
 *
 * MMKV keys:
 * - 'push_pref_mode': NotificationMode (per D-14)
 * - 'push_token': cached Expo push token
 * - 'push_pending_approvals': JSON array of pending approval responses
 */

import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationMode = 'all' | 'failures_and_permissions' | 'permissions_only' | 'none';

export interface PendingApproval {
  sessionId: string;
  toolName: string;
  response: 'approve' | 'deny';
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Notification mode (D-14)
// ---------------------------------------------------------------------------

const MODE_KEY = 'push_pref_mode';

export function getNotificationMode(): NotificationMode {
  const raw = mmkv.getString(MODE_KEY);
  if (raw === 'all' || raw === 'failures_and_permissions' || raw === 'permissions_only' || raw === 'none') {
    return raw;
  }
  return 'all'; // default
}

export function setNotificationMode(mode: NotificationMode): void {
  mmkv.set(MODE_KEY, mode);
}

// ---------------------------------------------------------------------------
// Push token persistence (S-4)
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'push_token';

export function getPushToken(): string | null {
  return mmkv.getString(TOKEN_KEY) ?? null;
}

export function setPushToken(token: string): void {
  mmkv.set(TOKEN_KEY, token);
}

// ---------------------------------------------------------------------------
// Pending approvals queue
// ---------------------------------------------------------------------------

const APPROVALS_KEY = 'push_pending_approvals';

export function queueApproval(approval: PendingApproval): void {
  const existing = getPendingApprovals();
  existing.push(approval);
  mmkv.set(APPROVALS_KEY, JSON.stringify(existing));
}

export function getPendingApprovals(): PendingApproval[] {
  const raw = mmkv.getString(APPROVALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingApproval[];
  } catch {
    return [];
  }
}

export function clearPendingApprovals(): void {
  mmkv.delete(APPROVALS_KEY);
}
