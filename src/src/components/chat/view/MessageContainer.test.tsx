/**
 * MessageContainer tests -- verifies CSS-only content-visibility
 * (no inline styles) and role-based rendering.
 *
 * content-visibility is now applied via CSS .msg-item class in MessageList.tsx,
 * not inline styles. See SCROLL-05 / Pitfall 5.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageContainer } from './MessageContainer';

describe('MessageContainer', () => {
  describe('content-visibility optimization (CSS-only, no inline styles)', () => {
    it('does not apply inline content-visibility styles to finalized assistant messages', () => {
      render(
        <MessageContainer role="assistant">
          <p>Hello</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.contentVisibility).toBe('');
      expect(container.style.containIntrinsicHeight).toBe('');
    });

    it('does not apply inline content-visibility styles to streaming messages', () => {
      render(
        <MessageContainer role="assistant" isStreaming>
          <p>Streaming...</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.contentVisibility).toBe('');
    });

    it('does not apply inline content-visibility styles to user messages', () => {
      render(
        <MessageContainer role="user">
          <p>User message</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.contentVisibility).toBe('');
      expect(container.style.containIntrinsicHeight).toBe('');
    });
  });

  describe('role-based rendering', () => {
    it('renders user messages with right-aligned bubble', () => {
      render(
        <MessageContainer role="user">
          <p>User message</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container).toHaveAttribute('data-role', 'user');
      expect(container.className).toContain('justify-end');
    });

    it('renders assistant messages full-width', () => {
      render(
        <MessageContainer role="assistant">
          <p>Assistant message</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container).toHaveAttribute('data-role', 'assistant');
      expect(container.className).not.toContain('justify-end');
    });

    it('renders system messages centered', () => {
      render(
        <MessageContainer role="system">
          <p>System message</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container).toHaveAttribute('data-role', 'system');
      expect(container.className).toContain('justify-center');
    });
  });
});
