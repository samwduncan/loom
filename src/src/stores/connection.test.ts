/**
 * Connection Store tests — exercises all actions for provider connection state.
 *
 * Uses getState()/setState() directly (exempted from no-external-store-mutation ESLint rule).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useConnectionStore } from './connection';
import type { ProviderId } from '@/types/provider';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConnectionStore', () => {
  beforeEach(() => {
    useConnectionStore.getState().reset();
  });

  // -- Initial state: all three providers --
  it('initial providers record has all three providers with "disconnected" status', () => {
    const { providers } = useConnectionStore.getState();
    const providerIds: ProviderId[] = ['claude', 'codex', 'gemini'];

    for (const id of providerIds) {
      expect(providers[id]).toBeDefined();
      expect(providers[id].status).toBe('disconnected');
      expect(providers[id].lastConnected).toBeNull();
      expect(providers[id].reconnectAttempts).toBe(0);
      expect(providers[id].error).toBeNull();
      expect(providers[id].modelId).toBeNull();
    }
  });

  // -- updateProviderStatus --
  it('updateProviderStatus changes provider status', () => {
    useConnectionStore.getState().updateProviderStatus('claude', 'connecting');
    expect(useConnectionStore.getState().providers.claude.status).toBe('connecting');
  });

  it('updateProviderStatus sets lastConnected when status becomes "connected"', () => {
    useConnectionStore.getState().updateProviderStatus('claude', 'connected');
    const provider = useConnectionStore.getState().providers.claude;
    expect(provider.status).toBe('connected');
    expect(provider.lastConnected).not.toBeNull();
  });

  it('updateProviderStatus does not affect other providers', () => {
    useConnectionStore.getState().updateProviderStatus('claude', 'connected');
    expect(useConnectionStore.getState().providers.codex.status).toBe('disconnected');
    expect(useConnectionStore.getState().providers.gemini.status).toBe('disconnected');
  });

  // -- setProviderError --
  it('setProviderError sets error message', () => {
    useConnectionStore.getState().setProviderError('claude', 'Connection refused');
    expect(useConnectionStore.getState().providers.claude.error).toBe('Connection refused');
  });

  it('setProviderError clears error with null', () => {
    useConnectionStore.getState().setProviderError('claude', 'Some error');
    useConnectionStore.getState().setProviderError('claude', null);
    expect(useConnectionStore.getState().providers.claude.error).toBeNull();
  });

  // -- setProviderModel --
  it('setProviderModel sets modelId', () => {
    useConnectionStore.getState().setProviderModel('claude', 'claude-opus-4-20250514');
    expect(useConnectionStore.getState().providers.claude.modelId).toBe('claude-opus-4-20250514');
  });

  it('setProviderModel clears modelId with null', () => {
    useConnectionStore.getState().setProviderModel('claude', 'opus-4');
    useConnectionStore.getState().setProviderModel('claude', null);
    expect(useConnectionStore.getState().providers.claude.modelId).toBeNull();
  });

  // -- incrementReconnectAttempts --
  it('incrementReconnectAttempts increments counter', () => {
    expect(useConnectionStore.getState().providers.claude.reconnectAttempts).toBe(0);
    useConnectionStore.getState().incrementReconnectAttempts('claude');
    expect(useConnectionStore.getState().providers.claude.reconnectAttempts).toBe(1);
    useConnectionStore.getState().incrementReconnectAttempts('claude');
    expect(useConnectionStore.getState().providers.claude.reconnectAttempts).toBe(2);
  });

  // -- resetReconnectAttempts --
  it('resetReconnectAttempts resets counter to 0', () => {
    useConnectionStore.getState().incrementReconnectAttempts('claude');
    useConnectionStore.getState().incrementReconnectAttempts('claude');
    useConnectionStore.getState().resetReconnectAttempts('claude');
    expect(useConnectionStore.getState().providers.claude.reconnectAttempts).toBe(0);
  });

  // -- connect --
  it('connect sets status to "connecting", clears error, resets reconnect attempts', () => {
    // Set up a dirty state first
    useConnectionStore.getState().setProviderError('claude', 'Old error');
    useConnectionStore.getState().incrementReconnectAttempts('claude');
    useConnectionStore.getState().incrementReconnectAttempts('claude');

    useConnectionStore.getState().connect('claude');

    const provider = useConnectionStore.getState().providers.claude;
    expect(provider.status).toBe('connecting');
    expect(provider.error).toBeNull();
    expect(provider.reconnectAttempts).toBe(0);
  });

  // -- disconnect --
  it('disconnect sets status to "disconnected"', () => {
    useConnectionStore.getState().updateProviderStatus('claude', 'connected');
    useConnectionStore.getState().disconnect('claude');
    expect(useConnectionStore.getState().providers.claude.status).toBe('disconnected');
  });

  // -- reset --
  it('reset() restores initial state with all providers at defaults', () => {
    // Dirty up the state
    useConnectionStore.getState().updateProviderStatus('claude', 'connected');
    useConnectionStore.getState().setProviderError('codex', 'API key missing');
    useConnectionStore.getState().setProviderModel('gemini', 'gemini-pro');
    useConnectionStore.getState().incrementReconnectAttempts('claude');

    useConnectionStore.getState().reset();

    const { providers } = useConnectionStore.getState();
    const providerIds: ProviderId[] = ['claude', 'codex', 'gemini'];

    for (const id of providerIds) {
      expect(providers[id].status).toBe('disconnected');
      expect(providers[id].lastConnected).toBeNull();
      expect(providers[id].reconnectAttempts).toBe(0);
      expect(providers[id].error).toBeNull();
      expect(providers[id].modelId).toBeNull();
    }
  });
});
