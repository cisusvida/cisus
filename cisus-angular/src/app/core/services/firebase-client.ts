import { inject, Service } from '@angular/core';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { CISUS_RUNTIME_CONFIG } from '../config/runtime-config';

let emulatorsConnected = false;
let appCheckInitialized = false;

@Service()
export class FirebaseClient {
  readonly app: FirebaseApp;
  readonly auth: Auth;
  readonly firestore: Firestore;
  readonly functions: Functions;
  private readonly config = inject(CISUS_RUNTIME_CONFIG);

  constructor() {
    this.app = getApps().length ? getApps()[0] : initializeApp(this.config.firebase);
    if (!this.config.useEmulators && !appCheckInitialized && typeof window !== 'undefined') {
      initializeAppCheck(this.app, {
        provider: new ReCaptchaEnterpriseProvider(this.config.firebaseAppCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckInitialized = true;
    }
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app, this.config.firestoreDatabaseId);
    this.functions = getFunctions(this.app, 'southamerica-west1');
    if (this.config.useEmulators && !emulatorsConnected) {
      emulatorsConnected = true;
      connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(this.firestore, '127.0.0.1', 8085);
      connectFunctionsEmulator(this.functions, '127.0.0.1', 5001);
    }
  }
}
