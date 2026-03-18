/**
 * Session grouping utilities -- pure functions for filtering junk sessions
 * and organizing sessions into a project > date > session hierarchy.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import type { Session, SessionDateGroup, ProjectGroup, ProjectSessionGroup } from '@/types/session';

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

  const groups: Record<SessionDateGroup, Session[]> = {
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

  const orderedLabels: SessionDateGroup[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

  return orderedLabels
    .filter((label) => groups[label].length > 0)
    .map((label) => ({
      label,
      sessions: groups[label].sort(sortDesc),
    }));
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
 */
export function groupSessionsByProject(projects: ProjectSessionInput[]): ProjectGroup[] {
  return projects
    .map((project) => {
      const visibleSessions = project.sessions.filter((s) => !isJunkSession(s));
      return {
        projectName: project.projectName,
        displayName: project.displayName,
        projectPath: project.projectPath,
        sessionCount: project.sessions.length,
        visibleCount: visibleSessions.length,
        dateGroups: groupIntoDateBuckets(visibleSessions),
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
