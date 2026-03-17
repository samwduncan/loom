/**
 * MessageContainer tests -- verifies content-visibility optimization
 * for finalized vs streaming messages.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageContainer } from './MessageContainer';

describe('MessageContainer', () => {
  describe('content-visibility optimization', () => {
    it('applies content-visibility: auto to finalized assistant messages', () => {
      render(
        <MessageContainer role="assistant">
          <p>Hello</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.contentVisibility).toBe('auto');
    });

    it('applies contain-intrinsic-height to finalized messages', () => {
      render(
        <MessageContainer role="assistant">
          <p>Hello</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.containIntrinsicHeight).toBe('auto 200px');
    });

    it('does NOT apply content-visibility to streaming messages', () => {
      render(
        <MessageContainer role="assistant" isStreaming>
          <p>Streaming...</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.contentVisibility).toBe('');
    });

    it('applies content-visibility to finalized user messages', () => {
      render(
        <MessageContainer role="user">
          <p>User message</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.contentVisibility).toBe('auto');
      expect(container.style.containIntrinsicHeight).toBe('auto 200px');
    });

    it('does NOT apply content-visibility to streaming user messages', () => {
      render(
        <MessageContainer role="user" isStreaming>
          <p>User streaming</p>
        </MessageContainer>,
      );

      const container = screen.getByTestId('message-container');
      expect(container.style.contentVisibility).toBe('');
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
