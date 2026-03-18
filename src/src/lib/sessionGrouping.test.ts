/**
 * Session grouping tests -- verifies junk filtering and project-based grouping.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { isJunkSession, groupSessionsByProject } from './sessionGrouping';
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
