/**
 * Format time tests -- verifies relative time formatting.
 * Date grouping tests live in sessionGrouping.test.ts (single source of truth).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from './formatTime';

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
