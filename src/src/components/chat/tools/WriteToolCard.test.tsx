/**
 * WriteToolCard tests -- covers TOOL-13 file write preview card rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { WriteToolCard } from './WriteToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';

// Mock Shiki -- we test the fallback plain text rendering, not Shiki itself
vi.mock('@/lib/shiki-highlighter', () => ({
  highlightCode: vi.fn().mockResolvedValue(''),
  getLanguageFromPath: vi.fn().mockReturnValue('text'),
}));

function makeProps(overrides: Partial<ToolCardProps> = {}): ToolCardProps {
  return {
    toolName: 'Write',
    input: { file_path: 'src/config/app.ts' },
    output: 'export const config = {\n  port: 3000,\n  host: "localhost",\n};',
    isError: false,
    status: 'resolved',
    ...overrides,
  };
}

describe('WriteToolCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file path', () => {
    const { container } = render(<WriteToolCard {...makeProps()} />);
    expect(container.textContent).toContain('src/config/app.ts');
  });

  it('renders file path icon (FilePlus svg)', () => {
    const { container } = render(<WriteToolCard {...makeProps()} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders preview content', () => {
    const { container } = render(<WriteToolCard {...makeProps()} />);
    expect(container.textContent).toContain('export const config');
    expect(container.textContent).toContain('port: 3000');
  });

  it('truncates at 20 lines with "Show full file" button', () => {
    const lines = Array.from({ length: 40 }, (_, i) => `line-${i}`);
    const { container } = render(
      <WriteToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    // First 20 lines visible
    expect(container.textContent).toContain('line-0');
    expect(container.textContent).toContain('line-19');
    // Line 20 should NOT be visible
    expect(container.textContent).not.toContain('line-20');

    const button = container.querySelector('button:not([aria-label])');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Show full file');
  });

  it('expands to show all lines after clicking Show full file', () => {
    const lines = Array.from({ length: 40 }, (_, i) => `line-${i}`);
    const { container } = render(
      <WriteToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    const button = container.querySelector('button:not([aria-label])');
    fireEvent.click(button!); // ASSERT: button exists because output exceeds threshold
    expect(container.textContent).toContain('line-39');
  });

  it('handles null output gracefully', () => {
    const { container } = render(
      <WriteToolCard {...makeProps({ output: null })} />,
    );
    expect(container.textContent).toContain('src/config/app.ts');
    expect(container.textContent).toContain('No content');
  });

  it('does not truncate when lines <= 20', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line-${i}`);
    const { container } = render(
      <WriteToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    const buttons = container.querySelectorAll('button:not([aria-label])');
    expect(buttons.length).toBe(0);
  });
});
