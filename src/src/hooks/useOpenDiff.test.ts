/**
 * useOpenDiff tests -- verifies the hook wires setActiveTab, openFile, and openDiff.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOpenDiff } from '@/hooks/useOpenDiff';
import { useFileStore } from '@/stores/file';
import { useUIStore } from '@/stores/ui';

describe('useOpenDiff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileStore.getState().reset();
  });

  it('calls setActiveTab("files"), openFile(path), and openDiff(path)', () => {
    const setActiveTabSpy = vi.spyOn(useUIStore.getState(), 'setActiveTab');

    const { result } = renderHook(() => useOpenDiff());

    act(() => {
      result.current('/home/project/src/main.ts');
    });

    expect(setActiveTabSpy).toHaveBeenCalledWith('files');
    const state = useFileStore.getState();
    expect(state.activeFilePath).toBe('/home/project/src/main.ts');
    expect(state.diffFilePath).toBe('/home/project/src/main.ts');
    expect(state.openTabs).toHaveLength(1);
    expect(state.openTabs[0]!.filePath).toBe('/home/project/src/main.ts'); // ASSERT: openFile guarantees at least one tab
  });

  it('returns a stable callback reference', () => {
    const { result, rerender } = renderHook(() => useOpenDiff());
    const firstRef = result.current;
    rerender();
    expect(result.current).toBe(firstRef);
  });
});
