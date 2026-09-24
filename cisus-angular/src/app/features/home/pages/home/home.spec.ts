import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import type { CatalogProduct } from '../../../../core/models/commerce';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        {
          provide: CommerceGateway,
          useValue: {
            listPublicProducts: async (): Promise<CatalogProduct[]> => [
              {
                id: 'cisus_tabla_felino',
                sku: 'CIS-TAB-FELINO',
                name: 'Felino',
                description: 'Tabla conceptual de felino.',
                imagePath: 'public-media/products/cisus_tabla_felino/image.webp',
                imageUrl: null,
                basePrice: 29990,
                currency: 'CLP',
              },
            ],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('places Productos immediately after the cover with real catalog references', () => {
    const children = [...fixture.nativeElement.children] as HTMLElement[];
    expect(children.slice(0, 4).map((element) => element.tagName.toLowerCase())).toEqual([
      'app-hero',
      'app-portfolio',
      'app-process',
      'app-contact',
    ]);
    const portfolio = fixture.nativeElement.querySelector('#portfolio') as HTMLElement;
    expect(portfolio.textContent).toContain('Explora nuestras colecciones');
    expect(portfolio.textContent).toContain('Felino');
    expect(portfolio.querySelector('.family-switcher')).toBeNull();
    expect(portfolio.querySelector('#portfolio-family-title')?.textContent?.trim()).toBe(
      'Tablas de cocina',
    );
    expect(fixture.nativeElement.querySelector('#portfolio dialog')).toBeNull();
  });
});
