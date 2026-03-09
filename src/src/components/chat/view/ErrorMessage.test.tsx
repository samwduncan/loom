/**
 * ErrorMessage tests -- inline error banner with red accent.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage';
import type { Message } from '@/types/message';

function makeErrorMessage(content: string): Message {
  return {
    id: 'err-1',
    role: 'error',
    content,
    metadata: {
      timestamp: '2026-03-07T12:00:00Z',
      tokenCount: null,
      inputTokens: null,
      outputTokens: null,
      cacheReadTokens: null,
      cost: null,
      duration: null,
    },
    providerContext: {
      providerId: 'claude',
      modelId: '',
      agentName: null,
    },
  };
}

describe('ErrorMessage', () => {
  it('renders the error text content', () => {
    render(<ErrorMessage message={makeErrorMessage('Something went wrong')} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has border-l-4 border-destructive accent', () => {
    render(<ErrorMessage message={makeErrorMessage('Error text')} />);
    const inner = screen.getByTestId('error-message-inner');
    expect(inner.className).toContain('border-l-4');
    expect(inner.className).toContain('border-destructive');
  });

  it('has bg-destructive/10 muted background', () => {
    render(<ErrorMessage message={makeErrorMessage('Error text')} />);
    const inner = screen.getByTestId('error-message-inner');
    expect(inner.className).toContain('bg-destructive/10');
  });

  it('renders an AlertCircle icon (svg element)', () => {
    render(<ErrorMessage message={makeErrorMessage('Error text')} />);
    const container = screen.getByTestId('error-message-inner');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('wraps in MessageContainer with role="error"', () => {
    render(<ErrorMessage message={makeErrorMessage('Error text')} />);
    const wrapper = screen.getByTestId('message-container');
    expect(wrapper.dataset.role).toBe('error');
  });
});
