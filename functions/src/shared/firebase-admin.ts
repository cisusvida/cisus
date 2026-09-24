import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { defineString } from 'firebase-functions/params';

/** Determina el proyecto desde el entorno administrado o la configuración local. */
const projectId =
  process.env.GCP_PROJECT ??
  process.env.GCLOUD_PROJECT ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.FIREBASE_PROJECT_ID;

const configuredDatabaseId =
  process.env.FIRESTORE_DATABASE_ID ?? process.env.FIREBASE_FIRESTORE_DATABASE;
const isFunctionsDiscovery = process.env.FUNCTIONS_CONTROL_API === 'true';
const firestoreDatabaseId = defineString('FIRESTORE_DATABASE_ID');

if (!projectId) {
  throw new Error('Falta FIREBASE_PROJECT_ID fuera del entorno administrado de Google Cloud.');
}
if (!configuredDatabaseId && !isFunctionsDiscovery) {
  throw new Error('Falta FIRESTORE_DATABASE_ID para seleccionar la base Firestore.');
}

// Firebase CLI discovers exported functions in an isolated process before it
// loads the project's .env file. No database calls run during discovery.
const databaseId = configuredDatabaseId ?? '(default)';

// Logging para debugging (desactivado en producción)
const isDebug = false;
if (isDebug) {
  console.log('[Firebase Admin] Configuración:', {
    projectId,
    databaseId,
    env: {
      GCP_PROJECT: process.env.GCP_PROJECT,
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIRESTORE_DATABASE_ID: process.env.FIRESTORE_DATABASE_ID,
    },
  });
}

const app =
  getApps()[0] ??
  initializeApp({
    projectId,
    storageBucket: `${projectId}.firebasestorage.app`,
  });

const firestore = getFirestore(app, databaseId);
const auth = getAuth(app);
const storage = getStorage(app);
// NOTE: FieldValue/Timestamp come from the modular 'firebase-admin/firestore' (imported above),
// NOT the compat namespace (admin.firestore.FieldValue). The Functions emulator proxies
// firebase-admin and the compat static namespace is undefined there, which would break
// serverTimestamp()/increment() at runtime.

// Log adicional para confirmar la configuración al exportar
if (isDebug) {
  console.log('[Firebase Admin] Firestore configurado con database:', databaseId);
}

export {
  app,
  firestore,
  auth,
  storage,
  databaseId,
  firestoreDatabaseId,
  projectId,
  FieldValue,
  Timestamp,
};
