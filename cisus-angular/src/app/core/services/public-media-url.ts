import { inject, Service } from '@angular/core';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type {
  CatalogProduct,
  MediaAnimation,
  MediaAnimationLayerKey,
  MediaLayer,
  PublicMediaReference,
  PublicMediaUrl,
} from '../models/commerce';
import {
  PROCESS_IDEA_MEDIA_TARGETS,
  type ProcessIdeaId,
  type ProcessIdeaImageUrls,
  type ProcessImageUrls,
  type ProcessMediaTargetId,
  type ProcessStepId,
} from '../models/process-step';
import { FirebaseClient } from './firebase-client';

const CACHE_KEY = 'cisus.publicMedia.v1';
const REVALIDATE_BEFORE_MS = 5 * 60 * 1000;
const HOME_PREFIX = 'public-media/home/';
const PROCESS_PREFIX = 'public-media/process/';
const PRODUCT_PREFIX = 'public-media/products/';
const PRODUCT_RELATED_PREFIX = 'public-media/product-related/';
const PRODUCT_SCENE_PREFIX = 'public-media/product-scenes/';
const HOME_COMPOSITION_TARGETS = [
  'hero',
  'hero_carving',
  'hero_layer_3',
  'hero_layer_4',
  'hero_layer_5',
  'hero_layer_6',
] as const satisfies readonly MediaAnimationLayerKey[];

export function homeAnimationLayerKeys(data: Record<string, unknown>): MediaAnimationLayerKey[] {
  const paths = [
    'heroImagePath',
    'heroCarvingImagePath',
    'heroLayer3Path',
    'heroLayer4Path',
    'heroLayer5Path',
    'heroLayer6Path',
  ];
  const published = HOME_COMPOSITION_TARGETS.filter((target, index) => {
    const path = data[paths[index]];
    return typeof path === 'string' && path.startsWith(`${HOME_PREFIX}${target}/`);
  });
  if (Array.isArray(data['heroAnimationLayerKeys']))
    return data['heroAnimationLayerKeys'].filter(
      (key): key is MediaAnimationLayerKey =>
        typeof key === 'string' &&
        HOME_COMPOSITION_TARGETS.includes(key as (typeof HOME_COMPOSITION_TARGETS)[number]),
    );

  const legacyTarget = data['heroAnimationTarget'] === 'first' || data['heroAnimationTarget'] === 'both'
    ? data['heroAnimationTarget']
    : 'last';
  if (legacyTarget === 'first') return published.includes('hero') ? ['hero'] : [];
  const overlays = published.filter((target) => target !== 'hero');
  if (legacyTarget === 'both')
    return published.includes('hero') && overlays.length ? ['hero', overlays[overlays.length - 1]] : [];
  return overlays.length ? [overlays[overlays.length - 1]] : [];
}

export function homeAnimationConfiguration(data: Record<string, unknown>): {
  animation: MediaAnimation;
  animationLayerKeys: MediaAnimationLayerKey[];
} {
  const animationLayerKeys = homeAnimationLayerKeys(data);
  const fields = [
    'heroImagePath',
    'heroCarvingImagePath',
    'heroLayer3Path',
    'heroLayer4Path',
    'heroLayer5Path',
    'heroLayer6Path',
  ];
  const allRecipientsPublished =
    animationLayerKeys.length > 0 &&
    animationLayerKeys.every((key) => {
      const index = HOME_COMPOSITION_TARGETS.indexOf(
        key as (typeof HOME_COMPOSITION_TARGETS)[number],
      );
      const path = data[fields[index]];
      return typeof path === 'string' && path.startsWith(`${HOME_PREFIX}${key}/`);
    });
  const savedAnimation: MediaAnimation =
    data['heroAnimation'] === 'disappear'
      ? 'disappear'
      : data['heroAnimation'] === 'none'
        ? 'none'
        : 'appear';
  return {
    animation: savedAnimation !== 'none' && allRecipientsPublished ? savedAnimation : 'none',
    animationLayerKeys,
  };
}

const PROCESS_IMAGE_FIELDS: Record<ProcessMediaTargetId, string> = {
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
};

type MediaCache = Record<string, PublicMediaUrl>;

export function isReusablePublicMedia(
  entry: unknown,
  expectedPath: string,
  now = Date.now(),
): entry is PublicMediaUrl {
  if (typeof entry !== 'object' || entry === null) return false;
  const media = entry as Partial<PublicMediaUrl>;
  return (
    media.path === expectedPath &&
    typeof media.key === 'string' &&
    typeof media.url === 'string' &&
    media.url.startsWith('https://') &&
    typeof media.expiresAt === 'number' &&
    Number.isFinite(media.expiresAt) &&
    media.expiresAt - now > REVALIDATE_BEFORE_MS
  );
}

export function processMediaReferences(data: Record<string, unknown>): PublicMediaReference[] {
  return (Object.entries(PROCESS_IMAGE_FIELDS) as Array<[ProcessMediaTargetId, string]>).flatMap(
    ([targetId, field]) => {
      const path = String(data[field] ?? '');
      return path.startsWith(`${PROCESS_PREFIX}${targetId}/`)
        ? [{ kind: 'process', targetId, expectedPath: path }]
        : [];
    },
  );
}

/**
 * Keep selection (idea) separate from progression (stage): one resolved media map becomes
 * the image sequence for each selector option. Missing future media stays explicitly null,
 * so choosing Tablas is safe before its first image is published.
 */
export function processIdeaImageUrls(resolved: ReadonlyMap<string, string>): ProcessIdeaImageUrls {
  const urls: ProcessIdeaImageUrls = {};

  for (const [ideaId, targets] of Object.entries(PROCESS_IDEA_MEDIA_TARGETS) as Array<
    [ProcessIdeaId, Record<ProcessStepId, ProcessMediaTargetId>]
  >) {
    urls[ideaId] = Object.fromEntries(
      (Object.entries(targets) as Array<[ProcessStepId, ProcessMediaTargetId]>).map(
        ([stepId, targetId]) => [stepId, resolved.get(`process:${targetId}`) ?? null],
      ),
    ) as ProcessImageUrls;
  }

  return urls;
}

@Service()
export class PublicMediaUrlService {
  private readonly client = inject(FirebaseClient);
  private readonly cache = this.readCache();
  private readonly inFlight = new Map<string, Promise<string | null>>();

  observeHomeHero(listener: (url: string | null) => void): Unsubscribe {
    return this.observeHomeMedia('hero', 'heroImagePath', listener);
  }

  observeHeroComposition(
    listener: (
      layers: MediaLayer[],
      animation: MediaAnimation,
      animationLayerKeys: MediaAnimationLayerKey[],
    ) => void,
  ): Unsubscribe {
    let version = 0;
    const fields = [
      'heroImagePath',
      'heroCarvingImagePath',
      'heroLayer3Path',
      'heroLayer4Path',
      'heroLayer5Path',
      'heroLayer6Path',
    ];
    const targets = [
      'hero',
      'hero_carving',
      'hero_layer_3',
      'hero_layer_4',
      'hero_layer_5',
      'hero_layer_6',
    ];
    const unsubscribe = onSnapshot(
      doc(this.client.firestore, 'public_site_content', 'home'),
      (snapshot) => {
        const data = snapshot.data() ?? {};
        const current = ++version;
        const refs = fields.flatMap<PublicMediaReference>((field, index) =>
          typeof data[field] === 'string' &&
          data[field].startsWith(`${HOME_PREFIX}${targets[index]}/`)
            ? [{ kind: 'home', targetId: targets[index], expectedPath: data[field] }]
            : [],
        );
        const { animation, animationLayerKeys } = homeAnimationConfiguration(data);
        void this.resolveMany(refs)
          .then((urls) => {
            if (current !== version) return;
            listener(
              refs.map((ref) => ({
                kind: 'home',
                targetId: ref.targetId,
                path: ref.expectedPath,
                url: urls.get(`home:${ref.targetId}`) ?? null,
              })),
              animation,
              animationLayerKeys,
            );
          })
          .catch(() => {
            if (current === version) listener([], 'none', []);
          });
      },
    );
    return () => {
      ++version;
      unsubscribe();
    };
  }

  observeHomeHeroCarving(listener: (url: string | null) => void): Unsubscribe {
    return this.observeHomeMedia('hero_carving', 'heroCarvingImagePath', listener);
  }

  observeHomePortfolioBackground(listener: (url: string | null) => void): Unsubscribe {
    return this.observeHomeMedia('portfolio_background', 'portfolioBackgroundImagePath', listener);
  }

  private observeHomeMedia(
    targetId: string,
    field: string,
    listener: (url: string | null) => void,
  ): Unsubscribe {
    let requestVersion = 0;
    return onSnapshot(
      doc(this.client.firestore, 'public_site_content', 'home'),
      (snapshot) => {
        const path = snapshot.exists() ? String(snapshot.data()[field] ?? '') : '';
        const currentRequest = ++requestVersion;
        if (!path.startsWith(`${HOME_PREFIX}${targetId}/`)) {
          listener(null);
          return;
        }
        void this.resolve({ kind: 'home', targetId, expectedPath: path }).then((url) => {
          if (currentRequest === requestVersion) listener(url);
        });
      },
      () => listener(null),
    );
  }

  observeProcessIdeaImages(listener: (urls: ProcessIdeaImageUrls) => void): Unsubscribe {
    let requestVersion = 0;
    return onSnapshot(
      doc(this.client.firestore, 'public_site_content', 'process'),
      (snapshot) => {
        const references = processMediaReferences(snapshot.exists() ? snapshot.data() : {});
        const currentRequest = ++requestVersion;
        if (!references.length) {
          listener(processIdeaImageUrls(new Map()));
          return;
        }
        void this.resolveMany(references)
          .then((resolved) => {
            if (currentRequest !== requestVersion) return;
            listener(processIdeaImageUrls(resolved));
          })
          .catch(() => {
            if (currentRequest === requestVersion) listener(processIdeaImageUrls(new Map()));
          });
      },
      () => listener(processIdeaImageUrls(new Map())),
    );
  }

  async attachProductUrls(products: CatalogProduct[]): Promise<CatalogProduct[]> {
    const references = products.flatMap<PublicMediaReference>((product) => [
      ...(product.customizationImagePath?.startsWith(
        `public-media/product-customizations/${product.id}/`,
      )
        ? [
            {
              kind: 'product_customization' as const,
              targetId: product.id,
              expectedPath: product.customizationImagePath,
            },
          ]
        : []),
      ...(product.thumbnailImagePath
        ? [
            {
              kind: 'product_thumbnail' as const,
              targetId: product.id,
              expectedPath: product.thumbnailImagePath,
            },
          ]
        : []),
      ...(product.relatedImagePath?.startsWith(`${PRODUCT_RELATED_PREFIX}${product.id}/`)
        ? [
            {
              kind: 'product_related' as const,
              targetId: product.id,
              expectedPath: product.relatedImagePath,
            },
          ]
        : []),
      ...(product.sceneLayers ?? []).flatMap((layer) =>
        layer.path ? [{ kind: layer.kind, targetId: product.id, expectedPath: layer.path }] : [],
      ),
      ...(product.imagePath?.startsWith(`${PRODUCT_PREFIX}${product.id}/`)
        ? [{ kind: 'product' as const, targetId: product.id, expectedPath: product.imagePath }]
        : []),
      ...(product.sceneImagePath?.startsWith(`${PRODUCT_SCENE_PREFIX}${product.id}/`)
        ? [
            {
              kind: 'product_scene' as const,
              targetId: product.id,
              expectedPath: product.sceneImagePath,
            },
          ]
        : []),
    ]);
    if (!references.length) return products;

    const resolved = await this.resolveMany(references);
    return products.map((product) => ({
      ...product,
      imageUrl: resolved.get(`product:${product.id}`) ?? null,
      sceneImageUrl: resolved.get(`product_scene:${product.id}`) ?? null,
      thumbnailImageUrl: resolved.get(`product_thumbnail:${product.id}`) ?? null,
      relatedImageUrl: resolved.get(`product_related:${product.id}`) ?? null,
      customizationImageUrl: resolved.get(`product_customization:${product.id}`) ?? null,
      sceneLayers: (product.sceneLayers ?? []).map((layer) => ({
        ...layer,
        url: resolved.get(`${layer.kind}:${product.id}`) ?? null,
      })),
    }));
  }

  async resolve(reference: PublicMediaReference): Promise<string | null> {
    const results = await this.resolveMany([reference]);
    return results.get(`${reference.kind}:${reference.targetId}`) ?? null;
  }

  private async resolveMany(references: PublicMediaReference[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const missing = new Map<string, PublicMediaReference>();
    const waiting = new Map<string, Promise<string | null>>();

    for (const reference of references) {
      const key = `${reference.kind}:${reference.targetId}`;
      const versionKey = JSON.stringify([key, reference.expectedPath]);
      // Accept the existing slot-based cache as well, so this update keeps saved URLs.
      const cached = this.cache[versionKey] ?? this.cache[key];
      if (isReusablePublicMedia(cached, reference.expectedPath)) {
        result.set(key, cached.url);
      } else {
        const pending = this.inFlight.get(versionKey);
        if (pending) waiting.set(key, pending);
        else missing.set(versionKey, reference);
      }
    }

    if (missing.size) {
      // Defer execution until every reference has been registered in inFlight.
      const batch = Promise.resolve().then(async () => {
        const callable = httpsCallable<
          { items: Array<{ kind: string; targetId: string }> },
          { media: PublicMediaUrl[] }
        >(this.client.functions, 'getPublicMediaUrls');
        const items = [...missing.values()].map(({ kind, targetId }) => ({ kind, targetId }));
        const media: PublicMediaUrl[] = [];
        for (let offset = 0; offset < items.length; offset += 50) {
          media.push(...(await callable({ items: items.slice(offset, offset + 50) })).data.media);
        }
        const resolved = new Map<string, string>();
        for (const [versionKey, reference] of missing) {
          const key = `${reference.kind}:${reference.targetId}`;
          const entry = media.find((media) => media.key === key);
          if (!isReusablePublicMedia(entry, reference.expectedPath)) continue;
          this.cache[versionKey] = entry;
          resolved.set(versionKey, entry.url);
        }
        this.writeCache();
        return resolved;
      });

      for (const [versionKey, reference] of missing) {
        const pending = batch
          .then((resolved) => resolved.get(versionKey) ?? null)
          .finally(() => this.inFlight.delete(versionKey));
        this.inFlight.set(versionKey, pending);
        waiting.set(`${reference.kind}:${reference.targetId}`, pending);
      }
    }

    await Promise.all(
      [...waiting].map(async ([key, pending]) => {
        const url = await pending;
        if (url) result.set(key, url);
      }),
    );
    return result;
  }

  private readCache(): MediaCache {
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}');
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
      return Object.fromEntries(
        Object.entries(value).filter(
          ([, entry]) =>
            typeof entry?.path === 'string' && isReusablePublicMedia(entry, entry.path),
        ),
      );
    } catch {
      return {};
    }
  }

  private writeCache(): void {
    // Bound persistent and in-memory growth, including old image versions.
    const entries = Object.entries(this.cache)
      .filter(([, entry]) => isReusablePublicMedia(entry, entry.path))
      .slice(-200);
    for (const key of Object.keys(this.cache)) delete this.cache[key];
    Object.assign(this.cache, Object.fromEntries(entries));
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch {
      // Keep the in-memory cache when storage is unavailable or full.
    }
  }
}
