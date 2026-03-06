/**
 * Time formatting utilities -- relative time display and date grouping.
 *
 * Pure functions, no external dependencies. Uses Date arithmetic only.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { Session } from '@/types/session';

export type DateGroup = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';

/**
 * Format a date string as a relative time from now.
 * Thresholds: <60s "just now", <60min "Xm ago", <24h "Xh ago",
 * <7d "Xd ago", else "Mon DD" via toLocaleDateString.
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Group sessions into date categories based on updatedAt field.
 * Uses midnight boundaries (not 24h rolling).
 * Returns array of non-empty groups in order: Today, Yesterday, Previous 7 Days, Older.
 * Sessions within each group sorted by updatedAt descending (most recent first).
 */
export function groupSessionsByDate(
  sessions: Session[],
): Array<{ label: DateGroup; sessions: Session[] }> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86_400_000);

  const groups: Record<DateGroup, Session[]> = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': [],
  };

  for (const session of sessions) {
    const date = new Date(session.updatedAt);
    if (date >= todayStart) {
      groups['Today'].push(session);
    } else if (date >= yesterdayStart) {
      groups['Yesterday'].push(session);
    } else if (date >= weekStart) {
      groups['Previous 7 Days'].push(session);
    } else {
      groups['Older'].push(session);
    }
  }

  // Sort within each group by updatedAt descending (most recent first)
  const sortDesc = (a: Session, b: Session) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  const orderedLabels: DateGroup[] = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  return orderedLabels
    .filter((label) => groups[label].length > 0)
    .map((label) => ({
      label,
      sessions: groups[label].sort(sortDesc),
    }));
}
