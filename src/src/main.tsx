import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { App } from '@/App';
import { initializeNativePlugins, hideSplashWhenReady } from '@/lib/native-plugins';
import { initializeWebSocket } from '@/lib/websocket-init';

// ─── Reload telemetry (iOS diagnostics) ──────────────────────────
// Detects WKWebView content process kills by comparing timestamps.
// Check Safari Web Inspector console for "[reload-telemetry]" entries.
{
  const key = 'loom-last-load-ts';
  const now = Date.now();
  const prev = localStorage.getItem(key);
  if (prev) {
    const elapsed = now - Number(prev);
    if (elapsed < 60_000) {
      console.warn(`[reload-telemetry] Page reloaded after ${elapsed}ms — likely WKWebView content process kill`);
    } else {
      console.info(`[reload-telemetry] Fresh load (${Math.round(elapsed / 1000)}s since last)`);
    }
  } else {
    console.info('[reload-telemetry] First load (no previous timestamp)');
  }
  localStorage.setItem(key, String(now));
}

// Fire-and-forget native plugin init BEFORE React render tree mounts.
// Must run before initializeWebSocket so Keyboard resize mode is configured first.
void initializeNativePlugins();


// Fire-and-forget WS init BEFORE React render tree mounts.
// void prefix satisfies no-floating-promises. Safe to call multiple times (has init guard).
void initializeWebSocket();

createRoot(document.getElementById('root')!).render( // ASSERT: root element is guaranteed to exist in index.html
  <StrictMode>
    <App />
  </StrictMode>,
);

// Hide splash screen when WebSocket connects (or after 3s fallback).
// Must run after React mounts so the user sees content, not a blank screen.
// hideSplashWhenReady() is async and internally awaits nativePluginsReady
// to avoid the cold-start race (SS-2).
void hideSplashWhenReady();
