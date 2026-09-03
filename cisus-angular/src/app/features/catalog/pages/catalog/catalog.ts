import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '../../../../core/models/commerce';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { Footer } from '../../../../shared/footer/footer';

@Component({
  imports: [NgOptimizedImage, RouterLink, Footer],
  selector: 'app-catalog',
  styleUrl: './catalog.scss',
  templateUrl: './catalog.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class Catalog {
  private readonly commerce = inject(CommerceGateway);
  protected readonly products = signal<CatalogProduct[]>([]);
  protected readonly query = signal('');
  protected readonly selected = signal<CatalogProduct | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
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
  }

  protected updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected open(item: CatalogProduct): void {
    this.selected.set(item);
  }

  protected close(): void {
    this.selected.set(undefined);
  }

  protected price(value: number, currency: string): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
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
