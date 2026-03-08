/**
 * BashToolCard tests -- covers TOOL-10 BashToolCard rendering.
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BashToolCard } from './BashToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';

function makeProps(overrides: Partial<ToolCardProps> = {}): ToolCardProps {
  return {
    toolName: 'Bash',
    input: { command: 'echo hello' },
    output: 'hello',
    isError: false,
    status: 'resolved',
    ...overrides,
  };
}

describe('BashToolCard', () => {
  it('renders command with $ prefix', () => {
    const { container } = render(<BashToolCard {...makeProps()} />);
    expect(container.textContent).toContain('$ echo hello');
  });

  it('renders output lines', () => {
    const { container } = render(
      <BashToolCard {...makeProps({ output: 'line1\nline2\nline3' })} />,
    );
    expect(container.textContent).toContain('line1');
    expect(container.textContent).toContain('line2');
    expect(container.textContent).toContain('line3');
  });

  it('truncates at 50 lines and shows "Show N more lines" button', () => {
    const lines = Array.from({ length: 80 }, (_, i) => `output-${i}`);
    const { container } = render(
      <BashToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    // Only first 50 lines should be rendered initially
    expect(container.textContent).toContain('output-0');
    expect(container.textContent).toContain('output-49');
    expect(container.textContent).not.toContain('output-50');

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Show 30 more lines');
  });

  it('expands to show all lines after clicking Show more', () => {
    const lines = Array.from({ length: 80 }, (_, i) => `output-${i}`);
    const { container } = render(
      <BashToolCard {...makeProps({ output: lines.join('\n') })} />,
    );
    const button = container.querySelector('button');
    fireEvent.click(button!); // ASSERT: button exists because output exceeds threshold
    expect(container.textContent).toContain('output-79');
  });

  it('renders ANSI colored output with correct CSS classes', () => {
    const { container } = render(
      <BashToolCard
        {...makeProps({ output: '\x1b[31mred text\x1b[0m' })}
      />,
    );
    const redSpan = container.querySelector('.ansi-red');
    expect(redSpan).not.toBeNull();
    expect(redSpan?.textContent).toBe('red text');
  });

  it('renders no output area when output is null', () => {
    const { container } = render(
      <BashToolCard {...makeProps({ output: null })} />,
    );
    // Command header should be present
    expect(container.textContent).toContain('$ echo hello');
    // No output lines or truncation button
    const button = container.querySelector('button');
    expect(button).toBeNull();
  });

  it('has error styling when isError is true', () => {
    const { container } = render(
      <BashToolCard
        {...makeProps({ output: 'error output', isError: true })}
      />,
    );
    const errorDiv = container.querySelector('[class*="status-error"]');
    expect(errorDiv).not.toBeNull();
  });

  it('escapes HTML entities in output (no XSS)', () => {
    const { container } = render(
      <BashToolCard
        {...makeProps({ output: '<script>alert("xss")</script>' })}
      />,
    );
    // Should not contain actual script element
    expect(container.querySelector('script')).toBeNull();
    // Should show escaped text
    expect(container.textContent).toContain('<script>alert("xss")</script>');
  });
});
