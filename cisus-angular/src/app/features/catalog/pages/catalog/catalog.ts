import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import type { CatalogProduct } from '../../../../core/models/commerce';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { Footer } from '../../../../shared/footer/footer';

@Component({
  imports: [NgOptimizedImage, RouterLink, Footer],
  selector: 'app-catalog',
  styleUrl: './catalog.scss',
  templateUrl: './catalog.html',
  host: { '(document:keydown.escape)': 'close()', '(window:resize)': 'syncScrollbar()' },
})
export class Catalog {
  private readonly commerce = inject(CommerceGateway);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly modal = viewChild<ElementRef<HTMLDialogElement>>('modal');
  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly query = signal('');
  protected readonly selected = signal<CatalogProduct | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  private readonly modalScroll = viewChild<ElementRef<HTMLElement>>('modalScroll');
  protected readonly scrollbarThumbHeight = signal('0px');
  protected readonly scrollbarThumbOffset = signal('0px');
  protected readonly visibleItems = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('es');
    return this.products().filter(
      (item) =>
        !query ||
        `${item.name} ${item.description} ${item.sku}`.toLocaleLowerCase('es').includes(query),
    );
  });

  constructor() {
    void this.load();
    effect(() => {
      const id = this.params().get('producto');
      this.selected.set(id ? this.products().find((product) => product.id === id) : undefined);
    });
    afterRenderEffect(() => {
      const modal = this.modal()?.nativeElement;
      if (modal && !modal.open) modal.showModal();
    });
    afterRenderEffect(() => this.syncScrollbar());
  }

  protected updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected open(item: CatalogProduct): void {
    this.selected.set(item);
  }

  protected close(): void {
    this.modal()?.nativeElement.close();
    this.selected.set(undefined);
    if (this.params().has('producto')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { producto: null },
        queryParamsHandling: 'merge',
        preserveFragment: true,
        replaceUrl: true,
      });
    }
  }

  protected price(value: number, currency: string): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected syncScrollbar(): void {
    const scroll = this.modalScroll()?.nativeElement;
    const trackHeight = Math.max((scroll?.clientHeight ?? 0) - 88, 0);
    const maxScrollTop = Math.max((scroll?.scrollHeight ?? 0) - (scroll?.clientHeight ?? 0), 0);

    if (!scroll || !maxScrollTop || !trackHeight) {
      this.scrollbarThumbHeight.set('0px');
      this.scrollbarThumbOffset.set('0px');
      return;
    }

    const thumbHeight = Math.min(
      trackHeight,
      Math.max(24, (scroll.clientHeight / scroll.scrollHeight) * trackHeight),
    );
    const thumbOffset = (scroll.scrollTop / maxScrollTop) * (trackHeight - thumbHeight);

    this.scrollbarThumbHeight.set(`${thumbHeight}px`);
    this.scrollbarThumbOffset.set(`${thumbOffset}px`);
  }

  private async load(): Promise<void> {
    try {
      this.products.set(await this.commerce.listPublicProducts());
    } catch {
      this.error.set('No pudimos cargar el catálogo en este momento.');
    } finally {
      this.loading.set(false);
    }
  }
}
