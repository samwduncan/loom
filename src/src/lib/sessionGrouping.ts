/**
 * Session grouping utilities -- pure functions for filtering junk sessions
 * and organizing sessions into a project > date > session hierarchy.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { Session, ProjectGroup, ProjectSessionGroup } from '@/types/session';

/** Patterns that identify notification-classifier or system-only sessions. */
const JUNK_TITLE_PATTERNS = [
  /^notification/i,
  /classifier/i,
  /^system\s*$/i,
];

/** Default titles that indicate an unused session (when messageCount is unknown or 0). */
const DEFAULT_TITLES = new Set(['New Session', 'New Chat']);

/**
 * Determine if a session is "junk" -- no real user content.
 *
 * A session is junk if:
 * - messageCount is explicitly 0
 * - Title is a default placeholder AND messageCount is unknown (null/undefined)
 * - Title matches notification-classifier patterns
 */
export function isJunkSession(session: Session): boolean {
  const messageCount = session.metadata.messageCount;

  // Explicit zero messages -- definitely junk
  if (messageCount === 0) return true;

  // Notification-classifier patterns are always junk regardless of message count
  if (JUNK_TITLE_PATTERNS.some((pattern) => pattern.test(session.title))) return true;

  // Default titles are junk only when messageCount is unknown (null/undefined)
  // If messageCount > 0, the session has real content even with a generic title
  if (DEFAULT_TITLES.has(session.title) && (messageCount == null)) return true;

  return false;
}

/**
 * Group sessions into 5 date buckets based on updatedAt.
 * Uses midnight boundaries (not 24h rolling).
 * Returns non-empty groups in order, sessions sorted descending within each group.
 */
function groupIntoDateBuckets(sessions: Session[]): ProjectSessionGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86_400_000);
  const monthStart = new Date(todayStart.getTime() - 30 * 86_400_000);

  /** Date-only bucket labels (excludes 'Pinned' which is handled by the outer function). */
  type DateBucketLabel = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Older';
  const groups: Record<DateBucketLabel, Session[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'This Month': [],
    'Older': [],
  };

  for (const session of sessions) {
    const date = new Date(session.updatedAt);
    if (date >= todayStart) {
      groups['Today'].push(session);
    } else if (date >= yesterdayStart) {
      groups['Yesterday'].push(session);
    } else if (date >= weekStart) {
      groups['This Week'].push(session);
    } else if (date >= monthStart) {
      groups['This Month'].push(session);
    } else {
      groups['Older'].push(session);
    }
  }

  const sortDesc = (a: Session, b: Session) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  const orderedLabels: DateBucketLabel[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  return orderedLabels
    .filter((label) => groups[label].length > 0)
    .map((label) => ({
      label,
      sessions: groups[label].sort(sortDesc),
    }));
}

/**
 * Post-process already-grouped ProjectGroup[] to hoist pinned sessions
 * into a 'Pinned' pseudo-date-group at the top of each project.
 * Removes pinned sessions from their original date buckets to prevent duplicates.
 */
export function hoistPinnedSessions(
  groups: ProjectGroup[],
  pinnedIds: Set<string>,
): ProjectGroup[] {
  if (pinnedIds.size === 0) return groups;

  return groups.map((project) => {
    const pinned: Session[] = [];
    const filteredDateGroups = project.dateGroups
      .map((dg) => {
        const remaining: Session[] = [];
        for (const session of dg.sessions) {
          if (pinnedIds.has(session.id)) {
            pinned.push(session);
          } else {
            remaining.push(session);
          }
        }
        return { ...dg, sessions: remaining };
      })
      .filter((dg) => dg.sessions.length > 0);

    if (pinned.length === 0) return project;

    // Sort pinned descending by updatedAt (same as date buckets)
    pinned.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return {
      ...project,
      dateGroups: [{ label: 'Pinned' as const, sessions: pinned }, ...filteredDateGroups],
    };
  });
}

/** Input shape for groupSessionsByProject -- one entry per project. */
export interface ProjectSessionInput {
  projectName: string;
  displayName: string;
  projectPath: string;
  sessions: Session[];
}

/**
 * Group sessions by project, filter junk, organize into date subgroups.
 * Projects are sorted alphabetically by displayName.
 *
 * When pinnedIds is provided with entries, pinned sessions are hoisted into
 * a 'Pinned' pseudo-date-group at the top of each project (removed from
 * their original date bucket to prevent duplicates).
 */
export function groupSessionsByProject(
  projects: ProjectSessionInput[],
  pinnedIds?: Set<string>,
): ProjectGroup[] {
  const hasPins = pinnedIds != null && pinnedIds.size > 0;

  return projects
    .map((project) => {
      const visibleSessions = project.sessions.filter((s) => !isJunkSession(s));

      if (!hasPins) {
        return {
          projectName: project.projectName,
          displayName: project.displayName,
          projectPath: project.projectPath,
          sessionCount: project.sessions.length,
          visibleCount: visibleSessions.length,
          dateGroups: groupIntoDateBuckets(visibleSessions),
        };
      }

      // Partition into pinned and unpinned
      // ASSERT: pinnedIds is non-null and non-empty when hasPins is true
      const pinned: Session[] = [];
      const unpinned: Session[] = [];
      for (const session of visibleSessions) {
        if (pinnedIds.has(session.id)) {
          pinned.push(session);
        } else {
          unpinned.push(session);
        }
      }

      const dateGroups: ProjectSessionGroup[] = groupIntoDateBuckets(unpinned);

      if (pinned.length > 0) {
        // Sort pinned descending by updatedAt (same as date buckets)
        const sortDesc = (a: Session, b: Session) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        pinned.sort(sortDesc);

        dateGroups.unshift({ label: 'Pinned', sessions: pinned });
      }

      return {
        projectName: project.projectName,
        displayName: project.displayName,
        projectPath: project.projectPath,
        sessionCount: project.sessions.length,
        visibleCount: visibleSessions.length,
        dateGroups,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
