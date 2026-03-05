import { describe, it, expect } from 'vitest';
import {
  SPRING_GENTLE,
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  EASING,
  DURATION,
} from './motion';

describe('motion.ts spring configs', () => {
  it('all three springs have stiffness and damping > 0', () => {
    for (const spring of [SPRING_GENTLE, SPRING_SNAPPY, SPRING_BOUNCY]) {
      expect(spring.stiffness).toBeGreaterThan(0);
      expect(spring.damping).toBeGreaterThan(0);
    }
  });

  it('SPRING_GENTLE has lower stiffness than SPRING_SNAPPY', () => {
    expect(SPRING_GENTLE.stiffness).toBeLessThan(SPRING_SNAPPY.stiffness);
  });

  it('all springs conform to SpringConfig shape', () => {
    for (const spring of [SPRING_GENTLE, SPRING_SNAPPY, SPRING_BOUNCY]) {
      expect(spring).toHaveProperty('stiffness');
      expect(spring).toHaveProperty('damping');
      expect(typeof spring.stiffness).toBe('number');
      expect(typeof spring.damping).toBe('number');
    }
  });
});

describe('motion.ts EASING values', () => {
  it('all easing values are valid cubic-bezier strings', () => {
    const cubicBezierPattern = /^cubic-bezier\(\s*[\d.]+,\s*[\d.-]+,\s*[\d.]+,\s*[\d.-]+\s*\)$/;
    for (const [, value] of Object.entries(EASING)) {
      expect(value).toMatch(cubicBezierPattern);
    }
  });
});

describe('motion.ts DURATION values', () => {
  it('all duration values are positive numbers', () => {
    for (const [, value] of Object.entries(DURATION)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });

  it('durations are in ascending order: fast < normal < slow < spring', () => {
    expect(DURATION.fast).toBeLessThan(DURATION.normal);
    expect(DURATION.normal).toBeLessThan(DURATION.slow);
    expect(DURATION.slow).toBeLessThan(DURATION.spring);
  });
});
