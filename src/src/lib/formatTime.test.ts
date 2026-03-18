/**
 * Format time tests -- verifies relative time formatting and date grouping.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime, groupSessionsByDate } from './formatTime';
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
    metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    ...rest,
  };
}

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T12:00:30Z'));
    expect(formatRelativeTime('2026-03-06T12:00:00Z')).toBe('just now');
  });

  it('returns "Xm ago" for timestamps less than 60 minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T12:05:00Z'));
    expect(formatRelativeTime('2026-03-06T12:00:00Z')).toBe('5m ago');
  });

  it('returns "Xh ago" for timestamps less than 24 hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));
    expect(formatRelativeTime('2026-03-06T12:00:00Z')).toBe('3h ago');
  });

  it('returns "Xd ago" for timestamps less than 7 days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T12:00:00Z'));
    expect(formatRelativeTime('2026-03-03T12:00:00Z')).toBe('3d ago');
  });

  it('returns "Mon DD" for timestamps 7+ days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T12:00:00Z'));
    const result = formatRelativeTime('2026-02-20T12:00:00Z');
    expect(result).toMatch(/Feb\s+20/);
  });
});

describe('groupSessionsByDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('groups sessions into Today/Yesterday/This Week/This Month/Older', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const sessions = [
      makeSession({ updatedAt: '2026-03-06T14:00:00Z', title: 'Today session' }),
      makeSession({ updatedAt: '2026-03-05T10:00:00Z', title: 'Yesterday session' }),
      makeSession({ updatedAt: '2026-03-02T10:00:00Z', title: 'This week session' }),
      makeSession({ updatedAt: '2026-02-15T10:00:00Z', title: 'This month session' }),
      makeSession({ updatedAt: '2026-01-10T10:00:00Z', title: 'Old session' }),
    ];

    const groups = groupSessionsByDate(sessions);
    expect(groups).toHaveLength(5);
    expect(groups[0]?.label).toBe('Today');
    expect(groups[0]?.sessions[0]?.title).toBe('Today session');
    expect(groups[1]?.label).toBe('Yesterday');
    expect(groups[2]?.label).toBe('This Week');
    expect(groups[3]?.label).toBe('This Month');
    expect(groups[4]?.label).toBe('Older');
  });

  it('omits empty groups from result', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const sessions = [
      makeSession({ updatedAt: '2026-03-06T14:00:00Z', title: 'Only today' }),
    ];

    const groups = groupSessionsByDate(sessions);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe('Today');
  });

  it('sorts sessions within each group by updatedAt descending (most recent first)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T15:00:00Z'));

    const sessions = [
      makeSession({ updatedAt: '2026-03-06T10:00:00Z', title: 'Earlier today' }),
      makeSession({ updatedAt: '2026-03-06T14:00:00Z', title: 'Later today' }),
      makeSession({ updatedAt: '2026-03-06T12:00:00Z', title: 'Midday' }),
    ];

    const groups = groupSessionsByDate(sessions);
    expect(groups[0]?.sessions[0]?.title).toBe('Later today');
    expect(groups[0]?.sessions[1]?.title).toBe('Midday');
    expect(groups[0]?.sessions[2]?.title).toBe('Earlier today');
  });

  it('returns empty array for empty sessions input', () => {
    const groups = groupSessionsByDate([]);
    expect(groups).toHaveLength(0);
  });
});
