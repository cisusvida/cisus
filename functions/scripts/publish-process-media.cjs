#!/usr/bin/env node

'use strict';

const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { basename, join, resolve } = require('node:path');
const sharp = require('sharp');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'cisus-3b180';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'cisusdb';
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'cisus-3b180.firebasestorage.app';
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const PROCESS_FIELDS = Object.freeze({
  // Legacy Portavasos IDs deliberately remain for existing content; do not migrate Storage paths.
  idea: 'ideaImagePath',
  sketch: 'sketchImagePath',
  design: 'designImagePath',
  prototype: 'prototypeImagePath',
  production: 'productionImagePath',
  delivery: 'deliveryImagePath',
  result: 'resultImagePath',
  tablas_idea: 'tablasIdeaImagePath',
  tablas_sketch: 'tablasSketchImagePath',
  tablas_design: 'tablasDesignImagePath',
  tablas_prototype: 'tablasPrototypeImagePath',
  tablas_production: 'tablasProductionImagePath',
  tablas_delivery: 'tablasDeliveryImagePath',
  tablas_result: 'tablasResultImagePath',
});

function fail(message) {
  console.error(message);
  process.exitCode = 1;
  return null;
}

function parseArgs(argv) {
  const uploads = [];
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const source = argv[index + 1];
    const targetId = String(flag || '').replace(/^--/, '');
    if (!PROCESS_FIELDS[targetId] || !source) {
      throw new Error(
        'Uso: node functions/scripts/publish-process-media.cjs --<etapa> <archivo> (idea, sketch, design, prototype, production, delivery, result, tablas_idea, tablas_sketch, tablas_design, tablas_prototype, tablas_production, tablas_delivery o tablas_result)',
      );
    }
    uploads.push({ targetId, source: resolve(source) });
  }
  if (!uploads.length) throw new Error('Indica al menos una imagen de proceso.');
  if (new Set(uploads.map(({ targetId }) => targetId)).size !== uploads.length) {
    throw new Error('Cada etapa puede aparecer una sola vez.');
  }
  return uploads;
}

function gcloud(...args) {
  const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] };
  if (process.platform !== 'win32') return execFileSync('gcloud', args, options).trim();

  const script = execFileSync('where.exe', ['gcloud.ps1'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .find(Boolean);
  if (!script) throw new Error('No se encontró gcloud.ps1 en PATH.');
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, ...args],
    options,
  ).trim();
}

function storageUri(path) {
  return `gs://${BUCKET}/${path}`;
}

async function encodeUpload(upload, workDir) {
  const sourceBytes = statSync(upload.source).size;
  if (!sourceBytes || sourceBytes > MAX_SOURCE_BYTES) {
    throw new Error(`${basename(upload.source)} debe pesar menos de 8 MB.`);
  }

  const destination = join(workDir, `${upload.targetId}.webp`);
  const encoded = await sharp(readFileSync(upload.source), { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  writeFileSync(destination, encoded);

  const path = `public-media/process/${upload.targetId}/image-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const uri = storageUri(path);
  const downloadToken = randomUUID();
  gcloud('storage', 'cp', destination, uri, '--content-type=image/webp', '--quiet');
  gcloud(
    'storage',
    'objects',
    'update',
    uri,
    '--cache-control=public, max-age=604800, immutable',
    `--custom-metadata=mediaKind=process,targetId=${upload.targetId},firebaseStorageDownloadTokens=${downloadToken}`,
    '--quiet',
  );
  return { ...upload, path };
}

function stringValue(value) {
  return { stringValue: value };
}

async function commitReferences(uploaded) {
  const token = gcloud('auth', 'print-access-token');
  const root = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
  const now = new Date().toISOString();
  const processFields = Object.fromEntries(
    uploaded.map(({ targetId, path }) => [PROCESS_FIELDS[targetId], stringValue(path)]),
  );
  processFields.updatedAt = { timestampValue: now };
  processFields.updatedBy = stringValue('system:initial-process-media-import');

  const writes = [
    {
      update: { name: `${root}/public_site_content/process`, fields: processFields },
      updateMask: { fieldPaths: [...Object.keys(processFields)] },
    },
    ...uploaded.map(({ targetId, path }) => ({
      update: {
        name: `${root}/audit_logs/${randomUUID().replaceAll('-', '')}`,
        fields: {
          event: stringValue('public_media_seeded'),
          actorUid: stringValue('system:initial-process-media-import'),
          companyId: stringValue('cisus'),
          entityId: stringValue('cisus'),
          mediaKind: stringValue('process'),
          targetId: stringValue(targetId),
          path: stringValue(path),
          createdAt: { timestampValue: now },
        },
      },
    })),
  ];

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:commit`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ writes }),
    },
  );
  if (!response.ok) {
    throw new Error(`Firestore rechazó la publicación (${response.status}): ${await response.text()}`);
  }
}

async function readPublishedReferences() {
  const token = gcloud('auth', 'print-access-token');
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/public_site_content/process`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`No se pudo leer la publicación (${response.status}).`);
  const document = await response.json();
  return Object.fromEntries(
    Object.entries(PROCESS_FIELDS).map(([targetId, field]) => [
      targetId,
      document.fields?.[field]?.stringValue ?? null,
    ]),
  );
}

async function ensureDownloadTokens() {
  const references = await readPublishedReferences();
  const published = Object.entries(references).filter(([, path]) => Boolean(path));
  if (!published.length) return;
  gcloud(
    'storage',
    'objects',
    'update',
    ...published.map(([, path]) => storageUri(path)),
    `--update-custom-metadata=firebaseStorageDownloadTokens=${randomUUID()}`,
    '--quiet',
  );
  console.log(`${published.length} tokens actualizados.`);
}

async function main() {
  if (process.argv.length === 3 && process.argv[2] === '--verify') {
    console.log(JSON.stringify(await readPublishedReferences(), null, 2));
    return;
  }
  if (process.argv.length === 3 && process.argv[2] === '--repair-tokens') {
    await ensureDownloadTokens();
    return;
  }
  const uploads = parseArgs(process.argv.slice(2));
  const workDir = mkdtempSync(join(tmpdir(), 'cisus-process-media-'));
  const uploaded = [];
  try {
    for (const upload of uploads) uploaded.push(await encodeUpload(upload, workDir));
    await commitReferences(uploaded);
    for (const { targetId, path } of uploaded) console.log(`${targetId}: ${path}`);
  } catch (error) {
    for (const { path } of uploaded) {
      try {
        gcloud('storage', 'rm', storageUri(path), '--quiet');
      } catch {
        console.error(`No se pudo revertir ${path}.`);
      }
    }
    throw error;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
