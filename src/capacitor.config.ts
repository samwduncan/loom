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
    SplashScreen: {
      // launchAutoHide must be true in server.url mode — the JS bridge timing is
      // unreliable when loading from a remote server, so SplashScreen.hide() from
      // hideSplashWhenReady() may never fire. For bundled mode this is also fine
      // since the local HTML loads fast enough that auto-hide is seamless.
      launchAutoHide: true,
      backgroundColor: '#2b2521',
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
