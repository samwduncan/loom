/**
 * InlineError -- unit tests for inline error display with retry.
 *
 * Constitution: Vitest + React Testing Library (2.5).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineError } from './InlineError';

describe('InlineError', () => {
  it('renders the error message text', () => {
    render(<InlineError message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders an AlertCircle icon', () => {
    render(<InlineError message="fail" />);
    const alert = screen.getByRole('alert');
    // lucide-react renders <svg> elements
    const svg = alert.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders a retry button when onRetry is provided', () => {
    render(<InlineError message="fail" onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('does NOT render a retry button when onRetry is omitted', () => {
    render(<InlineError message="fail" />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('calls onRetry when the retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<InlineError message="fail" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has role="alert" on the wrapper', () => {
    render(<InlineError message="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
