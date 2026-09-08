import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import type { ProcessIdeaIllustration } from '../../../../core/models/process-step';
import { nearestIdeaTurn, orbitPosition, wrapIdeaIndex } from './idea-orbit.geometry';
import { ProcessIdeaIcon } from './process-idea-icon';

export interface IdeaOrbitOption {
  id: string;
  label: string;
  illustration: ProcessIdeaIllustration;
  status?: 'realized' | 'developing';
}

/** Owns idea navigation only. Selecting an idea never changes the process stage. */
@Component({
  selector: 'app-process-idea-orbit',
  imports: [ProcessIdeaIcon],
  templateUrl: './process-idea-orbit.html',
  styleUrl: './process-idea-orbit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessIdeaOrbit {
  readonly ideas = input.required<readonly IdeaOrbitOption[]>();
  readonly selectedId = input.required<string>();
  readonly selection = output<string>();
  readonly instanceId = input('process');
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly turn = signal(0);
  protected readonly dragAngle = signal(0);
  protected readonly dragging = signal(false);
  protected readonly selectedIndex = computed(() =>
    Math.max(
      0,
      this.ideas().findIndex((idea) => idea.id === this.selectedId()),
    ),
  );
  protected readonly cursor = computed(() =>
    nearestIdeaTurn(this.selectedIndex(), this.turn(), this.ideas().length),
  );
  protected readonly items = computed(() =>
    this.ideas().map((idea, index) => {
      const position = nearestIdeaTurn(index, this.cursor(), this.ideas().length);
      const relative = position - this.cursor();
      return { idea, position, relative, ...orbitPosition(relative) };
    }),
  );
  private pointerStart: { x: number; y: number; id: number; horizontal: boolean } | null = null;
  private suppressClick = false;
  private wheelUntil = 0;

  protected choose(position: number): void {
    if (!this.ideas().length) return;
    this.turn.set(position);
    this.selection.emit(this.ideas()[wrapIdeaIndex(position, this.ideas().length)].id);
  }
  protected clickIdea(position: number): void {
    if (!this.suppressClick) this.choose(position);
  }
  protected move(direction: number): void {
    this.choose(this.cursor() + direction);
  }
  protected onKeydown(event: KeyboardEvent): void {
    const directions: Record<string, number> = {
      ArrowUp: -1,
      ArrowLeft: -1,
      ArrowDown: 1,
      ArrowRight: 1,
    };
    if (event.key in directions) {
      event.preventDefault();
      this.move(directions[event.key]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.choose(event.key === 'Home' ? 0 : this.ideas().length - 1);
    } else {
      return;
    }
    // Keep keyboard focus with the selected idea, even when older neighbours leave the window.
    if ((event.target as HTMLElement).closest('.orbit-choice')) {
      afterNextRender(
        () =>
          this.element.nativeElement
            .querySelector<HTMLButtonElement>('.orbit-choice--selected')
            ?.focus({ preventScroll: true }),
        { injector: this.injector },
      );
    }
  }
  protected onWheel(event: WheelEvent): void {
    if (this.ideas().length < 2 || event.ctrlKey) return;
    const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < 3) return;
    event.preventDefault();
    // One detent per gesture; momentum must not cycle through the entire catalogue.
    const now = Date.now();
    const allowed = now > this.wheelUntil;
    this.wheelUntil = now + 220;
    if (allowed) this.move(Math.sign(delta));
  }
  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.pointerStart = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      horizontal: window.matchMedia?.('(max-width: 1050px)').matches ?? false,
    };
    this.suppressClick = false;
  }
  protected onPointerMove(event: PointerEvent): void {
    const start = this.pointerStart;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const delta = start.horizontal ? dx : -dy;
    const crossDelta = start.horizontal ? dy : dx;
    if (!this.dragging() && (Math.abs(delta) < 22 || Math.abs(crossDelta) > Math.abs(delta)))
      return;
    this.dragging.set(true);
    this.dragAngle.set(Math.max(-38, Math.min(38, delta / 3)));
    this.suppressClick = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  protected onPointerUp(event: PointerEvent): void {
    const start = this.pointerStart;
    if (start?.id === event.pointerId && this.dragging() && Math.abs(this.dragAngle()) >= 7) {
      this.move(this.dragAngle() < 0 ? 1 : -1);
    }
    this.cancelPointer();
  }
  protected cancelPointer(): void {
    this.pointerStart = null;
    this.dragging.set(false);
    this.dragAngle.set(0);
  }
}
