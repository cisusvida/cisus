"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const sharp = require("sharp");
const { HttpsError } = require("firebase-functions/v2/https");

// Run the actual callable body and encoder with in-memory Firebase boundaries.
function harness(failCommit = false, content = {}) {
  const writes = [];
  const saved = [];
  const deleted = [];
  let callableOptions;
  const file = (path) => ({
    download: async () => [await sharp({ create: { width: 2, height: 2, channels: 4, background: '#ffffff' } }).webp().toBuffer()],
    save: async (bytes, options) => saved.push({ path, bytes, options }),
    getMetadata: async () => [{ generation: "1", metadata: { firebaseStorageDownloadTokens: "test-token" } }],
    delete: async () => deleted.push(path),
  });
  const firebase = {
    storage: { bucket: () => ({ name: "test-bucket", file }) },
    firestore: {
      collection: (name) => ({ doc: (id = "audit") => ({ path: `${name}/${id}`, get: async () => ({ exists: true, data: () => ({ heroImagePath: 'public-media/home/hero/base.webp', heroCarvingImagePath: 'public-media/home/hero_carving/top.webp', sceneImagePath: `public-media/product-scenes/${id}/base.webp`, ...content }) }) }) }),
      batch: () => ({
        set: (ref, data) => writes.push({ ref, data }),
        commit: async () => { if (failCommit) throw new Error("commit failed"); },
      }),
    },
    FieldValue: { serverTimestamp: () => "timestamp", delete: () => 'delete' },
  };
  const exported = {};
  vm.runInNewContext(readFileSync(join(__dirname, "public-media.function.js"), "utf8"), {
    exports: exported, Buffer, process, console,
    require: (name) => {
      if (name === "../shared/firebase-admin") return firebase;
      if (name === "firebase-functions/v2/https") return { HttpsError, onCall: (_, handler) => handler };
      if (name === "../security/define-scoped-callable") return {
        defineScopedCallable: (options, handler) => { callableOptions = options; return handler; },
      };
      return require(name);
    },
  });
  return { upload: exported.uploadPublicMedia, download: exported.downloadPublicMedia, configure: exported.configurePublicMedia, saved, writes, deleted, callableOptions };
}
function catalogHarness(products) {
  const exported = {};
  const query = {
    where() { return this; },
    limit() { return this; },
    get: async () => ({ docs: products.map(({ id, data }) => ({ id, data: () => data })) }),
  };
  const firebase = { firestore: { collection: () => query } };
  vm.runInNewContext(readFileSync(join(__dirname, '../catalog/catalog.function.js'), 'utf8'), {
    exports: exported,
    process: { env: { FUNCTIONS_EMULATOR: 'true' } },
    require: (name) => {
      if (name === 'firebase-functions/v2/https')
        return { HttpsError, onCall: (_options, handler) => handler };
      if (name === '../shared/firebase-admin') return firebase;
      if (name === '../security/define-scoped-callable')
        return { defineScopedCallable: (_options, handler) => handler };
      return require(name);
    },
  });
  return exported.listPublicProducts;
}
const context = { scopeLevel: "company", jobRoleId: "cisus_designer", uid: "designer", cid: "cisus", entityId: "cisus" };
async function pngRequest() {
  const pixels = Buffer.from([255, 0, 0, 0, 0, 255, 0, 85, 0, 0, 255, 170, 255, 255, 255, 255]);
  const png = await sharp(pixels, { raw: { width: 2, height: 2, channels: 4 } }).png().toBuffer();
  return { kind: "home", targetId: "hero_carving", mimeType: "image/png", fileBase64: png.toString("base64") };
}

for (const quality of [undefined, 82, 76, 68]) {
  test(`upload converts PNG to WebP preserving alpha at quality ${quality ?? "default"}`, async () => {
    const h = harness();
    const result = await h.upload({ ...await pngRequest(), ...(quality === undefined ? {} : { quality }) }, context);
    assert.equal(h.callableOptions.permission, "public_media.manage");
    assert.equal(h.saved.length, 1);
    const encoded = h.saved[0];
    const metadata = await sharp(encoded.bytes).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.hasAlpha, true);
    assert.equal(metadata.width, 2);
    const alpha = await sharp(encoded.bytes).extractChannel("alpha").raw().toBuffer();
    assert.deepEqual([...alpha], [0, 85, 170, 255]);
    assert.equal(encoded.options.metadata.metadata.webpQuality, String(quality ?? 82));
    assert.match(encoded.path, /^public-media\/home\/hero_carving\/.*\.webp$/);
    assert.equal(h.writes[0].data.heroCarvingImagePath, encoded.path);
    assert.equal(h.writes[0].data.heroImagePath, undefined);
    assert.equal(h.writes[1].data.quality, quality ?? 82);
    assert.equal(result.media.path, encoded.path);
  });
}
test("upload rejects foreign roles and branch scope before writing", async () => {
  for (const overrides of [{ jobRoleId: "company_admin" }, { scopeLevel: "branch" }]) {
    const h = harness();
    await assert.rejects(h.upload(await pngRequest(), { ...context, ...overrides }), { code: "permission-denied" });
    assert.equal(h.saved.length, 0);
  }
});
test("upload rejects unsupported qualities, malformed images and excessive bytes", async () => {
  const request = await pngRequest();
  for (const overrides of [
    ...[0, 100, "82", null, 81].map((quality) => ({ quality })),
    { fileBase64: Buffer.from("not an image").toString("base64") },
    { fileBase64: Buffer.alloc(8 * 1024 * 1024 + 1).toString("base64") },
  ]) {
    const h = harness();
    await assert.rejects(h.upload({ ...request, ...overrides }, context), { code: "invalid-argument" });
    assert.equal(h.saved.length, 0);
  }
});
test("upload removes its new object if the read-model commit fails", async () => {
  const h = harness(true);
  await assert.rejects(h.upload(await pngRequest(), context), /commit failed/);
  assert.deepEqual(h.deleted, [h.saved[0].path]);
});

test('thumbnail upload leaves catalog and scene unchanged', async () => {
  const h = harness();
  await h.upload({ ...await pngRequest(), kind: 'product_thumbnail', targetId: 'felino' }, context);
  assert.match(h.writes[0].data.thumbnailImagePath, /^public-media\/product-thumbnails\/felino\//);
  assert.equal(h.writes[0].data.sceneImagePath, undefined);
  assert.equal(h.writes[0].data.imagePath, undefined);
});
test('extra layers use separate destinations and reject mismatched ratio', async () => {
  const h = harness();
  await h.upload({ ...await pngRequest(), kind: 'product_scene_3', targetId: 'felino' }, context);
  assert.match(h.writes[0].data.sceneLayer3Path, /^public-media\/product-layers\/felino\/3\//);
  const png = await sharp({ create: { width: 4, height: 2, channels: 4, background: '#fff' } }).png().toBuffer();
  await assert.rejects(h.upload({ ...await pngRequest(), fileBase64: png.toString('base64') }, context), { code: 'invalid-argument' });
});
test('download uses only active managed path and keeps authorization', async () => {
  const h = harness();
  const downloaded = await h.download({ kind: 'home', targetId: 'hero' }, context);
  assert.equal((await sharp(Buffer.from(downloaded.base64, 'base64')).metadata()).format, 'webp');
  assert.match(downloaded.filename, /hero-home.webp$/);
  await assert.rejects(h.download({ kind: 'home', targetId: '../private' }, context), { code: 'invalid-argument' });
  await assert.rejects(h.download({ kind: 'home', targetId: 'hero' }, { ...context, jobRoleId: 'company_admin' }), { code: 'permission-denied' });
});
test('animation validates mode, scope and presence of an overlay', async () => {
  const h = harness();
  await h.configure({ kind: 'home', targetId: 'hero', animation: 'disappear' }, context);
  assert.equal(h.writes[0].data.heroAnimation, 'disappear');
  await assert.rejects(h.configure({ kind: 'home', targetId: 'hero', animation: 'zoom' }, context), { code: 'invalid-argument' });
  await assert.rejects(h.configure({ kind: 'product_scene', targetId: 'felino', animation: 'disappear' }, context), { code: 'failed-precondition' });
});

test('animation stores stable layer keys for Home and product compositions', async () => {
  for (const [kind, animationLayerKeys, content] of [
    ['home', ['hero_layer_3'], { heroLayer3Path: 'public-media/home/hero_layer_3/middle.webp' }],
    ['product_scene', ['product_scene', 'product_scene_3'], { sceneLayer3Path: 'public-media/product-layers/felino/3/overlay.webp' }],
  ]) {
    const h = harness(false, content);
    const result = await h.configure({
      kind,
      targetId: kind === 'home' ? 'hero' : 'felino',
      animation: 'appear',
      animationLayerKeys,
    }, context);
    const field = kind === 'home' ? 'heroAnimationLayerKeys' : 'sceneAnimationLayerKeys';
    assert.deepEqual(Array.from(result.animationLayerKeys), animationLayerKeys);
    assert.deepEqual(Array.from(h.writes[0].data[field]), animationLayerKeys);
    assert.deepEqual(Array.from(h.writes[1].data.animationLayerKeys), animationLayerKeys);
  }
});

test('animation validates stable identities, publication, and the base-plus-one-overlay limit', async () => {
  const valid = { kind: 'product_scene', targetId: 'felino', animation: 'disappear', animationLayerKeys: ['product_scene'] };
  const baseOnly = harness();
  await baseOnly.configure(valid, context);
  assert.deepEqual(Array.from(baseOnly.writes[0].data.sceneAnimationLayerKeys), ['product_scene']);
  for (const animationLayerKeys of [
    ['product_scene', 'product_scene'],
    ['product_scene_9'],
    ['product_scene_2', 'product_scene_3'],
    ['product_scene', 'product_scene_2', 'product_scene_3'],
    'product_scene_2',
  ]) {
    const invalid = harness();
    await assert.rejects(invalid.configure({ ...valid, animationLayerKeys }, context), { code: 'invalid-argument' });
    assert.equal(invalid.writes.length, 0);
  }
  await assert.rejects(harness(false, { sceneLayer2Path: null }).configure({
    ...valid,
    animationLayerKeys: ['product_scene_2'],
  }, context), { code: 'failed-precondition' });
  await assert.rejects(harness().configure({ ...valid, animationLayerKeys: [] }, context), { code: 'failed-precondition' });
  const noEffect = harness(false, { sceneAnimationLayerKeys: ['product_scene_2'] });
  const preserved = await noEffect.configure({ kind: 'product_scene', targetId: 'felino', animation: 'none', animationLayerKeys: ['product_scene_2'] }, context);
  assert.deepEqual(Array.from(preserved.animationLayerKeys), ['product_scene_2']);
});

test('legacy animation documents resolve once before a new layer is published', async () => {
  const home = harness(false, {
    heroAnimation: 'appear',
    heroAnimationTarget: 'last',
  });
  await home.upload({ ...await pngRequest(), kind: 'home', targetId: 'hero_layer_3' }, context);
  assert.equal(home.writes[0].data.heroAnimation, 'appear');
  assert.deepEqual(Array.from(home.writes[0].data.heroAnimationLayerKeys), ['hero_carving']);

  const product = harness(false, {
    sceneAnimation: 'appear',
    sceneAnimationTarget: 'last',
    sceneLayer2Path: 'public-media/product-layers/felino/2/first.webp',
  });
  await product.upload({ ...await pngRequest(), kind: 'product_scene_3', targetId: 'felino' }, context);
  assert.equal(product.writes[0].data.sceneAnimation, 'appear');
  assert.deepEqual(Array.from(product.writes[0].data.sceneAnimationLayerKeys), ['product_scene_2']);

  const both = harness(false, {
    heroAnimation: 'disappear',
    heroAnimationTarget: 'both',
    heroLayer3Path: 'public-media/home/hero_layer_3/previous.webp',
  });
  await both.upload({ ...await pngRequest(), kind: 'home', targetId: 'hero_layer_4' }, context);
  assert.deepEqual(Array.from(both.writes[0].data.heroAnimationLayerKeys), ['hero', 'hero_layer_3']);

  const missingOverlay = harness(false, {
    heroAnimation: 'appear',
    heroAnimationTarget: 'last',
    heroCarvingImagePath: null,
  });
  await missingOverlay.upload({ ...await pngRequest(), kind: 'home', targetId: 'hero_carving' }, context);
  assert.equal(missingOverlay.writes[0].data.heroAnimation, 'none');
  assert.deepEqual(Array.from(missingOverlay.writes[0].data.heroAnimationLayerKeys), []);
});

test('an older client changing only the effect cannot overwrite a saved stable destination', async () => {
  const h = harness(false, {
    heroAnimationLayerKeys: ['hero_layer_3'],
    heroLayer3Path: 'public-media/home/hero_layer_3/previous.webp',
    heroAnimationTarget: 'last',
  });
  const result = await h.configure({ kind: 'home', targetId: 'hero', animation: 'disappear' }, context);
  assert.deepEqual(Array.from(result.animationLayerKeys), ['hero_layer_3']);
  assert.deepEqual(Array.from(h.writes[0].data.heroAnimationLayerKeys), ['hero_layer_3']);
});

test('stable animation configuration keeps the media editor authorization gate', async () => {
  const h = harness();
  await assert.rejects(h.configure({
    kind: 'home',
    targetId: 'hero',
    animation: 'appear',
    animationLayerKeys: ['hero_carving'],
  }, { ...context, jobRoleId: 'company_admin' }), { code: 'permission-denied' });
  assert.equal(h.writes.length, 0);
});

test('customization upload preserves alpha, uses its own field and requires the base ratio', async () => {
  const h = harness();
  const request = { ...await pngRequest(), kind: 'product_customization', targetId: 'felino' };
  await h.upload(request, context);
  assert.match(h.writes[0].data.customizationImagePath, /^public-media\/product-customizations\/felino\//);
  assert.equal(h.writes[0].data.sceneImagePath, undefined);
  assert.equal(h.writes[0].data.imagePath, undefined);
  assert.equal((await sharp(h.saved[0].bytes).metadata()).hasAlpha, true);
  const png = await sharp({ create: { width: 4, height: 2, channels: 4, background: '#fff' } }).png().toBuffer();
  await assert.rejects(h.upload({ ...request, fileBase64: png.toString('base64') }, context), { code: 'invalid-argument' });
  await assert.rejects(harness(false, { sceneImagePath: null }).upload(request, context), { code: 'failed-precondition' });
  await assert.rejects(harness(false, { customizationImagePath: 'public-media/product-customizations/felino/overlay.webp' }).upload({ ...request, kind: 'product_scene', fileBase64: png.toString('base64') }, context), { code: 'invalid-argument' });
});

test('exclusive related-card upload stores its own image and selects it atomically', async () => {
  const h = harness();
  await h.upload({ ...await pngRequest(), kind: 'product_related', targetId: 'felino' }, context);
  assert.match(h.saved[0].path, /^public-media\/product-related\/felino\//);
  assert.equal(h.writes[0].data.relatedImagePath, h.saved[0].path);
  assert.equal(h.writes[0].data.relatedImageSource, 'product_related');
  assert.equal(h.writes[0].data.imagePath, undefined);
  assert.equal(h.writes[0].data.sceneImagePath, undefined);
  assert.equal(h.writes[1].data.mediaKind, 'product_related');
});

test('customization settings validate name, media, authorization and audit before enabling', async () => {
  const data = { kind: 'product_customization', targetId: 'felino', customization: { enabled: true, label: ' canaleta ' } };
  const h = harness(false, { customizationImagePath: 'public-media/product-customizations/felino/overlay.webp' });
  const result = await h.configure(data, context);
  assert.equal(result.customization.label, 'canaleta');
  assert.equal(h.writes[0].ref.path, 'products/felino');
  assert.equal(h.writes[0].data.customization.enabled, true);
  assert.equal(h.writes[0].data.sceneAnimation, undefined);
  assert.equal(h.writes[1].data.event, 'public_media_configured');
  for (const customization of [{ enabled: true, label: '' }, { enabled: 'true', label: 'Canaleta' }, { enabled: true, label: 'x'.repeat(41) }, { enabled: true, label: 'foo\nbar' }]) {
    await assert.rejects(h.configure({ ...data, customization }, context), { code: 'invalid-argument' });
  }
  await assert.rejects(harness().configure(data, context), { code: 'failed-precondition' });
  await assert.rejects(harness(false, { customizationImagePath: 'public-media/product-customizations/delfin/overlay.webp' }).configure(data, context), { code: 'failed-precondition' });
  await assert.rejects(h.configure(data, { ...context, jobRoleId: 'company_admin' }), { code: 'permission-denied' });
  await assert.rejects(h.configure(data, { ...context, scopeLevel: 'branch' }), { code: 'permission-denied' });
  const disabled = harness();
  await disabled.configure({ ...data, customization: { enabled: false, label: '' } }, context);
  assert.equal(disabled.writes[0].data.customization.enabled, false);
});

test('related-card image preference validates source and same-product managed paths, then audits', async () => {
  const sources = {
    product_scene: ['sceneImagePath', 'public-media/product-scenes/felino/scene.webp'],
    product: ['imagePath', 'public-media/products/felino/catalog.webp'],
    product_thumbnail: ['thumbnailImagePath', 'public-media/product-thumbnails/felino/thumb.webp'],
    product_customization: ['customizationImagePath', 'public-media/product-customizations/felino/overlay.webp'],
    product_related: ['relatedImagePath', 'public-media/product-related/felino/card.webp'],
    product_scene_2: ['sceneLayer2Path', 'public-media/product-layers/felino/2/overlay.webp'],
  };
  for (const [source, [field, path]] of Object.entries(sources)) {
    const h = harness(false, { [field]: path });
    const result = await h.configure({ kind: 'product', targetId: 'felino', relatedImageSource: source }, context);
    assert.equal(result.relatedImageSource, source);
    assert.equal(h.writes[0].ref.path, 'products/felino');
    assert.equal(h.writes[0].data.relatedImageSource, source);
    assert.equal(h.writes[0].data.customization, undefined);
    assert.equal(h.writes[1].data.event, 'public_media_configured');
    assert.equal(h.writes[1].data.relatedImageSource, source);
  }
  const automatic = await harness().configure({ kind: 'product', targetId: 'felino', relatedImageSource: 'auto' }, context);
  assert.equal(automatic.relatedImageSource, 'auto');

  for (const source of ['image', '', null, 1, {}, 'product_scene_7']) {
    const invalid = harness(false, { imagePath: 'public-media/products/felino/catalog.webp' });
    await assert.rejects(invalid.configure({
      kind: 'product', targetId: 'felino', relatedImageSource: source,
    }, context), { code: 'invalid-argument' });
    assert.equal(invalid.writes.length, 0);
  }

  for (const [source, field, path] of [
    ['product', 'imagePath', 'public-media/products/delfin/catalog.webp'],
    ['product_scene', 'sceneImagePath', 'public-media/product-scenes/delfin/scene.webp'],
    ['product_related', 'relatedImagePath', null],
    ['product_scene_2', 'sceneLayer2Path', null],
  ]) {
    const missing = harness(false, { [field]: path });
    await assert.rejects(missing.configure({
      kind: 'product', targetId: 'felino', relatedImageSource: source,
    }, context), { code: 'failed-precondition' });
    assert.equal(missing.writes.length, 0);
  }

  for (const overrides of [{ jobRoleId: 'company_admin' }, { scopeLevel: 'branch' }]) {
    const denied = harness();
    await assert.rejects(denied.configure({
      kind: 'product', targetId: 'felino', relatedImageSource: 'auto',
    }, { ...context, ...overrides }), { code: 'permission-denied' });
    assert.equal(denied.writes.length, 0);
  }
});

test('public catalog exposes only validated related image source values and defaults legacy data to auto', async () => {
  const listPublicProducts = catalogHarness([
    ...['auto', 'scene', 'catalog', 'thumbnail', 'product_scene_2', 'product_related', 'unknown'].map((relatedImageSource, index) => ({
      id: `product-${index}`,
      data: { relatedImageSource, relatedImagePath: 'public-media/product-related/product-5/card.webp' },
    })),
  ]);
  const result = await listPublicProducts({});
  assert.deepEqual(Array.from(result.products, (product) => product.relatedImageSource), [
    'auto', 'product_scene', 'product', 'product_thumbnail', 'product_scene_2', 'product_related', 'auto',
  ]);
  assert.equal(result.products[5].relatedImagePath, 'public-media/product-related/product-5/card.webp');
});

test('public catalog resolves legacy animation targets and exposes stable scene layer keys', async () => {
  const listPublicProducts = catalogHarness([
    {
      id: 'felino',
      data: {
        sceneImagePath: 'public-media/product-scenes/felino/base.webp',
        sceneLayer2Path: 'public-media/product-layers/felino/2/overlay.webp',
        sceneAnimation: 'appear',
        sceneAnimationTarget: 'last',
      },
    },
    {
      id: 'delfin',
      data: {
        sceneImagePath: 'public-media/product-scenes/delfin/base.webp',
        sceneAnimation: 'appear',
        sceneAnimationTarget: 'last',
      },
    },
    {
      id: 'relieve',
      data: {
        sceneImagePath: 'public-media/product-scenes/relieve/base.webp',
        sceneLayer3Path: 'public-media/product-layers/relieve/3/overlay.webp',
        sceneAnimation: 'disappear',
        sceneAnimationLayerKeys: ['product_scene_3'],
      },
    },
  ]);
  const { products } = await listPublicProducts({});
  assert.deepEqual(Array.from(products[0].sceneAnimationLayerKeys), ['product_scene_2']);
  assert.equal(products[0].sceneAnimation, 'appear');
  assert.deepEqual(Array.from(products[1].sceneAnimationLayerKeys), []);
  assert.equal(products[1].sceneAnimation, 'none');
  assert.deepEqual(Array.from(products[2].sceneAnimationLayerKeys), ['product_scene_3']);
  assert.equal(products[2].sceneAnimation, 'disappear');
});
