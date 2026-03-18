/**
 * Tests for useSessionSelection hook -- selection state management and bulk delete logic.
 *
 * Constitution: Named export only (2.2).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionSelection } from './useSessionSelection';

// Mock apiFetch
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ProjectGroup } from '@/types/session';

const mockedApiFetch = vi.mocked(apiFetch);

describe('useSessionSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty selection and isSelecting=false', () => {
    const { result } = renderHook(() => useSessionSelection());
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.isSelecting).toBe(false);
  });

  it('toggle adds an ID and sets isSelecting=true', () => {
    const { result } = renderHook(() => useSessionSelection());
    act(() => { result.current.toggle('s1'); });
    expect(result.current.selectedIds.has('s1')).toBe(true);
    expect(result.current.isSelecting).toBe(true);
  });

  it('toggle removes an already-selected ID', () => {
    const { result } = renderHook(() => useSessionSelection());
    act(() => { result.current.toggle('s1'); });
    act(() => { result.current.toggle('s1'); });
    expect(result.current.selectedIds.has('s1')).toBe(false);
  });

  it('selectAll selects all provided IDs and sets isSelecting=true', () => {
    const { result } = renderHook(() => useSessionSelection());
    act(() => { result.current.selectAll(['s1', 's2', 's3']); });
    expect(result.current.selectedIds.size).toBe(3);
    expect(result.current.isSelecting).toBe(true);
  });

  it('clear empties selection and sets isSelecting=false', () => {
    const { result } = renderHook(() => useSessionSelection());
    act(() => { result.current.toggle('s1'); });
    act(() => { result.current.toggle('s2'); });
    act(() => { result.current.clear(); });
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.isSelecting).toBe(false);
  });

  describe('bulkDelete', () => {
    const mockGroups: ProjectGroup[] = [
      {
        projectName: 'proj1',
        displayName: 'Proj 1',
        projectPath: '/path/proj1',
        sessionCount: 2,
        visibleCount: 2,
        dateGroups: [
          {
            label: 'Today',
            sessions: [
              { id: 's1', title: 'Session 1', messages: [], providerId: 'claude', createdAt: '', updatedAt: '', metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null } },
              { id: 's2', title: 'Session 2', messages: [], providerId: 'claude', createdAt: '', updatedAt: '', metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null } },
            ],
          },
        ],
      },
    ];

    it('deletes all selected sessions and calls removeSession for each', async () => {
      mockedApiFetch.mockResolvedValue(undefined);
      const mockRemoveSession = vi.fn();
      const mockNavigate = vi.fn();
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(() => useSessionSelection());
      act(() => { result.current.toggle('s1'); });
      act(() => { result.current.toggle('s2'); });

      await act(async () => {
        await result.current.bulkDelete(mockGroups, 'other', mockNavigate, mockRemoveSession);
      });

      expect(mockedApiFetch).toHaveBeenCalledTimes(2);
      expect(mockRemoveSession).toHaveBeenCalledWith('s1');
      expect(mockRemoveSession).toHaveBeenCalledWith('s2');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'loom:projects-updated' }));
      // Should clear selection after bulk delete
      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.isSelecting).toBe(false);

      dispatchSpy.mockRestore();
    });

    it('shows toast on partial failure', async () => {
      mockedApiFetch
        .mockResolvedValueOnce(undefined) // s1 succeeds
        .mockRejectedValueOnce(new Error('Network error')); // s2 fails
      const mockRemoveSession = vi.fn();
      const mockNavigate = vi.fn();

      const { result } = renderHook(() => useSessionSelection());
      act(() => { result.current.selectAll(['s1', 's2']); });

      await act(async () => {
        await result.current.bulkDelete(mockGroups, null, mockNavigate, mockRemoveSession);
      });

      // Only s1 should be removed (the one that succeeded)
      expect(mockRemoveSession).toHaveBeenCalledWith('s1');
      expect(mockRemoveSession).not.toHaveBeenCalledWith('s2');
      expect(toast.error).toHaveBeenCalledWith('Failed to delete 1 session(s)');
    });

    it('navigates to most recent remaining session when active session is deleted', async () => {
      mockedApiFetch.mockResolvedValue(undefined);
      const mockRemoveSession = vi.fn();
      const mockNavigate = vi.fn();

      const groups: ProjectGroup[] = [
        {
          projectName: 'proj1',
          displayName: 'Proj 1',
          projectPath: '/path/proj1',
          sessionCount: 3,
          visibleCount: 3,
          dateGroups: [
            {
              label: 'Today',
              sessions: [
                { id: 's1', title: 'Active', messages: [], providerId: 'claude', createdAt: '', updatedAt: '2026-03-18T02:00:00Z', metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null } },
                { id: 's2', title: 'Other', messages: [], providerId: 'claude', createdAt: '', updatedAt: '2026-03-18T01:00:00Z', metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null } },
                { id: 's3', title: 'Oldest', messages: [], providerId: 'claude', createdAt: '', updatedAt: '2026-03-17T01:00:00Z', metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null } },
              ],
            },
          ],
        },
      ];

      const { result } = renderHook(() => useSessionSelection());
      act(() => { result.current.toggle('s1'); });

      await act(async () => {
        await result.current.bulkDelete(groups, 's1', mockNavigate, mockRemoveSession);
      });

      // Should navigate to s2 (most recent remaining)
      expect(mockNavigate).toHaveBeenCalledWith('/chat/s2');
    });

    it('navigates to /chat when no sessions remain after deleting active', async () => {
      mockedApiFetch.mockResolvedValue(undefined);
      const mockRemoveSession = vi.fn();
      const mockNavigate = vi.fn();

      const { result } = renderHook(() => useSessionSelection());
      act(() => { result.current.selectAll(['s1', 's2']); });

      await act(async () => {
        await result.current.bulkDelete(mockGroups, 's1', mockNavigate, mockRemoveSession);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('Escape key clears selection when isSelecting is true', () => {
    const { result } = renderHook(() => useSessionSelection());
    act(() => { result.current.toggle('s1'); });
    expect(result.current.isSelecting).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.isSelecting).toBe(false);
  });
});
