import { describe, expect, it } from 'vitest';
import type { PublicMediaUrl } from '../models/commerce';
import { isReusablePublicMedia } from './public-media-url';

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
});
