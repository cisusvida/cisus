import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { Hero } from '../../components/hero/hero';
import { Process } from '../../components/process/process';
import { Portfolio } from '../../components/portfolio/portfolio';
import { Contact } from '../../components/contact/contact';
import { Footer } from '../../../../shared/footer/footer';
@Component({
  imports: [Hero, Process, Portfolio, Contact, Footer],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cover = viewChild.required('cover', { read: ElementRef<HTMLElement> });

  constructor() {
    afterNextRender(() => {
      const cover = this.cover().nativeElement;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      let frame: number | undefined;
      let previousReveal = '';
      const update = () => {
        frame = undefined;
        const height = Math.max(window.innerHeight, 1);
        const progress = reducedMotion?.matches
          ? 1
          : Math.min(1, Math.max(0, (height - cover.getBoundingClientRect().bottom) / (height * 0.8)));
        const reveal = (progress * progress * (3 - 2 * progress)).toFixed(3);
        if (reveal !== previousReveal) {
          this.host.nativeElement.style.setProperty('--collection-reveal', reveal);
          previousReveal = reveal;
        }
      };
      const schedule = () => {
        frame ??= requestAnimationFrame(update);
      };
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
      observer?.observe(cover);
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      reducedMotion?.addEventListener('change', schedule);
      update();
      this.destroyRef.onDestroy(() => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        reducedMotion?.removeEventListener('change', schedule);
      });
    });
  }
}
