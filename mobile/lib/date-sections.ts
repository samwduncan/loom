/**
 * Date section utility for session grouping in the drawer SectionList.
 *
 * Groups sessions into Today / Yesterday / Last Week / Older sections
 * using start-of-day comparison (not raw timestamp diff) so a session
 * from 11:59 PM yesterday doesn't appear as "Today" at 12:01 AM.
 *
 * Per D-10: running sessions stay in their date group (no special handling
 * needed -- grouping is based on updatedAt, which only changes on activity).
 *
 * Sessions within each section remain sorted by updatedAt descending
 * (the input from useSessions is already sorted).
 */

import type { SessionData } from '../hooks/useSessions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectionData {
  title: string; // 'Today' | 'Yesterday' | 'Last Week' | 'Older'
  data: SessionData[];
}

// ---------------------------------------------------------------------------
// Section titles in fixed display order
// ---------------------------------------------------------------------------

const SECTION_ORDER = ['Today', 'Yesterday', 'Last Week', 'Older'] as const;

// ---------------------------------------------------------------------------
// Date classification
// ---------------------------------------------------------------------------

/**
 * Returns the relative date section for a given date.
 * Uses start-of-day comparison for correct boundary behavior.
 *
 * @returns One of: 'Today' | 'Yesterday' | 'Last Week' | 'Older'
 */
export function getRelativeDateSection(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfToday.getTime() - startOfDate.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays <= 0) return 'Today'; // includes future dates (clock skew edge case)
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last Week';
  return 'Older';
}

// ---------------------------------------------------------------------------
// Session grouping
// ---------------------------------------------------------------------------

/**
 * Groups sessions into date sections for SectionList rendering.
 * Returns sections in fixed order (Today first, Older last).
 * Empty sections are omitted.
 *
 * @param sessions - Sessions sorted by updatedAt descending (from useSessions)
 * @returns SectionData[] with stable ordering
 */
export function groupSessionsByDate(sessions: SessionData[]): SectionData[] {
  const groups = new Map<string, SessionData[]>();

  for (const session of sessions) {
    const section = getRelativeDateSection(new Date(session.updatedAt));
    if (!groups.has(section)) {
      groups.set(section, []);
    }
    // ASSERT: groups.get(section) is non-null because we just ensured it exists
    groups.get(section)!.push(session);
  }

  // Return in fixed order, omitting empty sections
  return SECTION_ORDER
    .filter((title) => groups.has(title))
    .map((title) => ({ title, data: groups.get(title)! }));
}
