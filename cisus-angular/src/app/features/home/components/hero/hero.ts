import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';
import { HeroMediaEditor, type EditorMedia } from '../hero-media-editor/hero-media-editor';
import type {
  MediaAnimation,
  MediaAnimationConfiguration,
  MediaAnimationLayerKey,
  MediaLayer,
  PublicMediaKind,
} from '../../../../core/models/commerce';

@Component({
  imports: [RouterLink, HeroMediaEditor],
  selector: 'app-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  private readonly publicMedia = inject(PublicMediaUrlService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly composition = signal<MediaLayer[]>([]);
  protected readonly animation = signal<MediaAnimation>('appear');
  protected readonly animationLayerKeys = signal<MediaAnimationLayerKey[]>([]);
  protected readonly replayEnabled = signal(true);
  protected animationChanged(config: MediaAnimationConfiguration): void {
    this.animation.set(config.animation);
    this.animationLayerKeys.set(Array.isArray(config.animationLayerKeys) ? config.animationLayerKeys : []);
  }
  protected readonly editorLayers = computed<EditorMedia[]>(() =>
    (this.composition().length
      ? this.composition()
      : [{ kind: 'home' as const, targetId: 'hero', url: null }]
    ).map((layer, index) => ({
      ...layer,
      label: index === 0 ? 'Imagen base' : `Superposición ${index}`,
      description: index === 0 ? 'Composición principal' : 'Superposición alineada',
    })),
  );
  protected animationKey(layer: MediaLayer): MediaAnimationLayerKey {
    return layer.targetId as MediaAnimationLayerKey;
  }
  protected replayAnimation(): void {
    this.replayEnabled.set(false);
    requestAnimationFrame(() => this.replayEnabled.set(true));
  }

  protected published(event: {
    kind: PublicMediaKind;
    targetId: string;
    url: string;
    path: string;
  }): void {
    this.composition.update((layers) => {
      const updated = layers.some((layer) => layer.targetId === event.targetId)
        ? layers.map((layer) => (layer.targetId === event.targetId ? event : layer))
        : [...layers, event];
      const order = ['hero', 'hero_carving', 'hero_layer_3', 'hero_layer_4', 'hero_layer_5', 'hero_layer_6'];
      return updated.sort((a, b) => order.indexOf(a.targetId) - order.indexOf(b.targetId));
    });
  }

  constructor() {
    this.destroyRef.onDestroy(
      this.publicMedia.observeHeroComposition((layers, animation, animationLayerKeys) => {
        this.composition.set(layers);
        this.animation.set(animation);
        this.animationLayerKeys.set(Array.isArray(animationLayerKeys) ? animationLayerKeys : []);
      }),
    );
  }
}
