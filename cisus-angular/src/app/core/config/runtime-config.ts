import { InjectionToken } from '@angular/core';
import type { FirebaseOptions } from 'firebase/app';

export interface CisusRuntimeConfig {
  firebase: FirebaseOptions;
  firebaseAppCheckSiteKey: string;
  firestoreDatabaseId: string;
  useEmulators: boolean;
}

declare global {
  var __CISUS_RUNTIME_CONFIG__: CisusRuntimeConfig | undefined;
}

function loadRuntimeConfig(): CisusRuntimeConfig {
  const config = globalThis.__CISUS_RUNTIME_CONFIG__;
  if (!config?.firebase?.projectId || !config.firebase.apiKey) {
    throw new Error(
      'Falta la configuración pública de Firebase en runtime-config.js. No se habilitará autenticación.',
    );
  }
  if (!config.firestoreDatabaseId) {
    throw new Error('Falta firestoreDatabaseId en runtime-config.js.');
  }
  if (
    !config.useEmulators &&
    (!config.firebaseAppCheckSiteKey || config.firebaseAppCheckSiteKey.startsWith('REPLACE_'))
  ) {
    throw new Error(
      'Falta la clave pública de reCAPTCHA Enterprise para Firebase App Check en runtime-config.js.',
    );
  }
  return config;
}

export const CISUS_RUNTIME_CONFIG = new InjectionToken<CisusRuntimeConfig>('CISUS_RUNTIME_CONFIG', {
  providedIn: 'root',
  factory: loadRuntimeConfig,
});
