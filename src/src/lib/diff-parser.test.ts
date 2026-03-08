import { describe, it, expect } from 'vitest';
import { computeDiff } from './diff-parser';

describe('computeDiff', () => {
  it('returns empty array for identical strings', () => {
    expect(computeDiff('hello', 'hello')).toEqual([]);
  });

  it('computes pure addition (empty old string)', () => {
    const result = computeDiff('', 'line1\nline2');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((l) => l.type === 'added')).toBe(true);
    expect(result[0]?.oldLineNo).toBeNull();
    expect(result[0]?.newLineNo).toBe(1);
  });

  it('computes pure deletion (empty new string)', () => {
    const result = computeDiff('line1\nline2', '');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((l) => l.type === 'removed')).toBe(true);
    expect(result[0]?.oldLineNo).toBe(1);
    expect(result[0]?.newLineNo).toBeNull();
  });

  it('computes mixed changes with context', () => {
    const oldStr = 'a\nb\nc\nd\ne';
    const newStr = 'a\nb\nX\nd\ne';
    const result = computeDiff(oldStr, newStr);

    const removed = result.filter((l) => l.type === 'removed');
    const added = result.filter((l) => l.type === 'added');
    const context = result.filter((l) => l.type === 'context');

    expect(removed.length).toBe(1);
    expect(removed[0]?.content).toBe('c');
    expect(added.length).toBe(1);
    expect(added[0]?.content).toBe('X');
    expect(context.length).toBeGreaterThan(0);
  });

  it('respects context lines parameter', () => {
    const oldStr = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
    const newStr = 'a\nb\nc\nd\ne\nX\ng\nh\ni\nj';
    const result1 = computeDiff(oldStr, newStr, 1);
    const result3 = computeDiff(oldStr, newStr, 3);

    // More context lines = more context type lines in result
    const ctx1 = result1.filter((l) => l.type === 'context').length;
    const ctx3 = result3.filter((l) => l.type === 'context').length;
    expect(ctx3).toBeGreaterThanOrEqual(ctx1);
  });

  it('assigns correct dual line numbers', () => {
    const result = computeDiff('a\nb\n', 'a\nc\n');
    const removed = result.find((l) => l.type === 'removed');
    const added = result.find((l) => l.type === 'added');

    expect(removed?.oldLineNo).toBe(2);
    expect(removed?.newLineNo).toBeNull();
    expect(added?.newLineNo).toBe(2);
    expect(added?.oldLineNo).toBeNull();
  });
});
