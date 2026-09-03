import { provideRouter } from '@angular/router';
import type { CisusRuntimeConfig } from './app/core/config/runtime-config';

globalThis.__CISUS_RUNTIME_CONFIG__ = {
  firebase: {
    apiKey: 'test-api-key',
    authDomain: 'localhost',
    projectId: 'demo-project',
    storageBucket: 'demo-project.invalid',
  },
  firebaseAppCheckSiteKey: '',
  firestoreDatabaseId: '(default)',
  useEmulators: true,
} satisfies CisusRuntimeConfig;

export default [provideRouter([])];
