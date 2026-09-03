(() => {
  globalThis.__CISUS_RUNTIME_CONFIG__ ??= {
    firebase: {
      apiKey: 'REPLACE_FIREBASE_API_KEY',
      authDomain: 'REPLACE_FIREBASE_AUTH_DOMAIN',
      projectId: 'REPLACE_FIREBASE_PROJECT_ID',
      storageBucket: 'REPLACE_FIREBASE_STORAGE_BUCKET',
      messagingSenderId: 'REPLACE_FIREBASE_MESSAGING_SENDER_ID',
      appId: 'REPLACE_FIREBASE_APP_ID',
    },
    firebaseAppCheckSiteKey: 'REPLACE_FIREBASE_APP_CHECK_SITE_KEY',
    firestoreDatabaseId: 'REPLACE_FIRESTORE_DATABASE_ID',
    // Localhost usa los servicios desplegados; este proyecto no usa emuladores.
    useEmulators: false,
  };
})();
