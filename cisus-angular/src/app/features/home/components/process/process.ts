import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type { ProcessIdeaId, ProcessIdeaImageUrls } from '../../../../core/models/process-step';
import { MarketingContent } from '../../../../core/services/marketing-content';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';
import { ProcessIdeaOrbit } from './process-idea-orbit';
import { ProcessIdeaIcon } from './process-idea-icon';
import {
  PROCESS_IDEA_MEDIA_TARGETS,
  type ProcessStepId,
} from '../../../../core/models/process-step';
import { HeroMediaEditor, type EditorMedia } from '../hero-media-editor/hero-media-editor';

@Component({
  imports: [NgOptimizedImage, ProcessIdeaOrbit, ProcessIdeaIcon, HeroMediaEditor],
  selector: 'app-process',
  styleUrl: './process.scss',
  templateUrl: './process.html',
})
export class Process {
  private readonly content = inject(MarketingContent);
  private readonly publicMedia = inject(PublicMediaUrlService);
  private readonly processIdeaImageUrls = signal<ProcessIdeaImageUrls>({});

  protected readonly ideas = this.content.processIdeas;
  protected readonly activeIdeaId = signal<ProcessIdeaId>('portavasos');
  protected readonly activeIdea = computed(
    () => this.ideas.find((idea) => idea.id === this.activeIdeaId()) ?? this.ideas[0],
  );
  protected readonly steps = computed(() => {
    const imageUrls = this.processIdeaImageUrls()[this.activeIdeaId()] ?? {};
    return this.content.processSteps.map((step) => ({
      ...step,
      imageUrl: imageUrls[step.id] ?? null,
    }));
  });
  protected readonly activeIndex = signal(0);
  protected readonly editorEntries = computed<EditorMedia[]>(() =>
    this.steps().map((step) => ({
      kind: 'process',
      targetId: PROCESS_IDEA_MEDIA_TARGETS[this.activeIdeaId()][step.id],
      url: step.imageUrl,
      label: `${step.number} · ${step.title}`,
      description: `${this.activeIdea().label} · ${step.title}`,
      recommendation:
        'Recomendado vertical 3:4 · 900 × 1200 px. Mantén lo importante dentro del centro de la tarjeta.',
    })),
  );
  protected processPublished(event: { targetId: string; url: string }): void {
    for (const idea of this.ideas) {
      const entry = Object.entries(PROCESS_IDEA_MEDIA_TARGETS[idea.id]).find(
        ([, target]) => target === event.targetId,
      );
      if (entry)
        this.processIdeaImageUrls.update((urls) => ({
          ...urls,
          [idea.id]: { ...urls[idea.id], [entry[0] as ProcessStepId]: event.url },
        }));
    }
  }
  protected readonly hasInteracted = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly stepsRail = viewChild.required<ElementRef<HTMLDivElement>>('stepsRail');
  private readonly stepCards = viewChildren<ElementRef<HTMLElement>>('stepCard');
  private targetIndex: number | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const unsubscribe = this.publicMedia.observeProcessIdeaImages((urls) => {
      this.processIdeaImageUrls.set(urls);
    });
    this.destroyRef.onDestroy(unsubscribe);

    afterNextRender(() => {
      const rail = this.stepsRail().nativeElement;
      const resizeObserver = new ResizeObserver(() => {
        this.centerStep(this.activeIndex(), 'instant');
      });

      resizeObserver.observe(rail);
      this.destroyRef.onDestroy(() => {
        resizeObserver.disconnect();
        clearTimeout(this.scrollTimer);
      });
      this.centerStep(this.activeIndex(), 'instant');
    });
  }

  protected selectIdea(ideaId: string): void {
    const idea = this.ideas.find((item) => item.id === ideaId);
    if (!idea || idea.id === this.activeIdeaId()) return;
    this.activeIdeaId.set(idea.id);
    this.hasInteracted.set(true);

    const reducedMotion = this.prefersReducedMotion();
    this.centerStep(this.activeIndex(), reducedMotion ? 'instant' : 'smooth');
  }

  protected markInteraction(): void {
    this.hasInteracted.set(true);
    this.targetIndex = null;
  }

  protected selectStep(index: number, focusCard = false): void {
    const next = Math.max(0, Math.min(index, this.steps().length - 1));
    this.hasInteracted.set(true);
    this.activeIndex.set(next);
    this.targetIndex = next;

    const reducedMotion = this.prefersReducedMotion();
    this.centerStep(next, reducedMotion ? 'instant' : 'smooth');

    if (focusCard) {
      this.stepCards()[next]?.nativeElement.querySelector('button')?.focus({ preventScroll: true });
    }
    this.scheduleScrollEnd();
  }

  protected onRailKeydown(event: KeyboardEvent): void {
    let next: number;

    switch (event.key) {
      case 'ArrowLeft':
        next = this.activeIndex() - 1;
        break;
      case 'ArrowRight':
        next = this.activeIndex() + 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.steps().length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.selectStep(next, true);
  }

  protected onScroll(): void {
    if (this.targetIndex === null) {
      this.updateActiveStep();
    }
    this.scheduleScrollEnd();
  }

  protected onScrollEnd(): void {
    clearTimeout(this.scrollTimer);

    if (this.targetIndex !== null) {
      this.activeIndex.set(this.targetIndex);
      this.targetIndex = null;
      return;
    }

    this.updateActiveStep();
  }

  /**
   * Keep scroll centering and the active-step detector on the same reference point: the center of the
   * rail. The symmetric CSS edge gutter lets both the first and last cards reach that center.
   */
  private centerStep(index: number, behavior: ScrollBehavior): void {
    const rail = this.stepsRail().nativeElement;
    const card = this.stepCards()[index]?.nativeElement;
    if (!card) return;

    const desiredLeft = card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
    const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const left = Math.min(Math.max(0, desiredLeft), maxLeft);
    if (typeof rail.scrollTo === 'function') {
      rail.scrollTo({ left, behavior });
    } else {
      // JSDOM and older embedded web views may not expose Element#scrollTo.
      rail.scrollLeft = left;
    }
  }

  private scheduleScrollEnd(): void {
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(
      () => {
        this.onScrollEnd();
      },
      this.targetIndex === null ? 180 : 700,
    );
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private updateActiveStep(): void {
    const rail = this.stepsRail().nativeElement;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    this.stepCards().forEach(({ nativeElement: card }, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    this.activeIndex.set(nearestIndex);
  }
}
