/**
 * MentionPicker tests -- popup rendering, selection highlighting, click handling, empty states.
 *
 * Tests verify: file list rendering, data-selected attribute, click callback,
 * empty/loading state text.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MentionPicker } from './MentionPicker';
import type { FileMention } from '@/types/mention';

const MOCK_RESULTS: FileMention[] = [
  { path: 'src/components/App.tsx', name: 'App.tsx' },
  { path: 'src/components/Header.tsx', name: 'Header.tsx' },
  { path: 'src/utils/cn.ts', name: 'cn.ts' },
];

describe('MentionPicker', () => {
  it('renders file results with filename and directory path', () => {
    render(
      <MentionPicker
        results={MOCK_RESULTS}
        selectedIndex={0}
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );

    // Check filenames
    expect(screen.getByText('App.tsx')).toBeInTheDocument();
    expect(screen.getByText('Header.tsx')).toBeInTheDocument();
    expect(screen.getByText('cn.ts')).toBeInTheDocument();

    // Check directory paths (src/components/ appears twice -- two files in that dir)
    expect(screen.getAllByText('src/components/')).toHaveLength(2);
    expect(screen.getByText('src/utils/')).toBeInTheDocument();
  });

  it('selected item has data-selected="true"', () => {
    render(
      <MentionPicker
        results={MOCK_RESULTS}
        selectedIndex={1}
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );

    const picker = screen.getByTestId('mention-picker');
    const items = within(picker).getAllByRole('option');
    expect(items[0]).not.toHaveAttribute('data-selected'); // ASSERT: index 0 exists (3 mock results)
    expect(items[1]).toHaveAttribute('data-selected', 'true'); // ASSERT: index 1 exists (3 mock results)
    expect(items[2]).not.toHaveAttribute('data-selected'); // ASSERT: index 2 exists (3 mock results)
  });

  it('clicking an item calls onSelect with the correct FileMention', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <MentionPicker
        results={MOCK_RESULTS}
        selectedIndex={0}
        isLoading={false}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText('Header.tsx'));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith({ path: 'src/components/Header.tsx', name: 'Header.tsx' });
  });

  it('shows "No files found" when results empty and not loading', () => {
    render(
      <MentionPicker
        results={[]}
        selectedIndex={0}
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('No files found')).toBeInTheDocument();
  });

  it('shows "Loading files..." when loading', () => {
    render(
      <MentionPicker
        results={[]}
        selectedIndex={0}
        isLoading={true}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Loading files...')).toBeInTheDocument();
  });
});
