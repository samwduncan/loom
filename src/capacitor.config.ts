import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.samsara.loom',
  appName: 'Loom',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      // Disabled: patches global fetch() which breaks WebSocket upgrade handshake.
      // All HTTP routing handled by platform.ts resolveApiUrl() instead.
      enabled: false,
    },
  },
  server: {
    // To use remote dev server: set CAPACITOR_SERVER_URL before running `cap sync`
    // e.g. CAPACITOR_SERVER_URL=http://100.86.4.57:5184 npx cap sync ios
    // This value is resolved at sync time, NOT at app runtime.
    // Leave unset for bundled assets mode (loads from dist/).
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true,
    allowNavigation: ['100.86.4.57:*', '*.ts.net'],
  },
  ios: {
    webContentsDebuggingEnabled: true,
    preferredContentMode: 'mobile',
  },
};

// Exception: Capacitor CLI requires default export (Constitution 2.2 exception)
export default config;
