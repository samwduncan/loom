/**
 * TokenUsage tests -- expandable token usage footer for assistant messages.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TokenUsage } from './TokenUsage';
import type { MessageMetadata } from '@/types/message';

function makeMetadata(overrides: Partial<MessageMetadata> = {}): MessageMetadata {
  return {
    timestamp: '2026-03-17T00:00:00Z',
    tokenCount: null,
    inputTokens: null,
    outputTokens: null,
    cacheReadTokens: null,
    cost: null,
    duration: null,
    ...overrides,
  };
}

describe('TokenUsage', () => {
  it('renders nothing when all metadata fields are null', () => {
    const { container } = render(<TokenUsage metadata={makeMetadata()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders compact summary with token counts and cost', () => {
    render(
      <TokenUsage
        metadata={makeMetadata({
          inputTokens: 1234,
          outputTokens: 567,
          cost: 0.012,
        })}
      />,
    );

    const summary = screen.getByTestId('token-usage-summary');
    expect(summary).toBeInTheDocument();
    expect(summary.textContent).toContain('1,234');
    expect(summary.textContent).toContain('567');
    expect(summary.textContent).toContain('$0.012');
  });

  it('renders cache info when cacheReadTokens > 0', () => {
    render(
      <TokenUsage
        metadata={makeMetadata({
          inputTokens: 1000,
          outputTokens: 200,
          cacheReadTokens: 500,
          cost: 0.01,
        })}
      />,
    );

    const summary = screen.getByTestId('token-usage-summary');
    expect(summary.textContent).toContain('cached');
    expect(summary.textContent).toContain('500');
  });

  it('clicking summary toggles expanded state', async () => {
    const user = userEvent.setup();
    render(
      <TokenUsage
        metadata={makeMetadata({
          inputTokens: 1000,
          outputTokens: 200,
          cost: 0.01,
        })}
      />,
    );

    // Initially no detail view visible
    expect(screen.queryByTestId('token-usage-detail')).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByTestId('token-usage-summary'));
    expect(screen.getByTestId('token-usage-detail')).toBeInTheDocument();

    // Click again to collapse
    await user.click(screen.getByTestId('token-usage-summary'));
    expect(screen.queryByTestId('token-usage-detail')).not.toBeInTheDocument();
  });

  it('expanded view shows labeled breakdown rows', async () => {
    const user = userEvent.setup();
    render(
      <TokenUsage
        metadata={makeMetadata({
          inputTokens: 5000,
          outputTokens: 1200,
          cacheReadTokens: 3000,
          cost: 0.025,
        })}
      />,
    );

    await user.click(screen.getByTestId('token-usage-summary'));
    const detail = screen.getByTestId('token-usage-detail');

    expect(detail.textContent).toContain('Input tokens');
    expect(detail.textContent).toContain('5,000');
    expect(detail.textContent).toContain('Output tokens');
    expect(detail.textContent).toContain('1,200');
    expect(detail.textContent).toContain('Cache read');
    expect(detail.textContent).toContain('3,000');
    expect(detail.textContent).toContain('Cost');
    expect(detail.textContent).toContain('$0.025');
  });

  it('expanded view hides cache row when cacheReadTokens is 0', async () => {
    const user = userEvent.setup();
    render(
      <TokenUsage
        metadata={makeMetadata({
          inputTokens: 1000,
          outputTokens: 200,
          cacheReadTokens: 0,
          cost: 0.005,
        })}
      />,
    );

    await user.click(screen.getByTestId('token-usage-summary'));
    const detail = screen.getByTestId('token-usage-detail');

    expect(detail.textContent).toContain('Input tokens');
    expect(detail.textContent).toContain('Output tokens');
    expect(detail.textContent).not.toContain('Cache read');
  });

  it('expanded view hides cache row when cacheReadTokens is null', async () => {
    const user = userEvent.setup();
    render(
      <TokenUsage
        metadata={makeMetadata({
          inputTokens: 1000,
          outputTokens: 200,
          cost: 0.005,
        })}
      />,
    );

    await user.click(screen.getByTestId('token-usage-summary'));
    const detail = screen.getByTestId('token-usage-detail');

    expect(detail.textContent).not.toContain('Cache read');
  });
});
