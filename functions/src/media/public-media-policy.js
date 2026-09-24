"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_MEDIA_ROLES =
  exports.PROCESS_ASSETS =
  exports.HOME_ASSETS =
    void 0;
exports.parseMediaRequests = parseMediaRequests;
exports.allowedMediaPath = allowedMediaPath;

exports.HOME_ASSETS = Object.freeze({
  hero: "heroImagePath",
  hero_carving: "heroCarvingImagePath",
  hero_layer_3: "heroLayer3Path",
  hero_layer_4: "heroLayer4Path",
  hero_layer_5: "heroLayer5Path",
  hero_layer_6: "heroLayer6Path",
  portfolio_background: "portfolioBackgroundImagePath",
});
exports.PROCESS_ASSETS = Object.freeze({
  // Legacy Portavasos IDs deliberately remain for existing content; do not migrate Storage paths.
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
exports.PLATFORM_MEDIA_ROLES = new Set([
  "platform_admin",
  "cisus_commercial_admin",
  "cisus_operations",
  "cisus_designer",
]);

function validTargetId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{3,180}$/.test(value);
}

function parseMediaRequests(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) {
    throw new TypeError(
      "items must contain between 1 and 50 media references.",
    );
  }
  const unique = new Map();
  for (const raw of value) {
    if (!raw || typeof raw !== "object")
      throw new TypeError("Invalid media reference.");
    const kind = raw.kind;
    const targetId = raw.targetId;
    if (kind === "home") {
      if (typeof targetId !== "string" || !Object.hasOwn(exports.HOME_ASSETS, targetId)) {
        throw new TypeError("Unknown home media reference.");
      }
    } else if (kind === "process") {
      if (
        typeof targetId !== "string" ||
        !Object.hasOwn(exports.PROCESS_ASSETS, targetId)
      ) {
        throw new TypeError("Unknown process media reference.");
      }
    } else if (kind === "product" || kind === "product_scene" || kind === "product_thumbnail" || kind === "product_customization" || kind === "product_related" || /^product_scene_[2-6]$/.test(kind)) {
      if (!validTargetId(targetId))
        throw new TypeError("Invalid product media reference.");
    } else {
      throw new TypeError("Unknown media kind.");
    }
    unique.set(`${kind}:${targetId}`, { kind, targetId });
  }
  return [...unique.values()];
}

function allowedMediaPath(kind, targetId, path) {
  if (typeof path !== "string" || !path.endsWith(".webp")) return false;
  if (kind === "home") return path.startsWith(`public-media/home/${targetId}/`);
  if (kind === "process")
    return path.startsWith(`public-media/process/${targetId}/`);
  if (kind === "product")
    return path.startsWith(`public-media/products/${targetId}/`);
  if (kind === "product_scene")
    return path.startsWith(`public-media/product-scenes/${targetId}/`);
  if (kind === "product_thumbnail") return path.startsWith(`public-media/product-thumbnails/${targetId}/`);
  if (kind === "product_customization") return path.startsWith(`public-media/product-customizations/${targetId}/`);
  if (kind === "product_related") return path.startsWith(`public-media/product-related/${targetId}/`);
  if (/^product_scene_[2-6]$/.test(kind)) return path.startsWith(`public-media/product-layers/${targetId}/${kind.slice(-1)}/`);
  return false;
}

exports.mediaField = function (kind, targetId) {
  if (kind === 'home') return exports.HOME_ASSETS[targetId];
  if (kind === 'process') return exports.PROCESS_ASSETS[targetId];
  if (kind === 'product_scene') return 'sceneImagePath';
  if (kind === 'product_thumbnail') return 'thumbnailImagePath';
  if (kind === 'product_customization') return 'customizationImagePath';
  if (kind === 'product_related') return 'relatedImagePath';
  if (/^product_scene_[2-6]$/.test(kind)) return `sceneLayer${kind.slice(-1)}Path`;
  return 'imagePath';
};
