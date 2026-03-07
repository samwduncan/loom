import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the highlighter module before importing CodeBlock
vi.mock('@/lib/shiki-highlighter', () => ({
  highlightCode: vi.fn(),
}));

import { CodeBlock } from './CodeBlock';
import { highlightCode } from '@/lib/shiki-highlighter';

const mockedHighlight = vi.mocked(highlightCode);

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: never resolve so we test fallback state
    mockedHighlight.mockReturnValue(new Promise(() => {}));
  });

  it('renders code text as fallback before highlight resolves', () => {
    render(<CodeBlock language="typescript" code="const x = 1" />);
    expect(screen.getByText('const x = 1')).toBeInTheDocument();
  });

  it('shows language label text', () => {
    render(<CodeBlock language="typescript" code="const x = 1" />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('copy button exists with correct aria-label', () => {
    render(<CodeBlock language="typescript" code="const x = 1" />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('blocks with 5 lines show line number gutter', () => {
    const fiveLines = 'line1\nline2\nline3\nline4\nline5';
    const { container } = render(<CodeBlock language="text" code={fiveLines} />);
    // Line numbers should be present via gutter elements
    const gutter = container.querySelector('[data-line-numbers]');
    expect(gutter).toBeInTheDocument();
  });

  it('blocks with 2 lines do NOT show line number gutter', () => {
    const twoLines = 'line1\nline2';
    const { container } = render(<CodeBlock language="text" code={twoLines} />);
    const gutter = container.querySelector('[data-line-numbers]');
    expect(gutter).not.toBeInTheDocument();
  });

  it('container has min-height style attribute', () => {
    const { container } = render(<CodeBlock language="typescript" code="const x = 1" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.minHeight).toBeTruthy();
  });

  it('blocks with 25 lines have max-height constraint', () => {
    const lines = Array.from({ length: 25 }, (_, i) => `line ${i + 1}`).join('\n');
    const { container } = render(<CodeBlock language="text" code={lines} />);
    const codeContainer = container.querySelector('[data-code-scroll]') as HTMLElement;
    expect(codeContainer.className).toContain('max-h-[400px]');
  });

  it('replaces fallback with highlighted HTML after highlight resolves', async () => {
    const highlighted = '<pre class="shiki"><code><span class="line">const x = 1</span></code></pre>';
    mockedHighlight.mockResolvedValue(highlighted);

    const { container } = render(<CodeBlock language="typescript" code="const x = 1" />);

    await waitFor(() => {
      const shikiOutput = container.querySelector('[data-highlighted]');
      expect(shikiOutput).toBeInTheDocument();
    });
  });

  it('copy button changes to "Copied!" on click', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<CodeBlock language="typescript" code="const x = 1" />);
    const copyBtn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1');
  });
});
