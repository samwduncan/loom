/**
 * ReadToolCard tests -- covers TOOL-11 file content card rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ReadToolCard } from './ReadToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';

// Mock Shiki -- we test the fallback plain text rendering, not Shiki itself
vi.mock('@/lib/shiki-highlighter', () => ({
  highlightCode: vi.fn().mockResolvedValue(''),
  getLanguageFromPath: vi.fn().mockReturnValue('text'),
}));

function makeProps(overrides: Partial<ToolCardProps> = {}): ToolCardProps {
  return {
    toolName: 'Read',
    input: { file_path: 'src/utils/auth.ts' },
    output: 'const foo = "bar";\nexport default foo;',
    isError: false,
    status: 'resolved',
    ...overrides,
  };
}

describe('ReadToolCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file path', () => {
    const { container } = render(<ReadToolCard {...makeProps()} />);
    expect(container.textContent).toContain('src/utils/auth.ts');
  });

  it('renders file path icon (FileText svg)', () => {
    const { container } = render(<ReadToolCard {...makeProps()} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders output content as plain text fallback', () => {
    const { container } = render(<ReadToolCard {...makeProps()} />);
    expect(container.textContent).toContain('const foo = "bar"');
    expect(container.textContent).toContain('export default foo;');
  });

  it('truncates at 100 lines with show more button', () => {
    const lines = Array.from({ length: 150 }, (_, i) => `line-${i}`);
    const { container } = render(
      <ReadToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    // First 100 lines visible
    expect(container.textContent).toContain('line-0');
    expect(container.textContent).toContain('line-99');
    // Line 100 should NOT be visible
    expect(container.textContent).not.toContain('line-100');

    const button = container.querySelector('button:not([aria-label])');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Show 50 more lines');
  });

  it('expands to show all lines after clicking Show more', () => {
    const lines = Array.from({ length: 150 }, (_, i) => `line-${i}`);
    const { container } = render(
      <ReadToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    const button = container.querySelector('button:not([aria-label])');
    fireEvent.click(button!); // ASSERT: button exists because output exceeds threshold
    expect(container.textContent).toContain('line-149');
  });

  it('shows "Show less" when expanded', () => {
    const lines = Array.from({ length: 150 }, (_, i) => `line-${i}`);
    const { container } = render(
      <ReadToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    const showMore = container.querySelector('button:not([aria-label])');
    fireEvent.click(showMore!); // ASSERT: button exists
    const showLess = container.querySelector('button:not([aria-label])');
    expect(showLess?.textContent).toBe('Show less');
  });

  it('does not truncate when lines <= 100', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line-${i}`);
    const { container } = render(
      <ReadToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    // No truncation button
    const buttons = container.querySelectorAll('button:not([aria-label])');
    expect(buttons.length).toBe(0);
  });

  it('handles null output gracefully', () => {
    const { container } = render(
      <ReadToolCard {...makeProps({ output: null })} />,
    );
    expect(container.textContent).toContain('src/utils/auth.ts');
    expect(container.textContent).toContain('No content');
  });

  it('handles missing file_path gracefully', () => {
    const { container } = render(
      <ReadToolCard {...makeProps({ input: {} })} />,
    );
    expect(container.textContent).toContain('unknown');
  });

  it('has a copy button when output is present', () => {
    const { container } = render(<ReadToolCard {...makeProps()} />);
    const copyBtn = container.querySelector('button[aria-label="Copy file content"]');
    expect(copyBtn).not.toBeNull();
  });
});
