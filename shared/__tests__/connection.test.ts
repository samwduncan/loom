/**
 * Connection Store tests -- exercises all actions for provider connection state.
 *
 * Uses factory pattern with mock StateStorage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createConnectionStore } from '../stores/connection';
import type { ProviderId } from '../types/provider';

// ---------------------------------------------------------------------------
// Mock Storage
// ---------------------------------------------------------------------------

const mockStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => {},
  removeItem: (_name: string) => {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createConnectionStore', () => {
  let store: ReturnType<typeof createConnectionStore>;

  beforeEach(() => {
    store = createConnectionStore(mockStorage);
  });

  // -- Initial state: all three providers --
  it('initial providers record has all three providers with "disconnected" status', () => {
    const { providers } = store.getState();
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
    store.getState().updateProviderStatus('claude', 'connecting');
    expect(store.getState().providers.claude.status).toBe('connecting');
  });

  it('updateProviderStatus sets lastConnected when status becomes "connected"', () => {
    store.getState().updateProviderStatus('claude', 'connected');
    const provider = store.getState().providers.claude;
    expect(provider.status).toBe('connected');
    expect(provider.lastConnected).not.toBeNull();
  });

  it('updateProviderStatus does not affect other providers', () => {
    store.getState().updateProviderStatus('claude', 'connected');
    expect(store.getState().providers.codex.status).toBe('disconnected');
    expect(store.getState().providers.gemini.status).toBe('disconnected');
  });

  // -- setProviderError --
  it('setProviderError sets error message', () => {
    store.getState().setProviderError('claude', 'Connection refused');
    expect(store.getState().providers.claude.error).toBe('Connection refused');
  });

  it('setProviderError clears error with null', () => {
    store.getState().setProviderError('claude', 'Some error');
    store.getState().setProviderError('claude', null);
    expect(store.getState().providers.claude.error).toBeNull();
  });

  // -- setProviderModel --
  it('setProviderModel sets modelId', () => {
    store.getState().setProviderModel('claude', 'claude-opus-4-20250514');
    expect(store.getState().providers.claude.modelId).toBe('claude-opus-4-20250514');
  });

  it('setProviderModel clears modelId with null', () => {
    store.getState().setProviderModel('claude', 'opus-4');
    store.getState().setProviderModel('claude', null);
    expect(store.getState().providers.claude.modelId).toBeNull();
  });

  // -- incrementReconnectAttempts --
  it('incrementReconnectAttempts increments counter', () => {
    expect(store.getState().providers.claude.reconnectAttempts).toBe(0);
    store.getState().incrementReconnectAttempts('claude');
    expect(store.getState().providers.claude.reconnectAttempts).toBe(1);
    store.getState().incrementReconnectAttempts('claude');
    expect(store.getState().providers.claude.reconnectAttempts).toBe(2);
  });

  // -- resetReconnectAttempts --
  it('resetReconnectAttempts resets counter to 0', () => {
    store.getState().incrementReconnectAttempts('claude');
    store.getState().incrementReconnectAttempts('claude');
    store.getState().resetReconnectAttempts('claude');
    expect(store.getState().providers.claude.reconnectAttempts).toBe(0);
  });

  // -- connect --
  it('connect sets status to "connecting", clears error, resets reconnect attempts', () => {
    store.getState().setProviderError('claude', 'Old error');
    store.getState().incrementReconnectAttempts('claude');
    store.getState().incrementReconnectAttempts('claude');

    store.getState().connect('claude');

    const provider = store.getState().providers.claude;
    expect(provider.status).toBe('connecting');
    expect(provider.error).toBeNull();
    expect(provider.reconnectAttempts).toBe(0);
  });

  // -- disconnect --
  it('disconnect sets status to "disconnected"', () => {
    store.getState().updateProviderStatus('claude', 'connected');
    store.getState().disconnect('claude');
    expect(store.getState().providers.claude.status).toBe('disconnected');
  });

  // -- persist rehydration (NaN bug) --
  it('incrementReconnectAttempts never produces NaN after persist rehydration', () => {
    store.setState({
      providers: {
        claude: { modelId: 'claude-sonnet' } as never,
        codex: { modelId: null } as never,
        gemini: { modelId: null } as never,
      },
    });

    store.getState().incrementReconnectAttempts('claude');
    const attempts =
      store.getState().providers.claude.reconnectAttempts;
    expect(attempts).not.toBeNaN();
    expect(typeof attempts).toBe('number');
  });

  // -- persist rehydration safety --
  it('rehydration with only modelId preserves all ephemeral defaults', () => {
    const merge = store.persist.getOptions().merge;
    if (!merge) {
      throw new Error('merge function not found on connection store');
    }

    const persistedState = {
      providers: {
        claude: { modelId: 'claude-sonnet' },
        codex: { modelId: null },
        gemini: { modelId: null },
      },
    };

    const currentState = store.getState();
    const merged = merge(persistedState, currentState);

    expect(merged.providers.claude.status).toBe('disconnected');
    expect(merged.providers.claude.error).toBeNull();
    expect(merged.providers.claude.reconnectAttempts).toBe(0);
    expect(merged.providers.claude.lastConnected).toBeNull();
    expect(merged.providers.claude.modelId).toBe('claude-sonnet');

    expect(merged.providers.codex.status).toBe('disconnected');
    expect(merged.providers.gemini.reconnectAttempts).toBe(0);
  });

  // -- reset --
  it('reset() restores initial state with all providers at defaults', () => {
    store.getState().updateProviderStatus('claude', 'connected');
    store.getState().setProviderError('codex', 'API key missing');
    store.getState().setProviderModel('gemini', 'gemini-pro');
    store.getState().incrementReconnectAttempts('claude');

    store.getState().reset();

    const { providers } = store.getState();
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
