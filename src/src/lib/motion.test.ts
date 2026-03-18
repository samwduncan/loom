import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
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

describe('CSS spring easing tokens in tokens.css', () => {
  const tokensPath = resolve(__dirname, '../styles/tokens.css');
  const tokensCss = readFileSync(tokensPath, 'utf-8');

  const springs = ['gentle', 'snappy', 'bouncy'] as const;

  for (const name of springs) {
    it(`contains --ease-spring-${name} with a linear() value`, () => {
      const pattern = new RegExp(`--ease-spring-${name}:\\s*linear\\(`);
      expect(tokensCss).toMatch(pattern);
    });

    it(`contains --duration-spring-${name} with an ms value`, () => {
      const pattern = new RegExp(`--duration-spring-${name}:\\s*\\d+(\\.\\d+)?ms`);
      expect(tokensCss).toMatch(pattern);
    });

    it(`--ease-spring-${name} linear() has at least 30 comma-separated points`, () => {
      const match = tokensCss.match(
        new RegExp(`--ease-spring-${name}:\\s*linear\\(([^)]+)\\)`)
      );
      expect(match).not.toBeNull();
      const captured = match![1]; // ASSERT: match verified not null by preceding assertion
      expect(captured).toBeDefined();
      const points = captured!.split(','); // ASSERT: captured verified defined by preceding assertion
      expect(points.length).toBeGreaterThanOrEqual(30);
    });
  }

  it('SPRING_GENTLE, SPRING_SNAPPY, SPRING_BOUNCY JS configs still export correctly (regression)', () => {
    expect(SPRING_GENTLE).toEqual({ stiffness: 120, damping: 14 });
    expect(SPRING_SNAPPY).toEqual({ stiffness: 300, damping: 20 });
    expect(SPRING_BOUNCY).toEqual({ stiffness: 180, damping: 12 });
  });
});
