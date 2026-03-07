/**
 * SystemMessage tests -- centered muted system text.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemMessage } from './SystemMessage';
import type { Message } from '@/types/message';

function makeSystemMessage(content: string): Message {
  return {
    id: 'sys-1',
    role: 'system',
    content,
    metadata: {
      timestamp: '2026-03-07T12:00:00Z',
      tokenCount: null,
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

describe('SystemMessage', () => {
  it('renders the system text content', () => {
    render(<SystemMessage message={makeSystemMessage('Session started')} />);
    expect(screen.getByText('Session started')).toBeInTheDocument();
  });

  it('has text-muted and text-xs classes', () => {
    render(<SystemMessage message={makeSystemMessage('System text')} />);
    const inner = screen.getByTestId('system-message-inner');
    expect(inner.className).toContain('text-muted');
    expect(inner.className).toContain('text-xs');
  });

  it('wraps in MessageContainer with role="system"', () => {
    render(<SystemMessage message={makeSystemMessage('System text')} />);
    const wrapper = screen.getByTestId('message-container');
    expect(wrapper.dataset.role).toBe('system');
  });
});
