import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';

@Component({
  imports: [NgOptimizedImage, RouterLink],
  selector: 'app-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  private readonly publicMedia = inject(PublicMediaUrlService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly heroImageUrl = signal('/images/home_card.jpeg');

  constructor() {
    const unsubscribe = this.publicMedia.observeHomeHero((url) => {
      this.heroImageUrl.set(url ?? '/images/home_card.jpeg');
    });
    this.destroyRef.onDestroy(unsubscribe);
  }
}
