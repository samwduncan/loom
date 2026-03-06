/**
 * SessionItem tests -- title display, truncation, active state, provider logo, click.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SessionItem } from './SessionItem';

describe('SessionItem', () => {
  const defaultProps = {
    id: 'sess-1',
    title: 'Help with TypeScript generics',
    updatedAt: new Date().toISOString(),
    providerId: 'claude' as const,
    isActive: false,
    onClick: vi.fn(),
    onContextMenu: vi.fn(),
  };

  it('renders session title', () => {
    render(<SessionItem {...defaultProps} />);
    expect(screen.getByText('Help with TypeScript generics')).toBeInTheDocument();
  });

  it('has truncation CSS class on title', () => {
    render(<SessionItem {...defaultProps} />);
    const title = screen.getByText('Help with TypeScript generics');
    expect(title.className).toContain('truncate');
  });

  it('renders provider logo SVG', () => {
    const { container } = render(<SessionItem {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies active state CSS when isActive is true', () => {
    const { container } = render(<SessionItem {...defaultProps} isActive={true} />);
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('session-item-active');
  });

  it('does not apply active state CSS when isActive is false', () => {
    const { container } = render(<SessionItem {...defaultProps} isActive={false} />);
    const item = container.firstChild as HTMLElement;
    expect(item.className).not.toContain('session-item-active');
  });

  it('has role="option" for accessibility within listbox', () => {
    render(<SessionItem {...defaultProps} />);
    const option = screen.getByRole('option');
    expect(option).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<SessionItem {...defaultProps} onClick={onClick} />);
    await user.click(screen.getByRole('option'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Enter key press', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<SessionItem {...defaultProps} onClick={onClick} />);
    const option = screen.getByRole('option');
    option.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets aria-selected based on isActive', () => {
    const { rerender } = render(<SessionItem {...defaultProps} isActive={false} />);
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');

    rerender(<SessionItem {...defaultProps} isActive={true} />);
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  });
});
