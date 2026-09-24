import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Auth } from '../../../../core/services/auth';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import type { ActiveAccessContext } from '../../../../core/models/user';
import { HeroMediaEditor } from './hero-media-editor';

const designer: ActiveAccessContext = {
  scopeId: 'cisus-designer',
  companyId: 'cisus',
  companyName: 'Cisus',
  entityId: 'cisus',
  entityName: 'Cisus',
  jobRoleId: 'cisus_designer',
  scopeLevel: 'company',
  pv: 1,
  sv: 1,
  permissions: ['public_media.manage'],
};
describe('HeroMediaEditor', () => {
  let fixture: ComponentFixture<HeroMediaEditor>;
  const context = signal<ActiveAccessContext | undefined>(undefined);
  const upload = vi.fn();
  const download = vi.fn();
  const configure = vi.fn();
  const configureAnimation = vi.fn();
  const configureRelatedImage = vi.fn();
  const root = () => fixture.nativeElement as HTMLElement;
  const button = (name: string) =>
    root().querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  const openPanel = async () => {
    root().querySelector<HTMLButtonElement>('.editor-launch')!.click();
    await fixture.whenStable();
  };
  const open = async (layer = 'Capa 2 · Grabado') => {
    if (!root().querySelector<HTMLDialogElement>('dialog')?.open) await openPanel();
    if (layer === 'Personalización opcional' && root().querySelector('.product-customization-card')) {
      root().querySelector<HTMLButtonElement>('.product-customization-card .replace-button')!.click();
      await fixture.whenStable();
      return;
    }
    const normalized = layer === 'Capa 2 · Grabado' ? 'Superposición 1' :
      layer === 'Capa 1 · Imagen base' ? 'Imagen base' : layer;
    let rows = [...root().querySelectorAll<HTMLElement>('.composition-row, .archive-row, .product-resource-row')];
    let row = rows.find((item) => item.textContent?.includes(normalized) || item.textContent?.includes(layer));
    if (!row && root().querySelector('.editor-tabs button:nth-child(2)')) {
      root().querySelector<HTMLButtonElement>('.editor-tabs button:nth-child(2)')!.click();
      await fixture.whenStable();
      rows = [...root().querySelectorAll<HTMLElement>('.composition-row, .archive-row, .product-resource-row')];
      row = rows.find((item) => item.textContent?.includes(normalized) || item.textContent?.includes(layer));
    }
    if (!row) throw new Error(`No se encontró la fila ${normalized}`);
    row.querySelector<HTMLButtonElement>('.replace-button')!.click();
    await fixture.whenStable();
  };
  const choose = async (file = new File(['png'], 'grabado.png', { type: 'image/png' })) => {
    const input = root().querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() =>
      expect(
        root().querySelector('.file-info') || root().querySelector('[role=alert]'),
      ).toBeTruthy(),
    );
    await fixture.whenStable();
  };
  beforeEach(async () => {
    context.set(designer);
    configureAnimation
      .mockReset()
      .mockImplementation(async (data) => ({
        animation: data.animation,
        animationLayerKeys: data.animationLayerKeys,
      }));
    configure
      .mockReset()
      .mockImplementation(async (data) => ({ customization: data.customization }));
    configureRelatedImage
      .mockReset()
      .mockImplementation(async (data) => ({ relatedImageSource: data.relatedImageSource }));
    upload
      .mockReset()
      .mockResolvedValue({ media: { url: 'https://example.com/new.webp', path: 'test.webp' } });
    download.mockReset().mockResolvedValue({
      base64: btoa('webp'),
      filename: 'cisus-portada-grabado.webp',
      mimeType: 'image/webp',
    });
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 10, height: 10, close: vi.fn() }),
    );
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        if (!this.open) return;
        this.open = false;
        this.dispatchEvent(new Event('close'));
      },
    });
    await TestBed.configureTestingModule({
      imports: [HeroMediaEditor],
      providers: [
        { provide: Auth, useValue: { activeContext: context } },
        {
          provide: CommerceGateway,
          useValue: {
            uploadPublicMedia: upload,
            downloadPublicMedia: download,
            configureProductCustomization: configure,
            configurePublicMedia: configureAnimation,
            configureRelatedImageSource: configureRelatedImage,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HeroMediaEditor);
    fixture.componentRef.setInput('baseUrl', 'https://example.com/base.webp');
    fixture.componentRef.setInput('carvingUrl', 'https://example.com/carving.webp');
    await fixture.whenStable();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('requires an internal company role and the media permission', async () => {
    expect(root().querySelectorAll('.archive-row')).toHaveLength(2);
    for (const value of [
      undefined,
      { ...designer, jobRoleId: 'company_admin' as const },
      { ...designer, permissions: [] },
      { ...designer, scopeLevel: 'branch' as const },
    ]) {
      context.set(value);
      await fixture.whenStable();
      expect(root().querySelector('.editor-launch')).toBeNull();
    }
  });

  it('saves a selected intermediate layer by stable identity', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    fixture.componentRef.setInput('animation', 'disappear');
    const changed = vi.fn();
    fixture.componentInstance.animationChanged.subscribe(changed);
    await fixture.whenStable();
    await openPanel();
    const selectLayer = root().querySelector<HTMLInputElement>(
      'input[aria-label="Esta capa recibirá la animación: Superposición 1"]',
    )!;
    selectLayer.click();
    await fixture.whenStable();
    expect(configureAnimation).toHaveBeenCalledWith({
      kind: 'home',
      targetId: 'hero',
      animation: 'disappear',
      animationLayerKeys: ['hero_carving'],
    });
    expect(changed).toHaveBeenCalledWith({ animation: 'disappear', animationLayerKeys: ['hero_carving'] });
  });

  it('saves an effect change with the current stable destination', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    fixture.componentRef.setInput('animationLayerKeys', ['hero_carving']);
    fixture.componentRef.setInput('animation', 'none');
    await fixture.whenStable();
    await openPanel();
    const select = root().querySelector<HTMLSelectElement>('select[id$="-animation"]')!;
    select.value = 'appear';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(configureAnimation).toHaveBeenCalledWith({
      kind: 'home',
      targetId: 'hero',
      animation: 'appear',
      animationLayerKeys: ['hero_carving'],
    });
  });

  it('restores the previous destination after a save failure', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    fixture.componentRef.setInput('animationLayerKeys', ['hero']);
    fixture.componentRef.setInput('animation', 'disappear');
    await fixture.whenStable();
    await openPanel();
    configureAnimation.mockRejectedValueOnce(new Error('offline'));
    root().querySelector<HTMLInputElement>(
      'input[aria-label="Esta capa recibirá la animación: Superposición 1"]',
    )!.click();
    await vi.waitFor(() =>
      expect(root().querySelector('.tools-status')?.textContent).toContain('No se pudo guardar'),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root().querySelector('.composition-row.is-primary-destination')?.textContent).toContain('Imagen base');
    expect(root().querySelector<HTMLInputElement>(
      'input[aria-label="Esta capa recibirá la animación: Imagen base"]',
    )!.checked).toBe(true);
  });

  it('can animate the selected overlay and the base together', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    fixture.componentRef.setInput('animation', 'appear');
    fixture.componentRef.setInput('animationLayerKeys', ['hero_carving']);
    await fixture.whenStable();
    await openPanel();
    root().querySelector<HTMLInputElement>('.base-animation-choice input')!.click();
    await fixture.whenStable();
    expect(configureAnimation).toHaveBeenCalledWith({
      kind: 'home',
      targetId: 'hero',
      animation: 'appear',
      animationLayerKeys: ['hero', 'hero_carving'],
    });
  });

  it('replays the public effect without writing animation settings again', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    fixture.componentRef.setInput('animation', 'appear');
    fixture.componentRef.setInput('animationLayerKeys', ['hero_carving']);
    await fixture.whenStable();
    const replayed = vi.fn();
    fixture.componentInstance.replayRequested.subscribe(replayed);
    await openPanel();
    root().querySelector<HTMLButtonElement>('.replay-button')!.click();
    await fixture.whenStable();
    expect(replayed).toHaveBeenCalledOnce();
    expect(configureAnimation).not.toHaveBeenCalled();
  });

  it('keeps the animation destination independent from download and replacement actions', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    fixture.componentRef.setInput('animationLayerKeys', ['hero_carving']);
    await fixture.whenStable();
    await openPanel();
    download.mockRejectedValueOnce(new Error('offline'));
    button('Descargar Imagen base').click();
    await fixture.whenStable();
    root().querySelector<HTMLButtonElement>(
      'button[aria-label="Reemplazar imagen de Imagen base"]',
    )!.click();
    await fixture.whenStable();
    root().querySelector<HTMLButtonElement>('.editor-footer .secondary')!.click();
    await fixture.whenStable();
    expect(root().textContent).toContain('Destino seleccionado · sin animación');
    expect(configureAnimation).not.toHaveBeenCalled();
  });

  it('disables an unpublished layer choice and announces the six-layer limit', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    fixture.componentRef.setInput('entries', [
      { kind: 'home', targetId: 'hero', url: 'https://example.com/base.webp', label: 'Base', description: 'Base' },
      { kind: 'home', targetId: 'hero_carving', url: null, label: 'Capa 2', description: 'Overlay' },
      { kind: 'home', targetId: 'hero_layer_3', url: 'https://example.com/3.webp', label: 'Capa 3', description: 'Overlay' },
      { kind: 'home', targetId: 'hero_layer_4', url: 'https://example.com/4.webp', label: 'Capa 4', description: 'Overlay' },
      { kind: 'home', targetId: 'hero_layer_5', url: 'https://example.com/5.webp', label: 'Capa 5', description: 'Overlay' },
      { kind: 'home', targetId: 'hero_layer_6', url: 'https://example.com/6.webp', label: 'Capa 6', description: 'Overlay' },
    ]);
    await fixture.whenStable();
    await openPanel();
    expect(root().textContent).toContain('Capas · 6 de 6');
    expect(root().textContent).toContain('Has alcanzado las 6 capas');
    expect(root().querySelector<HTMLButtonElement>('.add-layer-button')!.disabled).toBe(true);
    expect(root().querySelector<HTMLInputElement>(
      'input[aria-label="Esta capa recibirá la animación: Superposición 1"]',
    )!.disabled).toBe(true);
  });

  it('ignores a saved animation response after changing products', async () => {
    fixture.componentRef.setInput('allowLayers', true);
    let resolve!: (value: { animation: string; animationLayerKeys: string[] }) => void;
    configureAnimation.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const changed = vi.fn();
    fixture.componentInstance.animationChanged.subscribe(changed);
    await fixture.whenStable();
    await openPanel();
    root().querySelector<HTMLInputElement>(
      'input[aria-label="Esta capa recibirá la animación: Superposición 1"]',
    )!.click();
    await fixture.whenStable();
    fixture.componentRef.setInput('scopeKey', 'another-product');
    await fixture.whenStable();
    resolve({ animation: 'none', animationLayerKeys: ['hero', 'hero_carving'] });
    await fixture.whenStable();
    expect(changed).not.toHaveBeenCalled();
  });
  it('publishes only the selected layer with the chosen quality and original PNG', async () => {
    const published = vi.fn();
    fixture.componentInstance.published.subscribe(published);
    await open();
    expect(root().querySelector<HTMLInputElement>('input[value="82"]')?.checked).toBe(true);
    await choose();
    root().querySelector<HTMLInputElement>('input[value="76"]')!.click();
    await fixture.whenStable();
    root().querySelector<HTMLButtonElement>('.primary')!.click();
    await fixture.whenStable();
    expect(upload).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'home',
        targetId: 'hero_carving',
        quality: 76,
        mimeType: 'image/png',
        fileBase64: expect.stringMatching(/^data:image\/png;base64,/),
      }),
    );
    expect(published).toHaveBeenCalledWith({
      kind: 'home',
      path: 'test.webp',
      targetId: 'hero_carving',
      url: 'https://example.com/new.webp',
    });
    expect(root().querySelector<HTMLDialogElement>('dialog')?.open).toBe(false);
  });
  it('cancel discards the candidate without uploading; opening another layer resets quality', async () => {
    await open();
    await choose();
    root().querySelector<HTMLInputElement>('input[value="68"]')!.click();
    root().querySelector<HTMLButtonElement>('.editor-footer .secondary')!.click();
    await fixture.whenStable();
    await open('Capa 1 · Imagen base');
    expect(root().querySelector('.file-info')).toBeNull();
    expect(root().querySelector<HTMLInputElement>('input[value="82"]')?.checked).toBe(true);
    expect(upload).not.toHaveBeenCalled();
  });
  it('rejects unsupported and oversized files before reading or publishing', async () => {
    await open();
    await choose(new File(['svg'], 'x.svg', { type: 'image/svg+xml' }));
    expect(root().querySelector('[role=alert]')?.textContent).toContain('PNG, WebP o JPG');
    const file = new File(['x'], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 + 1 });
    await choose(file);
    expect(root().querySelector('[role=alert]')?.textContent).toContain('8 MB');
    expect(createImageBitmap).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });
  it('keeps a failed upload open for retry and prevents duplicate publication', async () => {
    let reject!: (error: Error) => void;
    upload.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    await open();
    await choose();
    const publish = root().querySelector<HTMLButtonElement>('.primary')!;
    publish.click();
    publish.click();
    await fixture.whenStable();
    expect(upload).toHaveBeenCalledOnce();
    const cancel = new Event('cancel', { cancelable: true });
    root().querySelector('dialog')!.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    reject(new Error('offline'));
    await fixture.whenStable();
    expect(root().querySelector('[role=alert]')?.textContent).toContain('No se pudo publicar');
    expect(root().querySelector<HTMLDialogElement>('dialog')?.open).toBe(true);
  });
  it('discards edits when the active scope changes', async () => {
    await open();
    await choose();
    context.set({ ...designer, scopeId: 'another-scope' });
    await fixture.whenStable();
    expect(root().querySelector<HTMLDialogElement>('dialog')?.open).toBe(false);
    expect(root().querySelector('.file-info')).toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });
  it('downloads the selected published layer under a distinct filename', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['webp'], { type: 'image/webp' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL() {
          return 'blob:download';
        }
        static override revokeObjectURL() {}
      },
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('cisus-portada-grabado.webp');
    });
    await openPanel();
    button('Descargar Capa 2 · Grabado').click();
    await fixture.whenStable();
    expect(download).toHaveBeenCalledWith({ kind: 'home', targetId: 'hero_carving' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(click).toHaveBeenCalledOnce();
  });

  it('closes the composition dialog with its visible close control', async () => {
    await openPanel();
    expect(root().querySelector<HTMLDialogElement>('dialog')!.open).toBe(true);
    button('Cerrar editor').click();
    await fixture.whenStable();
    expect(root().querySelector<HTMLDialogElement>('dialog')!.open).toBe(false);
  });

  it('discards a candidate when the selected product changes', async () => {
    fixture.componentRef.setInput('scopeKey', 'felino');
    await fixture.whenStable();
    await open();
    await choose();
    fixture.componentRef.setInput('scopeKey', 'delfin');
    await fixture.whenStable();
    expect(root().querySelector<HTMLDialogElement>('dialog')?.open).toBe(false);
    expect(root().querySelector('.file-info')).toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });

  it('publishes a thumbnail to its independent product destination', async () => {
    fixture.componentRef.setInput('entries', [
      {
        kind: 'product_thumbnail',
        targetId: 'delfin',
        url: null,
        label: 'Miniatura · Delfín',
        description: 'Selector',
        recommendation: '1:1 · 1200 × 1200 px',
      },
    ]);
    fixture.componentRef.setInput('scopeKey', 'delfin');
    await fixture.whenStable();
    await open('Miniatura · Delfín');
    await choose();
    expect(root().textContent).toContain('1:1');
    root().querySelector<HTMLButtonElement>('.primary')!.click();
    await fixture.whenStable();
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'product_thumbnail', targetId: 'delfin' }),
    );
  });

  it('publishes the exclusive related-card image through its dedicated product destination', async () => {
    fixture.componentRef.setInput('entries', [
      {
        kind: 'product_related',
        targetId: 'felino',
        url: null,
        label: 'Imagen exclusiva · Otras colecciones',
        description: 'Sube una imagen propia para las tarjetas',
      },
    ]);
    fixture.componentRef.setInput('relatedImage', { targetId: 'felino', source: 'auto' });
    await fixture.whenStable();
    await open('Imagen exclusiva · Otras colecciones');
    await choose();
    root().querySelector<HTMLButtonElement>('.primary')!.click();
    await fixture.whenStable();
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'product_related', targetId: 'felino' }),
    );
  });

  it('marks one published layer for related cards and leaves the exclusive upload available', async () => {
    fixture.componentRef.setInput('entries', [
      {
        kind: 'product_scene',
        targetId: 'felino',
        url: 'https://example.com/scene.webp',
        label: 'Capa 1 · Imagen base',
        description: 'Felino',
      },
      {
        kind: 'product_scene_2',
        targetId: 'felino',
        url: 'https://example.com/layer.webp',
        label: 'Capa 2',
        description: 'Superposición alineada',
      },
      {
        kind: 'product_related',
        targetId: 'felino',
        url: null,
        label: 'Imagen exclusiva · Otras colecciones',
        description: 'Sube una imagen propia para las tarjetas',
      },
      {
        kind: 'product',
        targetId: 'felino',
        url: 'https://example.com/catalog.webp',
        label: 'Foto de catálogo · Felino',
        description: 'Ficha',
      },
      {
        kind: 'product_thumbnail',
        targetId: 'felino',
        url: 'https://example.com/thumb.webp',
        label: 'Miniatura · Felino',
        description: 'Selector',
      },
    ]);
    fixture.componentRef.setInput('scopeKey', 'felino');
    fixture.componentRef.setInput('relatedImage', {
      targetId: 'felino',
      source: 'auto',
    });
    fixture.componentRef.setInput('sectionLabel', 'Producto · Felino');
    fixture.componentRef.setInput('allowLayers', true);
    await fixture.whenStable();
    await openPanel();
    expect(root().textContent).toContain('Referencia: lienzo de escena de 1600 × 989 px aprox.');
    expect(root().querySelector('.editor-tabs')).toBeNull();
    expect(root().querySelectorAll('.related-source-option')).toHaveLength(5);
    expect(root().textContent).toContain('Imagen exclusiva');
    expect(root().querySelector<HTMLInputElement>('input[type=radio][value="product_related"]')).toBeNull();
    expect(root().querySelector<HTMLImageElement>('.related-current img')?.src).toContain('scene.webp');
    expect(root().textContent).toContain('Foto de catálogo · Felino');
    expect(root().textContent).toContain('Miniatura · Felino');

    root().querySelector<HTMLInputElement>('input[type=radio][value="product_scene_2"]')!.click();
    await fixture.whenStable();
    expect(configureRelatedImage).toHaveBeenCalledWith({
      targetId: 'felino',
      relatedImageSource: 'product_scene_2',
    });
    expect(
      root().querySelector<HTMLInputElement>('input[type=radio][value="product_scene_2"]')!.checked,
    ).toBe(true);
    expect(root().querySelector<HTMLImageElement>('.related-current img')?.src).toContain('layer.webp');
    expect(upload).not.toHaveBeenCalled();
  });

  it('lets the designer open the exclusive image row when no source has been selected', async () => {
    fixture.componentRef.setInput('entries', [
      {
        kind: 'product_scene',
        targetId: 'felino',
        url: 'https://example.com/scene.webp',
        label: 'Capa 1 · Imagen base',
        description: 'Felino',
      },
      {
        kind: 'product_related',
        targetId: 'felino',
        url: null,
        label: 'Imagen exclusiva · Otras colecciones',
        description: 'Sube una imagen propia para las tarjetas',
      },
    ]);
    fixture.componentRef.setInput('scopeKey', 'felino');
    fixture.componentRef.setInput('relatedImage', {
      targetId: 'felino',
      source: 'product_thumbnail',
    });
    fixture.componentRef.setInput('allowLayers', true);
    await fixture.whenStable();
    await openPanel();
    expect(root().querySelector<HTMLInputElement>('input[type=radio][value="product_related"]')).toBeNull();
    expect(root().querySelector<HTMLInputElement>('input[type=radio][value="auto"]')?.checked).toBe(true);
    expect(button('Agregar imagen a Imagen exclusiva · Otras colecciones').disabled).toBe(false);
  });

  it('explains when the published media function does not recognize the selection', async () => {
    fixture.componentRef.setInput('entries', [
      {
        kind: 'product_scene',
        targetId: 'felino',
        url: 'https://example.com/scene.webp',
        label: 'Capa 1 · Imagen base',
        description: 'Felino',
      },
    ]);
    fixture.componentRef.setInput('relatedImage', { targetId: 'felino', source: 'auto' });
    fixture.componentRef.setInput('allowLayers', true);
    configureRelatedImage.mockRejectedValueOnce(
      Object.assign(new Error('invalid-argument'), { code: 'functions/invalid-argument' }),
    );
    await fixture.whenStable();
    await openPanel();
    root().querySelector<HTMLInputElement>('input[type=radio][value="product_scene"]')!.click();
    await fixture.whenStable();
    expect(root().textContent).toContain('La función de medios publicada aún no reconoce');
  });

  const openCustomization = async (url: string | null = null) => {
    fixture.componentRef.setInput('entries', [
      {
        kind: 'product_scene',
        targetId: 'felino',
        url: 'https://example.com/base.webp',
        label: 'Base',
        description: 'Base',
      },
      {
        kind: 'product_customization',
        targetId: 'felino',
        url,
        label: 'Personalización opcional',
        description: 'Personalización',
      },
    ]);
    fixture.componentRef.setInput('scopeKey', 'felino');
    fixture.componentRef.setInput('allowLayers', true);
    await fixture.whenStable();
    await open('Personalización opcional');
  };

  it('requires a name and overlay, saves the chosen product, and retries configuration without uploading twice', async () => {
    await openCustomization();
    const name = root().querySelector<HTMLInputElement>('input[type=text]')!;
    name.value = 'canaleta';
    name.dispatchEvent(new Event('input'));
    root().querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    await fixture.whenStable();
    expect(root().querySelector<HTMLButtonElement>('.primary')!.disabled).toBe(true);
    await choose();
    configure.mockRejectedValueOnce(new Error('offline'));
    root().querySelector<HTMLButtonElement>('.primary')!.click();
    await fixture.whenStable();
    expect(root().querySelector<HTMLDialogElement>('dialog')!.open).toBe(true);
    expect(root().querySelector('[role=alert]')?.textContent).toContain('No se pudo guardar');
    root().querySelector<HTMLButtonElement>('.primary')!.click();
    await fixture.whenStable();
    expect(upload).toHaveBeenCalledOnce();
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'product_customization', targetId: 'felino' }),
    );
    expect(configure).toHaveBeenLastCalledWith({
      targetId: 'felino',
      customization: { enabled: true, label: 'canaleta' },
    });
    expect(root().querySelector<HTMLDialogElement>('dialog')!.open).toBe(false);
  });

  it('can disable or rename a configured button without replacing its image or animating it', async () => {
    fixture.componentRef.setInput('customization', { enabled: true, label: 'canaleta' });
    await openCustomization('https://example.com/overlay.webp');
    expect(root().querySelector<HTMLSelectElement>('select[id$="-animation"]')).toBeNull();
    root().querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    await fixture.whenStable();
    root().querySelector<HTMLButtonElement>('.primary')!.click();
    await fixture.whenStable();
    expect(configure).toHaveBeenCalledWith({
      targetId: 'felino',
      customization: { enabled: false, label: 'canaleta' },
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it('does not apply a pending customization to a different product', async () => {
    let resolve!: (value: { media: { url: string; path: string } }) => void;
    upload.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    await openCustomization();
    await choose();
    root().querySelector<HTMLButtonElement>('.primary')!.click();
    await fixture.whenStable();
    fixture.componentRef.setInput('scopeKey', 'delfin');
    await fixture.whenStable();
    resolve({ media: { url: 'https://example.com/overlay.webp', path: 'overlay.webp' } });
    await fixture.whenStable();
    expect(configure).not.toHaveBeenCalled();
    expect(root().querySelector<HTMLDialogElement>('dialog')!.open).toBe(false);
  });
});
