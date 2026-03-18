/**
 * Tests for DeleteSessionDialog -- singular/plural text based on count.
 *
 * Constitution: Named export only (2.2).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeleteSessionDialog } from './DeleteSessionDialog';

describe('DeleteSessionDialog', () => {
  it('shows singular text when count is 1 (default)', () => {
    render(
      <DeleteSessionDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('Delete session?')).toBeInTheDocument();
    expect(
      screen.getByText(/This will permanently delete this session/),
    ).toBeInTheDocument();
  });

  it('shows plural text when count is 5', () => {
    render(
      <DeleteSessionDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        count={5}
      />,
    );

    expect(screen.getByText('Delete 5 sessions?')).toBeInTheDocument();
    expect(
      screen.getByText(/This will permanently delete 5 sessions/),
    ).toBeInTheDocument();
  });

  it('shows singular text when count is explicitly 1', () => {
    render(
      <DeleteSessionDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        count={1}
      />,
    );

    expect(screen.getByText('Delete session?')).toBeInTheDocument();
  });
});
