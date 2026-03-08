/**
 * GrepToolCard tests -- covers TOOL-15 GrepToolCard rendering.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { GrepToolCard } from './GrepToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';

function makeProps(overrides: Partial<ToolCardProps> = {}): ToolCardProps {
  return {
    toolName: 'Grep',
    input: { pattern: 'useState' },
    output: 'src/App.tsx:5:import { useState } from "react";\nsrc/App.tsx:12:  const [count, setCount] = useState(0);',
    isError: false,
    status: 'resolved',
    ...overrides,
  };
}

describe('GrepToolCard', () => {
  it('renders the search pattern', () => {
    const { container } = render(<GrepToolCard {...makeProps()} />);
    expect(container.textContent).toContain('useState');
  });

  it('renders grouped matches by file', () => {
    const { container } = render(<GrepToolCard {...makeProps()} />);
    expect(container.textContent).toContain('src/App.tsx');
    expect(container.textContent).toContain('import { useState } from "react";');
    expect(container.textContent).toContain('const [count, setCount] = useState(0);');
  });

  it('shows line numbers', () => {
    const { container } = render(<GrepToolCard {...makeProps()} />);
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('12');
  });

  it('highlights match terms in content', () => {
    const { container } = render(<GrepToolCard {...makeProps()} />);
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
    // All marks should contain the search term
    for (const mark of marks) {
      expect(mark.textContent?.toLowerCase()).toBe('usestate');
    }
  });

  it('shows summary with match and file counts', () => {
    const { container } = render(<GrepToolCard {...makeProps()} />);
    expect(container.textContent).toContain('2 matches in 1 file');
  });

  it('shows plural files in summary', () => {
    const output = [
      'src/a.ts:1:foo',
      'src/b.ts:2:foo',
      'src/c.ts:3:foo',
    ].join('\n');
    const { container } = render(
      <GrepToolCard {...makeProps({ output })} />,
    );
    expect(container.textContent).toContain('3 matches in 3 files');
  });

  it('truncates at 5 files and shows "Show N more files" button', () => {
    const lines = Array.from(
      { length: 8 },
      (_, i) => `src/file${i}.ts:1:match content`,
    );
    const { container } = render(
      <GrepToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    // First 5 files visible
    expect(container.textContent).toContain('src/file0.ts');
    expect(container.textContent).toContain('src/file4.ts');
    // 6th file hidden
    expect(container.textContent).not.toContain('src/file5.ts');

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Show 3 more files');
  });

  it('expands to show all files after clicking Show more', () => {
    const lines = Array.from(
      { length: 8 },
      (_, i) => `src/file${i}.ts:1:match content`,
    );
    const { container } = render(
      <GrepToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    const button = container.querySelector('button');
    fireEvent.click(button!); // ASSERT: button exists because file count exceeds threshold
    expect(container.textContent).toContain('src/file7.ts');
  });

  it('falls back to plain text on unparseable output', () => {
    const { container } = render(
      <GrepToolCard
        {...makeProps({ output: 'just some plain text with no grep format' })}
      />,
    );
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toBe('just some plain text with no grep format');
  });

  it('handles null output (executing state)', () => {
    const { container } = render(
      <GrepToolCard {...makeProps({ output: null })} />,
    );
    expect(container.textContent).toContain('useState');
    // No results body rendered
    expect(container.querySelector('pre')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });

  it('skips highlighting for invalid regex patterns', () => {
    const { container } = render(
      <GrepToolCard
        {...makeProps({
          input: { pattern: '[invalid(' },
          output: 'src/a.ts:1:some content',
        })}
      />,
    );
    // Should render without crashing, no <mark> elements
    expect(container.textContent).toContain('some content');
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(0);
  });

  it('renders File icons for each file group', () => {
    const { container } = render(<GrepToolCard {...makeProps()} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
