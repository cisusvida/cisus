import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import type {
  CatalogProduct,
  MediaAnimationConfiguration,
  MediaAnimationLayerKey,
  ProductCustomization,
  PublicMediaKind,
} from '../../../../core/models/commerce';
import {
  HeroMediaEditor,
  type EditorMedia,
  type RelatedImageSettings,
} from '../hero-media-editor/hero-media-editor';
import type {
  ProductFamily,
  ProductModelReference,
  ProductType,
} from '../../../../core/models/portfolio-item';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { MarketingContent } from '../../../../core/services/marketing-content';

interface PortfolioProduct extends Omit<CatalogProduct, 'basePrice'> {
  basePrice: number | null;
}

interface AvailableProduct extends PortfolioProduct {
  portfolio: ProductModelReference;
}

interface AvailableProductType extends Omit<ProductType, 'models'> {
  models: AvailableProduct[];
}

interface AvailableProductFamily extends Omit<ProductFamily, 'types'> {
  types: AvailableProductType[];
}

interface ProductSelection {
  familyId: string;
  typeId: string;
  product: AvailableProduct;
  sceneUrl: string | null;
}

interface ProductDetail {
  product: PortfolioProduct;
  family: AvailableProductFamily | null;
}

type RelatedItem =
  | {
      kind: 'family';
      id: string;
      family: AvailableProductFamily;
      representative: AvailableProduct;
    }
  | { kind: 'product'; id: string; product: PortfolioProduct };

@Component({
  imports: [HeroMediaEditor],
  selector: 'app-portfolio',
  styleUrl: './portfolio.scss',
  templateUrl: './portfolio.html',
  host: {
    '(window:resize)': 'onResize()',
    '(document:pointerdown)': 'closeTypesOutside($event)',
    '(document:keydown.escape)': 'closeTypes(true)',
  },
})
export class Portfolio {
  private readonly content = inject(MarketingContent);
  private readonly commerce = inject(CommerceGateway);
  private readonly destroyRef = inject(DestroyRef);
  private readonly familyHeading = viewChild<ElementRef<HTMLHeadingElement>>('familyHeading');
  private readonly relatedViewport = viewChild<ElementRef<HTMLElement>>('relatedViewport');
  private readonly detailsDialog = viewChild<ElementRef<HTMLDialogElement>>('detailsDialog');
  private readonly typeSwitcher = viewChild<ElementRef<HTMLElement>>('typeSwitcher');
  private readonly moreTypes = viewChild<ElementRef<HTMLDetailsElement>>('moreTypes');
  protected readonly visibleTypeCount = signal(Number.MAX_SAFE_INTEGER);
  protected readonly overflowTypes = computed(() => this.types().slice(this.visibleTypeCount()));

  protected readonly products = signal<PortfolioProduct[]>([]);
  protected readonly replayEnabled = signal(true);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly selectionBusy = signal(false);
  protected readonly selection = signal<ProductSelection | null>(null);
  protected readonly previousSelection = signal<ProductSelection | null>(null);
  protected readonly announcement = signal('');
  protected readonly relatedPage = signal(0);
  protected readonly compactLayout = signal(false);
  protected readonly detail = signal<ProductDetail | null>(null);
  private detailTrigger: HTMLElement | null = null;
  private readonly lastSelections = new Map<string, { typeId: string; productId: string }>();
  private drag: { pointerId: number; startX: number; scrollLeft: number; moved: boolean } | null =
    null;
  private suppressCardClick = false;
  private relatedWheelGesture: { time: number; direction: number } | null = null;
  private resizeFrame: number | undefined;
  private readonly failedImages = signal<ReadonlySet<string>>(new Set());
  private readonly imagePreloads = new Map<string, Promise<boolean>>();
  private requestVersion = 0;
  private selectionVersion = 0;
  private transitionTimer: ReturnType<typeof setTimeout> | undefined;
  private mediaQuery: MediaQueryList | undefined;

  protected readonly families = computed<AvailableProductFamily[]>(() => {
    const products = new Map(this.products().map((product) => [product.id, product]));
    return this.content.productFamilies.flatMap<AvailableProductFamily>((family) => {
      const types = family.types.flatMap<AvailableProductType>((type) => {
        const models = type.models.flatMap<AvailableProduct>((reference) => {
          const product = products.get(reference.productId);
          return product ? [{ ...product, portfolio: reference }] : [];
        });
        return models.length ? [{ ...type, models }] : [];
      });
      return types.length ? [{ ...family, types }] : [];
    });
  });
  protected readonly family = computed(() => {
    const currentFamilyId = this.selection()?.familyId;
    return this.families().find(({ id }) => id === currentFamilyId) ?? this.families()[0];
  });
  protected readonly types = computed(() => this.family()?.types ?? []);
  protected readonly type = computed(() => {
    const currentTypeId = this.selection()?.typeId;
    return this.types().find(({ id }) => id === currentTypeId) ?? this.types()[0];
  });
  protected readonly models = computed(() => this.type()?.models ?? []);
  protected readonly active = computed(() => this.selection()?.product ?? this.models()[0]);
  protected readonly activeSceneUrl = computed(() => this.selection()?.sceneUrl ?? null);
  protected readonly customizationActive = linkedSignal({
    source: () => this.active()?.id,
    computation: () => false,
  });
  protected readonly customizationAvailable = computed(() => {
    const product = this.active();
    return !!(
      product?.customization?.enabled &&
      product.customization.label.trim() &&
      product.sceneImageUrl &&
      this.activeSceneUrl() === product.sceneImageUrl &&
      product.customizationImageUrl
    );
  });
  protected toggleCustomization(): void {
    if (!this.customizationAvailable()) return;
    const url = this.active()?.customizationImageUrl;
    if (url)
      this.failedImages.update((failed) => new Set([...failed].filter((item) => item !== url)));
    this.customizationActive.update((active) => !active);
  }
  protected customizationFailed(url: string): void {
    this.imageFailed(url);
    this.customizationActive.set(false);
    this.announcement.set('No se pudo cargar la personalización. Pulsa el botón para reintentar.');
  }
  protected readonly editorLayers = computed<EditorMedia[]>(() => {
    const product = this.active();
    if (!product) return [];
    return [
      {
        kind: 'product_scene',
        targetId: product.id,
        url: product.sceneImageUrl ?? null,
        label: 'Capa 1 · Imagen base',
        description: product.name,
      },
      {
        kind: 'product_related',
        targetId: product.id,
        url: product.relatedImageUrl ?? null,
        label: 'Imagen exclusiva · Otras colecciones',
        description: 'Sube una imagen propia para las tarjetas',
      },
      {
        kind: 'product',
        targetId: product.id,
        url: product.imageUrl ?? null,
        label: `Foto de catálogo · ${product.name}`,
        description: 'Fotografía usada en la ficha del producto',
      },
      ...(product.sceneLayers ?? []).map((layer, index) => ({
        ...layer,
        label: `Capa ${index + 2}`,
        description: 'Superposición alineada',
      })),
      {
        kind: 'product_customization',
        targetId: product.id,
        url: product.customizationImageUrl ?? null,
        label: 'Personalización opcional',
        description: 'Nombre del botón e imagen superpuesta de este producto',
      },
      {
        kind: 'product_thumbnail',
        targetId: product.id,
        url: product.thumbnailImageUrl ?? null,
        label: `Miniatura · ${product.name}`,
        description: 'Solo cambia el selector de modelos',
        recommendation:
          'Recomendado 1:1 · 1200 × 1200 px. Pieza completa centrada; no modifica la escena ni la foto de catálogo.',
      },
    ];
  });
  protected readonly relatedImageSettings = computed<RelatedImageSettings | null>(() => {
    const product = this.active();
    if (!product) return null;
    return {
      targetId: product.id,
      source: product.relatedImageSource ?? 'auto',
    };
  });

  protected mediaPublished(event: {
    kind: PublicMediaKind;
    targetId: string;
    url: string;
    path: string;
  }): void {
    const patch = (product: PortfolioProduct): PortfolioProduct => {
      if (product.id !== event.targetId) return product;
      if (event.kind === 'product_thumbnail')
        return { ...product, thumbnailImageUrl: event.url, thumbnailImagePath: event.path };
      if (event.kind === 'product_related')
        return {
          ...product,
          relatedImageUrl: event.url,
          relatedImagePath: event.path,
          relatedImageSource: 'product_related',
        };
      if (event.kind === 'product')
        return { ...product, imageUrl: event.url, imagePath: event.path };
      if (event.kind === 'product_scene')
        return { ...product, sceneImageUrl: event.url, sceneImagePath: event.path };
      if (event.kind === 'product_customization')
        return { ...product, customizationImageUrl: event.url, customizationImagePath: event.path };
      return {
        ...product,
        sceneLayers: [
          ...(product.sceneLayers ?? []).filter((layer) => layer.kind !== event.kind),
          event,
        ].sort((a, b) => a.kind.localeCompare(b.kind)),
      };
    };
    this.products.update((products) => products.map(patch));
    this.selection.update((selection) =>
      selection && selection.product.id === event.targetId
        ? {
            ...selection,
            product: { ...patch(selection.product), portfolio: selection.product.portfolio },
            sceneUrl: event.kind === 'product_scene' ? event.url : selection.sceneUrl,
          }
        : selection,
    );
  }

  protected animationChanged(config: MediaAnimationConfiguration): void {
    const id = this.active()?.id;
    this.products.update((products) =>
      products.map((product) =>
        product.id === id
          ? {
              ...product,
              sceneAnimation: config.animation,
              sceneAnimationLayerKeys: config.animationLayerKeys,
            }
          : product,
      ),
    );
    this.selection.update((selection) =>
      selection
        ? {
            ...selection,
            product: {
              ...selection.product,
              sceneAnimation: config.animation,
              sceneAnimationLayerKeys: config.animationLayerKeys,
            },
          }
        : null,
    );
  }

  protected animatedLayer(kind: string): boolean {
    return !!this.active()?.sceneAnimationLayerKeys?.includes(kind as MediaAnimationLayerKey);
  }

  protected replayAnimation(): void {
    this.replayEnabled.set(false);
    requestAnimationFrame(() => this.replayEnabled.set(true));
  }

  protected customizationChanged(event: {
    targetId: string;
    customization: ProductCustomization;
  }): void {
    this.products.update((products) =>
      products.map((product) =>
        product.id === event.targetId
          ? { ...product, customization: event.customization }
          : product,
      ),
    );
    this.selection.update((selection) =>
      selection?.product.id === event.targetId
        ? { ...selection, product: { ...selection.product, customization: event.customization } }
        : selection,
    );
    if (this.active()?.id === event.targetId) this.customizationActive.set(false);
  }

  protected measureTypes(): void {
    const row = this.typeSwitcher()?.nativeElement;
    if (!row?.clientWidth) return;
    const buttons = [...row.querySelectorAll<HTMLElement>(':scope > .type-option')];
    const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
    const widths = buttons.map((button) => button.getBoundingClientRect().width);
    const total =
      widths.reduce((sum, width) => sum + width, 0) + Math.max(0, widths.length - 1) * gap;
    let count = widths.length;
    if (total > row.clientWidth) {
      let used = 44;
      count = 0;
      for (const width of widths) {
        if (used + gap + width > row.clientWidth) break;
        used += gap + width;
        count++;
      }
    }
    this.visibleTypeCount.set(count);
  }

  protected closeTypes(restoreFocus = false): void {
    const details = this.moreTypes()?.nativeElement;
    if (!details?.open) return;
    details.open = false;
    if (restoreFocus) details.querySelector('summary')?.focus();
  }

  protected closeTypesOutside(event: PointerEvent): void {
    if (!this.moreTypes()?.nativeElement.contains(event.target as Node)) this.closeTypes();
  }

  protected selectOverflowType(typeId: string): void {
    this.closeTypes(true);
    void this.selectType(typeId);
  }

  protected thumbnailUrl(product: PortfolioProduct): string | null {
    return this.availableImageUrl(
      product.thumbnailImageUrl,
      product.sceneImageUrl,
      product.imageUrl,
    );
  }
  protected readonly activeSceneFit = computed(
    () => this.active()?.portfolio.sceneObjectFit ?? 'contain',
  );
  protected readonly activeScenePosition = computed(
    () => this.active()?.portfolio.sceneObjectPosition ?? '50% 50%',
  );
  protected readonly activeDescription = computed(() => {
    const product = this.active();
    if (!product) return '';
    return product.shortDescription || product.description;
  });
  protected readonly activeMetadata = computed(() => {
    const product = this.active();
    if (!product) return '';
    if (product.portfolio.metadata) return product.portfolio.metadata;
    const typeLabel = this.type()?.id === 'relieve' ? 'Tabla con relieve' : 'Tabla conceptual';
    return `${typeLabel} · ${product.materialLabel || 'Madera'}`;
  });
  protected readonly familyClaim = computed(() => this.family()?.claim ?? '');
  protected readonly conceptFamily = computed(
    () => this.family()?.commercialState === 'design_concept',
  );
  protected readonly detailProduct = computed(() => this.detail()?.product ?? null);
  protected readonly detailIsConcept = computed(
    () => this.detail()?.family?.commercialState === 'design_concept',
  );
  protected readonly companionProducts = computed(() => {
    const products = new Map(this.products().map((product) => [product.id, product]));
    return this.content.portfolioCompanionProductIds.flatMap((id) => {
      const product = products.get(id);
      return product ? [product] : [];
    });
  });
  protected readonly alternativeFamilies = computed(() => {
    const activeFamilyId = this.family()?.id;
    return this.families().filter(({ id }) => id !== activeFamilyId);
  });
  protected readonly relatedItems = computed<RelatedItem[]>(() => [
    ...this.alternativeFamilies().flatMap<RelatedItem>((family) => {
      const representative = family.types[0]?.models[0];
      return representative
        ? [{ kind: 'family', id: `family:${family.id}`, family, representative }]
        : [];
    }),
    ...this.companionProducts().map<RelatedItem>((product) => ({
      kind: 'product',
      id: `product:${product.id}`,
      product,
    })),
  ]);
  protected readonly relatedPageCount = computed(() =>
    Math.max(1, Math.ceil(this.relatedItems().length / 2)),
  );
  protected readonly relatedPages = computed(() =>
    Array.from({ length: this.relatedPageCount() }, (_, index) => index),
  );

  constructor() {
    effect((onCleanup) => {
      const row = this.typeSwitcher()?.nativeElement;
      this.types();
      if (!row) return;
      const frame = requestAnimationFrame(() => this.measureTypes());
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(() => this.measureTypes());
      observer?.observe(row);
      row.querySelectorAll(':scope > .type-option').forEach((button) => observer?.observe(button));
      onCleanup(() => {
        cancelAnimationFrame(frame);
        observer?.disconnect();
      });
    });
    effect((onCleanup) => {
      const viewport = this.relatedViewport()?.nativeElement;
      viewport?.addEventListener('wheel', this.onRelatedWheel, { passive: false });
      onCleanup(() => viewport?.removeEventListener('wheel', this.onRelatedWheel));
    });
    this.configureMediaQuery();
    this.destroyRef.onDestroy(() => {
      if (this.transitionTimer) clearTimeout(this.transitionTimer);
      if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
      this.mediaQuery?.removeEventListener('change', this.onMediaQueryChange);
    });
    void this.load();
  }

  protected async load(): Promise<void> {
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.error.set('');
    try {
      const products = await this.commerce.listPublicProducts();
      if (this.destroyRef.destroyed || version !== this.requestVersion) return;
      this.failedImages.set(new Set());
      this.products.set(products);
      this.lastSelections.clear();
      const firstFamily = this.families()[0];
      const firstType = firstFamily?.types[0];
      const firstProduct = firstType?.models[0];
      const sceneUrl = firstProduct ? await this.prepareScene(firstProduct) : null;
      if (this.destroyRef.destroyed || version !== this.requestVersion) return;
      this.selection.set(
        firstFamily && firstType && firstProduct
          ? { familyId: firstFamily.id, typeId: firstType.id, product: firstProduct, sceneUrl }
          : null,
      );
      if (firstFamily && firstType && firstProduct) {
        this.rememberSelection(firstFamily.id, firstType.id, firstProduct.id);
      }
      this.relatedPage.set(0);
      this.preloadNextScene();
    } catch {
      if (this.destroyRef.destroyed || version !== this.requestVersion) return;
      this.error.set('No pudimos cargar los productos. Inténtalo de nuevo.');
    } finally {
      if (!this.destroyRef.destroyed && version === this.requestVersion) this.loading.set(false);
    }
  }

  protected async selectFamily(familyId: string): Promise<void> {
    const family = this.families().find(({ id }) => id === familyId);
    if (!family) return;
    const remembered = this.lastSelections.get(family.id);
    const rememberedType = family.types.find(({ id }) => id === remembered?.typeId);
    const rememberedProduct = rememberedType?.models.find(({ id }) => id === remembered?.productId);
    const type = rememberedProduct ? rememberedType : family.types[0];
    const product = rememberedProduct ?? type?.models[0];
    if (!type || !product) return;
    await this.activate(family.id, type.id, product);
    this.relatedPage.set(0);
    this.announcement.set(`${family.label}. ${product.name} seleccionado.`);
    if (this.compactLayout()) {
      queueMicrotask(() => {
        const heading = this.familyHeading()?.nativeElement;
        heading?.focus({ preventScroll: true });
        heading?.scrollIntoView?.({ block: 'start', behavior: this.motion() });
      });
    }
  }

  protected async selectType(typeId: string): Promise<void> {
    const type = this.types().find(({ id }) => id === typeId);
    const product = type?.models[0];
    const family = this.family();
    if (!family || !type || !product) return;
    await this.activate(family.id, type.id, product);
  }

  protected async selectModel(product: AvailableProduct): Promise<void> {
    const family = this.family();
    const type = this.type();
    if (!family || !type) return;
    await this.activate(family.id, type.id, product);
  }

  protected imageUrl(product: PortfolioProduct): string | null {
    return product.imageUrl && !this.failedImages().has(product.imageUrl) ? product.imageUrl : null;
  }

  protected editorialImageUrl(product: PortfolioProduct): string | null {
    const automatic = (): string | null =>
      this.availableImageUrl(product.sceneImageUrl, product.imageUrl);
    const source = product.relatedImageSource;
    const preferred =
      source === 'product_scene'
        ? this.availableImageUrl(product.sceneImageUrl)
        : source === 'product'
          ? this.availableImageUrl(product.imageUrl)
          : source === 'product_thumbnail'
            ? this.availableImageUrl(product.thumbnailImageUrl)
            : source === 'product_customization'
              ? this.availableImageUrl(product.customizationImageUrl)
              : source === 'product_related'
                ? this.availableImageUrl(product.relatedImageUrl)
                : source?.startsWith('product_scene_')
                  ? this.availableImageUrl(
                      product.sceneLayers?.find((layer) => layer.kind === source)?.url ?? null,
                    )
                  : null;
    return preferred ?? automatic();
  }

  protected imageFailed(url: string): void {
    this.failedImages.update((failed) => new Set([...failed, url]));
  }

  protected async sceneFailed(url: string): Promise<void> {
    this.imageFailed(url);
    this.imagePreloads.delete(url);
    const current = this.selection();
    if (!current || current.sceneUrl !== url) return;
    const version = ++this.selectionVersion;
    this.selectionBusy.set(true);
    const fallback = await this.prepareScene(current.product);
    if (this.destroyRef.destroyed || version !== this.selectionVersion) return;
    this.selection.update((selection) => (selection ? { ...selection, sceneUrl: fallback } : null));
    this.selectionBusy.set(false);
  }

  protected companionDescription(product: PortfolioProduct): string {
    return product.shortDescription || product.description;
  }

  protected customizationButtonLabel(): string {
    const label = this.active()?.customization?.label.trim() ?? '';
    return label ? label.charAt(0).toLocaleUpperCase('es-CL') + label.slice(1) : '';
  }

  protected relatedImageChanged(event: {
    targetId: string;
    relatedImageSource: NonNullable<PortfolioProduct['relatedImageSource']>;
  }): void {
    this.products.update((products) =>
      products.map((product) =>
        product.id === event.targetId
          ? { ...product, relatedImageSource: event.relatedImageSource }
          : product,
      ),
    );
    this.selection.update((selection) =>
      selection?.product.id === event.targetId
        ? {
            ...selection,
            product: { ...selection.product, relatedImageSource: event.relatedImageSource },
          }
        : selection,
    );
  }

  protected openDetails(product: PortfolioProduct, event: Event): void {
    this.detailTrigger = event.currentTarget as HTMLElement;
    this.detail.set({ product, family: this.familyForProduct(product.id) });
    this.detailsDialog()?.nativeElement.showModal();
  }

  protected closeDetails(): void {
    this.detailsDialog()?.nativeElement.close();
    this.detail.set(null);
    this.detailTrigger?.focus({ preventScroll: true });
  }

  protected price(product: PortfolioProduct): string {
    if (product.basePrice === null) return '';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: product.currency,
      maximumFractionDigits: 0,
    }).format(product.basePrice);
  }

  protected inquiryHref(product: PortfolioProduct): string {
    const subject = `Consulta Cisus — ${product.name}`;
    const body = `Hola, me interesa el modelo ${product.name}.\nCantidad aproximada:\nMueble o uso previsto:\nComuna:\n`;
    return `mailto:hola@cisus.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  protected async retryActiveScene(): Promise<void> {
    const current = this.selection();
    if (!current) return;
    this.clearProductFailures(current.product);
    await this.activate(current.familyId, current.typeId, current.product);
  }

  protected async modelKey(event: KeyboardEvent, product: AvailableProduct): Promise<void> {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const models = this.models();
    const currentIndex = models.findIndex(({ id }) => id === product.id);
    if (currentIndex < 0) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = models[(currentIndex + step + models.length) % models.length];
    const container = (event.currentTarget as HTMLElement).parentElement;
    const target = container?.querySelector<HTMLElement>(`[data-model-id="${next.id}"]`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    await this.selectModel(next);
  }

  private pageStride(viewport: HTMLElement): number {
    const cards = viewport.querySelectorAll<HTMLElement>('.related-card');
    const first = cards[0];
    const nextPage = cards[2];
    return first && nextPage ? nextPage.offsetLeft - first.offsetLeft : viewport.clientWidth;
  }

  private motion(): ScrollBehavior {
    return typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
  }

  protected goToRelatedPage(page: number): void {
    const nextPage = Math.min(Math.max(page, 0), this.relatedPageCount() - 1);
    this.relatedPage.set(nextPage);
    const viewport = this.relatedViewport()?.nativeElement;
    if (!viewport) return;
    viewport.scrollTo({ left: nextPage * this.pageStride(viewport), behavior: this.motion() });
  }

  protected onRelatedScroll(event: Event): void {
    const viewport = event.currentTarget as HTMLElement;
    const stride = this.pageStride(viewport);
    const page = stride ? Math.round(viewport.scrollLeft / stride) : 0;
    this.relatedPage.set(Math.max(0, Math.min(page, this.relatedPageCount() - 1)));
  }

  protected startRelatedDrag(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const viewport = event.currentTarget as HTMLElement;
    this.suppressCardClick = false;
    this.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: viewport.scrollLeft,
      moved: false,
    };
  }

  protected moveRelatedDrag(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 6) return;
    const viewport = event.currentTarget as HTMLElement;
    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    viewport.scrollLeft = drag.scrollLeft - delta;
    event.preventDefault();
  }

  protected endRelatedDrag(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const viewport = event.currentTarget as HTMLElement;
    this.suppressCardClick = this.drag.moved;
    this.drag = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId))
      viewport.releasePointerCapture(event.pointerId);
  }

  protected openRelated(product: PortfolioProduct, event: Event): void {
    if (this.suppressCardClick) {
      this.suppressCardClick = false;
      return;
    }
    this.openDetails(product, event);
  }

  protected async selectRelatedFamily(familyId: string): Promise<void> {
    if (this.suppressCardClick) {
      this.suppressCardClick = false;
      return;
    }
    await this.selectFamily(familyId);
  }

  protected relatedKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    this.goToRelatedPage(this.relatedPage() + (event.key === 'ArrowRight' ? 1 : -1));
  }

  protected onResize(): void {
    this.syncCompactLayout();
    const page = Math.min(this.relatedPage(), this.relatedPageCount() - 1);
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.measureTypes();
      const viewport = this.relatedViewport()?.nativeElement;
      if (viewport)
        viewport.scrollTo({ left: page * this.pageStride(viewport), behavior: 'instant' });
      this.relatedPage.set(page);
    });
  }

  private readonly onRelatedWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    const viewport = event.currentTarget as HTMLElement;
    const delta = event.deltaX;
    const atStart = viewport.scrollLeft <= 1;
    const atEnd = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
    if ((delta < 0 && atStart) || (delta > 0 && atEnd) || !delta) return;
    event.preventDefault();
    const direction = Math.sign(delta);
    const sameGesture =
      this.relatedWheelGesture?.direction === direction &&
      event.timeStamp - this.relatedWheelGesture.time < 220;
    this.relatedWheelGesture = { time: event.timeStamp, direction };
    if (sameGesture) return;

    // Treat the wheel's inertia as one gesture, advancing only to the adjacent column/card.
    const cards = [...viewport.querySelectorAll<HTMLElement>('.related-card')];
    if (direction < 0) cards.reverse();
    const nextCard = cards.find((card) => (card.offsetLeft - viewport.scrollLeft) * direction > 1);
    const left =
      nextCard?.offsetLeft ?? (direction > 0 ? viewport.scrollWidth - viewport.clientWidth : 0);
    viewport.scrollTo({ left, behavior: this.motion() });
  };

  private readonly onMediaQueryChange = (): void => this.syncCompactLayout();

  private configureMediaQuery(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    this.mediaQuery = window.matchMedia('(max-width: 899px)');
    this.syncCompactLayout();
    this.mediaQuery.addEventListener('change', this.onMediaQueryChange);
  }

  private syncCompactLayout(): void {
    this.compactLayout.set(this.mediaQuery?.matches ?? false);
  }

  private async activate(
    familyId: string,
    typeId: string,
    product: AvailableProduct,
  ): Promise<void> {
    const version = ++this.selectionVersion;
    this.clearProductFailures(product);
    this.selectionBusy.set(true);
    const sceneUrl = await this.prepareScene(product);
    if (this.destroyRef.destroyed || version !== this.selectionVersion) return;

    const current = this.selection();
    if (current?.product.id !== product.id || current.sceneUrl !== sceneUrl) {
      this.previousSelection.set(current?.sceneUrl ? current : null);
      this.selection.set({ familyId, typeId, product, sceneUrl });
      this.rememberSelection(familyId, typeId, product.id);
      this.announcement.set(`${product.name} seleccionado.`);
      this.schedulePreviousSceneRemoval();
    }
    this.selectionBusy.set(false);
    this.preloadNextScene();
  }

  private clearProductFailures(product: PortfolioProduct): void {
    const urls = new Set(
      [product.sceneImageUrl, product.imageUrl].filter((url): url is string => Boolean(url)),
    );
    if (!urls.size) return;
    this.failedImages.update((failed) => new Set([...failed].filter((url) => !urls.has(url))));
  }

  private async prepareScene(product: PortfolioProduct): Promise<string | null> {
    for (const url of [product.sceneImageUrl, product.imageUrl]) {
      if (!url || this.failedImages().has(url)) continue;
      if (await this.preload(url)) return url;
      this.imageFailed(url);
    }
    return null;
  }

  private availableImageUrl(...urls: Array<string | null | undefined>): string | null {
    return (
      urls.find((url): url is string => typeof url === 'string' && !this.failedImages().has(url)) ??
      null
    );
  }

  private preload(url: string): Promise<boolean> {
    if (typeof Image === 'undefined') return Promise.resolve(true);
    const existing = this.imagePreloads.get(url);
    if (existing) return existing;
    const pending = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = url;
    }).then((loaded) => {
      if (!loaded) this.imagePreloads.delete(url);
      return loaded;
    });
    this.imagePreloads.set(url, pending);
    return pending;
  }

  private preloadNextScene(): void {
    const ordered = this.types().flatMap(({ models }) => models);
    const currentIndex = ordered.findIndex(({ id }) => id === this.active()?.id);
    const next = ordered[currentIndex + 1] ?? ordered[0];
    const url = next ? this.availableImageUrl(next.sceneImageUrl, next.imageUrl) : null;
    if (url) void this.preload(url);
  }

  private rememberSelection(familyId: string, typeId: string, productId: string): void {
    this.lastSelections.set(familyId, { typeId, productId });
  }

  private familyForProduct(productId: string): AvailableProductFamily | null {
    return (
      this.families().find((family) =>
        family.types.some((type) => type.models.some(({ id }) => id === productId)),
      ) ?? null
    );
  }

  private schedulePreviousSceneRemoval(): void {
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
    this.transitionTimer = setTimeout(() => this.previousSelection.set(null), 360);
  }
}
