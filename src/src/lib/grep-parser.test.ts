import { describe, it, expect } from 'vitest';
import { parseGrepOutput } from './grep-parser';
import type { GrepFileGroup } from './grep-parser';

/** Helper: asserts result is non-null and returns it typed */
function expectGroups(result: GrepFileGroup[] | null): GrepFileGroup[] {
  expect(result).not.toBeNull();
  return result as GrepFileGroup[]; // ASSERT: validated non-null by expect above
}

describe('parseGrepOutput', () => {
  it('parses standard ripgrep output', () => {
    const output = 'src/app.ts:10:const x = 1;\nsrc/app.ts:15:const y = 2;';
    const groups = expectGroups(parseGrepOutput(output));
    expect(groups).toHaveLength(1);
    expect(groups[0]?.filePath).toBe('src/app.ts');
    expect(groups[0]?.matches).toHaveLength(2);
    expect(groups[0]?.matches[0]).toEqual({ lineNo: 10, content: 'const x = 1;' });
    expect(groups[0]?.matches[1]).toEqual({ lineNo: 15, content: 'const y = 2;' });
  });

  it('handles separator lines between context groups', () => {
    const output = 'src/a.ts:1:line1\n--\nsrc/a.ts:10:line10';
    const groups = expectGroups(parseGrepOutput(output));
    expect(groups).toHaveLength(1);
    expect(groups[0]?.matches).toHaveLength(2);
  });

  it('groups matches by filepath', () => {
    const output = [
      'src/a.ts:1:first',
      'src/a.ts:2:second',
      'src/b.ts:5:third',
    ].join('\n');
    const groups = expectGroups(parseGrepOutput(output));
    expect(groups).toHaveLength(2);
    expect(groups[0]?.filePath).toBe('src/a.ts');
    expect(groups[0]?.matches).toHaveLength(2);
    expect(groups[1]?.filePath).toBe('src/b.ts');
    expect(groups[1]?.matches).toHaveLength(1);
  });

  it('returns null for invalid format', () => {
    expect(parseGrepOutput('no matches here')).toBeNull();
  });

  it('returns null for empty output', () => {
    expect(parseGrepOutput('')).toBeNull();
  });

  it('returns null for whitespace-only output', () => {
    expect(parseGrepOutput('   \n  \n  ')).toBeNull();
  });

  it('handles content with colons', () => {
    const output = 'src/app.ts:10:const url = "http://example.com";';
    const groups = expectGroups(parseGrepOutput(output));
    expect(groups[0]?.matches[0]?.content).toBe('const url = "http://example.com";');
  });
});
