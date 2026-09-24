'use strict';

/**
 * Restores the private client workspace and internal access identities.
 *
 * Dry run (local validation only):
 *   npm run seed:client-projects
 *
 * Apply with the currently authenticated gcloud owner account:
 *   $env:CISUS_GOOGLE_ACCESS_TOKEN = gcloud auth print-access-token
 *   $env:GOOGLE_CLOUD_QUOTA_PROJECT = 'cisus-3b180'
 *   npm run seed:client-projects -- --apply
 *
 * The ignored manifest under archivos/ contains customer data and file mappings.
 * No password is generated or stored. New users recover access from the login page.
 */

const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { Timestamp } = require('firebase-admin/firestore');
const {
  clientMembershipId,
  isDocumentId,
} = require('../functions/src/client-projects/client-project-policy');

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const forceFiles = args.has('--force-files');
const projectId = process.env.FIREBASE_PROJECT_ID || 'cisus-3b180';
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'cisusdb';
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
const cloudAccessToken = process.env.CISUS_GOOGLE_ACCESS_TOKEN?.trim();
const manifestPath = path.resolve(
  process.cwd(),
  process.env.CISUS_CLIENT_SEED_FILE || 'archivos/client-projects.seed.json',
);

function credential() {
  if (!cloudAccessToken) return applicationDefault();
  return {
    getAccessToken: async () => ({ access_token: cloudAccessToken, expires_in: 3300 }),
  };
}

const SERVER_TIMESTAMP = Symbol('serverTimestamp');

function serverTimestamp() {
  return SERVER_TIMESTAMP;
}

function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (value instanceof Timestamp) return { timestampValue: value.toDate().toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (value && typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .filter(([, nested]) => nested !== undefined)
            .map(([key, nested]) => [key, toFirestoreValue(nested)]),
        ),
      },
    };
  }
  throw new Error(`Unsupported Firestore value type: ${typeof value}.`);
}

function fromFirestoreValue(value) {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
  return undefined;
}

function decodeFirestoreFields(fields) {
  return Object.fromEntries(
    Object.entries(fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]),
  );
}

class RestDocumentReference {
  constructor(database, collectionName, id) {
    this.database = database;
    this.name = `${database.documentsRoot}/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}`;
  }

  get() {
    return this.database.getDocument(this);
  }
}

class RestWriteBatch {
  constructor(database) {
    this.database = database;
    this.writes = [];
  }

  set(reference, data, options = {}) {
    if (options.merge !== true) throw new Error('The migration requires merge writes.');
    const fields = {};
    const updateTransforms = [];
    for (const [fieldPath, value] of Object.entries(data)) {
      if (value === SERVER_TIMESTAMP) {
        updateTransforms.push({ fieldPath, setToServerValue: 'REQUEST_TIME' });
      } else if (value !== undefined) {
        fields[fieldPath] = toFirestoreValue(value);
      }
    }
    const write = {
      update: { name: reference.name, fields },
      updateMask: { fieldPaths: Object.keys(fields) },
    };
    if (updateTransforms.length) write.updateTransforms = updateTransforms;
    this.writes.push(write);
  }

  commit() {
    return this.database.request(`${this.database.databaseRoot}/documents:commit`, {
      method: 'POST',
      body: JSON.stringify({ writes: this.writes }),
    });
  }
}

class RestFirestore {
  constructor(targetProjectId, targetDatabaseId, accessToken) {
    if (!accessToken) {
      throw new Error('CISUS_GOOGLE_ACCESS_TOKEN is required to apply the Firestore seed.');
    }
    this.accessToken = accessToken;
    this.databaseRoot = `projects/${encodeURIComponent(targetProjectId)}/databases/${encodeURIComponent(targetDatabaseId)}`;
    this.documentsRoot = `${this.databaseRoot}/documents`;
  }

  collection(collectionName) {
    return {
      doc: (id) => new RestDocumentReference(this, collectionName, id),
    };
  }

  batch() {
    return new RestWriteBatch(this);
  }

  async request(resourcePath, options = {}) {
    const response = await fetch(`https://firestore.googleapis.com/v1/${resourcePath}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': projectId,
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || response.statusText;
      const error = new Error(`Firestore REST ${response.status}: ${message}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async getDocument(reference) {
    try {
      const payload = await this.request(reference.name);
      const data = decodeFirestoreFields(payload.fields);
      return { exists: true, data: () => data };
    } catch (error) {
      if (error?.status === 404) return { exists: false, data: () => undefined };
      throw error;
    }
  }
}

class RestStorageFile {
  constructor(bucket, objectName) {
    this.bucket = bucket;
    this.objectName = objectName;
  }

  async exists() {
    try {
      await this.bucket.getObject(this.objectName);
      return [true];
    } catch (error) {
      if (error?.status === 404) return [false];
      throw error;
    }
  }

  async getMetadata() {
    return [await this.bucket.getObject(this.objectName)];
  }

  save(bytes, options) {
    return this.bucket.uploadObject(this.objectName, bytes, options);
  }
}

class RestStorageBucket {
  constructor(name, accessToken) {
    if (!accessToken) {
      throw new Error('CISUS_GOOGLE_ACCESS_TOKEN is required to upload private files.');
    }
    this.name = name;
    this.accessToken = accessToken;
  }

  file(objectName) {
    return new RestStorageFile(this, objectName);
  }

  async request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'x-goog-user-project': projectId,
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || response.statusText;
      const error = new Error(`Storage REST ${response.status}: ${message}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  getObject(objectName) {
    return this.request(
      `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(this.name)}/o/${encodeURIComponent(objectName)}`,
    );
  }

  uploadObject(objectName, bytes, options) {
    const boundary = `cisus-${createHash('sha256').update(objectName).digest('hex').slice(0, 24)}`;
    const objectMetadata = {
      name: objectName,
      contentType: options.contentType,
      cacheControl: options.metadata?.cacheControl,
      metadata: options.metadata?.metadata,
    };
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(objectMetadata)}\r\n--${boundary}\r\nContent-Type: ${options.contentType}\r\n\r\n`,
      ),
      bytes,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    return this.request(
      `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(this.name)}/o?uploadType=multipart`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      },
    );
  }
}

function requiredText(value, label) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function dateTimestamp(value, label) {
  const parsed = new Date(requiredText(value, label));
  if (Number.isNaN(parsed.getTime())) throw new Error(`${label} is not a valid date.`);
  return Timestamp.fromDate(parsed);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function contentType(fileName) {
  switch (path.extname(fileName).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.pdf':
      return 'application/pdf';
    case '.mp4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}

function safeFileName(value) {
  const extension = path.extname(value).toLowerCase();
  const base = path
    .basename(value, extension)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'archivo'}${extension}`;
}

async function readManifest() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.accounts) || !Array.isArray(manifest.projects)) {
    throw new Error('The client seed manifest must include accounts and projects arrays.');
  }
  const accountKeys = new Set();
  const accountEmails = new Set();
  for (const account of manifest.accounts) {
    const key = requiredText(account.key, 'account.key');
    const email = requiredText(account.email, `accounts.${key}.email`).toLowerCase();
    if (accountKeys.has(key) || accountEmails.has(email))
      throw new Error(`Duplicate account ${key}/${email}.`);
    if (!isDocumentId(account.uid)) throw new Error(`Invalid deterministic uid for ${email}.`);
    accountKeys.add(key);
    accountEmails.add(email);
  }
  const projectIds = new Set();
  const fileIds = new Set();
  const sourceFiles = [];
  for (const project of manifest.projects) {
    if (!isDocumentId(project.projectId) || projectIds.has(project.projectId)) {
      throw new Error(`Invalid or duplicate project id: ${project.projectId}.`);
    }
    projectIds.add(project.projectId);
    if (!accountKeys.has(project.clientAccountKey)) {
      throw new Error(`Unknown client account for ${project.projectId}.`);
    }
    for (const file of project.files || []) {
      if (!isDocumentId(file.fileId) || fileIds.has(file.fileId)) {
        throw new Error(`Invalid or duplicate file id: ${file.fileId}.`);
      }
      fileIds.add(file.fileId);
      const sourcePath = path.resolve(
        path.dirname(manifestPath),
        requiredText(file.source, `${file.fileId}.source`),
      );
      const bytes = await fs.readFile(sourcePath);
      sourceFiles.push({ project, file, sourcePath, bytes, hash: sha256(bytes) });
    }
  }
  return { manifest, sourceFiles };
}

async function resolveUsers(auth, accounts) {
  const resolved = new Map();
  for (const account of accounts) {
    const email = account.email.toLowerCase();
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`[auth] existing ${email} (${user.uid})`);
      if (!user.displayName && account.displayName) {
        user = await auth.updateUser(user.uid, { displayName: account.displayName });
      }
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') throw error;
      user = await auth.createUser({
        uid: account.uid,
        email,
        displayName: account.displayName,
        emailVerified: false,
        disabled: false,
      });
      console.log(`[auth] created ${email} (${user.uid}); password recovery is required`);
    }
    resolved.set(account.key, user);
  }
  return resolved;
}

async function uploadFiles(bucket, sourceFiles) {
  const uploaded = [];
  for (const entry of sourceFiles) {
    const storagePath = `client-projects/${entry.project.projectId}/files/${entry.file.fileId}-${safeFileName(entry.file.source)}`;
    const remoteFile = bucket.file(storagePath);
    const [exists] = await remoteFile.exists();
    if (exists) {
      const [metadata] = await remoteFile.getMetadata();
      const remoteHash = metadata.metadata?.sha256;
      if (remoteHash === entry.hash) {
        console.log(`[storage] unchanged gs://${bucket.name}/${storagePath}`);
      } else if (!forceFiles) {
        throw new Error(
          `Remote file differs: ${storagePath}. Re-run with --force-files only after reviewing it.`,
        );
      } else {
        await remoteFile.save(entry.bytes, {
          resumable: false,
          validation: 'crc32c',
          contentType: contentType(entry.file.source),
          metadata: {
            cacheControl: 'private, max-age=0, no-store',
            metadata: {
              sha256: entry.hash,
              projectId: entry.project.projectId,
              visibility: 'client_shared',
              originalName: path.basename(entry.file.source),
            },
          },
        });
        console.log(`[storage] replaced gs://${bucket.name}/${storagePath}`);
      }
    } else {
      await remoteFile.save(entry.bytes, {
        resumable: false,
        validation: 'crc32c',
        contentType: contentType(entry.file.source),
        metadata: {
          cacheControl: 'private, max-age=0, no-store',
          metadata: {
            sha256: entry.hash,
            projectId: entry.project.projectId,
            visibility: 'client_shared',
            originalName: path.basename(entry.file.source),
          },
        },
      });
      console.log(`[storage] uploaded gs://${bucket.name}/${storagePath}`);
    }
    uploaded.push({ ...entry, storagePath });
  }
  return uploaded;
}

async function writeSeed(database, manifest, resolvedUsers, uploadedFiles) {
  const createdAt = dateTimestamp(manifest.seedCreatedAt, 'seedCreatedAt');
  const internal = manifest.internalAccess;
  const batch = database.batch();
  batch.set(
    database.collection('companies').doc(internal.companyId),
    {
      name: internal.companyName,
      status: 'active',
      createdAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    database.collection('business_units').doc(internal.companyId),
    {
      companyId: internal.companyId,
      name: internal.companyName,
      type: 'company',
      status: 'active',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    database.collection('partner_agreements').doc(internal.companyId),
    {
      companyId: internal.companyId,
      status: 'active',
      commercialModels: [],
      pricingAuthority: 'cisus_fixed',
      currency: 'CLP',
      contractVersion: 1,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    database.collection('subscription_entitlements').doc(internal.companyId),
    {
      companyId: internal.companyId,
      status: 'active',
      planId: 'cisus_internal',
      subscriptionVersionNonce: 1,
      entitlements: [
        'multi_branch',
        'customer_identity',
        'advanced_pricing',
        'margin_promotions',
        'stock_transfers',
        'advanced_analytics',
      ],
      limits: { seats: { max: internal.maxSeats } },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  for (const access of internal.accounts) {
    const user = resolvedUsers.get(access.accountKey);
    if (!user) throw new Error(`Missing resolved internal account ${access.accountKey}.`);
    batch.set(
      database.collection('access_contracts').doc(access.contractId),
      {
        uid: user.uid,
        companyId: internal.companyId,
        scopeUnitId: internal.companyId,
        jobRoleId: access.jobRoleId,
        status: 'active',
        createdAt,
        updatedAt: serverTimestamp(),
        updatedBy: `seed:${manifest.seedVersion}`,
      },
      { merge: true },
    );
  }

  for (const project of manifest.projects) {
    const user = resolvedUsers.get(project.clientAccountKey);
    if (!user) throw new Error(`Missing resolved client account ${project.clientAccountKey}.`);
    const { files: _files, clientAccountKey: _clientAccountKey, ...projectData } = project;
    batch.set(
      database.collection('client_projects').doc(project.projectId),
      {
        ...projectData,
        migratedFrom: 'local-client-project-seed',
        seedVersion: manifest.seedVersion,
        createdAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    const membershipId = clientMembershipId(user.uid, project.projectId);
    batch.set(
      database.collection('client_project_memberships').doc(membershipId),
      {
        uid: user.uid,
        projectId: project.projectId,
        accessRole: 'client_owner',
        status: 'active',
        source: `seed:${manifest.seedVersion}`,
        createdAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  for (const entry of uploadedFiles) {
    batch.set(
      database.collection('client_project_files').doc(entry.file.fileId),
      {
        projectId: entry.project.projectId,
        name: entry.file.name,
        category: entry.file.category,
        contentType: contentType(entry.file.source),
        size: entry.bytes.length,
        sha256: entry.hash,
        storagePath: entry.storagePath,
        documentDate: entry.file.documentDate,
        sortOrder: entry.file.sortOrder,
        visibility: 'client_shared',
        status: 'active',
        sourceOriginalName: path.basename(entry.file.source),
        seedVersion: manifest.seedVersion,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  batch.set(
    database.collection('migration_audits').doc(manifest.seedVersion),
    {
      projectId,
      databaseId,
      bucketName,
      accountEmails: manifest.accounts.map((account) => account.email.toLowerCase()),
      projectIds: manifest.projects.map((project) => project.projectId),
      sourceFileCount: uploadedFiles.length,
      lastAppliedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();
}

async function verify(database, auth, manifest, resolvedUsers, sourceFiles) {
  const [users, projectSnapshots, membershipSnapshots] = await Promise.all([
    Promise.all(
      manifest.accounts.map((account) => auth.getUserByEmail(account.email.toLowerCase())),
    ),
    Promise.all(
      manifest.projects.map((project) =>
        database.collection('client_projects').doc(project.projectId).get(),
      ),
    ),
    Promise.all(
      manifest.projects.map((project) => {
        const user = resolvedUsers.get(project.clientAccountKey);
        return database
          .collection('client_project_memberships')
          .doc(clientMembershipId(user.uid, project.projectId))
          .get();
      }),
    ),
  ]);
  const fileSnapshots = await Promise.all(
    sourceFiles.map((entry) =>
      database.collection('client_project_files').doc(entry.file.fileId).get(),
    ),
  );
  if (
    users.some((user) => user.disabled) ||
    projectSnapshots.some((snapshot) => !snapshot.exists) ||
    membershipSnapshots.some(
      (snapshot) => !snapshot.exists || snapshot.data()?.status !== 'active',
    ) ||
    fileSnapshots.some((snapshot) => !snapshot.exists || snapshot.data()?.status !== 'active')
  ) {
    throw new Error('Post-seed verification failed.');
  }
  console.log(
    `[verify] ${users.length} accounts, ${projectSnapshots.length} projects and ${fileSnapshots.length} file records are active`,
  );
}

async function main() {
  const { manifest, sourceFiles } = await readManifest();
  console.log(`[seed] ${manifest.seedVersion}`);
  console.log(`[target] ${projectId}/${databaseId} -> gs://${bucketName}`);
  console.log(
    `[plan] ${manifest.accounts.length} accounts, ${manifest.projects.length} projects, ${sourceFiles.length} private file uploads`,
  );
  for (const project of manifest.projects) {
    console.log(
      `  - ${project.projectCode}: ${project.companyName} (${project.files.length} files)`,
    );
  }
  if (!apply) {
    console.log(
      '[dry-run] local manifest and every source file are valid; no remote changes were made',
    );
    return;
  }
  if (
    projectId !== manifest.target.projectId ||
    databaseId !== manifest.target.databaseId ||
    bucketName !== manifest.target.bucketName
  ) {
    throw new Error('The configured Firebase target does not match the reviewed seed manifest.');
  }
  const app = initializeApp({ credential: credential(), projectId, storageBucket: bucketName });
  const auth = getAuth(app);
  const database = new RestFirestore(projectId, databaseId, cloudAccessToken);
  const bucket = new RestStorageBucket(bucketName, cloudAccessToken);
  const resolvedUsers = await resolveUsers(auth, manifest.accounts);
  const uploadedFiles = await uploadFiles(bucket, sourceFiles);
  await writeSeed(database, manifest, resolvedUsers, uploadedFiles);
  await verify(database, auth, manifest, resolvedUsers, sourceFiles);
  console.log(
    '[done] client projects restored; new password users must use the recovery link on the login page',
  );
}

main().catch((error) => {
  console.error('[seed:error]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
