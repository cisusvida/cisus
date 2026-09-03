import { inject, Service } from '@angular/core';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import type { CatalogProduct, PublicMediaReference, PublicMediaUrl } from '../models/commerce';
import { FirebaseClient } from './firebase-client';

const CACHE_KEY = 'cisus.publicMedia.v1';
const REVALIDATE_BEFORE_MS = 5 * 60 * 1000;
const HOME_PREFIX = 'public-media/home/';
const PRODUCT_PREFIX = 'public-media/products/';

type MediaCache = Record<string, PublicMediaUrl>;

export function isReusablePublicMedia(
  entry: PublicMediaUrl | undefined,
  expectedPath: string,
  now = Date.now(),
): entry is PublicMediaUrl {
  return Boolean(
    entry &&
    entry.path === expectedPath &&
    entry.url.startsWith('https://') &&
    entry.expiresAt - now > REVALIDATE_BEFORE_MS,
  );
}

@Service()
export class PublicMediaUrlService {
  private readonly client = inject(FirebaseClient);
  private readonly inFlight = new Map<string, Promise<string | null>>();

  observeHomeHero(listener: (url: string | null) => void): Unsubscribe {
    let requestVersion = 0;
    return onSnapshot(
      doc(this.client.firestore, 'public_site_content', 'home'),
      (snapshot) => {
        const path = snapshot.exists() ? String(snapshot.data()['heroImagePath'] ?? '') : '';
        const currentRequest = ++requestVersion;
        if (!path.startsWith(`${HOME_PREFIX}hero/`)) {
          listener(null);
          return;
        }
        void this.resolve({ kind: 'home', targetId: 'hero', expectedPath: path }).then((url) => {
          if (currentRequest === requestVersion) listener(url);
        });
      },
      () => listener(null),
    );
  }

  async attachProductUrls(products: CatalogProduct[]): Promise<CatalogProduct[]> {
    const references = products.flatMap<PublicMediaReference>((product) =>
      product.imagePath?.startsWith(`${PRODUCT_PREFIX}${product.id}/`)
        ? [{ kind: 'product', targetId: product.id, expectedPath: product.imagePath }]
        : [],
    );
    if (!references.length) return products;

    const resolved = await this.resolveMany(references);
    return products.map((product) => ({
      ...product,
      imageUrl: resolved.get(`product:${product.id}`) ?? null,
    }));
  }

  async resolve(reference: PublicMediaReference): Promise<string | null> {
    const key = `${reference.kind}:${reference.targetId}`;
    const cached = this.readCache()[key];
    if (isReusablePublicMedia(cached, reference.expectedPath)) return cached.url;

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const request = this.resolveMany([reference]).then((results) => results.get(key) ?? null);
    this.inFlight.set(key, request);
    try {
      return await request;
    } finally {
      if (this.inFlight.get(key) === request) this.inFlight.delete(key);
    }
  }

  private async resolveMany(references: PublicMediaReference[]): Promise<Map<string, string>> {
    const cache = this.readCache();
    const result = new Map<string, string>();
    const missing: PublicMediaReference[] = [];

    for (const reference of references) {
      const key = `${reference.kind}:${reference.targetId}`;
      const cached = cache[key];
      if (isReusablePublicMedia(cached, reference.expectedPath)) result.set(key, cached.url);
      else missing.push(reference);
    }

    if (!missing.length) return result;
    const callable = httpsCallable<
      { items: Array<{ kind: string; targetId: string }> },
      { media: PublicMediaUrl[] }
    >(this.client.functions, 'getPublicMediaUrls');
    const response = await callable({
      items: missing.map(({ kind, targetId }) => ({ kind, targetId })),
    });

    for (const entry of response.data.media) {
      const expected = missing.find(
        (reference) => `${reference.kind}:${reference.targetId}` === entry.key,
      );
      if (!expected || entry.path !== expected.expectedPath || !entry.url.startsWith('https://')) {
        continue;
      }
      cache[entry.key] = entry;
      result.set(entry.key, entry.url);
    }
    this.writeCache(cache);
    return result;
  }

  private readCache(): MediaCache {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return {};
      const value = JSON.parse(raw) as unknown;
      return typeof value === 'object' && value !== null ? (value as MediaCache) : {};
    } catch {
      return {};
    }
  }

  private writeCache(cache: MediaCache): void {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // La imagen sigue disponible aunque el navegador bloquee almacenamiento local.
    }
  }
}
