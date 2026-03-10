import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';
import { useUIStore } from '@/stores/ui';

describe('CommandPalette', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it('does not render dialog content when closed', () => {
    render(<CommandPalette />);
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
  });

  it('renders dialog with input when open', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    render(<CommandPalette />);
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('shows "No results found" as empty state when open', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    render(<CommandPalette />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('has the correct dialog label for accessibility', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    render(<CommandPalette />);
    expect(screen.getByRole('dialog', { name: 'Command Palette' })).toBeInTheDocument();
  });
});
