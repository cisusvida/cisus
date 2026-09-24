import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';
import { Hero } from './hero';
import type {
  MediaAnimation,
  MediaAnimationLayerKey,
  MediaLayer,
} from '../../../../core/models/commerce';

describe('Hero', () => {
  let component: Hero;
  let fixture: ComponentFixture<Hero>;
  let heroMediaListener: (url: string | null) => void;
  let carvingMediaListener: (url: string | null) => void;
  let compositionListener: (
    layers: MediaLayer[],
    animation: MediaAnimation,
    animationLayerKeys?: MediaAnimationLayerKey[],
  ) => void;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        {
          provide: PublicMediaUrlService,
          useValue: {
            observeHeroComposition: (listener: typeof compositionListener) => {
              compositionListener = listener;
              let base: string | null = null;
              heroMediaListener = (url) => {
                base = url;
                listener([{ kind: 'home', targetId: 'hero', url }], 'none');
              };
              carvingMediaListener = (url) =>
                listener(
                  [
                    { kind: 'home', targetId: 'hero', url: base },
                    { kind: 'home', targetId: 'hero_carving', url },
                  ],
                  'appear',
                  ['hero_carving'],
                );
              return () => undefined;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('presents the product-led message and working destinations', () => {
    const element = fixture.nativeElement as HTMLElement;
    const links = [...element.querySelectorAll<HTMLAnchorElement>('.hero-action')];

    expect(element.querySelector('.hero-kicker')?.textContent).toContain(
      'Diseño y fabricación propia',
    );
    expect(element.querySelector('h1')?.textContent).toContain(
      'Piezas que merecen estar a la vista.',
    );
    expect(element.querySelector('.hero-copy')?.textContent).toContain(
      'Diseños que combinan utilidad y carácter. Para tu espacio o para regalar.',
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/catalogo']);
  });

  it('shows only managed media over the decorative vector background', async () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.hero-media')).toBeNull();
    expect(element.querySelector('.hero-background svg')).toBeTruthy();

    heroMediaListener('/managed-home-hero.webp');
    carvingMediaListener('/managed-home-carving.webp');

    await fixture.whenStable();

    const base = element.querySelector<HTMLImageElement>('.hero-media__base');
    const carving = element.querySelector<HTMLImageElement>('.hero-media .layer-appear');
    expect(base?.src).toContain('/managed-home-hero.webp');
    expect(carving?.src).toContain('/managed-home-carving.webp');
    expect(carving?.alt).toBe('');
    expect(element.querySelector('.hero-media__carving-exit')).toBeNull();
  });

  it.each([
    { label: 'base', keys: ['hero'] as MediaAnimationLayerKey[], expected: [true, false, false] },
    { label: 'middle layer', keys: ['hero_carving'] as MediaAnimationLayerKey[], expected: [false, true, false] },
    { label: 'base and selected overlay', keys: ['hero', 'hero_layer_3'] as MediaAnimationLayerKey[], expected: [true, false, true] },
  ])(
    'applies the configured effect to the stable $label destination',
    async ({ keys, expected }) => {
      compositionListener(
        [
          { kind: 'home', targetId: 'hero', url: '/base.webp' },
          { kind: 'home', targetId: 'hero_carving', url: '/middle.webp' },
          { kind: 'home', targetId: 'hero_layer_3', url: '/last.webp' },
        ],
        'appear',
        keys,
      );
      await fixture.whenStable();
      const layers = (fixture.nativeElement as HTMLElement).querySelectorAll('.hero-media img');
      expect(layers[0].classList.contains('layer-appear')).toBe(expected[0]);
      expect(layers[1].classList.contains('layer-appear')).toBe(expected[1]);
      expect(layers[2].classList.contains('layer-appear')).toBe(expected[2]);
    },
  );
});
