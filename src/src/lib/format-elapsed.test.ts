/**
 * formatElapsed utility tests — covers elapsed time formatting for tool cards.
 * Tests sub-second, second, and minute ranges with boundary cases.
 */

import { describe, it, expect } from 'vitest';
import { formatElapsed } from '@/lib/format-elapsed';

describe('formatElapsed', () => {
  it('formats 0ms as "0.0s"', () => {
    expect(formatElapsed(0)).toBe('0.0s');
  });

  it('formats sub-second values with one decimal', () => {
    expect(formatElapsed(300)).toBe('0.3s');
  });

  it('formats seconds with one decimal', () => {
    expect(formatElapsed(1200)).toBe('1.2s');
  });

  it('formats mid-range seconds', () => {
    expect(formatElapsed(5432)).toBe('5.4s');
  });

  it('stays in seconds format at 59.9s', () => {
    expect(formatElapsed(59999)).toBe('60.0s');
  });

  it('switches to minute format at exactly 60s', () => {
    expect(formatElapsed(60000)).toBe('1m 0s');
  });

  it('formats minutes and seconds correctly', () => {
    expect(formatElapsed(83000)).toBe('1m 23s');
  });

  it('formats multi-minute durations', () => {
    expect(formatElapsed(125000)).toBe('2m 5s');
  });
});
