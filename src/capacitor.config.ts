import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loom.agent',
  appName: 'Loom',
  webDir: 'dist',
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

export default config;
