/**
 * Tests for native-actions.ts -- native destructive action sheet utility.
 *
 * Covers: destructive selection returns true, cancel returns false,
 * web returns false immediately, error returns false.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { platformMock, mockShowActions } = vi.hoisted(() => ({
  platformMock: { IS_NATIVE: false },
  mockShowActions: vi.fn(),
}));

vi.mock('@/lib/platform', () => platformMock);

vi.mock('@capacitor/action-sheet', () => ({
  ActionSheet: { showActions: mockShowActions },
  ActionSheetButtonStyle: {
    Destructive: 'DESTRUCTIVE',
    Cancel: 'CANCEL',
  },
}));

import { showDestructiveConfirmation } from '@/lib/native-actions';

describe('showDestructiveConfirmation', () => {
  beforeEach(() => {
    platformMock.IS_NATIVE = false;
    mockShowActions.mockClear();
  });

  it('returns true when user selects destructive option (index 0)', async () => {
    platformMock.IS_NATIVE = true;
    mockShowActions.mockResolvedValueOnce({ index: 0 });
    const result = await showDestructiveConfirmation({
      title: 'Delete?',
      message: 'This cannot be undone.',
    });
    expect(result).toBe(true);
  });

  it('returns false when user selects cancel (index 1)', async () => {
    platformMock.IS_NATIVE = true;
    mockShowActions.mockResolvedValueOnce({ index: 1 });
    const result = await showDestructiveConfirmation({
      title: 'Delete?',
      message: 'This cannot be undone.',
    });
    expect(result).toBe(false);
  });

  it('returns false on web (no UI rendered)', async () => {
    platformMock.IS_NATIVE = false;
    const result = await showDestructiveConfirmation({
      title: 'Delete?',
      message: 'This cannot be undone.',
    });
    expect(result).toBe(false);
    expect(mockShowActions).not.toHaveBeenCalled();
  });

  it('returns false on error', async () => {
    platformMock.IS_NATIVE = true;
    mockShowActions.mockRejectedValueOnce(new Error('Plugin unavailable'));
    const result = await showDestructiveConfirmation({
      title: 'Delete?',
      message: 'This cannot be undone.',
    });
    expect(result).toBe(false);
  });

  it('passes custom destructiveText and cancelText', async () => {
    platformMock.IS_NATIVE = true;
    mockShowActions.mockResolvedValueOnce({ index: 0 });
    await showDestructiveConfirmation({
      title: 'Remove?',
      message: 'Are you sure?',
      destructiveText: 'Remove',
      cancelText: 'Keep',
    });
    expect(mockShowActions).toHaveBeenCalledWith({
      title: 'Remove?',
      message: 'Are you sure?',
      options: [
        { title: 'Remove', style: 'DESTRUCTIVE' },
        { title: 'Keep', style: 'CANCEL' },
      ],
    });
  });

  it('uses default button text when not specified', async () => {
    platformMock.IS_NATIVE = true;
    mockShowActions.mockResolvedValueOnce({ index: 0 });
    await showDestructiveConfirmation({
      title: 'Delete?',
      message: 'This cannot be undone.',
    });
    expect(mockShowActions).toHaveBeenCalledWith({
      title: 'Delete?',
      message: 'This cannot be undone.',
      options: [
        { title: 'Delete', style: 'DESTRUCTIVE' },
        { title: 'Cancel', style: 'CANCEL' },
      ],
    });
  });
});
