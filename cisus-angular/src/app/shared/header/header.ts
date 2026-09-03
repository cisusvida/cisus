import { Component, ElementRef, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Auth } from '../../core/services/auth';

@Component({
  host: {
    '[class.header--hero]': 'isHome()',
    '(document:click)': 'onDocumentClick($event)',
  },
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  protected readonly auth = inject(Auth);
  protected readonly menuOpen = signal(false);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  protected readonly isHome = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.isHomeUrl(event.urlAfterRedirects)),
      startWith(this.isHomeUrl(this.router.url)),
    ),
  );

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onDocumentClick(event: Event): void {
    const target = event.target;
    if (this.menuOpen() && target && !this.elementRef.nativeElement.contains(target as Node)) {
      this.closeMenu();
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    this.closeMenu();
    await this.router.navigateByUrl('/');
  }

  private isHomeUrl(url: string): boolean {
    return /^\/(?:[?#]|$)/.test(url);
  }
}
