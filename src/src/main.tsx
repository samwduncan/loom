import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { App } from '@/App';
import { initializeNativePlugins } from '@/lib/native-plugins';
import { initializeWebSocket } from '@/lib/websocket-init';

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
