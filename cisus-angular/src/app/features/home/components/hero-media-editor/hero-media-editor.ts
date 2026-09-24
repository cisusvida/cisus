import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Auth } from '../../../../core/services/auth';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import type {
  MediaAnimation,
  MediaAnimationConfiguration,
  MediaAnimationLayerKey,
  MediaLayer,
  ProductCustomization,
  PublicMediaKind,
  RelatedImageSource,
} from '../../../../core/models/commerce';

type HeroTarget = string;
export interface EditorMedia extends MediaLayer {
  label: string;
  description: string;
  recommendation?: string;
}
export interface RelatedImageSettings {
  targetId: string;
  source: RelatedImageSource;
}
type HeroLayer = EditorMedia;
let editorInstance = 0;
type WebpQuality = 82 | 76 | 68;
const MAX_BYTES = 8 * 1024 * 1024;

function isRelatedImageSource(value: unknown): value is RelatedImageSource {
  return (
    value === 'auto' ||
    value === 'product' ||
    value === 'product_scene' ||
    value === 'product_thumbnail' ||
    value === 'product_customization' ||
    value === 'product_related' ||
    (typeof value === 'string' && /^product_scene_[2-6]$/.test(value))
  );
}

function mediaCallError(error: unknown, fallback: string): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  if (code === 'functions/invalid-argument')
    return 'La función de medios publicada aún no reconoce esta opción. Hay que actualizar el backend para guardarla.';
  if (code === 'functions/permission-denied' || code === 'functions/unauthenticated')
    return 'Tu sesión o perfil actual no tiene permiso para cambiar esta imagen.';
  return fallback;
}

@Component({
  imports: [],
  selector: 'app-hero-media-editor',
  styleUrl: './hero-media-editor.scss',
  templateUrl: './hero-media-editor.html',
})
export class HeroMediaEditor {
  readonly baseUrl = input<string | null>(null);
  readonly carvingUrl = input<string | null>(null);
  readonly entries = input<EditorMedia[] | null>(null);
  readonly sectionLabel = input('Portada');
  readonly scopeKey = input('hero');
  readonly allowLayers = input(false);
  readonly animation = input<MediaAnimation>('none');
  readonly animationLayerKeys = input<MediaAnimationLayerKey[]>([]);
  readonly customization = input<ProductCustomization>({ enabled: false, label: '' });
  readonly relatedImage = input<RelatedImageSettings | null>(null);
  readonly customizationChanged = output<{
    targetId: string;
    customization: ProductCustomization;
  }>();
  readonly animationChanged = output<MediaAnimationConfiguration>();
  readonly replayRequested = output<void>();
  readonly relatedImageChanged = output<{
    targetId: string;
    relatedImageSource: RelatedImageSource;
  }>();
  readonly published = output<{
    kind: PublicMediaKind;
    targetId: string;
    url: string;
    path: string;
  }>();
  protected readonly instanceId = `media-editor-${++editorInstance}`;
  private readonly dialogBody = viewChild<ElementRef<HTMLElement>>('dialogBody');
  protected readonly baseDimensions = signal<{ width: number; height: number } | null>(null);
  private readonly auth = inject(Auth);
  private readonly commerce = inject(CommerceGateway);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('editorDialog');
  private readonly destroyRef = inject(DestroyRef);
  protected readonly view = signal<'composition' | 'archive'>('composition');
  protected readonly archiveEditing = signal(false);
  protected readonly animationState = signal<MediaAnimationConfiguration>({
    animation: 'none',
    animationLayerKeys: [],
  });
  protected readonly animateBaseWithOverlay = signal(false);
  private savedBodyScrollTop = 0;
  protected returnView: 'composition' | 'archive' = 'composition';
  protected readonly publishing = signal(false);
  protected readonly canEdit = computed(() => {
    const context = this.auth.activeContext();
    return (
      context?.scopeLevel === 'company' &&
      ['cisus_designer', 'platform_admin', 'cisus_commercial_admin', 'cisus_operations'].includes(
        context.jobRoleId,
      ) &&
      context.permissions.includes('public_media.manage')
    );
  });
  protected readonly layers = computed<HeroLayer[]>(
    () =>
      this.entries() ?? [
        {
          targetId: 'hero',
          kind: 'home',
          label: 'Capa 1 · Imagen base',
          description: 'Composición principal',
          url: this.baseUrl(),
        },
        {
          targetId: 'hero_carving',
          kind: 'home',
          label: 'Capa 2 · Grabado',
          description: 'Superposición transparente animada',
          url: this.carvingUrl(),
        },
      ],
  );
  protected readonly isProductEditor = computed(() =>
    this.layers().some((layer) => layer.kind === 'product' || layer.kind.startsWith('product_')),
  );
  protected readonly isCoverEditor = computed(
    () => !this.isProductEditor() && this.sectionLabel() === 'Portada',
  );
  protected readonly productName = computed(() =>
    this.sectionLabel().startsWith('Producto · ')
      ? this.sectionLabel().slice('Producto · '.length)
      : this.layers()[0]?.targetId ?? 'producto',
  );
  private readonly relatedImageSelection = signal<RelatedImageSource | null>(null);
  protected readonly relatedImageSource = computed(() => {
    const source = this.relatedImageSelection() ?? this.relatedImage()?.source;
    if (!isRelatedImageSource(source)) return 'auto';
    return source === 'auto' || this.relatedImageChoices().some((layer) => layer.kind === source)
      ? source
      : 'auto';
  });
  protected readonly relatedImageChoices = computed(() =>
    this.layers().filter((layer) => !!layer.url && this.relatedSourceFor(layer) !== null),
  );
  protected relatedSourceFor(layer: HeroLayer): RelatedImageSource | null {
    return isRelatedImageSource(layer.kind) ? layer.kind : null;
  }
  protected readonly sceneLayers = computed(() =>
    this.layers().filter((layer) => this.isCompositionLayer(layer)),
  );
  protected readonly compositionLayers = computed(() => [...this.sceneLayers()].reverse());
  protected readonly archiveLayers = computed(() => this.layers());
  protected readonly productResourceLayers = computed(() =>
    this.layers().filter(
      (layer) => !this.isCompositionLayer(layer) && layer.kind !== 'product_customization',
    ),
  );
  protected readonly productCustomizationLayer = computed(() =>
    this.layers().find((layer) => layer.kind === 'product_customization') ?? null,
  );
  protected readonly relatedImagePreview = computed(() => {
    const source = this.relatedImageSource();
    if (source !== 'auto') return this.layers().find((layer) => layer.kind === source && !!layer.url) ?? null;
    return this.layers().find((layer) => layer.kind === 'product_scene' && !!layer.url) ??
      this.layers().find((layer) => layer.kind === 'product' && !!layer.url) ?? null;
  });
  protected readonly sceneAspectRatio = computed(() => {
    const size = this.baseDimensions();
    return size ? `${size.width} / ${size.height}` : '1600 / 989';
  });
  protected readonly hasPublishedSceneLayer = computed(() =>
    this.sceneLayers().some((layer) => !!layer.url),
  );
  protected readonly primaryAnimationLayerKey = computed(() => {
    const keys = this.animationState().animationLayerKeys;
    const baseKey = this.baseAnimationKey();
    return keys.find((key) => key !== baseKey) ?? keys[0] ?? null;
  });
  protected readonly hasPublishedAnimationLayer = computed(() => {
    const keys = this.animationState().animationLayerKeys;
    return keys.length > 0 && keys.every((key) =>
      this.sceneLayers().some((layer) => this.animationLayerKey(layer) === key && !!layer.url),
    );
  });
  protected readonly canAnimate = computed(
    () =>
      this.allowLayers() &&
      this.hasPublishedAnimationLayer(),
  );
  protected isCompositionLayer(layer: EditorMedia): boolean {
    return layer.kind === 'home'
      ? layer.targetId === 'hero' ||
          layer.targetId === 'hero_carving' ||
          /^hero_layer_[3-6]$/.test(layer.targetId)
      : layer.kind === 'product_scene' || /^product_scene_[2-6]$/.test(layer.kind);
  }
  protected animationLayerKey(layer: EditorMedia): MediaAnimationLayerKey {
    return layer.kind === 'home' ? (layer.targetId as MediaAnimationLayerKey) : layer.kind as MediaAnimationLayerKey;
  }
  protected isBaseLayer(layer: EditorMedia): boolean {
    return layer.kind === 'home' ? layer.targetId === 'hero' : layer.kind === 'product_scene';
  }
  protected baseAnimationKey(): MediaAnimationLayerKey {
    const base = this.sceneLayers().find((layer) => this.isBaseLayer(layer));
    if (base) return this.animationLayerKey(base);
    return this.sectionLabel().startsWith('Producto · ') ? 'product_scene' : 'hero';
  }
  protected animationLayerId(layer: EditorMedia): string {
    return `${this.instanceId}-animation-${this.animationLayerKey(layer).replace(/_/g, '-')}`;
  }
  protected dialogTitle(): string {
    if (this.view() === 'archive' && this.selected())
      return this.isProductEditor()
        ? `${this.selected()!.label} · ${this.productName()}`
        : `Archivo · ${this.selected()!.label}`;
    if (this.isProductEditor()) return `Editar imágenes de ${this.productName()}`;
    return this.isCoverEditor() ? 'Editar portada' : `Editar imágenes · ${this.sectionLabel()}`;
  }
  protected dialogDescription(): string {
    if (this.view() === 'archive')
      return 'Selecciona un archivo, revisa la optimización y publícalo cuando esté listo.';
    if (this.isProductEditor())
      return 'Gestiona la escena, las imágenes de catálogo y tarjetas y la personalización.';
    return this.isCoverEditor()
      ? 'Organiza las capas y configura su animación.'
      : 'Administra las imágenes de esta sección.';
  }
  protected compositionLabel(layer: EditorMedia): string {
    if (this.isBaseLayer(layer)) return 'Imagen base';
    const position = this.sceneLayers().indexOf(layer);
    return `Superposición ${Math.max(1, position)}`;
  }
  protected compositionPosition(layer: EditorMedia): string {
    return `Posición ${this.sceneLayers().indexOf(layer) + 1}`;
  }
  protected isAnimationDestination(layer: EditorMedia): boolean {
    return this.animationState().animationLayerKeys.includes(this.animationLayerKey(layer));
  }
  protected animationRowStatus(layer: EditorMedia): string {
    if (!this.isAnimationDestination(layer)) return '';
    if (this.animationState().animation === 'none') return 'Destino seleccionado · sin animación';
    return this.animationLayerKey(layer) === this.primaryAnimationLayerKey()
      ? 'Destino de la animación'
      : 'La imagen base también recibe la animación';
  }
  protected animationHeading(): string {
    const keys = this.animationState().animationLayerKeys;
    if (!keys.length) return 'Elige una capa para configurar su animación';
    const baseKey = this.baseAnimationKey();
    const primary = this.sceneLayers().find(
      (layer) => this.animationLayerKey(layer) === this.primaryAnimationLayerKey(),
    );
    if (!primary) return 'Animación de la capa seleccionada';
    if (keys.includes(baseKey) && keys.length === 2)
      return `Animación de Imagen base y ${this.compositionLabel(primary)}`;
    return `Animación de ${this.compositionLabel(primary)}`;
  }
  protected canvasInstruction(): string {
    const size = this.baseDimensions();
    if (size)
      return `Lienzo de la imagen base: ${size.width} × ${size.height} px. Todas las capas deben conservar su alineación.`;
    return this.sectionLabel().startsWith('Producto · ')
      ? 'Referencia: lienzo de escena de 1600 × 989 px aprox. Confirma el tamaño al publicar la imagen base; conserva la misma alineación en todas las capas.'
      : 'Referencia vigente: lienzo de portada 1920 × 1080 px. Confirma el tamaño al publicar la imagen base; conserva la misma alineación en todas las capas.';
  }
  protected recommendation(layer: EditorMedia): string {
    if (layer.recommendation) return layer.recommendation;
    if (layer.kind === 'product_related')
      return 'Imagen exclusiva para las tarjetas de Otras colecciones. Al publicarla se selecciona automáticamente.';
    if (layer.kind === 'product_scene') {
      const size = this.baseDimensions();
      const actual = size ? ` Lienzo actual: ${size.width} × ${size.height} px.` : '';
      return `Referencia para imagen nueva: 1600 × 989 px · proporción áurea aproximada.${actual} Las capas 2–6 y la personalización deben coincidir con la base. Para sustituir una base histórica por otra proporción, prepara antes sus capas.`;
    }
    if (layer.kind === 'product')
      return 'Fotografía de catálogo. Su uso es independiente de la escena y de la miniatura del selector de modelos.';
    const size = this.baseDimensions();
    return size
      ? `Lienzo de la base: ${size.width} × ${size.height} px. Mantén exactamente su proporción y posición en todas las capas.`
      : 'Composición 16:9 · referencia 1920 × 1080 px. Todas las capas deben compartir el mismo lienzo.';
  }
  protected readonly qualities = [
    {
      value: 82 as const,
      label: 'Recomendada · 82',
      description: 'Prioriza los detalles y las texturas.',
    },
    {
      value: 76 as const,
      label: 'Ligera · 76',
      description: 'Más compresión, con una pequeña pérdida de detalle.',
    },
    {
      value: 68 as const,
      label: 'Compacta · 68',
      description: 'Prioriza el peso; revisa los detalles finos.',
    },
  ];
  protected readonly selected = signal<HeroLayer | null>(null);
  protected readonly editingCustomization = computed(
    () => this.selected()?.kind === 'product_customization',
  );
  protected readonly customizationEnabled = signal(false);
  protected readonly customizationLabel = signal('');
  protected readonly canPublish = computed(() =>
    this.editingCustomization()
      ? !this.customizationEnabled() ||
        (!!this.customizationLabel().trim() && !!(this.candidate() || this.selected()?.url))
      : !!this.candidate(),
  );
  protected readonly candidate = signal<{
    file: File;
    dataUrl: string;
    width: number;
    height: number;
  } | null>(null);
  protected readonly quality = signal<WebpQuality>(82);
  protected readonly reading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly downloading = signal<HeroTarget | null>(null);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly busy = computed(() => this.reading() || this.uploading());
  private selectionVersion = 0;

  constructor() {
    effect(() => {
      this.auth.activeContext();
      this.scopeKey();
      // Any context change discards a pending edit, even between two authorized scopes.
      this.dialog()?.nativeElement.close();
      this.resetSelection();
      this.relatedImageSelection.set(null);
    });
    effect(() => {
      const config = {
        animation: this.animation(),
        animationLayerKeys: [...this.animationLayerKeys()],
      };
      this.animationState.set(config);
      this.animateBaseWithOverlay.set(
        config.animationLayerKeys.length === 2 &&
          config.animationLayerKeys.includes(this.baseAnimationKey()),
      );
    });
    effect((onCleanup) => {
      const url = this.sceneLayers()[0]?.url;
      this.baseDimensions.set(null);
      if (!url) return;
      const image = new Image();
      image.onload = () =>
        this.baseDimensions.set({ width: image.naturalWidth, height: image.naturalHeight });
      image.src = url;
      onCleanup(() => {
        image.onload = null;
      });
    });
    this.destroyRef.onDestroy(() => ++this.selectionVersion);
  }

  protected backdrop(event: MouseEvent): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog || event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      this.close();
  }

  protected addLayer(): void {
    const base = this.sceneLayers().find((layer) => this.isBaseLayer(layer));
    const count = this.sceneLayers().length;
    if (!base || !base.url || count >= 6 || this.busy()) return;
    const index = [2, 3, 4, 5, 6].find(
      (i) =>
        !this.sceneLayers().some((layer) =>
          base.kind === 'home'
            ? layer.targetId === (i === 2 ? 'hero_carving' : `hero_layer_${i}`)
            : layer.kind === `product_scene_${i}`,
        ),
    )!;
    this.edit({
      kind: base.kind === 'home' ? 'home' : (`product_scene_${index}` as PublicMediaKind),
      targetId:
        base.kind === 'home'
          ? index === 2
            ? 'hero_carving'
            : `hero_layer_${index}`
          : base.targetId,
      label: `Capa ${index}`,
      description: 'Superposición transparente alineada con la base',
      url: null,
    });
  }

  protected async changeAnimation(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    if (!['none', 'appear', 'disappear'].includes(value)) return;
    if (value !== 'none' && !this.canAnimate()) {
      this.notice.set('Publica y selecciona una capa antes de activar la animación.');
      return;
    }
    await this.saveAnimation({
      animation: value as MediaAnimation,
      animationLayerKeys: [...this.animationState().animationLayerKeys],
    });
  }

  protected async selectAnimationLayer(key: MediaAnimationLayerKey): Promise<void> {
    const layer = this.sceneLayers().find((item) => this.animationLayerKey(item) === key);
    if (!layer?.url || this.busy()) return;
    const baseKey = this.baseAnimationKey();
    if (key === baseKey) {
      this.animateBaseWithOverlay.set(false);
      await this.saveAnimation({ animation: this.animationState().animation, animationLayerKeys: [key] });
      return;
    }
    const keys = this.animateBaseWithOverlay() ? [baseKey, key] : [key];
    await this.saveAnimation({ animation: this.animationState().animation, animationLayerKeys: keys });
  }

  protected async toggleAnimateBase(event: Event): Promise<void> {
    const overlayKey = this.primaryAnimationLayerKey();
    const baseKey = this.baseAnimationKey();
    if (!overlayKey || overlayKey === baseKey || this.busy()) return;
    const enabled = (event.target as HTMLInputElement).checked;
    this.animateBaseWithOverlay.set(enabled);
    await this.saveAnimation({
      animation: this.animationState().animation,
      animationLayerKeys: enabled ? [baseKey, overlayKey] : [overlayKey],
    });
  }

  protected replay(): void {
    if (!this.canAnimate() || this.animationState().animation === 'none' || this.busy()) return;
    this.replayRequested.emit();
  }

  protected async toggleRelatedImageSource(
    source: RelatedImageSource,
    event: Event,
  ): Promise<void> {
    const value = (event.target as HTMLInputElement).checked ? source : 'auto';
    const settings = this.relatedImage();
    if (
      !settings ||
      !isRelatedImageSource(value) ||
      !this.canEdit() ||
      this.busy() ||
      (value !== 'auto' && !this.relatedImageChoices().some((layer) => layer.kind === value))
    )
      return;
    if (value === this.relatedImageSource()) return;
    const scope = this.scopeKey();
    const version = this.selectionVersion;
    this.relatedImageSelection.set(value);
    this.uploading.set(true);
    this.notice.set('');
    try {
      const result = await this.commerce.configureRelatedImageSource({
        targetId: settings.targetId,
        relatedImageSource: value,
      });
      if (
        !this.destroyRef.destroyed &&
        scope === this.scopeKey() &&
        version === this.selectionVersion
      ) {
        this.relatedImageSelection.set(result.relatedImageSource);
        this.relatedImageChanged.emit({
          targetId: settings.targetId,
          relatedImageSource: result.relatedImageSource,
        });
        this.notice.set('Imagen en Otras colecciones guardada.');
      }
    } catch (error: unknown) {
      if (
        !this.destroyRef.destroyed &&
        scope === this.scopeKey() &&
        version === this.selectionVersion
      ) {
        this.relatedImageSelection.set(null);
        this.notice.set(
          mediaCallError(
            error,
            'No se pudo guardar la imagen de Otras colecciones. Inténtalo de nuevo.',
          ),
        );
      }
    } finally {
      this.uploading.set(false);
    }
  }

  private async saveAnimation(config: MediaAnimationConfiguration): Promise<boolean> {
    const base = this.sceneLayers()[0];
    if (!base || !this.canEdit() || this.busy()) return false;
    const scope = this.scopeKey();
    const version = this.selectionVersion;
    const previous = this.animationState();
    this.animationState.set(config);
    this.animateBaseWithOverlay.set(
      config.animationLayerKeys.length === 2 && config.animationLayerKeys.includes(this.baseAnimationKey()),
    );
    this.uploading.set(true);
    // Render the optimistic destination before awaiting the request. If it fails
    // immediately, Angular still sees the rollback as a real checked-state change.
    this.changeDetector.detectChanges();
    try {
      const result = await this.commerce.configurePublicMedia({
        kind: base.kind,
        targetId: base.targetId,
        animation: config.animation,
        animationLayerKeys: config.animationLayerKeys,
      });
      if (
        !result ||
        result.animation !== config.animation ||
        !Array.isArray(result.animationLayerKeys) ||
        result.animationLayerKeys.length !== config.animationLayerKeys.length ||
        result.animationLayerKeys.some((key, index) => key !== config.animationLayerKeys[index])
      )
        throw Object.assign(new Error('Unsupported animation destination response'), {
          code: 'functions/invalid-argument',
        });
      if (
        !this.destroyRef.destroyed &&
        scope === this.scopeKey() &&
        version === this.selectionVersion
      ) {
        this.animationState.set(result);
        this.animationChanged.emit(result);
        this.notice.set('Animación guardada automáticamente.');
        return true;
      }
    } catch (error) {
      if (
        !this.destroyRef.destroyed &&
        scope === this.scopeKey() &&
        version === this.selectionVersion
      ) {
        this.animationState.set(previous);
        this.animateBaseWithOverlay.set(
          previous.animationLayerKeys.length === 2 && previous.animationLayerKeys.includes(this.baseAnimationKey()),
        );
        this.notice.set(mediaCallError(
          error,
          'No se pudo guardar la animación. Revisa tu conexión y vuelve a intentarlo.',
        ));
      }
    } finally {
      this.uploading.set(false);
    }
    return false;
  }

  protected edit(layer: HeroLayer): void {
    if (!this.canEdit() || this.busy()) return;
    this.savedBodyScrollTop = this.dialogBody()?.nativeElement.scrollTop ?? 0;
    this.returnView = this.view();
    this.selected.set(layer);
    this.customizationEnabled.set(this.customization().enabled);
    this.customizationLabel.set(this.customization().label);
    this.error.set('');
    this.notice.set('');
    this.quality.set(82);
    this.archiveEditing.set(true);
    this.view.set('archive');
    if (!this.dialog()?.nativeElement.open) this.dialog()?.nativeElement.showModal();
  }

  protected openEditor(): void {
    if (!this.canEdit()) return;
    this.view.set('composition');
    this.archiveEditing.set(false);
    this.selected.set(null);
    this.notice.set('');
    this.dialog()?.nativeElement.showModal();
    const body = this.dialogBody()?.nativeElement;
    if (body) body.scrollTop = 0;
  }

  protected openArchive(): void {
    this.savedBodyScrollTop = this.dialogBody()?.nativeElement.scrollTop ?? 0;
    this.returnView = 'composition';
    this.archiveEditing.set(false);
    this.selected.set(null);
    this.view.set('archive');
    this.restoreBodyScroll();
  }

  protected backToComposition(): void {
    this.savedBodyScrollTop = this.dialogBody()?.nativeElement.scrollTop ?? this.savedBodyScrollTop;
    this.view.set('composition');
    this.restoreBodyScroll();
  }

  protected returnFromFile(): void {
    this.candidate.set(null);
    this.error.set('');
    this.archiveEditing.set(false);
    this.view.set(this.returnView);
    this.restoreBodyScroll();
  }

  private restoreBodyScroll(): void {
    requestAnimationFrame(() => {
      const body = this.dialogBody()?.nativeElement;
      if (body) body.scrollTop = this.savedBodyScrollTop;
    });
  }

  protected changeCustomizationEnabled(event: Event): void {
    this.customizationEnabled.set((event.target as HTMLInputElement).checked);
  }

  protected changeCustomizationLabel(event: Event): void {
    this.customizationLabel.set((event.target as HTMLInputElement).value);
  }

  protected close(): void {
    if (!this.publishing()) this.dialog()?.nativeElement.close();
  }

  protected onCancel(event: Event): void {
    if (this.publishing()) event.preventDefault();
  }

  protected resetSelection(): void {
    ++this.selectionVersion;
    this.selected.set(null);
    this.candidate.set(null);
    this.error.set('');
    this.reading.set(false);
    this.view.set('composition');
    this.archiveEditing.set(false);
  }

  protected async chooseFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy() || !this.selected() || !this.canEdit()) return;
    this.candidate.set(null);
    this.error.set('');
    if (!['image/png', 'image/webp', 'image/jpeg'].includes(file.type)) {
      this.error.set('Selecciona una imagen PNG, WebP o JPG.');
      return;
    }
    if (!file.size || file.size > MAX_BYTES) {
      this.error.set('La imagen debe contener datos y pesar como máximo 8 MB.');
      return;
    }
    this.reading.set(true);
    const version = ++this.selectionVersion;
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (width * height > 40_000_000)
        throw new Error('La imagen supera los 40 megapíxeles. Reduce sus dimensiones.');
      const base = this.baseDimensions();
      const layer = this.selected();
      const isScene =
        layer?.kind.startsWith('product_scene') ||
        layer?.kind === 'product_customization' ||
        (layer?.kind === 'home' && layer.targetId !== 'portfolio_background');
      if (
        isScene &&
        base &&
        (this.sceneLayers().length > 1 || layer?.kind === 'product_customization' || !layer?.url) &&
        Math.abs(width / height - base.width / base.height) > 0.002
      )
        throw new Error(
          `Usa la proporción de la base (${base.width} × ${base.height}) para que las capas calcen.`,
        );
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(file);
      });
      if (version === this.selectionVersion) this.candidate.set({ file, dataUrl, width, height });
    } catch (error) {
      if (version === this.selectionVersion)
        this.error.set(error instanceof Error ? error.message : 'No se pudo abrir la imagen.');
    } finally {
      if (version === this.selectionVersion) this.reading.set(false);
    }
  }

  protected async publish(): Promise<void> {
    const layer = this.selected();
    const candidate = this.candidate();
    if (!layer || !this.canPublish() || !this.canEdit() || this.busy()) return;
    const customization = {
      enabled: this.customizationEnabled(),
      label: this.customizationLabel().trim(),
    };
    const version = this.selectionVersion;
    this.uploading.set(true);
    this.error.set('');
    try {
      if (candidate) {
        this.publishing.set(true);
        let media: { url: string; path: string };
        try {
          ({ media } = await this.commerce.uploadPublicMedia({
            kind: layer.kind,
            targetId: layer.targetId,
            fileBase64: candidate.dataUrl,
            mimeType: candidate.file.type as 'image/png' | 'image/webp' | 'image/jpeg',
            quality: this.quality(),
          }));
        } finally {
          this.publishing.set(false);
        }
        if (version !== this.selectionVersion || this.destroyRef.destroyed) return;
        this.published.emit({
          kind: layer.kind,
          targetId: layer.targetId,
          url: media.url,
          path: media.path,
        });
        // Keep a successful upload on a configuration retry, without uploading it again.
        this.selected.set({ ...layer, url: media.url, path: media.path });
        this.candidate.set(null);
      }
      if (layer.kind === 'product_customization') {
        const result = await this.commerce.configureProductCustomization({
          targetId: layer.targetId,
          customization,
        });
        if (version !== this.selectionVersion || this.destroyRef.destroyed) return;
        this.customizationChanged.emit({
          targetId: layer.targetId,
          customization: result.customization,
        });
        this.notice.set('Personalización guardada para este producto.');
      } else {
        this.notice.set(`${layer.label} publicada en WebP.`);
      }
      this.dialog()?.nativeElement.close();
    } catch (error: unknown) {
      if (version === this.selectionVersion)
        this.error.set(
          mediaCallError(
            error,
            layer.kind === 'product_customization'
              ? 'No se pudo guardar la personalización. Comprueba que la imagen base esté publicada y puedes reintentar.'
              : 'No se pudo publicar. Comprueba tu conexión e inténtalo de nuevo.',
          ),
        );
    } finally {
      this.uploading.set(false);
    }
  }

  protected async download(layer: HeroLayer): Promise<void> {
    if (!layer.url || this.downloading() || !this.canEdit()) return;
    this.downloading.set(`${layer.kind}:${layer.targetId}`);
    this.notice.set('');
    try {
      const response = await this.commerce.downloadPublicMedia({
        kind: layer.kind,
        targetId: layer.targetId,
      });
      const bytes = Uint8Array.from(atob(response.base64), (char) => char.charCodeAt(0));
      if (!bytes.length) throw new Error('Empty download');
      const url = URL.createObjectURL(new Blob([bytes], { type: response.mimeType }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = response.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      this.notice.set(`Descarga iniciada: ${layer.label}.`);
    } catch {
      this.notice.set(
        `No se pudo descargar ${layer.label}. Revisa tu conexión e inténtalo de nuevo.`,
      );
    } finally {
      this.downloading.set(null);
    }
  }
}
