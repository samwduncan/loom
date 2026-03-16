/**
 * MentionChipRow tests -- chip rendering, removal, empty state.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MentionChipRow } from './MentionChipRow';
import type { FileMention } from '@/types/mention';

const MENTIONS: FileMention[] = [
  { path: 'src/components/App.tsx', name: 'App.tsx' },
  { path: 'src/utils/cn.ts', name: 'cn.ts' },
];

describe('MentionChipRow', () => {
  it('renders nothing when mentions is empty', () => {
    const { container } = render(<MentionChipRow mentions={[]} onRemove={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a chip for each mention with the filename', () => {
    render(<MentionChipRow mentions={MENTIONS} onRemove={vi.fn()} />);
    const chips = screen.getAllByTestId('mention-chip');
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveTextContent('App.tsx');
    expect(chips[1]).toHaveTextContent('cn.ts');
  });

  it('shows full path in title attribute', () => {
    render(<MentionChipRow mentions={MENTIONS} onRemove={vi.fn()} />);
    const chips = screen.getAllByTestId('mention-chip');
    expect(chips[0]).toHaveAttribute('title', 'src/components/App.tsx');
    expect(chips[1]).toHaveAttribute('title', 'src/utils/cn.ts');
  });

  it('calls onRemove with the file path when X is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<MentionChipRow mentions={MENTIONS} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]!); // ASSERT: we rendered 2 mentions so index 0 exists

    expect(onRemove).toHaveBeenCalledWith('src/components/App.tsx');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
