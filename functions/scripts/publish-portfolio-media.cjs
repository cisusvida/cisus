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
const ACTOR = "system:portfolio-media-import";
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const EDITORIAL_CONTENT = Object.freeze({
  cisus_tabla_felino: {
    description:
      "Una pieza funcional y decorativa, con una composición lineal de felino que aporta carácter y calidez a tu espacio.",
    shortDescription:
      "Una pieza funcional con silueta felina, pensada para servir, decorar y regalar.",
    materialLabel: "Madera",
  },
});
const TARGETS = Object.freeze({
  hero: {
    kind: "home",
    id: "hero",
    field: "heroImagePath",
    folder: "public-media/home/hero",
  },
  carving: {
    kind: "home",
    id: "hero_carving",
    field: "heroCarvingImagePath",
    folder: "public-media/home/hero_carving",
  },
  background: {
    kind: "home",
    id: "portfolio_background",
    field: "portfolioBackgroundImagePath",
    folder: "public-media/home/portfolio_background",
  },
  "felino-scene": {
    kind: "product_scene",
    id: "cisus_tabla_felino",
    field: "sceneImagePath",
    folder: "public-media/product-scenes/cisus_tabla_felino",
  },
  "delfin-scene": {
    kind: "product_scene",
    id: "cisus_tabla_delfin",
    field: "sceneImagePath",
    folder: "public-media/product-scenes/cisus_tabla_delfin",
  },
  "relieve-scene": {
    kind: "product_scene",
    id: "cisus_tabla_relieve",
    field: "sceneImagePath",
    folder: "public-media/product-scenes/cisus_tabla_relieve",
  },
  zorro: {
    kind: "product",
    id: "cisus_tabla_zorro",
    field: "imagePath",
    folder: "public-media/products/cisus_tabla_zorro",
    product: {
      sku: "CIS-TAB-ZORRO",
      name: "Zorro",
      description:
        "Propuesta visual de una tabla conceptual con silueta de zorro, pensada para servir, decorar y regalar.",
      shortDescription:
        "Propuesta visual con silueta de zorro, pensada para servir y regalar.",
      materialLabel: "Madera",
      basePrice: 32990,
    },
  },
  "zorro-scene": {
    kind: "product_scene",
    id: "cisus_tabla_zorro",
    field: "sceneImagePath",
    folder: "public-media/product-scenes/cisus_tabla_zorro",
  },
  mesa: {
    kind: "product",
    id: "cisus_mesa_cauce",
    field: "imagePath",
    folder: "public-media/products/cisus_mesa_cauce",
    product: {
      sku: "CIS-MES-CAUCE",
      name: "Mesas personalizadas",
      description: "Hechas para integrar tu espacio.",
      shortDescription: "Hechas para integrar tu espacio.",
      materialLabel: "Madera",
      basePrice: 189990,
    },
  },
  mueble: {
    kind: "product",
    id: "cisus_mueble_linde",
    field: "imagePath",
    folder: "public-media/products/cisus_mueble_linde",
    product: {
      sku: "CIS-MUE-LINDE",
      name: "Almacenamiento artesanal",
      description: "Funcionalidad con diseño atemporal.",
      shortDescription: "Funcionalidad con diseño atemporal.",
      materialLabel: "Madera",
      basePrice: 249990,
    },
  },
  repisa: {
    kind: "product",
    id: "cisus_repisa_senda",
    field: "imagePath",
    folder: "public-media/products/cisus_repisa_senda",
    product: {
      sku: "CIS-PROP-REPISA",
      name: "Repisas orgánicas",
      description:
        "Propuesta editorial para explorar almacenamiento ligero en madera.",
      shortDescription: "Propuesta editorial de almacenamiento ligero.",
      materialLabel: "Madera",
      basePrice: 79990,
    },
  },
  banco: {
    kind: "product",
    id: "cisus_banco_raiz",
    field: "imagePath",
    folder: "public-media/products/cisus_banco_raiz",
    product: {
      sku: "CIS-PROP-BANCO",
      name: "Bancos escultóricos",
      description:
        "Propuesta editorial de asiento compacto con una silueta cálida y orgánica.",
      shortDescription: "Propuesta editorial de asiento compacto.",
      materialLabel: "Madera",
      basePrice: 119990,
    },
  },
  lampara: {
    kind: "product",
    id: "cisus_lampara_claro",
    field: "imagePath",
    folder: "public-media/products/cisus_lampara_claro",
    product: {
      sku: "CIS-PROP-LAMPARA",
      name: "Lámparas de madera",
      description:
        "Propuesta editorial de iluminación ambiental con listones de madera.",
      shortDescription: "Propuesta editorial de iluminación ambiental.",
      materialLabel: "Madera",
      basePrice: 89990,
    },
  },
  pedestal: {
    kind: "product",
    id: "cisus_pedestal_brote",
    field: "imagePath",
    folder: "public-media/products/cisus_pedestal_brote",
    product: {
      sku: "CIS-PROP-PEDESTAL",
      name: "Pedestales botánicos",
      description:
        "Propuesta editorial para integrar plantas y madera en una pieza vertical.",
      shortDescription: "Propuesta editorial para integrar plantas y madera.",
      materialLabel: "Madera",
      basePrice: 69990,
    },
  },
});

function parseArgs(argv) {
  if (argv.length % 2 !== 0)
    throw new Error("Cada opción necesita una ruta de archivo.");
  const uploads = [];
  for (let index = 0; index < argv.length; index += 2) {
    const key = String(argv[index] || "").replace(/^--/, "");
    const target = TARGETS[key];
    if (!target) throw new Error(`Destino desconocido: ${key}`);
    uploads.push({ key, ...target, source: resolve(argv[index + 1]) });
  }
  if (!uploads.length) throw new Error("Indica al menos una imagen.");
  if (new Set(uploads.map(({ key }) => key)).size !== uploads.length) {
    throw new Error("Cada destino puede aparecer una sola vez.");
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

async function encodeAndUpload(upload, workDir) {
  const size = statSync(upload.source).size;
  if (!size || size > MAX_SOURCE_BYTES) {
    throw new Error(`${basename(upload.source)} debe pesar menos de 8 MB.`);
  }
  const destination = join(workDir, `${upload.key}.webp`);
  const maxWidth = upload.kind === "product" ? 1200 : 1920;
  const encoded = await sharp(readFileSync(upload.source), {
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
  writeFileSync(destination, encoded);

  const path = `${upload.folder}/image-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const uri = storageUri(path);
  const token = randomUUID();
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
    `--custom-metadata=mediaKind=${upload.kind},targetId=${upload.id},firebaseStorageDownloadTokens=${token}`,
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

async function commit(uploaded) {
  const token = gcloud("auth", "print-access-token");
  const root = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
  const now = new Date().toISOString();
  const writes = uploaded.flatMap((upload) => {
    const documentName =
      upload.kind === "home"
        ? `${root}/public_site_content/home`
        : `${root}/products/${upload.id}`;
    const fields = upload.product
      ? {
          sku: stringValue(upload.product.sku),
          name: stringValue(upload.product.name),
          description: stringValue(upload.product.description),
          materialLabel: stringValue(upload.product.materialLabel || "Madera"),
          shortDescription: stringValue(
            upload.product.shortDescription || upload.product.description,
          ),
          imagePath: stringValue(upload.path),
          basePrice: integerValue(upload.product.basePrice),
          currency: stringValue("CLP"),
          status: stringValue("active"),
          isPublic: { booleanValue: true },
          updatedAt: { timestampValue: now },
          updatedBy: stringValue(ACTOR),
        }
      : {
          [upload.field]: stringValue(upload.path),
          updatedAt: { timestampValue: now },
          updatedBy: stringValue(ACTOR),
        };
    return [
      {
        update: { name: documentName, fields },
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
            mediaKind: stringValue(upload.kind),
            targetId: stringValue(upload.id),
            path: stringValue(upload.path),
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
  if (!response.ok)
    throw new Error(
      `Firestore rechazó la publicación: ${await response.text()}`,
    );
}

async function syncEditorialContent() {
  const token = gcloud("auth", "print-access-token");
  const root = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
  const now = new Date().toISOString();
  const writes = Object.entries(EDITORIAL_CONTENT).map(([id, content]) => {
    const fields = {
      description: stringValue(content.description),
      shortDescription: stringValue(content.shortDescription),
      materialLabel: stringValue(content.materialLabel),
      updatedAt: { timestampValue: now },
      updatedBy: stringValue(ACTOR),
    };
    return {
      update: { name: `${root}/products/${id}`, fields },
      updateMask: { fieldPaths: Object.keys(fields) },
    };
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
  if (!response.ok)
    throw new Error(`Firestore rechazó el contenido: ${await response.text()}`);
}

async function main() {
  if (process.argv.length === 3 && process.argv[2] === "--sync-editorial") {
    await syncEditorialContent();
    console.log(
      `Contenido editorial sincronizado: ${Object.keys(EDITORIAL_CONTENT).join(", ")}`,
    );
    return;
  }
  const uploads = parseArgs(process.argv.slice(2));
  const workDir = mkdtempSync(join(tmpdir(), "cisus-portfolio-media-"));
  const uploaded = [];
  try {
    for (const upload of uploads)
      uploaded.push(await encodeAndUpload(upload, workDir));
    await commit(uploaded);
    for (const upload of uploaded) console.log(`${upload.key}: ${upload.path}`);
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
