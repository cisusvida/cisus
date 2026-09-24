#!/usr/bin/env node

"use strict";

const { execFileSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { basename, join, resolve } = require("node:path");
const sharp = require("sharp");

const PROJECT_ID = process.env.GCLOUD_PROJECT || "cisus-3b180";
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "cisusdb";
const BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || "cisus-3b180.firebasestorage.app";
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const ACTOR = "system:initial-product-media-import";
const PRODUCTS = Object.freeze({
  felino: {
    id: "cisus_tabla_felino",
    sku: "CIS-TAB-FELINO",
    name: "Felino",
    description:
      "Tabla de madera alargada con una composición lineal de felino para compartir y regalar.",
    basePrice: 29990,
  },
  delfin: {
    id: "cisus_tabla_delfin",
    sku: "CIS-TAB-DELFIN",
    name: "Delfín",
    description:
      "Tabla de madera redonda con una composición lineal de delfín que acompaña su movimiento.",
    basePrice: 24990,
  },
  relieve: {
    id: "cisus_tabla_relieve",
    sku: "CIS-TAB-RELIEVE",
    name: "Con relieve",
    description:
      "Tabla de madera con canal perimetral, asa integrada y un paisaje lineal en su superficie.",
    basePrice: 34990,
  },
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
    const key = String(flag || "").replace(/^--/, "");
    if (!PRODUCTS[key] || !source) {
      throw new Error(
        "Uso: node functions/scripts/publish-product-media.cjs --felino <archivo> --delfin <archivo> --relieve <archivo>",
      );
    }
    uploads.push({ key, product: PRODUCTS[key], source: resolve(source) });
  }
  if (!uploads.length)
    throw new Error("Indica al menos una imagen de producto.");
  if (new Set(uploads.map(({ key }) => key)).size !== uploads.length) {
    throw new Error("Cada producto puede aparecer una sola vez.");
  }
  return uploads;
}

function gcloud(...args) {
  const options = { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] };
  if (process.platform !== "win32")
    return execFileSync("gcloud", args, options).trim();

  const script = execFileSync("where.exe", ["gcloud.ps1"], { encoding: "utf8" })
    .split(/\r?\n/)
    .find(Boolean);
  if (!script) throw new Error("No se encontró gcloud.ps1 en PATH.");
  return execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      script,
      ...args,
    ],
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

  const destination = join(workDir, `${upload.key}.webp`);
  const encoded = await sharp(readFileSync(upload.source), {
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
  writeFileSync(destination, encoded);

  const productId = upload.product.id;
  const path = `public-media/products/${productId}/image-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const uri = storageUri(path);
  const downloadToken = randomUUID();
  gcloud(
    "storage",
    "cp",
    destination,
    uri,
    "--content-type=image/webp",
    "--quiet",
  );
  gcloud(
    "storage",
    "objects",
    "update",
    uri,
    "--cache-control=public, max-age=604800, immutable",
    `--custom-metadata=mediaKind=product,targetId=${productId},firebaseStorageDownloadTokens=${downloadToken}`,
    "--quiet",
  );
  return { ...upload, path };
}

function stringValue(value) {
  return { stringValue: value };
}

function integerValue(value) {
  return { integerValue: String(value) };
}

async function commitProducts(uploaded) {
  const token = gcloud("auth", "print-access-token");
  const root = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
  const now = new Date().toISOString();
  const writes = uploaded.flatMap(({ product, path }) => {
    const fields = {
      sku: stringValue(product.sku),
      name: stringValue(product.name),
      description: stringValue(product.description),
      imagePath: stringValue(path),
      basePrice: integerValue(product.basePrice),
      currency: stringValue("CLP"),
      status: stringValue("active"),
      isPublic: { booleanValue: true },
      updatedAt: { timestampValue: now },
      updatedBy: stringValue(ACTOR),
    };
    return [
      {
        update: { name: `${root}/products/${product.id}`, fields },
        updateMask: { fieldPaths: Object.keys(fields) },
      },
      {
        update: {
          name: `${root}/audit_logs/${randomUUID().replaceAll("-", "")}`,
          fields: {
            event: stringValue("public_media_seeded"),
            actorUid: stringValue(ACTOR),
            companyId: stringValue("cisus"),
            entityId: stringValue("cisus"),
            mediaKind: stringValue("product"),
            targetId: stringValue(product.id),
            path: stringValue(path),
            createdAt: { timestampValue: now },
          },
        },
      },
    ];
  });

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:commit`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ writes }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Firestore rechazó la publicación (${response.status}): ${await response.text()}`,
    );
  }
}

function decodedValue(value) {
  if (value?.stringValue !== undefined) return value.stringValue;
  if (value?.integerValue !== undefined) return Number(value.integerValue);
  if (value?.booleanValue !== undefined) return value.booleanValue;
  return null;
}

async function readProducts() {
  const token = gcloud("auth", "print-access-token");
  const entries = await Promise.all(
    Object.values(PRODUCTS).map(async (product) => {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/products/${product.id}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      if (response.status === 404) return [product.id, null];
      if (!response.ok)
        throw new Error(`No se pudo leer ${product.id} (${response.status}).`);
      const document = await response.json();
      return [
        product.id,
        Object.fromEntries(
          [
            "sku",
            "name",
            "imagePath",
            "basePrice",
            "currency",
            "status",
            "isPublic",
          ].map((field) => [field, decodedValue(document.fields?.[field])]),
        ),
      ];
    }),
  );
  return Object.fromEntries(entries);
}

async function main() {
  if (process.argv.length === 3 && process.argv[2] === "--verify") {
    console.log(JSON.stringify(await readProducts(), null, 2));
    return;
  }
  const uploads = parseArgs(process.argv.slice(2));
  const workDir = mkdtempSync(join(tmpdir(), "cisus-product-media-"));
  const uploaded = [];
  try {
    for (const upload of uploads)
      uploaded.push(await encodeUpload(upload, workDir));
    await commitProducts(uploaded);
    for (const { product, path } of uploaded)
      console.log(`${product.id}: ${path}`);
  } catch (error) {
    for (const { path } of uploaded) {
      try {
        gcloud("storage", "rm", storageUri(path), "--quiet");
      } catch {
        console.error(`No se pudo revertir ${path}.`);
      }
    }
    throw error;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) =>
  fail(error instanceof Error ? error.message : String(error)),
);
