/**
 * SessionItem tests -- title display, truncation, active state, provider logo, click,
 * inline rename (double-click, Enter, Escape, blur).
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
    onRename: vi.fn(),
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

  // -- Inline rename tests --

  describe('inline rename', () => {
    it('enters edit mode on double-click of title', async () => {
      const user = userEvent.setup();
      render(<SessionItem {...defaultProps} />);

      const title = screen.getByText('Help with TypeScript generics');
      await user.dblClick(title);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Help with TypeScript generics');
    });

    it('calls onRename with new value when Enter is pressed', async () => {
      const onRename = vi.fn();
      const user = userEvent.setup();
      render(<SessionItem {...defaultProps} onRename={onRename} />);

      const title = screen.getByText('Help with TypeScript generics');
      await user.dblClick(title);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'New title{Enter}');

      expect(onRename).toHaveBeenCalledWith('sess-1', 'New title');
    });

    it('cancels edit on Escape without calling onRename', async () => {
      const onRename = vi.fn();
      const user = userEvent.setup();
      render(<SessionItem {...defaultProps} onRename={onRename} />);

      const title = screen.getByText('Help with TypeScript generics');
      await user.dblClick(title);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'New title{Escape}');

      expect(onRename).not.toHaveBeenCalled();
      // Title should be restored
      expect(screen.getByText('Help with TypeScript generics')).toBeInTheDocument();
    });

    it('confirms edit on blur', async () => {
      const onRename = vi.fn();
      const user = userEvent.setup();
      render(<SessionItem {...defaultProps} onRename={onRename} />);

      const title = screen.getByText('Help with TypeScript generics');
      await user.dblClick(title);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Blurred title');
      await user.tab(); // triggers blur

      expect(onRename).toHaveBeenCalledWith('sess-1', 'Blurred title');
    });

    it('does NOT call onRename when input is empty', async () => {
      const onRename = vi.fn();
      const user = userEvent.setup();
      render(<SessionItem {...defaultProps} onRename={onRename} />);

      const title = screen.getByText('Help with TypeScript generics');
      await user.dblClick(title);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.keyboard('{Enter}');

      expect(onRename).not.toHaveBeenCalled();
    });

    it('does NOT call onRename when value unchanged', async () => {
      const onRename = vi.fn();
      const user = userEvent.setup();
      render(<SessionItem {...defaultProps} onRename={onRename} />);

      const title = screen.getByText('Help with TypeScript generics');
      await user.dblClick(title);

      // Press Enter without changing value
      await user.keyboard('{Enter}');

      expect(onRename).not.toHaveBeenCalled();
    });

    it('enters edit mode when isEditing prop is true', () => {
      render(<SessionItem {...defaultProps} isEditing={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Help with TypeScript generics');
    });

    it('single click does not enter edit mode', async () => {
      const user = userEvent.setup();
      render(<SessionItem {...defaultProps} />);

      await user.click(screen.getByRole('option'));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });
});
