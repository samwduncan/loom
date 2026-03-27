import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Polyfill ResizeObserver for jsdom (not available in jsdom environment)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Global fetch stub for tests that don't mock fetch themselves.
// Node.js fetch rejects relative URLs (/api/...) with ERR_INVALID_URL.
// This prevents unhandled rejections from side-effect API calls during component renders.
const originalFetch = globalThis.fetch;
if (!globalThis.fetch.__vitest_mocked__) {
  const safeFetch: typeof globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.startsWith('/')) {
      // Return an empty 200 for relative API calls in tests
      return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return originalFetch(input, init);
  };
  globalThis.fetch = safeFetch;
}

afterEach(() => {
  cleanup();
});
