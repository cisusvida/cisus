import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { PortfolioItem } from '../../../../core/models/portfolio-item';
import { MarketingContent } from '../../../../core/services/marketing-content';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-portfolio',
  styleUrl: './portfolio.scss',
  templateUrl: './portfolio.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class Portfolio {
  protected readonly items = inject(MarketingContent).featured;
  protected readonly selected = signal<PortfolioItem | undefined>(undefined);
  private readonly modalClose = viewChild<ElementRef<HTMLButtonElement>>('modalClose');
  private trigger?: HTMLButtonElement;

  constructor() {
    effect(() => this.modalClose()?.nativeElement.focus());
  }

  protected open(item: PortfolioItem, event: Event): void {
    this.trigger = event.currentTarget as HTMLButtonElement;
    this.selected.set(item);
  }
  protected close(): void {
    this.selected.set(undefined);
    this.trigger?.focus();
    this.trigger = undefined;
  }
  protected price(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
