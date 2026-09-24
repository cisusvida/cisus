"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  PLATFORM_MEDIA_ROLES,
  HOME_ASSETS,
  PROCESS_ASSETS,
  allowedMediaPath,
  parseMediaRequests,
  mediaField,
} = require("./public-media-policy");

test("process media preserves legacy Portavasos targets and maps Tablas fields", () => {
  assert.deepEqual(HOME_ASSETS, {
    hero: "heroImagePath",
    hero_carving: "heroCarvingImagePath",
    hero_layer_3: "heroLayer3Path",
    hero_layer_4: "heroLayer4Path",
    hero_layer_5: "heroLayer5Path",
    hero_layer_6: "heroLayer6Path",
    portfolio_background: "portfolioBackgroundImagePath",
  });
  assert.deepEqual(PROCESS_ASSETS, {
    idea: "ideaImagePath",
    sketch: "sketchImagePath",
    design: "designImagePath",
    prototype: "prototypeImagePath",
    production: "productionImagePath",
    delivery: "deliveryImagePath",
    result: "resultImagePath",
    tablas_idea: "tablasIdeaImagePath",
    tablas_sketch: "tablasSketchImagePath",
    tablas_design: "tablasDesignImagePath",
    tablas_prototype: "tablasPrototypeImagePath",
    tablas_production: "tablasProductionImagePath",
    tablas_delivery: "tablasDeliveryImagePath",
    tablas_result: "tablasResultImagePath",
  });
});

test("public media requests accept only known home/process assets and valid product ids", () => {
  assert.deepEqual(
    parseMediaRequests([
      { kind: "home", targetId: "hero" },
      { kind: "home", targetId: "hero_carving" },
      { kind: "home", targetId: "portfolio_background" },
      { kind: "process", targetId: "idea" },
      { kind: "process", targetId: "result" },
      { kind: "process", targetId: "tablas_idea" },
      { kind: "process", targetId: "tablas_result" },
      { kind: "product", targetId: "product_alpha" },
      { kind: "product_scene", targetId: "product_alpha" },
      { kind: "product", targetId: "product_alpha" },
    ]),
    [
      { kind: "home", targetId: "hero" },
      { kind: "home", targetId: "hero_carving" },
      { kind: "home", targetId: "portfolio_background" },
      { kind: "process", targetId: "idea" },
      { kind: "process", targetId: "result" },
      { kind: "process", targetId: "tablas_idea" },
      { kind: "process", targetId: "tablas_result" },
      { kind: "product", targetId: "product_alpha" },
      { kind: "product_scene", targetId: "product_alpha" },
    ],
  );
  assert.throws(() =>
    parseMediaRequests([{ kind: "home", targetId: "arbitrary" }]),
  );
  assert.throws(() =>
    parseMediaRequests([{ kind: "process", targetId: "arbitrary" }]),
  );
  assert.throws(() =>
    parseMediaRequests([{ kind: "product", targetId: "../private" }]),
  );
});

test("public media paths cannot escape their exact asset scope", () => {
  assert.equal(
    allowedMediaPath("home", "hero", "public-media/home/hero/image.webp"),
    true,
  );
  assert.equal(
    allowedMediaPath(
      "home",
      "hero_carving",
      "public-media/home/hero_carving/image.webp",
    ),
    true,
  );
  assert.equal(
    allowedMediaPath("process", "idea", "public-media/process/idea/image.webp"),
    true,
  );
  assert.equal(
    allowedMediaPath(
      "process",
      "result",
      "public-media/process/result/image.webp",
    ),
    true,
  );
  assert.equal(
    allowedMediaPath(
      "process",
      "tablas_idea",
      "public-media/process/tablas_idea/image.webp",
    ),
    true,
  );
  assert.equal(
    allowedMediaPath(
      "process",
      "tablas_result",
      "public-media/process/tablas_result/image.webp",
    ),
    true,
  );
  assert.equal(
    allowedMediaPath(
      "product",
      "product_alpha",
      "public-media/products/product_alpha/image.webp",
    ),
    true,
  );
  assert.equal(
    allowedMediaPath(
      "product_scene",
      "product_alpha",
      "public-media/product-scenes/product_alpha/image.webp",
    ),
    true,
  );
  assert.equal(
    allowedMediaPath(
      "product_scene",
      "product_alpha",
      "public-media/product-scenes/product_beta/image.webp",
    ),
    false,
  );
  assert.equal(
    allowedMediaPath(
      "product",
      "product_alpha",
      "public-media/products/product_beta/image.webp",
    ),
    false,
  );
  assert.equal(
    allowedMediaPath("home", "hero", "companies/company_alpha/private.webp"),
    false,
  );
  assert.equal(
    allowedMediaPath(
      "home",
      "hero_carving",
      "public-media/home/hero/image.webp",
    ),
    false,
  );
  assert.equal(
    allowedMediaPath(
      "process",
      "idea",
      "public-media/process/design/image.webp",
    ),
    false,
  );
  assert.equal(
    allowedMediaPath(
      "process",
      "result",
      "public-media/process/delivery/image.webp",
    ),
    false,
  );
  assert.equal(
    allowedMediaPath(
      "process",
      "tablas_idea",
      "public-media/process/idea/image.webp",
    ),
    false,
  );
});

test("partner-company roles cannot administer platform media", () => {
  assert.equal(PLATFORM_MEDIA_ROLES.has("cisus_operations"), true);
  assert.equal(PLATFORM_MEDIA_ROLES.has("cisus_designer"), true);
  assert.equal(PLATFORM_MEDIA_ROLES.has("company_admin"), false);
  assert.equal(PLATFORM_MEDIA_ROLES.has("branch_manager"), false);
});

test('layer and thumbnail destinations are bounded and isolated', () => {
  for (const index of [2,3,4,5,6]) {
    assert.equal(parseMediaRequests([{ kind: `product_scene_${index}`, targetId: 'felino' }]).length, 1);
    assert.equal(allowedMediaPath(`product_scene_${index}`, 'felino', `public-media/product-layers/felino/${index}/x.webp`), true);
    assert.equal(allowedMediaPath(`product_scene_${index}`, 'felino', `public-media/product-layers/delfin/${index}/x.webp`), false);
  }
  for (const index of [0,1,7,100]) assert.throws(() => parseMediaRequests([{ kind: `product_scene_${index}`, targetId: 'felino' }]));
  for (const targetId of ['constructor', '__proto__', 'hero_layer_7']) assert.throws(() => parseMediaRequests([{ kind: 'home', targetId }]));
  assert.equal(allowedMediaPath('product_thumbnail', 'felino', 'public-media/product-scenes/felino/x.webp'), false);
});

test('customization overlay has an independent product-bound destination', () => {
  assert.deepEqual(parseMediaRequests([{ kind: 'product_customization', targetId: 'felino' }]), [{ kind: 'product_customization', targetId: 'felino' }]);
  assert.equal(mediaField('product_customization', 'felino'), 'customizationImagePath');
  assert.equal(allowedMediaPath('product_customization', 'felino', 'public-media/product-customizations/felino/image.webp'), true);
  assert.equal(allowedMediaPath('product_customization', 'felino', 'public-media/product-customizations/delfin/image.webp'), false);
  assert.equal(allowedMediaPath('product_customization', 'felino', 'public-media/product-scenes/felino/image.webp'), false);
  assert.throws(() => parseMediaRequests([{ kind: 'product_customization', targetId: '../private' }]));
  assert.deepEqual(parseMediaRequests([{ kind: 'product_related', targetId: 'felino' }]), [
    { kind: 'product_related', targetId: 'felino' },
  ]);
  assert.equal(mediaField('product_related', 'felino'), 'relatedImagePath');
  assert.equal(allowedMediaPath('product_related', 'felino', 'public-media/product-related/felino/card.webp'), true);
  assert.equal(allowedMediaPath('product_related', 'felino', 'public-media/product-related/delfin/card.webp'), false);
});
