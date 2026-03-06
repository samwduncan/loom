/**
 * ScrollToBottomPill tests -- floating scroll-to-bottom button with frosted glass.
 *
 * Tests verify rendering, visibility states, click callback, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrollToBottomPill } from './ScrollToBottomPill';

describe('ScrollToBottomPill', () => {
  it('renders with "Scroll to bottom" text', () => {
    render(<ScrollToBottomPill visible={true} onClick={vi.fn()} />);
    expect(screen.getByText('Scroll to bottom')).toBeInTheDocument();
  });

  it('renders a down arrow icon (svg element)', () => {
    render(<ScrollToBottomPill visible={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('when visible=true, pill has opacity 1 and no pointer-events restriction', () => {
    render(<ScrollToBottomPill visible={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-100');
    expect(button.className).not.toContain('pointer-events-none');
  });

  it('when visible=false, pill has opacity 0 and pointer-events none', () => {
    render(<ScrollToBottomPill visible={false} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-0');
    expect(button.className).toContain('pointer-events-none');
  });

  it('clicking the pill calls the onClick callback', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ScrollToBottomPill visible={true} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('pill has z-index from --z-scroll-pill token', () => {
    render(<ScrollToBottomPill visible={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.style.zIndex).toBe('var(--z-scroll-pill)');
  });

  it('pill has role="button" and aria-label for accessibility', () => {
    render(<ScrollToBottomPill visible={true} onClick={vi.fn()} />);
    const button = screen.getByRole('button', {
      name: 'Scroll to bottom',
    });
    expect(button).toBeInTheDocument();
  });
});
