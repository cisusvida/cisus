'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
exports.getClientProjectFileUrl = exports.getMyClientProjects = void 0;

const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { FieldValue, firestore, storage } = require('../shared/firebase-admin');
const {
  allowedClientFilePath,
  buildPublicClientActivity,
  buildPublicClientTimeline,
  clientMembershipId,
  isDocumentId,
  publicClientFile,
  publicClientProject,
} = require('./client-project-policy');

const CALLABLE_OPTIONS = {
  region: 'southamerica-west1',
  memory: '256MiB',
  timeoutSeconds: 30,
  concurrency: 20,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
};
const FILE_URL_TTL_MS = 10 * 60 * 1000;

function requiredUid(request) {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para ver tus proyectos.', {
      code: 'AUTH_REQUIRED',
    });
  }
  return uid;
}

function requiredId(value, label) {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!isDocumentId(id)) {
    throw new HttpsError('invalid-argument', `${label} no es válido.`);
  }
  return id;
}

async function listProjectFiles(projectId) {
  const snapshot = await firestore
    .collection('client_project_files')
    .where('projectId', '==', projectId)
    .limit(100)
    .get();
  return snapshot.docs
    .filter((document) => {
      const data = document.data();
      return data.status === 'active' && data.visibility === 'client_shared';
    })
    .flatMap((document) => {
      try {
        return [publicClientFile(document.id, document.data())];
      } catch {
        console.warn('[getMyClientProjects] ignored malformed file', {
          projectId,
          fileId: document.id,
        });
        return [];
      }
    })
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

exports.getMyClientProjects = onCall(CALLABLE_OPTIONS, async (request) => {
  const uid = requiredUid(request);
  const membershipsSnapshot = await firestore
    .collection('client_project_memberships')
    .where('uid', '==', uid)
    .limit(50)
    .get();
  const projectIds = Array.from(
    new Set(
      membershipsSnapshot.docs
        .map((document) => document.data())
        .filter(
          (membership) => membership.status === 'active' && isDocumentId(membership.projectId),
        )
        .map((membership) => membership.projectId),
    ),
  );
  if (projectIds.length === 0) return { projects: [] };

  const projectSnapshots = await Promise.all(
    projectIds.map((projectId) => firestore.collection('client_projects').doc(projectId).get()),
  );
  const projects = await Promise.all(
    projectSnapshots
      .filter((snapshot) => snapshot.exists && snapshot.data()?.status !== 'archived')
      .map(async (snapshot) => {
        const project = publicClientProject(snapshot.id, snapshot.data());
        const files = await listProjectFiles(snapshot.id);
        const clientTimeline = buildPublicClientTimeline(project, files);
        return {
          ...project,
          clientTimeline,
          clientActivity: buildPublicClientActivity(project, files, clientTimeline),
          files,
        };
      }),
  );
  projects.sort((left, right) => right.lastConfirmedAt.localeCompare(left.lastConfirmedAt));
  return { projects };
});

exports.getClientProjectFileUrl = onCall(CALLABLE_OPTIONS, async (request) => {
  const uid = requiredUid(request);
  const projectId = requiredId(request.data?.projectId, 'El proyecto');
  const fileId = requiredId(request.data?.fileId, 'El archivo');
  const membershipId = clientMembershipId(uid, projectId);
  const [membershipSnapshot, fileSnapshot] = await Promise.all([
    firestore.collection('client_project_memberships').doc(membershipId).get(),
    firestore.collection('client_project_files').doc(fileId).get(),
  ]);
  const membership = membershipSnapshot.data();
  if (
    !membershipSnapshot.exists ||
    membership?.uid !== uid ||
    membership?.projectId !== projectId ||
    membership?.status !== 'active'
  ) {
    throw new HttpsError('permission-denied', 'No tienes acceso a este proyecto.', {
      code: 'CLIENT_MEMBERSHIP_REQUIRED',
    });
  }
  if (!fileSnapshot.exists) {
    throw new HttpsError('not-found', 'El archivo solicitado no existe.');
  }
  const fileData = fileSnapshot.data();
  if (
    fileData?.projectId !== projectId ||
    fileData?.status !== 'active' ||
    fileData?.visibility !== 'client_shared' ||
    !allowedClientFilePath(projectId, fileData?.storagePath)
  ) {
    throw new HttpsError('permission-denied', 'El archivo no está compartido con este cliente.', {
      code: 'CLIENT_FILE_NOT_SHARED',
    });
  }
  const file = storage.bucket().file(fileData.storagePath);
  const [exists] = await file.exists();
  if (!exists) throw new HttpsError('not-found', 'El archivo todavía no está disponible.');
  const expiresAt = Date.now() + FILE_URL_TTL_MS;
  const [url] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
  await firestore.collection('audit_logs').add({
    event: 'client_project_file_opened',
    actorUid: uid,
    projectId,
    fileId,
    success: true,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { url, expiresAt };
});
