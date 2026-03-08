/**
 * GlobToolCard tests -- covers TOOL-14 GlobToolCard rendering.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { GlobToolCard } from './GlobToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';

function makeProps(overrides: Partial<ToolCardProps> = {}): ToolCardProps {
  return {
    toolName: 'Glob',
    input: { pattern: '**/*.ts' },
    output: 'src/index.ts\nsrc/utils.ts\nsrc/main.ts',
    isError: false,
    status: 'resolved',
    ...overrides,
  };
}

describe('GlobToolCard', () => {
  it('renders the glob pattern', () => {
    const { container } = render(<GlobToolCard {...makeProps()} />);
    expect(container.textContent).toContain('**/*.ts');
  });

  it('renders file list from output', () => {
    const { container } = render(<GlobToolCard {...makeProps()} />);
    expect(container.textContent).toContain('src/index.ts');
    expect(container.textContent).toContain('src/utils.ts');
    expect(container.textContent).toContain('src/main.ts');
  });

  it('shows file count', () => {
    const { container } = render(<GlobToolCard {...makeProps()} />);
    expect(container.textContent).toContain('3 files found');
  });

  it('shows singular "file" for single result', () => {
    const { container } = render(
      <GlobToolCard {...makeProps({ output: 'one.ts' })} />,
    );
    expect(container.textContent).toContain('1 file found');
  });

  it('truncates at 20 files and shows "Show N more files" button', () => {
    const files = Array.from({ length: 30 }, (_, i) => `file-${i}.ts`);
    const { container } = render(
      <GlobToolCard {...makeProps({ output: files.join('\n') })} />,
    );
    // First 20 visible
    expect(container.textContent).toContain('file-0.ts');
    expect(container.textContent).toContain('file-19.ts');
    // 21st not visible
    expect(container.textContent).not.toContain('file-20.ts');

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Show 10 more files');
  });

  it('expands to show all files after clicking Show more', () => {
    const files = Array.from({ length: 30 }, (_, i) => `file-${i}.ts`);
    const { container } = render(
      <GlobToolCard {...makeProps({ output: files.join('\n') })} />,
    );
    const button = container.querySelector('button');
    fireEvent.click(button!); // ASSERT: button exists because file count exceeds threshold
    expect(container.textContent).toContain('file-29.ts');
  });

  it('handles null output (executing state)', () => {
    const { container } = render(
      <GlobToolCard {...makeProps({ output: null })} />,
    );
    expect(container.textContent).toContain('**/*.ts');
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders FileCode icon for code file extensions', () => {
    const { container } = render(
      <GlobToolCard {...makeProps({ output: 'src/app.tsx' })} />,
    );
    // Lucide icons render as SVGs
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('renders Folder icon for directory paths', () => {
    const { container } = render(
      <GlobToolCard {...makeProps({ output: 'src/components/' })} />,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('renders FileText icon for non-code files', () => {
    const { container } = render(
      <GlobToolCard {...makeProps({ output: 'README.md' })} />,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('left-truncates long file paths', () => {
    const longPath = 'a'.repeat(80) + '.ts';
    const { container } = render(
      <GlobToolCard {...makeProps({ output: longPath })} />,
    );
    expect(container.textContent).toContain('...');
  });

  it('filters out empty lines from output', () => {
    const { container } = render(
      <GlobToolCard {...makeProps({ output: 'file1.ts\n\nfile2.ts\n' })} />,
    );
    expect(container.textContent).toContain('2 files found');
  });

  it('defaults pattern to * when not provided', () => {
    const { container } = render(
      <GlobToolCard {...makeProps({ input: {} })} />,
    );
    expect(container.textContent).toContain('*');
  });
});
