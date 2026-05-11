import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brainas.app',
  appName: 'Brainas',
  /** Angular 19 `application` builder emits the browser bundle under `browser/`. */
  webDir: 'dist/app/browser',
  server: {
    androidScheme: 'https',
    /**
     * Path-based SPA routing relies on Capacitor’s local server resolving
     * extensionless URLs to index.html. Client-side navigations never hit the server.
     */
  },
};

export default config;
