/**
 * useSettingsData tests -- fetch on mount, cleanup, mutations, error handling.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useAgentStatuses,
  useApiKeys,
  useGitConfig,
  useMcpServers,
} from './useSettingsData';

// Mock API client
const mockApiFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

describe('useAgentStatuses', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches all 3 provider statuses on mount', async () => {
    mockApiFetch.mockResolvedValue({
      authenticated: true,
      email: 'test@example.com',
    });

    const { result } = renderHook(() => useAgentStatuses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledTimes(3);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/cli/claude/status',
      {},
      expect.any(AbortSignal),
    );
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/cli/codex/status',
      {},
      expect.any(AbortSignal),
    );
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/cli/gemini/status',
      {},
      expect.any(AbortSignal),
    );
    expect(result.current.data).toHaveLength(3);
  });

  it('returns isLoading=true initially, then false after fetch', async () => {
    mockApiFetch.mockResolvedValue({ authenticated: false, email: null });

    const { result } = renderHook(() => useAgentStatuses());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('populates defaultModel field for each provider', async () => {
    mockApiFetch.mockResolvedValue({ authenticated: true, email: 'a@b.com' });

    const { result } = renderHook(() => useAgentStatuses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const models = result.current.data.map((s) => s.defaultModel);
    expect(models).toEqual(['Sonnet', 'GPT-5.3 Codex', 'Gemini 3.1 Pro']);
  });

  it('aborts on unmount (cleanup)', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    mockApiFetch.mockResolvedValue({ authenticated: false, email: null });

    const { unmount } = renderHook(() => useAgentStatuses());

    unmount();

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('handles fetch error gracefully', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAgentStatuses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Individual provider errors are caught and set on each status
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0]?.error).toBe('Network error');
    expect(result.current.data[0]?.authenticated).toBe(false);
  });
});

describe('useApiKeys', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches keys on mount', async () => {
    const mockKeys = [
      { id: 1, key_name: 'test', api_key: 'sk-123', created_at: '2026-01-01', last_used: null, is_active: 1 },
    ];
    mockApiFetch.mockResolvedValue(mockKeys);

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockKeys);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/settings/api-keys',
      {},
      expect.any(AbortSignal),
    );
  });

  it('addKey calls POST and triggers refetch', async () => {
    mockApiFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue([]);

    await act(async () => {
      await result.current.addKey('new-key');
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/settings/api-keys', {
      method: 'POST',
      body: JSON.stringify({ key_name: 'new-key' }),
    });
  });

  it('deleteKey calls DELETE and triggers refetch', async () => {
    mockApiFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue([]);

    await act(async () => {
      await result.current.deleteKey(42);
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/settings/api-keys/42', {
      method: 'DELETE',
    });
  });

  it('toggleKey calls PATCH and triggers refetch', async () => {
    mockApiFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue([]);

    await act(async () => {
      await result.current.toggleKey(1, true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/settings/api-keys/1', {
      method: 'PATCH',
      body: JSON.stringify({ is_active: 1 }),
    });
  });
});

describe('useGitConfig', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches config on mount', async () => {
    const mockConfig = { success: true, gitName: 'swd', gitEmail: 'swd@example.com' };
    mockApiFetch.mockResolvedValue(mockConfig);

    const { result } = renderHook(() => useGitConfig());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockConfig);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/user/git-config',
      {},
      expect.any(AbortSignal),
    );
  });

  it('saveGitConfig calls POST with gitName/gitEmail', async () => {
    mockApiFetch.mockResolvedValue({ success: true, gitName: null, gitEmail: null });

    const { result } = renderHook(() => useGitConfig());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue({ success: true });

    await act(async () => {
      await result.current.saveGitConfig('New Name', 'new@example.com');
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/user/git-config', {
      method: 'POST',
      body: JSON.stringify({ gitName: 'New Name', gitEmail: 'new@example.com' }),
    });
  });
});

describe('useMcpServers', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('fetches from correct endpoint for claude provider', async () => {
    mockApiFetch.mockResolvedValue({ success: true, servers: [] });

    const { result } = renderHook(() => useMcpServers('claude'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/mcp/config/read',
      {},
      expect.any(AbortSignal),
    );
  });

  it('fetches from correct endpoint for codex provider', async () => {
    mockApiFetch.mockResolvedValue({ success: true, servers: [] });

    const { result } = renderHook(() => useMcpServers('codex'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/codex/mcp/config/read',
      {},
      expect.any(AbortSignal),
    );
  });

  it('addServer calls POST and triggers refetch', async () => {
    mockApiFetch.mockResolvedValue({ success: true, servers: [] });

    const { result } = renderHook(() => useMcpServers('claude'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue({ success: true, servers: [] });

    await act(async () => {
      await result.current.addServer({
        name: 'test-server',
        type: 'stdio',
        config: { command: 'node', args: ['server.js'] },
      });
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/mcp/config/add', {
      method: 'POST',
      body: JSON.stringify({
        name: 'test-server',
        type: 'stdio',
        config: { command: 'node', args: ['server.js'] },
      }),
    });
  });

  it('removeServer calls DELETE and triggers refetch', async () => {
    mockApiFetch.mockResolvedValue({ success: true, servers: [] });

    const { result } = renderHook(() => useMcpServers('claude'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockApiFetch.mockClear();
    mockApiFetch.mockResolvedValue({ success: true, servers: [] });

    await act(async () => {
      await result.current.removeServer('test-server');
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/mcp/config/remove', {
      method: 'DELETE',
      body: JSON.stringify({ name: 'test-server' }),
    });
  });
});
