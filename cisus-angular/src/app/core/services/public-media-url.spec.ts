import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { FirebaseClient } from './firebase-client';
import type { CatalogProduct, PublicMediaReference } from '../models/commerce';
import type { PublicMediaUrl } from '../models/commerce';
import {
  PublicMediaUrlService,
  homeAnimationConfiguration,
  homeAnimationLayerKeys,
  isReusablePublicMedia,
  processIdeaImageUrls,
  processMediaReferences,
} from './public-media-url';

const NOW = 1_000_000;
const PATH = 'public-media/products/product_alpha/image-1.webp';

function media(expiresAt: number, path = PATH): PublicMediaUrl {
  return {
    key: 'product:product_alpha',
    path,
    url: 'https://storage.googleapis.com/signed-image',
    expiresAt,
    generation: '1',
  };
}

describe('isReusablePublicMedia', () => {
  it('reutiliza una URL vigente para la misma ruta versionada', () => {
    expect(isReusablePublicMedia(media(NOW + 10 * 60 * 1000), PATH, NOW)).toBe(true);
  });

  it('rechaza rutas reemplazadas y URLs próximas a expirar', () => {
    expect(isReusablePublicMedia(media(NOW + 10 * 60 * 1000, `${PATH}.old`), PATH, NOW)).toBe(
      false,
    );
    expect(isReusablePublicMedia(media(NOW + 4 * 60 * 1000), PATH, NOW)).toBe(false);
  });

  it('solo crea referencias para rutas canónicas de etapas del proceso', () => {
    expect(
      processMediaReferences({
        ideaImagePath: 'public-media/process/idea/image-1.webp',
        sketchImagePath: 'public-media/process/design/not-sketch.webp',
        designImagePath: 'companies/private/design.webp',
        resultImagePath: 'public-media/process/result/image-7.webp',
        tablasIdeaImagePath: 'public-media/process/tablas_idea/table-idea.webp',
        tablasSketchImagePath: 'public-media/process/tablas_design/not-sketch.webp',
      }),
    ).toEqual([
      {
        kind: 'process',
        targetId: 'idea',
        expectedPath: 'public-media/process/idea/image-1.webp',
      },
      {
        kind: 'process',
        targetId: 'result',
        expectedPath: 'public-media/process/result/image-7.webp',
      },
      {
        kind: 'process',
        targetId: 'tablas_idea',
        expectedPath: 'public-media/process/tablas_idea/table-idea.webp',
      },
    ]);
  });
});

describe('processIdeaImageUrls', () => {
  it('keeps Portavasos on legacy media and leaves unpublished Tablas stages empty', () => {
    const urls = processIdeaImageUrls(
      new Map([
        ['process:idea', 'https://storage.example/portavasos-idea.webp'],
        ['process:tablas_idea', 'https://storage.example/tablas-idea.webp'],
      ]),
    );

    expect(urls.portavasos?.idea).toBe('https://storage.example/portavasos-idea.webp');
    expect(urls.tablas?.idea).toBe('https://storage.example/tablas-idea.webp');
    expect(urls.tablas?.sketch).toBeNull();
  });
});

describe('homeAnimationConfiguration', () => {
  it('resolves old first, last, and both selections to the currently published stable layers', () => {
    const content = {
      heroImagePath: 'public-media/home/hero/base.webp',
      heroCarvingImagePath: 'public-media/home/hero_carving/first.webp',
      heroLayer3Path: 'public-media/home/hero_layer_3/second.webp',
      heroAnimation: 'appear',
    };
    expect(homeAnimationConfiguration({ ...content, heroAnimationTarget: 'first' })).toEqual({
      animation: 'appear',
      animationLayerKeys: ['hero'],
    });
    expect(homeAnimationConfiguration({ ...content, heroAnimationTarget: 'last' })).toEqual({
      animation: 'appear',
      animationLayerKeys: ['hero_layer_3'],
    });
    expect(homeAnimationConfiguration({ ...content, heroAnimationTarget: 'both' })).toEqual({
      animation: 'appear',
      animationLayerKeys: ['hero', 'hero_layer_3'],
    });
  });

  it('keeps canonical identities and disables an old last effect when no overlay exists', () => {
    expect(
      homeAnimationConfiguration({
        heroImagePath: 'public-media/home/hero/base.webp',
        heroAnimation: 'disappear',
        heroAnimationLayerKeys: ['hero'],
      }),
    ).toEqual({ animation: 'disappear', animationLayerKeys: ['hero'] });
    expect(
      homeAnimationConfiguration({
        heroImagePath: 'public-media/home/hero/base.webp',
        heroAnimation: 'appear',
        heroAnimationTarget: 'last',
      }),
    ).toEqual({ animation: 'none', animationLayerKeys: [] });
    expect(
      homeAnimationLayerKeys({
        heroCarvingImagePath: 'public-media/home/hero_carving/overlay.webp',
        heroAnimationLayerKeys: ['hero_carving', 'unknown'],
      }),
    ).toEqual(['hero_carving']);
  });
});

const { callable } = vi.hoisted(() => ({ callable: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => callable }));

describe('PublicMediaUrlService cache', () => {
  const reference: PublicMediaReference = {
    kind: 'product',
    targetId: 'product_alpha',
    expectedPath: PATH,
  };
  const entry = () => media(Date.now() + 60 * 60 * 1000);
  const service = () => TestBed.runInInjectionContext(() => new PublicMediaUrlService());
  const product = { id: 'product_alpha', imagePath: PATH } as CatalogProduct;

  beforeEach(() => {
    localStorage.clear();
    callable.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: FirebaseClient, useValue: { functions: {} } }],
    });
    callable.mockResolvedValue({ data: { media: [entry()] } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('shares overlapping batch and individual requests, then reuses the URL', async () => {
    const resolver = service();
    const [products, url] = await Promise.all([
      resolver.attachProductUrls([product, product]),
      resolver.resolve(reference),
      resolver.attachProductUrls([product]),
    ]);
    expect(products[0].imageUrl).toBe(url);
    expect(callable).toHaveBeenCalledTimes(1);
    expect(callable).toHaveBeenCalledWith({
      items: [{ kind: 'product', targetId: 'product_alpha' }],
    });
    await resolver.resolve(reference);
    expect(callable).toHaveBeenCalledTimes(1);
  });

  it('resolves and caches a customization separately without accepting another product path', async () => {
    const path = 'public-media/product-customizations/product_alpha/overlay.webp';
    const overlay = {
      ...entry(),
      key: 'product_customization:product_alpha',
      path,
      url: 'https://storage.example/overlay.webp',
    };
    callable.mockResolvedValue({ data: { media: [entry(), overlay] } });
    const resolver = service();
    const [resolved] = await resolver.attachProductUrls([
      { ...product, customizationImagePath: path },
    ]);
    expect(resolved.customizationImageUrl).toBe(overlay.url);
    expect(resolved.imageUrl).toBe(entry().url);
    expect(callable).toHaveBeenCalledWith({
      items: [
        { kind: 'product_customization', targetId: 'product_alpha' },
        { kind: 'product', targetId: 'product_alpha' },
      ],
    });
    await resolver.attachProductUrls([{ ...product, customizationImagePath: path }]);
    expect(callable).toHaveBeenCalledOnce();
    const [foreign] = await resolver.attachProductUrls([
      {
        ...product,
        customizationImagePath: 'public-media/product-customizations/product_beta/overlay.webp',
      },
    ]);
    expect(foreign.customizationImageUrl).toBeNull();
  });

  it('resolves the exclusive image for related cards separately from catalog media', async () => {
    const path = 'public-media/product-related/product_alpha/card.webp';
    const related = {
      ...entry(),
      key: 'product_related:product_alpha',
      path,
      url: 'https://storage.example/related-card.webp',
    };
    callable.mockResolvedValue({ data: { media: [related] } });
    const [resolved] = await service().attachProductUrls([
      { ...product, imagePath: null, relatedImagePath: path },
    ]);
    expect(resolved.relatedImageUrl).toBe(related.url);
    expect(resolved.imageUrl).toBeNull();
    expect(callable).toHaveBeenCalledWith({
      items: [{ kind: 'product_related', targetId: 'product_alpha' }],
    });
  });

  it('keeps resolved URLs across a new service instance (page reload)', async () => {
    await service().resolve(reference);
    expect(await service().resolve(reference)).toBe(entry().url);
    expect(callable).toHaveBeenCalledTimes(1);
  });

  it('retains existing v1 cached URLs', async () => {
    localStorage.setItem('cisus.publicMedia.v1', JSON.stringify({ [entry().key]: entry() }));
    expect(await service().resolve(reference)).toBe(entry().url);
    expect(callable).not.toHaveBeenCalled();
  });

  it('keeps an in-memory cache when localStorage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const resolver = service();
    await resolver.resolve(reference);
    await resolver.resolve(reference);
    expect(callable).toHaveBeenCalledTimes(1);
  });

  it('does not reuse an old pending request after publishing a new image', async () => {
    let finishOld!: (value: { data: { media: PublicMediaUrl[] } }) => void;
    callable.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        }),
    );
    const resolver = service();
    const old = resolver.resolve(reference);
    await Promise.resolve();
    const newPath = PATH.replace('image-1', 'image-2');
    const newEntry = { ...entry(), path: newPath, url: 'https://storage.example/new.webp' };
    callable.mockResolvedValueOnce({ data: { media: [newEntry] } });
    expect(await resolver.resolve({ ...reference, expectedPath: newPath })).toBe(newEntry.url);
    finishOld({ data: { media: [entry()] } });
    await old;
    expect(await service().resolve({ ...reference, expectedPath: newPath })).toBe(newEntry.url);
    expect(callable).toHaveBeenCalledTimes(2);
  });

  it('preserves cache entries from simultaneous independent batches', async () => {
    const second = {
      ...reference,
      targetId: 'product_beta',
      expectedPath: PATH.replace('alpha', 'beta'),
    };
    const secondEntry = { ...entry(), key: 'product:product_beta', path: second.expectedPath };
    callable
      .mockResolvedValueOnce({ data: { media: [entry()] } })
      .mockResolvedValueOnce({ data: { media: [secondEntry] } });
    const resolver = service();
    await Promise.all([resolver.resolve(reference), resolver.resolve(second)]);
    const reloaded = service();
    await Promise.all([reloaded.resolve(reference), reloaded.resolve(second)]);
    expect(callable).toHaveBeenCalledTimes(2);
  });

  it('ignores corrupt cache values and refreshes expiring URLs', async () => {
    localStorage.setItem(
      'cisus.publicMedia.v1',
      JSON.stringify({
        broken: { path: PATH, url: 42 },
        [entry().key]: media(Date.now() + 60_000),
      }),
    );
    expect(await service().resolve(reference)).toBe(entry().url);
    expect(callable).toHaveBeenCalledTimes(1);
  });

  it('releases failed requests so the next attempt can succeed', async () => {
    callable.mockRejectedValueOnce(new Error('network'));
    const resolver = service();
    await expect(resolver.resolve(reference)).rejects.toThrow('network');
    expect(await resolver.resolve(reference)).toBe(entry().url);
    expect(callable).toHaveBeenCalledTimes(2);
  });
});
