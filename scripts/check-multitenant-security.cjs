'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const functionsRoot = path.join(root, 'functions', 'src');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const failures = [];
const trackedFiles = new Set(
  execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean),
);
for (const localConfig of ['.firebaserc', 'firebase.json', 'cisus-angular/public/runtime-config.js']) {
  if (trackedFiles.has(localConfig)) failures.push(`${localConfig} contiene configuración local y no debe versionarse.`);
}

const sensitivePatterns = [
  'AIza[0-9A-Za-z_-]{20,}',
  '[0-9]+:[0-9]+:web:[0-9a-f]{8,}',
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
].join('|');
const sensitiveScan = spawnSync('git', ['grep', '-I', '-n', '-E', sensitivePatterns, '--'], {
  cwd: root,
  encoding: 'utf8',
});
if (sensitiveScan.status === 0) {
  failures.push(`Hay credenciales o identificadores sensibles versionados:\n${sensitiveScan.stdout.trim()}`);
} else if (sensitiveScan.status !== 1) {
  failures.push(`No se pudo ejecutar el escaneo de datos sensibles: ${sensitiveScan.stderr.trim()}`);
}

const firebaseConfig = JSON.parse(read('firebase.example.json'));
const database = Array.isArray(firebaseConfig.firestore)
  ? firebaseConfig.firestore.find((entry) => entry.database === 'REPLACE_FIRESTORE_DATABASE_ID')
  : undefined;
if (database?.rules !== 'firestore.rules') failures.push('firebase.example.json no enlaza la base con sus reglas.');
if (firebaseConfig.storage?.rules !== 'storage.rules') failures.push('Storage no enlaza sus reglas.');

const firestoreRules = read('firestore.rules');
for (const claim of ['pv', 'sv', 'cid', 'entityId', 'jobRoleId', 'scopeId']) {
  if (!firestoreRules.includes(`request.auth.token.${claim}`)) failures.push(`Falta validar claim ${claim}.`);
}
if (!/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/.test(firestoreRules)) {
  failures.push('Firestore no conserva cierre global backend-only.');
}
if (!/match \/public_site_content\/home[\s\S]*allow read: if true;[\s\S]*allow write: if false;/.test(firestoreRules)) {
  failures.push('Falta el read model público y de solo lectura para la portada.');
}
const storageRules = read('storage.rules');
if (!/match \/\{allPaths=\*\*\}[\s\S]*allow read, write: if false;/.test(storageRules)) {
  failures.push('Storage no conserva cierre global backend-only.');
}
if (/allow read:\s*if true/.test(storageRules)) {
  failures.push('Storage abre lecturas públicas directas; deben usarse URLs firmadas.');
}

const firebaseClient = read('cisus-angular/src/app/core/services/firebase-client.ts');
const runtimeConfig = read('cisus-angular/public/runtime-config.example.js');
if (!firebaseClient.includes('initializeAppCheck') || !firebaseClient.includes('ReCaptchaEnterpriseProvider')) {
  failures.push('Angular no inicializa Firebase App Check con reCAPTCHA Enterprise.');
}
if (!runtimeConfig.includes("firebaseAppCheckSiteKey: 'REPLACE_FIREBASE_APP_CHECK_SITE_KEY'")) {
  failures.push('runtime-config.example.js no declara el placeholder de App Check.');
}

const publicMediaFunction = read('functions/src/media/public-media.function.js');
for (const contract of [
  'enforceAppCheck:',
  'getSignedUrl',
  'public-media/home/',
  'public-media/products/',
  "permission: 'catalog.manage'",
  'PLATFORM_MEDIA_ROLES',
]) {
  if (!publicMediaFunction.includes(contract)) failures.push(`Medios públicos: falta contrato ${contract}.`);
}

const bootstrap = new Set([
  'auth/get-available-contexts.function.js',
  'auth/get-entity-access.function.js',
]);
const publicCallableFiles = new Set([
  'catalog/catalog.function.js',
  'media/public-media.function.js',
]);
const callableFiles = walk(functionsRoot).filter((file) => /\.function\.(?:ts|js)$/.test(file));
for (const file of callableFiles) {
  const relative = path.relative(functionsRoot, file).replaceAll('\\', '/');
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('onCall') && !source.includes('defineScopedCallable')) continue;
  if (
    !bootstrap.has(relative) &&
    !publicCallableFiles.has(relative) &&
    !source.includes('defineScopedCallable') &&
    !source.includes('resolveFreshScopedContext')
  ) {
    failures.push(`${relative}: callable tenant sin autorización de contexto estricta.`);
  }
  if (publicCallableFiles.has(relative) && !source.includes('enforceAppCheck:')) {
    failures.push(`${relative}: callable público sin App Check obligatorio.`);
  }
  if (/console\.(?:log|info|warn|error)\([^\n]*(?:rut|phone|token)/i.test(source)) {
    failures.push(`${relative}: posible dato personal o token en logs.`);
  }
}

for (const forbidden of ['next.config.ts', 'src/app/layout.tsx', 'tailwind.config.ts']) {
  if (fs.existsSync(path.join(root, forbidden))) failures.push(`Permanece artefacto heredado: ${forbidden}.`);
}

if (failures.length) {
  console.error('Cisus security contract: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Cisus security contract: PASS');
}
