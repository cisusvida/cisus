import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/** Determina el proyecto desde el entorno administrado o la configuración local. */
const projectId =
  process.env.GCP_PROJECT ??
  process.env.GCLOUD_PROJECT ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.FIREBASE_PROJECT_ID;

const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE;

if (!projectId) {
  throw new Error('Falta FIREBASE_PROJECT_ID fuera del entorno administrado de Google Cloud.');
}
if (!databaseId) {
  throw new Error('Falta FIREBASE_FIRESTORE_DATABASE para seleccionar la base Firestore.');
}

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
      FIREBASE_FIRESTORE_DATABASE: process.env.FIREBASE_FIRESTORE_DATABASE,
    },
  });
}

const app = getApps()[0] ?? initializeApp({
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

export { app, firestore, auth, storage, databaseId, projectId, FieldValue, Timestamp };
