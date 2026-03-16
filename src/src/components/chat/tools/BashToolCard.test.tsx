/**
 * BashToolCard tests -- covers TOOL-10 BashToolCard rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { BashToolCard } from './BashToolCard';
import type { ToolCardProps } from '@/lib/tool-registry';
vi.mock('@/lib/shell-input', () => ({
  sendToShell: vi.fn(() => true),
}));

const mockSetActiveTab = vi.fn();
vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ setActiveTab: mockSetActiveTab }),
  ),
}));

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
    render(<BashToolCard {...makeProps({ output: null })} />);
    // Command header should be present
    expect(screen.getByText('echo hello')).toBeTruthy();
    // No truncation "Show more" button (Run in Terminal may still appear)
    expect(screen.queryByRole('button', { name: /show.*more/i })).toBeNull();
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

  describe('Run in Terminal button', () => {
    it('renders when status is resolved and command is non-empty', () => {
      render(<BashToolCard {...makeProps()} />);
      expect(
        screen.getByRole('button', { name: /run in terminal/i }),
      ).toBeTruthy();
    });

    it('does NOT render when status is invoked', () => {
      render(<BashToolCard {...makeProps({ status: 'invoked' })} />);
      expect(
        screen.queryByRole('button', { name: /run in terminal/i }),
      ).toBeNull();
    });

    it('does NOT render when status is executing', () => {
      render(<BashToolCard {...makeProps({ status: 'executing' })} />);
      expect(
        screen.queryByRole('button', { name: /run in terminal/i }),
      ).toBeNull();
    });

    it('does NOT render when command is empty', () => {
      render(
        <BashToolCard
          {...makeProps({ input: { command: '' } })}
        />,
      );
      expect(
        screen.queryByRole('button', { name: /run in terminal/i }),
      ).toBeNull();
    });

    it('calls setActiveTab("shell") on click', () => {
      mockSetActiveTab.mockClear();
      render(<BashToolCard {...makeProps()} />);
      const button = screen.getByRole('button', { name: /run in terminal/i });
      fireEvent.click(button);

      expect(mockSetActiveTab).toHaveBeenCalledWith('shell');
    });
  });
});
