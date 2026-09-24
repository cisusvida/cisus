import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type { ProcessIdeaImageUrls } from '../../../../core/models/process-step';
import { PublicMediaUrlService } from '../../../../core/services/public-media-url';
import { Process } from './process';

describe('Process experience', () => {
  let fixture: ComponentFixture<Process>;
  let rail: HTMLDivElement;
  let cards: HTMLElement[];
  let publishImages: (urls: ProcessIdeaImageUrls) => void;
  let unsubscribe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;
  let scrollTo: ReturnType<typeof vi.fn>;
  const button = (label: string) =>
    fixture.nativeElement.querySelector(
      'button:not(:disabled)[aria-label="' + label + '"]',
    ) as HTMLButtonElement;

  beforeEach(async () => {
    unsubscribe = vi.fn();
    disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect = disconnect;
      },
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    await TestBed.configureTestingModule({
      imports: [Process],
      providers: [
        {
          provide: PublicMediaUrlService,
          useValue: {
            observeProcessIdeaImages: (listener: typeof publishImages) => {
              publishImages = listener;
              return unsubscribe;
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Process);
    await fixture.whenStable();
    rail = fixture.nativeElement.querySelector('.steps');
    cards = [...fixture.nativeElement.querySelectorAll('.step')];
    // JSDOM has no layout. These dimensions reproduce the symmetric CSS gutters.
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 1400 },
      scrollWidth: { configurable: true, value: 3770 },
    });
    cards.forEach((card, index) =>
      Object.defineProperties(card, {
        offsetLeft: { configurable: true, value: 512.5 + index * 395 },
        offsetWidth: { configurable: true, value: 375 },
      }),
    );
    scrollTo = vi.fn(({ left }: ScrollToOptions) => {
      rail.scrollLeft = left ?? 0;
    });
    Object.defineProperty(rail, 'scrollTo', { configurable: true, value: scrollTo });
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('switches media without resetting a non-first stage or mixing idea images', async () => {
    publishImages({
      portavasos: { design: 'https://media.example.test/coaster-design.webp' },
      tablas: { design: 'https://media.example.test/board-design.webp' },
    });
    button('Seleccionar etapa 03: Diseño').click();
    await fixture.whenStable();
    expect(cards[2].querySelector('img')?.src).toContain('coaster-design');

    button('Mostrar las etapas de Tablas').click();
    await fixture.whenStable();
    expect(cards[2].querySelector('img')?.src).toContain('board-design');
    expect(cards[2].classList.contains('step--active')).toBe(true);
    expect(button('Mostrar las etapas de Tablas').getAttribute('aria-pressed')).toBe('true');
    expect(cards[0].querySelector('.step-state')?.textContent).toContain('En construcción');
    expect(cards[2].querySelector('.step-state')).toBeNull();

    button('Mostrar las etapas de Portavasos').click();
    await fixture.whenStable();
    expect(cards[2].querySelector('img')?.src).toContain('coaster-design');
  });

  it('centres the last and first stage on the same rail reference and moves keyboard focus', async () => {
    const first = button('Seleccionar etapa 01: Idea');
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await fixture.whenStable();
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 2370, behavior: 'instant' });
    expect(cards[6].classList.contains('step--final')).toBe(true);
    expect(cards[6].classList.contains('step--active')).toBe(true);
    expect(document.activeElement).toBe(button('Seleccionar etapa 07: Hecho realidad'));

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    await fixture.whenStable();
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'instant' });
    expect(rail.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.process-navigation')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Etapa anterior"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Etapa siguiente"]')).toBeNull();
  });

  it('lets scrolling interrupt a card selection and updates the nearest card', async () => {
    button('Seleccionar etapa 02: Boceto').click();
    await fixture.whenStable();
    rail.dispatchEvent(new Event('pointerdown'));
    rail.scrollLeft = 395 * 4;
    rail.dispatchEvent(new Event('scrollend'));
    await fixture.whenStable();
    expect(cards[4].classList.contains('step--active')).toBe(true);
    expect(button('Seleccionar etapa 05: Fabricación').getAttribute('aria-current')).toBe('step');
  });

  it('uses distinct SVG gradients for the selector and every placeholder', async () => {
    button('Mostrar las etapas de Tablas').click();
    await fixture.whenStable();
    const gradients = [...fixture.nativeElement.querySelectorAll('linearGradient')] as SVGElement[];
    expect(new Set(gradients.map((gradient) => gradient.id)).size).toBe(gradients.length);
    const traces = [...fixture.nativeElement.querySelectorAll('.idea-icon__trace')] as SVGElement[];
    for (const trace of traces) {
      expect(trace.getAttribute('stroke')).toMatch(/^url\(#idea-trace-/);
      expect(trace.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    }
  });

  it('keeps the cards below a fixed left fade that ends before the centred card', () => {
    const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]);
    const rule = (selector: string) =>
      rules.find(
        (candidate): candidate is CSSStyleRule =>
          candidate instanceof CSSStyleRule && candidate.selectorText.includes(selector),
      );
    const fade = rule('.process-experience')?.selectorText.includes('::before')
      ? rule('.process-experience')
      : rules.find(
          (candidate): candidate is CSSStyleRule =>
            candidate instanceof CSSStyleRule &&
            candidate.selectorText.includes('.process-experience') &&
            candidate.selectorText.includes('::before'),
        );
    const shell = rule('.steps-shell');
    const selector = rule('.idea-stage');
    const componentCss = [...document.querySelectorAll('style')]
      .map((style) => style.textContent)
      .join('\n');

    expect(fade?.style.zIndex).toBe('2');
    expect(fade?.style.width).toContain('/ 2 - 8px');
    expect(componentCss).toContain('var(--forest) calc(100% - 64px)');
    expect(shell?.style.zIndex).toBe('1');
    expect(selector?.style.zIndex).toBe('3');
    expect(selector?.style.left).toContain('/ 2 - 336px');
  });

  it('releases its live media subscription and resize observer on destroy', () => {
    fixture.destroy();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
