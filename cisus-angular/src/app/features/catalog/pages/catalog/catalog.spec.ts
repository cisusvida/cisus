import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { Catalog } from './catalog';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { PREVIEW_PRODUCTS } from '../../../home/pages/products-preview/products-preview.fixtures';
import type { CatalogProduct } from '../../../../core/models/commerce';

@Component({ template: 'Home' })
class TestHome {}

describe('Catalog product URL', () => {
  const list = vi.fn<() => Promise<CatalogProduct[]>>();
  beforeEach(async () => {
    list.mockReset().mockResolvedValue(PREVIEW_PRODUCTS);
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value: vi.fn(function (this: HTMLDialogElement) {
          Object.defineProperty(this, 'open', { configurable: true, writable: true, value: true });
        }),
      },
      close: {
        configurable: true,
        value: vi.fn(function (this: HTMLDialogElement) {
          Object.defineProperty(this, 'open', { configurable: true, writable: true, value: false });
        }),
      },
    });
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: TestHome },
          { path: 'catalogo', component: Catalog },
        ]),
        { provide: CommerceGateway, useValue: { listPublicProducts: list } },
      ],
    }).compileComponents();
  });
  afterEach(() => vi.restoreAllMocks());

  it('waits for products, follows parameter changes and ignores unknown or absent IDs', async () => {
    let resolve!: (items: CatalogProduct[]) => void;
    list.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/catalogo?producto=demo_felino', Catalog);
    expect(harness.routeNativeElement?.querySelector('dialog')).toBeNull();
    resolve(PREVIEW_PRODUCTS);
    await vi.waitFor(() =>
      expect(harness.routeNativeElement?.querySelector('dialog')?.textContent).toContain('Felino'),
    );
    const same = await harness.navigateByUrl('/catalogo?producto=demo_delfin', Catalog);
    await harness.fixture.whenStable();
    expect(same).toBe(first);
    expect(harness.routeNativeElement?.querySelector('dialog')?.textContent).toContain('Delfín');
    await harness.navigateByUrl('/catalogo?producto=not_published', Catalog);
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('dialog')).toBeNull();
    await harness.navigateByUrl('/catalogo', Catalog);
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('dialog')).toBeNull();
    expect(list).toHaveBeenCalledOnce();
  });

  it('removes only producto with replace navigation and retains fragment and other parameters', async () => {
    const harness = await RouterTestingHarness.create(
      '/catalogo?producto=demo_delfin&origen=home#lista',
    );
    await harness.fixture.whenStable();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    (
      harness.routeNativeElement?.querySelector('button[aria-label="Cerrar"]') as HTMLButtonElement
    ).click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/catalogo?origen=home#lista');
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ replaceUrl: true, preserveFragment: true }),
    );
    expect(harness.routeNativeElement?.querySelector('dialog')).toBeNull();
    await harness.navigateByUrl('/', TestHome);
    await harness.navigateByUrl('/catalogo?producto=demo_felino', Catalog);
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('dialog')?.textContent).toContain('Felino');
  });
});
