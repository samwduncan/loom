/**
 * SlashCommandPicker tests -- popup rendering, selection highlighting, click handling, empty states.
 *
 * Tests verify: command list rendering, data-selected attribute, click callback,
 * empty state text, ARIA attributes.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlashCommandPicker } from './SlashCommandPicker';
import type { SlashCommand } from '@/types/slash-command';

const MOCK_COMMANDS: SlashCommand[] = [
  { id: 'clear', label: '/clear', description: 'Clear conversation history' },
  { id: 'help', label: '/help', description: 'Show available commands' },
  { id: 'compact', label: '/compact', description: 'Compact conversation context' },
];

describe('SlashCommandPicker', () => {
  it('renders command results with label and description', () => {
    render(
      <SlashCommandPicker
        results={MOCK_COMMANDS}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );

    // Check labels
    expect(screen.getByText('/clear')).toBeInTheDocument();
    expect(screen.getByText('/help')).toBeInTheDocument();
    expect(screen.getByText('/compact')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('Clear conversation history')).toBeInTheDocument();
    expect(screen.getByText('Show available commands')).toBeInTheDocument();
    expect(screen.getByText('Compact conversation context')).toBeInTheDocument();
  });

  it('selected item has data-selected="true"', () => {
    render(
      <SlashCommandPicker
        results={MOCK_COMMANDS}
        selectedIndex={1}
        onSelect={vi.fn()}
      />,
    );

    const picker = screen.getByTestId('slash-picker');
    const items = within(picker).getAllByRole('option');
    expect(items[0]).not.toHaveAttribute('data-selected'); // ASSERT: index 0 exists (3 mock commands)
    expect(items[1]).toHaveAttribute('data-selected', 'true'); // ASSERT: index 1 exists (3 mock commands)
    expect(items[2]).not.toHaveAttribute('data-selected'); // ASSERT: index 2 exists (3 mock commands)
  });

  it('clicking an item calls onSelect with the command', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <SlashCommandPicker
        results={MOCK_COMMANDS}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText('/help'));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(MOCK_COMMANDS[1]); // ASSERT: index 1 is /help
  });

  it('shows "No commands found" when results empty', () => {
    render(
      <SlashCommandPicker
        results={[]}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('has role="listbox" on container and role="option" on items', () => {
    render(
      <SlashCommandPicker
        results={MOCK_COMMANDS}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(3);
  });

  it('items have correct aria-selected state', () => {
    render(
      <SlashCommandPicker
        results={MOCK_COMMANDS}
        selectedIndex={2}
        onSelect={vi.fn()}
      />,
    );

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false'); // ASSERT: index 0 exists (3 mock commands)
    expect(options[1]).toHaveAttribute('aria-selected', 'false'); // ASSERT: index 1 exists (3 mock commands)
    expect(options[2]).toHaveAttribute('aria-selected', 'true'); // ASSERT: index 2 exists (3 mock commands)
  });
});
