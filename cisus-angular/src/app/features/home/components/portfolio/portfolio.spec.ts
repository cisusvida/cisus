import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { CatalogProduct } from '../../../../core/models/commerce';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { MarketingContent } from '../../../../core/services/marketing-content';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';
import { Portfolio } from './portfolio';

describe('Portfolio editorial scene', () => {
  let fixture: ComponentFixture<Portfolio>;
  const list = vi.fn<() => Promise<CatalogProduct[]>>();
  const imageOutcomes = new Map<string, 'load' | 'error' | 'manual'>();
  const pendingImages = new Map<string, Array<{ onload: (() => void) | null }>>();

  const product = (
    id: string,
    name: string,
    description = `${name} para tu espacio.`,
  ): CatalogProduct => ({
    id,
    sku: id.toUpperCase(),
    name,
    description,
    shortDescription: `${name}, edición breve.`,
    materialLabel: 'Madera',
    imagePath: null,
    imageUrl: `/media/${id}.png`,
    sceneImagePath: null,
    sceneImageUrl: `/media/${id}-scene.png`,
    basePrice: 29990,
    currency: 'CLP',
  });

  const conceptProduct = (
    id: string,
    name: string,
    shortDescription: string,
    description: string,
    sceneName?: string,
  ): CatalogProduct => ({
    ...product(id, name, description),
    shortDescription,
    sceneImageUrl: `/media/${sceneName ?? id}.png`,
    basePrice: null as unknown as number,
  });

  const products = [
    product('cisus_tabla_felino', 'Felino'),
    product('cisus_tabla_delfin', 'Delfín'),
    product('cisus_tabla_zorro', 'Zorro'),
    product('cisus_tabla_relieve', 'Con relieve'),
    product('cisus_mesa_cauce', 'Mesas personalizadas'),
    product('cisus_mueble_linde', 'Almacenamiento artesanal'),
    product('cisus_repisa_senda', 'Propuesta · Repisas orgánicas'),
    product('cisus_banco_raiz', 'Propuesta · Bancos escultóricos'),
    product('cisus_lampara_claro', 'Propuesta · Lámparas de madera'),
    product('cisus_pedestal_brote', 'Propuesta · Pedestales botánicos'),
    conceptProduct(
      'cisus_pomo_orbita',
      'Órbita',
      'Un frente circular amplio para convertir el agarre en un detalle protagonista.',
      'Órbita combina un disco amplio con una base recogida.',
      'orbita-instalado',
    ),
    conceptProduct(
      'cisus_pomo_boton',
      'Botón',
      'Curvas suaves y presencia discreta para acompañar el diseño de tus muebles.',
      'Botón propone una forma circular compacta y redondeada.',
    ),
    conceptProduct(
      'cisus_pomo_canto',
      'Canto',
      'Geometría de bordes suaves para dar un acento definido a cajones y puertas.',
      'Canto combina un frente cuadrado con esquinas redondeadas.',
    ),
    conceptProduct(
      'cisus_tirador_encuentro',
      'Encuentro',
      'Dos mitades que dibujan un círculo al encontrarse las puertas.',
      'Encuentro se presenta como una pareja de tiradores semicirculares.',
    ),
    conceptProduct(
      'cisus_tirador_brisa',
      'Brisa',
      'Una línea orgánica y asimétrica que aporta movimiento al frente del mueble.',
      'Brisa parte de un extremo fino y se ensancha suavemente hacia el otro.',
    ),
    conceptProduct(
      'cisus_tirador_borde',
      'Borde',
      'Un perfil horizontal discreto que acompaña las líneas del cajón.',
      'Borde propone un frente alargado con una concavidad continua.',
    ),
    conceptProduct(
      'cisus_tirador_tallo',
      'Tallo',
      'Una silueta alargada que acentúa la verticalidad de puertas y armarios.',
      'Tallo combina un cuerpo esbelto con extremos suavemente ensanchados.',
    ),
  ];

  const content = {
    productFamilies: [
      {
        id: 'tablas',
        label: 'Tablas de cocina',
        heading: 'TABLAS DE COCINA',
        claim: 'Arte funcional para tu espacio',
        types: [
          {
            id: 'animales',
            label: 'Conceptuales de animales',
            icon: 'paw',
            models: [
              { productId: 'cisus_tabla_felino' },
              { productId: 'cisus_tabla_delfin' },
              { productId: 'cisus_tabla_zorro' },
            ],
          },
          {
            id: 'relieve',
            label: 'Relieve de paisajes',
            icon: 'relief',
            models: [{ productId: 'cisus_tabla_relieve' }],
          },
        ],
      },
      {
        id: 'pomos_tiradores',
        label: 'Pomos y tiradores',
        heading: 'POMOS Y TIRADORES',
        claim: 'El detalle que cambia tus muebles.',
        commercialState: 'design_concept',
        conceptLabel: 'Colección en desarrollo',
        imageDisclosure: 'Visualización de diseño',
        detailNotice:
          'Modelo en desarrollo. Medidas, madera, fijación y disponibilidad por confirmar.',
        types: [
          {
            id: 'pomos',
            label: 'Pomos',
            icon: 'knob',
            models: [
              {
                productId: 'cisus_pomo_orbita',
                metadata: 'Pomo de disco · Madera',
                sceneObjectFit: 'contain',
              },
              {
                productId: 'cisus_pomo_boton',
                metadata: 'Pomo redondo · Madera',
              },
              {
                productId: 'cisus_pomo_canto',
                metadata: 'Pomo cuadrado · Madera',
              },
            ],
          },
          {
            id: 'tiradores',
            label: 'Tiradores',
            icon: 'handle',
            models: [
              {
                productId: 'cisus_tirador_encuentro',
                metadata: 'Tirador en pareja · Madera',
              },
              {
                productId: 'cisus_tirador_brisa',
                metadata: 'Tirador orgánico · Madera',
              },
              {
                productId: 'cisus_tirador_borde',
                metadata: 'Tirador de perfil · Madera',
              },
              {
                productId: 'cisus_tirador_tallo',
                metadata: 'Tirador vertical · Madera',
              },
            ],
          },
        ],
      },
    ],
    portfolioCompanionProductIds: products.slice(4, 10).map(({ id }) => id),
  };

  const buttonWithText = (text: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent?.includes(text),
    ) as HTMLButtonElement;

  beforeEach(async () => {
    list.mockReset().mockResolvedValue(products);
    imageOutcomes.clear();
    pendingImages.clear();

    class TestImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        const outcome = imageOutcomes.get(value) ?? 'load';
        if (outcome === 'manual') {
          pendingImages.set(value, [...(pendingImages.get(value) ?? []), this]);
        } else {
          queueMicrotask(() => (outcome === 'load' ? this.onload?.() : this.onerror?.()));
        }
      }
    }

    vi.stubGlobal('Image', TestImage);
    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [
        { provide: CommerceGateway, useValue: { listPublicProducts: list } },
        { provide: MarketingContent, useValue: content },
        {
          provide: PublicMediaUrlService,
          useValue: {
            observeHomePortfolioBackground: (listener: (url: string) => void) => {
              listener('/media/background.png');
              return vi.fn();
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.unstubAllGlobals();
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(Portfolio);
    await fixture.whenStable();
  }

  it('shows more types only when measured buttons overflow and keeps hidden options selectable', async () => {
    let resize!: () => void;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    await render();
    const root = fixture.nativeElement as HTMLElement;
    const row = root.querySelector<HTMLElement>('.type-switcher')!;
    let width = 400;
    Object.defineProperty(row, 'clientWidth', { get: () => width });
    row.style.columnGap = '16px';
    row.querySelectorAll<HTMLElement>('.type-option').forEach((button) => {
      button.getBoundingClientRect = () => ({ width: 140 }) as DOMRect;
    });
    resize();
    await fixture.whenStable();
    expect(root.querySelector('.more-types')).toBeNull();
    width = 210;
    resize();
    await fixture.whenStable();
    expect(root.querySelectorAll('.type-option--overflow')).toHaveLength(1);
    const more = root.querySelector<HTMLDetailsElement>('.more-types')!;
    more.open = true;
    root.querySelector<HTMLButtonElement>('.type-overflow-list button')!.click();
    await fixture.whenStable();
    expect(root.querySelector('#portfolio-title')!.textContent).toContain('Con relieve');
    expect(more.open).toBe(false);
    expect(document.activeElement).toBe(more.querySelector('summary'));
    width = 400;
    resize();
    await fixture.whenStable();
    expect(root.querySelector('.more-types')).toBeNull();
  });

  it('handles more than two types using their actual widths', async () => {
    let resize!: () => void;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    TestBed.overrideProvider(MarketingContent, {
      useValue: {
        ...content,
        productFamilies: [
          {
            ...content.productFamilies[0],
            types: Array.from({ length: 6 }, (_, i) => ({
              ...content.productFamilies[0].types[0],
              id: `type-${i}`,
              label: `Tipo ${i + 1}`,
            })),
          },
        ],
      },
    });
    await render();
    const root = fixture.nativeElement as HTMLElement;
    const row = root.querySelector<HTMLElement>('.type-switcher')!;
    Object.defineProperty(row, 'clientWidth', { value: 360 });
    row.style.columnGap = '10px';
    row.querySelectorAll<HTMLElement>('.type-option').forEach((button) => {
      button.getBoundingClientRect = () => ({ width: 90 }) as DOMRect;
    });
    resize();
    await fixture.whenStable();
    expect(root.querySelectorAll('.type-option:not(.type-option--overflow)')).toHaveLength(3);
    expect(root.querySelectorAll('.type-overflow-list button')).toHaveLength(3);
    const more = root.querySelector<HTMLDetailsElement>('.more-types')!;
    more.open = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(more.open).toBe(false);
  });

  it('toggles the product overlay, resets it between products and allows retry after an image error', async () => {
    list.mockResolvedValue(
      products.map((item, i) =>
        i === 0
          ? {
              ...item,
              customization: { enabled: true, label: 'canaleta' },
              customizationImageUrl: '/media/canaleta.webp',
            }
          : item,
      ),
    );
    await render();
    const root = fixture.nativeElement as HTMLElement;
    const toggle = root.querySelector<HTMLButtonElement>('.customization-toggle')!;
    expect(toggle.textContent).toContain('Canaleta');
    expect(root.querySelector('.customization-plus')).not.toBeNull();
    expect(toggle.textContent).not.toContain('Agregar');
    expect(toggle.getAttribute('aria-label')).toBe('Agregar canaleta');
    expect(root.querySelector('.product-customization')).toBeNull();
    expect(root.querySelector('.product-actions')?.firstElementChild?.classList.contains('detail-link')).toBe(true);
    expect(toggle.classList.contains('is-active')).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('.customization-overlay')).toBeNull();
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Quitar canaleta');
    expect(toggle.classList.contains('is-active')).toBe(true);
    expect(root.querySelector('img.customization-overlay')?.getAttribute('src')).toBe(
      '/media/canaleta.webp',
    );
    toggle.click();
    await fixture.whenStable();
    expect(root.querySelector('.customization-overlay')).toBeNull();
    toggle.click();
    await fixture.whenStable();
    root.querySelector('.customization-overlay')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('[aria-live]')?.textContent).toContain('reintentar');
    toggle.click();
    await fixture.whenStable();
    expect(root.querySelector('.customization-overlay')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('[data-model-id="cisus_tabla_delfin"]')!.click();
    await fixture.whenStable();
    expect(root.querySelector('.customization-toggle')).toBeNull();
    expect(root.querySelector('.customization-overlay')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-model-id="cisus_tabla_felino"]')!.click();
    await fixture.whenStable();
    expect(root.querySelector('.customization-toggle')!.getAttribute('aria-pressed')).toBe('false');
  });

  it('hides disabled or incomplete customization and does not overlay a fallback catalog photo', async () => {
    list.mockResolvedValue(
      products.map((item, i) =>
        i === 0
          ? {
              ...item,
              customization: { enabled: true, label: 'canaleta' },
              customizationImageUrl: '/media/canaleta.webp',
            }
          : item,
      ),
    );
    imageOutcomes.set('/media/cisus_tabla_felino-scene.png', 'error');
    await render();
    expect(fixture.nativeElement.querySelector('.customization-toggle')).toBeNull();
  });

  it.each([
    { label: 'base', keys: ['product_scene'] as const, expected: [true, false, false] },
    { label: 'middle overlay', keys: ['product_scene_2'] as const, expected: [false, true, false] },
    { label: 'base and selected overlay', keys: ['product_scene', 'product_scene_3'] as const, expected: [true, false, true] },
    { label: 'no layer', keys: [] as const, expected: [false, false, false] },
  ])(
    'animates the stable $label destination while keeping customization above it',
    async ({ keys, expected }) => {
      list.mockResolvedValue(
        products.map((item, i) =>
          i === 0
            ? {
                ...item,
                sceneAnimation: 'disappear',
                sceneAnimationLayerKeys: [...keys],
                sceneLayers: [
                  { kind: 'product_scene_2', targetId: item.id, url: '/media/middle.webp' },
                  { kind: 'product_scene_3', targetId: item.id, url: '/media/last.webp' },
                ],
                customization: { enabled: true, label: 'canaleta' },
                customizationImageUrl: '/media/canaleta.webp',
              }
            : item,
        ),
      );
      await render();
      const root = fixture.nativeElement as HTMLElement;
      const stage = root.querySelector('.scene-stage')!;
      const layers = stage.querySelectorAll('img');
      expect(layers[0].classList.contains('layer-disappear')).toBe(expected[0]);
      expect(layers[1].classList.contains('layer-disappear')).toBe(expected[1]);
      expect(layers[2].classList.contains('layer-disappear')).toBe(expected[2]);
      root.querySelector<HTMLButtonElement>('.customization-toggle')!.click();
      await fixture.whenStable();
      expect(stage.lastElementChild?.classList.contains('customization-overlay')).toBe(true);
      expect(stage.lastElementChild?.classList.contains('layer-disappear')).toBe(false);
    },
  );

  it('opens product details inside Home without navigating', async () => {
    await render();
    expect(fixture.nativeElement.querySelector('#portfolio-section-title').textContent.trim()).toBe(
      'Explora nuestras colecciones',
    );
    expect(fixture.nativeElement.querySelector('.section-intro p').textContent.trim()).toBe(
      'Elige una colección y descubre sus diseños.',
    );
    expect(fixture.nativeElement.querySelector('#portfolio-family-title').textContent.trim()).toBe(
      'Tablas de cocina',
    );
    expect(fixture.nativeElement.querySelector('.family-switcher')).toBeNull();
    expect(fixture.nativeElement.querySelector('#portfolio-title').tagName).toBe('H4');
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Felino',
    );
    expect(fixture.nativeElement.querySelector('.product-meta').textContent).toContain(
      'Tabla conceptual · Madera',
    );
    const originalUrl = window.location.href;
    const dialog = fixture.nativeElement.querySelector('.product-dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
    dialog.close = vi.fn(() => dialog.removeAttribute('open'));
    fixture.nativeElement.querySelector('.detail-link').click();
    await fixture.whenStable();
    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.textContent).toContain('Felino para tu espacio.');
    expect(window.location.href).toBe(originalUrl);
    expect(fixture.nativeElement.querySelector('.view-all')).toBeNull();
    expect(fixture.nativeElement.querySelector('#portfolio a[href]')).toBeNull();
    fixture.nativeElement.querySelector('button[aria-label="Cerrar detalles"]').click();
    await fixture.whenStable();
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.detail-link'));
    expect(fixture.nativeElement.querySelectorAll('.model-switcher button')).toHaveLength(3);
    expect(fixture.nativeElement.querySelectorAll('.related-card')).toHaveLength(7);
    expect(fixture.nativeElement.querySelector('#related-title').textContent.trim()).toBe(
      'Otras colecciones',
    );
    const priorityFamily = fixture.nativeElement.querySelector('.related-card--family');
    expect(priorityFamily.textContent).toContain('Pomos y tiradores');
    expect(priorityFamily.getAttribute('aria-label')).toBe(
      'Mostrar la colección Pomos y tiradores',
    );
    expect(priorityFamily.querySelector('img').getAttribute('src')).toContain('orbita-instalado');
    expect(fixture.nativeElement.querySelectorAll('.related-dots button')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('.related-arrows')).toBeNull();
    expect(fixture.nativeElement.querySelector('.related-card-arrow')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Más detalle');
  });

  it('presents all knob and handle concepts without price or purchase language', async () => {
    await render();
    buttonWithText('Pomos y tiradores').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.family-switcher')).toBeNull();
    expect(fixture.nativeElement.querySelector('#portfolio-family-title').textContent.trim()).toBe(
      'Pomos y tiradores',
    );
    expect(fixture.nativeElement.querySelector('.related-card--family').textContent).toContain(
      'Tablas de cocina',
    );
    expect(fixture.nativeElement.querySelector('.related-card--family').textContent).not.toContain(
      'Pomos y tiradores',
    );
    expect(fixture.nativeElement.querySelector('#portfolio-section-title').textContent.trim()).toBe(
      'Explora nuestras colecciones',
    );
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Órbita',
    );
    expect(fixture.nativeElement.querySelector('.scene-claim').textContent.trim()).toBe(
      'El detalle que cambia tus muebles.',
    );
    expect(fixture.nativeElement.querySelector('.product-meta').textContent).toContain(
      'Pomo de disco · Madera',
    );
    expect(fixture.nativeElement.querySelector('.concept-status').textContent).toContain(
      'Colección en desarrollo',
    );
    expect(fixture.nativeElement.querySelectorAll('.model-switcher button')).toHaveLength(3);
    expect(
      fixture.nativeElement.querySelector('.scene-layer--current').getAttribute('src'),
    ).toContain('orbita-instalado');

    const dialog = fixture.nativeElement.querySelector('.product-dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
    fixture.nativeElement.querySelector('.detail-link').click();
    await fixture.whenStable();
    expect(dialog.textContent).toContain(
      'Modelo en desarrollo. Medidas, madera, fijación y disponibilidad por confirmar.',
    );
    expect(dialog.textContent).not.toContain('Precio referencial');
    expect(dialog.textContent).not.toContain('Comprar');
    const inquiry = dialog.querySelector<HTMLAnchorElement>('.detail-inquiry--primary');
    expect(decodeURIComponent(inquiry?.href ?? '')).toContain('Consulta Cisus — Órbita');
    expect(decodeURIComponent(inquiry?.href ?? '')).toContain('Cantidad aproximada:');
    expect(decodeURIComponent(inquiry?.href ?? '')).toContain('Mueble o uso previsto:');
    expect(decodeURIComponent(inquiry?.href ?? '')).toContain('Comuna:');
  });

  it('shows four handle models, supports arrow selection and restores each family state', async () => {
    await render();
    buttonWithText('Delfín').click();
    await fixture.whenStable();
    buttonWithText('Pomos y tiradores').click();
    await fixture.whenStable();
    buttonWithText('Tiradores').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Encuentro',
    );
    expect(fixture.nativeElement.querySelector('.product-meta').textContent).toContain(
      'Tirador en pareja · Madera',
    );
    expect(fixture.nativeElement.querySelectorAll('.model-switcher button')).toHaveLength(4);

    const borde = fixture.nativeElement.querySelector(
      'button[data-model-id="cisus_tirador_borde"]',
    ) as HTMLButtonElement;
    borde.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Tallo',
    );

    buttonWithText('Tablas de cocina').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Delfín',
    );
    buttonWithText('Pomos y tiradores').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Tallo',
    );
  });

  it('moves mobile focus to the updated family heading after choosing another collection', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    await render();

    fixture.nativeElement.querySelector('.related-card--family').click();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await fixture.whenStable();

    const familyHeading = fixture.nativeElement.querySelector(
      '#portfolio-family-title',
    ) as HTMLHeadingElement;
    expect(familyHeading.textContent?.trim()).toBe('Pomos y tiradores');
    expect(document.activeElement).toBe(familyHeading);
    expect(fixture.nativeElement.querySelector('.related-card--family').textContent).toContain(
      'Tablas de cocina',
    );
  });

  it('switches Zorro and Relieve atomically without refetching the catalog', async () => {
    await render();
    fixture.nativeElement.querySelector('button[aria-label="Mostrar Zorro"]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Zorro',
    );
    expect(fixture.nativeElement.querySelector('.detail-link').getAttribute('aria-label')).toBe(
      'Ver detalles de Zorro',
    );

    buttonWithText('Relieve de paisajes').click();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.type-option[aria-pressed="true"]').textContent,
    ).toContain('Relieve de paisajes');
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Con relieve',
    );
    expect(fixture.nativeElement.querySelector('.product-meta').textContent).toContain(
      'Tabla con relieve',
    );
    expect(list).toHaveBeenCalledOnce();
  });

  it('lets the latest rapid selection win after both images finish loading', async () => {
    imageOutcomes.set('/media/cisus_tabla_delfin-scene.png', 'manual');
    imageOutcomes.set('/media/cisus_tabla_zorro-scene.png', 'manual');
    await render();

    fixture.nativeElement.querySelector('button[aria-label="Mostrar Delfín"]').click();
    fixture.nativeElement.querySelector('button[aria-label="Mostrar Zorro"]').click();
    pendingImages.get('/media/cisus_tabla_zorro-scene.png')?.forEach((image) => image.onload?.());
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Zorro',
    );

    pendingImages.get('/media/cisus_tabla_delfin-scene.png')?.forEach((image) => image.onload?.());
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#portfolio-title').textContent.trim()).toBe(
      'Zorro',
    );
  });

  it('releases a failed scene and retries it on the next selection', async () => {
    await render();
    imageOutcomes.set('/media/cisus_tabla_zorro-scene.png', 'error');
    imageOutcomes.set('/media/cisus_tabla_zorro.png', 'error');
    fixture.nativeElement.querySelector('button[aria-label="Mostrar Zorro"]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('section').getAttribute('aria-busy')).toBe('false');

    imageOutcomes.set('/media/cisus_tabla_zorro-scene.png', 'load');
    fixture.nativeElement.querySelector('button[aria-label="Mostrar Zorro"]').click();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.scene-layer--current').getAttribute('src'),
    ).toContain('zorro-scene');
  });

  it('keeps the current catalog photo visible when an editorial scene is absent', async () => {
    list.mockResolvedValueOnce(
      products.map((item) =>
        item.id === 'cisus_mesa_cauce' ? { ...item, sceneImageUrl: null } : item,
      ),
    );
    await render();
    const firstRelated = fixture.nativeElement.querySelector(
      '.related-card--product',
    ) as HTMLElement;
    expect(firstRelated.textContent).toContain('Mesas personalizadas');
    expect(firstRelated.querySelector('img')?.getAttribute('src')).toContain(
      'cisus_mesa_cauce.png',
    );
  });

  it('uses a selected thumbnail for related cards and falls back to scene then catalog on failure', async () => {
    list.mockResolvedValueOnce(
      products.map((item) =>
        item.id === 'cisus_mesa_cauce'
          ? {
              ...item,
              relatedImageSource: 'product_thumbnail',
              thumbnailImageUrl: '/media/cauce-thumbnail.webp',
            }
          : item,
      ),
    );
    await render();
    const card = fixture.nativeElement.querySelector('.related-card--product') as HTMLElement;
    const image = card.querySelector('img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('/media/cauce-thumbnail.webp');
    image.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(card.querySelector('img')?.getAttribute('src')).toBe(
      '/media/cisus_mesa_cauce-scene.png',
    );
    card.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(card.querySelector('img')?.getAttribute('src')).toBe('/media/cisus_mesa_cauce.png');
  });

  it('shows the missing-image state when a product has no published source', async () => {
    list.mockResolvedValueOnce(
      products.map((item) =>
        item.id === 'cisus_mesa_cauce'
          ? {
              ...item,
              imageUrl: null,
              sceneImageUrl: null,
              thumbnailImageUrl: null,
            }
          : item,
      ),
    );
    await render();
    const card = fixture.nativeElement.querySelector('.related-card--product') as HTMLElement;
    expect(card.querySelector('img')).toBeNull();
    expect(card.querySelector('.related-image-missing')?.textContent).toContain(
      'Imagen no disponible',
    );
  });

  it('keeps related dots synchronized and retries a catalog failure', async () => {
    list.mockRejectedValueOnce(new Error('offline'));
    await render();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos',
    );
    buttonWithText('Reintentar').click();
    await fixture.whenStable();

    const viewport = fixture.nativeElement.querySelector('.related-viewport') as HTMLElement;
    const cards = viewport.querySelectorAll<HTMLElement>('.related-card');
    Object.defineProperty(cards[2], 'offsetLeft', { value: 240 });
    viewport.scrollTo = vi.fn();

    fixture.nativeElement.querySelector('button[aria-label="Ir a la página 2"]').click();
    await fixture.whenStable();
    expect(
      fixture.nativeElement
        .querySelector('button[aria-label="Ir a la página 2"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
    expect(viewport.scrollTo).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });
    viewport.scrollLeft = 480;
    viewport.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(
      fixture.nativeElement
        .querySelector('button[aria-label="Ir a la página 3"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('advances smoothly to the adjacent cards once per horizontal gesture and releases its edges', async () => {
    await render();
    const viewport = fixture.nativeElement.querySelector('.related-viewport') as HTMLElement;
    Object.defineProperties(viewport, { clientWidth: { value: 240 }, scrollWidth: { value: 720 } });
    const cards = viewport.querySelectorAll<HTMLElement>('.related-card');
    Object.defineProperty(cards[2], 'offsetLeft', { value: 240 });
    Object.defineProperty(cards[4], 'offsetLeft', { value: 480 });
    viewport.scrollTo = vi.fn();
    const wheel = new WheelEvent('wheel', { deltaX: 120, deltaY: 4, cancelable: true });
    Object.defineProperty(wheel, 'timeStamp', { value: 100 });
    viewport.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(viewport.scrollTo).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });
    viewport.scrollLeft = 240;
    const inertia = new WheelEvent('wheel', { deltaX: 1500, cancelable: true });
    Object.defineProperty(inertia, 'timeStamp', { value: 150 });
    viewport.dispatchEvent(inertia);
    expect(inertia.defaultPrevented).toBe(true);
    expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
    const nextGesture = new WheelEvent('wheel', { deltaX: 1500, cancelable: true });
    Object.defineProperty(nextGesture, 'timeStamp', { value: 500 });
    viewport.dispatchEvent(nextGesture);
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ left: 480, behavior: 'smooth' });
    viewport.scrollLeft = 480;
    const endWheel = new WheelEvent('wheel', { deltaX: 120, cancelable: true });
    viewport.dispatchEvent(endWheel);
    expect(endWheel.defaultPrevented).toBe(false);
  });

  it.each([
    { deltaX: 0, deltaY: 120 },
    { deltaX: 8, deltaY: -120 },
    { deltaX: 80, deltaY: 80 },
    { deltaX: 120, deltaY: 0, ctrlKey: true },
  ])('preserves page scrolling and zoom for wheel input %j', async (input) => {
    await render();
    const viewport = fixture.nativeElement.querySelector('.related-viewport') as HTMLElement;
    Object.defineProperties(viewport, { clientWidth: { value: 240 }, scrollWidth: { value: 720 } });
    viewport.scrollLeft = 240;
    viewport.scrollTo = vi.fn();
    const wheel = new WheelEvent('wheel', { ...input, cancelable: true });
    viewport.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
    expect(viewport.scrollTo).not.toHaveBeenCalled();
  });
});
