/**
 * Session grouping tests -- verifies junk filtering and project-based grouping.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { isJunkSession, groupSessionsByProject, hoistPinnedSessions } from './sessionGrouping';
import type { Session } from '@/types/session';

function makeSession(overrides: Partial<Session> & { updatedAt: string }): Session {
  const { updatedAt, ...rest } = overrides;
  return {
    id: Math.random().toString(36).slice(2, 10),
    title: 'Test Session',
    messages: [],
    providerId: 'claude',
    createdAt: updatedAt,
    updatedAt,
    metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: null },
    ...rest,
  };
}

describe('isJunkSession', () => {
  it('returns true for sessions with messageCount === 0', () => {
    const session = makeSession({
      updatedAt: '2026-03-06T12:00:00Z',
      title: 'Some title',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 0 },
    });
    expect(isJunkSession(session)).toBe(true);
  });

  it('returns true for "New Session" title with no real content indication', () => {
    const session = makeSession({
      updatedAt: '2026-03-06T12:00:00Z',
      title: 'New Session',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: null },
    });
    expect(isJunkSession(session)).toBe(true);
  });

  it('returns true for "New Chat" title with no real content indication', () => {
    const session = makeSession({
      updatedAt: '2026-03-06T12:00:00Z',
      title: 'New Chat',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: null },
    });
    expect(isJunkSession(session)).toBe(true);
  });

  it('returns true for notification-classifier patterns', () => {
    const session1 = makeSession({
      updatedAt: '2026-03-06T12:00:00Z',
      title: 'Notification classifier setup',
    });
    expect(isJunkSession(session1)).toBe(true);

    const session2 = makeSession({
      updatedAt: '2026-03-06T12:00:00Z',
      title: 'notification-classifier',
    });
    expect(isJunkSession(session2)).toBe(true);
  });

  it('returns false for normal sessions with real titles', () => {
    const session = makeSession({
      updatedAt: '2026-03-06T12:00:00Z',
      title: 'Implement authentication flow',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 5 },
    });
    expect(isJunkSession(session)).toBe(false);
  });

  it('returns false for sessions with messageCount > 0 even with generic title', () => {
    const session = makeSession({
      updatedAt: '2026-03-06T12:00:00Z',
      title: 'New Session',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 3 },
    });
    expect(isJunkSession(session)).toBe(false);
  });
});

describe('groupSessionsByProject', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns projects sorted alphabetically by displayName', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const result = groupSessionsByProject([
      {
        projectName: 'zebra',
        displayName: 'Zebra',
        projectPath: '/home/user/zebra',
        sessions: [makeSession({ updatedAt: '2026-03-06T14:00:00Z', title: 'Z session' })],
      },
      {
        projectName: 'alpha',
        displayName: 'Alpha',
        projectPath: '/home/user/alpha',
        sessions: [makeSession({ updatedAt: '2026-03-06T14:00:00Z', title: 'A session' })],
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toBeDefined();
    expect(result[0]?.displayName).toBe('Alpha');
    expect(result[1]?.displayName).toBe('Zebra');
  });

  it('omits empty date groups', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const result = groupSessionsByProject([
      {
        projectName: 'test',
        displayName: 'Test',
        projectPath: '/home/user/test',
        sessions: [makeSession({ updatedAt: '2026-03-06T14:00:00Z', title: 'Today only' })],
      },
    ]);

    const project = result[0];
    expect(project).toBeDefined();
    expect(project?.dateGroups).toHaveLength(1);
    expect(project?.dateGroups[0]?.label).toBe('Today');
  });

  it('excludes junk sessions from dateGroups', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const result = groupSessionsByProject([
      {
        projectName: 'test',
        displayName: 'Test',
        projectPath: '/home/user/test',
        sessions: [
          makeSession({
            updatedAt: '2026-03-06T14:00:00Z',
            title: 'Real session',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 5 },
          }),
          makeSession({
            updatedAt: '2026-03-06T13:00:00Z',
            title: 'New Session',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: null },
          }),
        ],
      },
    ]);

    const project = result[0];
    expect(project).toBeDefined();
    expect(project?.visibleCount).toBe(1);
    expect(project?.sessionCount).toBe(2);
    expect(project?.dateGroups[0]?.sessions).toHaveLength(1);
    expect(project?.dateGroups[0]?.sessions[0]?.title).toBe('Real session');
  });

  it('sets visibleCount correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const result = groupSessionsByProject([
      {
        projectName: 'test',
        displayName: 'Test',
        projectPath: '/home/user/test',
        sessions: [
          makeSession({
            updatedAt: '2026-03-06T14:00:00Z',
            title: 'Session 1',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 3 },
          }),
          makeSession({
            updatedAt: '2026-03-06T13:00:00Z',
            title: 'Session 2',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
          }),
          makeSession({
            updatedAt: '2026-03-06T12:00:00Z',
            title: 'New Session',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 0 },
          }),
        ],
      },
    ]);

    const project = result[0];
    expect(project).toBeDefined();
    expect(project?.visibleCount).toBe(2);
    expect(project?.sessionCount).toBe(3);
  });

  it('hoists pinned sessions into Pinned pseudo-date-group at top', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const pinnedId = 'pinned-session';
    const result = groupSessionsByProject(
      [
        {
          projectName: 'test',
          displayName: 'Test',
          projectPath: '/home/user/test',
          sessions: [
            makeSession({
              id: pinnedId,
              updatedAt: '2026-03-06T14:00:00Z',
              title: 'Pinned one',
              metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 3 },
            }),
            makeSession({
              updatedAt: '2026-03-06T13:00:00Z',
              title: 'Normal session',
              metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 2 },
            }),
          ],
        },
      ],
      new Set([pinnedId]),
    );

    const project = result[0];
    expect(project).toBeDefined();
    expect(project?.dateGroups[0]?.label).toBe('Pinned');
    expect(project?.dateGroups[0]?.sessions).toHaveLength(1);
    expect(project?.dateGroups[0]?.sessions[0]?.id).toBe(pinnedId);
    // Normal session in Today group, not duplicated
    expect(project?.dateGroups[1]?.label).toBe('Today');
    expect(project?.dateGroups[1]?.sessions).toHaveLength(1);
    expect(project?.dateGroups[1]?.sessions[0]?.title).toBe('Normal session');
  });

  it('behaves identically without pinnedIds parameter', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const sessions = [
      makeSession({
        updatedAt: '2026-03-06T14:00:00Z',
        title: 'Session A',
        metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
      }),
    ];

    const withoutPins = groupSessionsByProject([
      { projectName: 'test', displayName: 'Test', projectPath: '/home/user/test', sessions },
    ]);
    const withEmptyPins = groupSessionsByProject(
      [{ projectName: 'test', displayName: 'Test', projectPath: '/home/user/test', sessions }],
      new Set(),
    );

    expect(withoutPins).toEqual(withEmptyPins);
  });

  it('sorts pinned sessions descending by updatedAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const result = groupSessionsByProject(
      [
        {
          projectName: 'test',
          displayName: 'Test',
          projectPath: '/home/user/test',
          sessions: [
            makeSession({
              id: 'older-pinned',
              updatedAt: '2026-03-06T10:00:00Z',
              title: 'Older pinned',
              metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
            }),
            makeSession({
              id: 'newer-pinned',
              updatedAt: '2026-03-06T14:00:00Z',
              title: 'Newer pinned',
              metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
            }),
          ],
        },
      ],
      new Set(['older-pinned', 'newer-pinned']),
    );

    const pinned = result[0]?.dateGroups[0];
    expect(pinned?.label).toBe('Pinned');
    expect(pinned?.sessions[0]?.id).toBe('newer-pinned');
    expect(pinned?.sessions[1]?.id).toBe('older-pinned');
  });

  it('groups sessions into 5 date buckets', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T15:00:00Z'));

    const result = groupSessionsByProject([
      {
        projectName: 'test',
        displayName: 'Test',
        projectPath: '/home/user/test',
        sessions: [
          makeSession({
            updatedAt: '2026-03-15T14:00:00Z',
            title: 'Today',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
          }),
          makeSession({
            updatedAt: '2026-03-14T10:00:00Z',
            title: 'Yesterday',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
          }),
          makeSession({
            updatedAt: '2026-03-11T10:00:00Z',
            title: 'This Week',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
          }),
          makeSession({
            updatedAt: '2026-03-03T10:00:00Z',
            title: 'This Month',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
          }),
          makeSession({
            updatedAt: '2026-01-15T10:00:00Z',
            title: 'Older',
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null, messageCount: 1 },
          }),
        ],
      },
    ]);

    const project = result[0];
    expect(project).toBeDefined();
    const labels = project?.dateGroups.map((g) => g.label);
    expect(labels).toEqual(['Today', 'Yesterday', 'This Week', 'This Month', 'Older']);
  });
});

describe('hoistPinnedSessions', () => {
  const now = new Date();

  function makeSessionAt(id: string, title: string, hoursAgo: number): Session {
    const date = new Date(now.getTime() - hoursAgo * 3600_000);
    return makeSession({ id, title, updatedAt: date.toISOString() });
  }

  it('returns groups unchanged when pinnedIds is empty', () => {
    const groups = groupSessionsByProject([{
      projectName: 'p1', displayName: 'P1', projectPath: '/p1',
      sessions: [makeSessionAt('s1', 'Chat 1', 1)],
    }]);
    const result = hoistPinnedSessions(groups, new Set());
    expect(result).toBe(groups); // Same reference — no transform
  });

  it('hoists pinned sessions into a Pinned group at the top', () => {
    const groups = groupSessionsByProject([{
      projectName: 'p1', displayName: 'P1', projectPath: '/p1',
      sessions: [
        makeSessionAt('s1', 'Unpinned', 1),
        makeSessionAt('s2', 'Pinned One', 2),
        makeSessionAt('s3', 'Another Unpinned', 3),
      ],
    }]);
    const result = hoistPinnedSessions(groups, new Set(['s2']));
    const project = result[0]; // ASSERT: single project in input
    const labels = project!.dateGroups.map((g) => g.label); // ASSERT: project exists from single input
    expect(labels[0]).toBe('Pinned');
    const pinnedGroup = project!.dateGroups[0]; // ASSERT: Pinned group is first after hoisting
    expect(pinnedGroup!.sessions[0]!.id).toBe('s2'); // ASSERT: s2 is the only pinned session
  });

  it('removes pinned sessions from their original date bucket', () => {
    const groups = groupSessionsByProject([{
      projectName: 'p1', displayName: 'P1', projectPath: '/p1',
      sessions: [
        makeSessionAt('s1', 'Chat 1', 1),
        makeSessionAt('s2', 'Chat 2', 2),
      ],
    }]);
    const result = hoistPinnedSessions(groups, new Set(['s1']));
    // s1 should only appear in Pinned, not in Today
    const allSessionIds = result[0]!.dateGroups.flatMap((g) => g.sessions.map((s) => s.id)); // ASSERT: single project in input
    const s1Count = allSessionIds.filter((id) => id === 's1').length;
    expect(s1Count).toBe(1);
  });
});
