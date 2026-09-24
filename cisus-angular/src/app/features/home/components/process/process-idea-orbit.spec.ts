import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { IdeaOrbitOption, ProcessIdeaOrbit } from './process-idea-orbit';

@Component({
  imports: [ProcessIdeaOrbit],
  template: `<app-process-idea-orbit
    [ideas]="ideas()"
    [selectedId]="selected()"
    (selection)="selected.set($event)"
  />`,
})
class OrbitHost {
  readonly ideas = signal<readonly IdeaOrbitOption[]>(
    Array.from({ length: 5 }, (_, index) => ({
      id: `idea-${index}`,
      label: `Idea ${index + 1}`,
      illustration: 'coaster',
      status: 'realized',
    })),
  );
  readonly selected = signal('idea-0');
}

describe('Process idea wheel', () => {
  let fixture: ComponentFixture<OrbitHost>;
  const button = (label: string) =>
    fixture.nativeElement.querySelector(
      `button:not(:disabled)[aria-label="${label}"]`,
    ) as HTMLButtonElement;
  const disc = (label: string) => button(label).querySelector('.orbit-choice__disc') as HTMLElement;
  beforeEach(async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    await TestBed.configureTestingModule({ imports: [OrbitHost] }).compileComponents();
    fixture = TestBed.createComponent(OrbitHost);
    await fixture.whenStable();
  });
  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('rotates, selects and wraps a future catalogue without hardcoded product positions', async () => {
    button('Mostrar las etapas de Idea 1').focus();
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-4');
    expect(
      button('Mostrar las etapas de Idea 5').closest('.orbit-arm')?.getAttribute('style'),
    ).toContain('180deg');
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-0');
    button('Mostrar las etapas de Idea 2').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-1');
    expect(button('Mostrar las etapas de Idea 2').getAttribute('aria-pressed')).toBe('true');
    expect(
      fixture.nativeElement.querySelectorAll('.orbit-arm:not(.orbit-arm--hidden)'),
    ).toHaveLength(3);
  });

  it('keeps keyboard focus with the selection as other ideas leave the visible arc', async () => {
    button('Mostrar las etapas de Idea 1').focus();
    for (let index = 0; index < 3; index++) {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      await fixture.whenStable();
    }
    expect(fixture.componentInstance.selected()).toBe('idea-3');
    expect(document.activeElement).toBe(button('Mostrar las etapas de Idea 4'));
    expect(button('Mostrar las etapas de Idea 1')).toBeNull();
  });

  it('keeps the keyboard focus cue on the circular icon rather than framing the whole product', async () => {
    button('Mostrar las etapas de Idea 1').focus();
    await fixture.whenStable();
    const focusRule = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .find(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule &&
          rule.selectorText.includes('.orbit-choice') &&
          rule.selectorText.includes(':focus-visible') &&
          rule.style.outline === 'none',
      );
    expect(focusRule?.style.outline).toBe('none');
    expect(focusRule?.style.boxShadow).toBe('none');
  });

  it('shows only the selected idea title and never renders a subtitle', () => {
    const selectedLabel = fixture.nativeElement.querySelector(
      '.orbit-choice--selected .orbit-choice__label',
    ) as HTMLElement;
    const unselectedLabel = fixture.nativeElement.querySelector(
      '.orbit-choice:not(.orbit-choice--selected) .orbit-choice__label',
    ) as HTMLElement;
    expect(getComputedStyle(selectedLabel).visibility).toBe('visible');
    expect(getComputedStyle(unselectedLabel).visibility).toBe('hidden');
    expect(fixture.nativeElement.querySelector('.orbit-choice__status')).toBeNull();
  });

  it('accepts wheel gestures only on icons and leaves empty space and zoom to the page', async () => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const dial = fixture.nativeElement.querySelector('.orbit-dial') as HTMLElement;
    const pageScroll = new WheelEvent('wheel', { deltaY: 35, bubbles: true, cancelable: true });
    dial.dispatchEvent(pageScroll);
    expect(pageScroll.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.selected()).toBe('idea-0');
    for (let index = 0; index < 8; index++) {
      disc('Mostrar las etapas de Idea 1').dispatchEvent(
        new WheelEvent('wheel', { deltaY: 35, bubbles: true, cancelable: true }),
      );
    }
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-1');
    now += 300;
    disc('Mostrar las etapas de Idea 2').dispatchEvent(new WheelEvent('wheel', { deltaY: 35 }));
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-2');
    const zoom = new WheelEvent('wheel', { deltaY: 35, ctrlKey: true, cancelable: true });
    disc('Mostrar las etapas de Idea 3').dispatchEvent(zoom);
    expect(zoom.defaultPrevented).toBe(false);
  });

  it('previews a drag on the arc and commits once, without the following click selecting again', async () => {
    const dial = fixture.nativeElement.querySelector('.orbit-dial') as HTMLElement;
    const pointer = (type: string, y: number) =>
      (type === 'pointerdown' ? disc('Mostrar las etapas de Idea 1') : dial).dispatchEvent(
        new PointerEvent(type, {
          pointerId: 1,
          clientX: 100,
          clientY: y,
          button: 0,
          bubbles: true,
        }),
      );
    pointer('pointerdown', 100);
    pointer('pointermove', 175);
    await fixture.whenStable();
    expect(dial.classList.contains('orbit-dial--dragging')).toBe(true);
    pointer('pointerup', 175);
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-1');
    button('Mostrar las etapas de Idea 1').dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-1');
    expect(dial.classList.contains('orbit-dial--dragging')).toBe(false);
  });

  it('accepts keyboard activation immediately after a drag even without a pointer click', async () => {
    const dial = fixture.nativeElement.querySelector('.orbit-dial') as HTMLElement;
    const pointer = (type: string, y: number) =>
      (type === 'pointerdown' ? disc('Mostrar las etapas de Idea 1') : dial).dispatchEvent(
        new PointerEvent(type, {
          pointerId: 1,
          clientX: 100,
          clientY: y,
          button: 0,
          bubbles: true,
        }),
      );
    pointer('pointerdown', 100);
    pointer('pointermove', 175);
    pointer('pointerup', 175);
    await fixture.whenStable();

    button('Mostrar las etapas de Idea 1').dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 0 }),
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.selected()).toBe('idea-0');
  });

  it('does not start a drag in the empty dial', async () => {
    const dial = fixture.nativeElement.querySelector('.orbit-dial') as HTMLElement;
    for (const [type, y] of [
      ['pointerdown', 100],
      ['pointermove', 180],
      ['pointerup', 180],
    ] as const) {
      dial.dispatchEvent(
        new PointerEvent(type, {
          pointerId: 1,
          clientX: 100,
          clientY: y,
          button: 0,
          bubbles: true,
        }),
      );
    }
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-0');
    expect(dial.classList.contains('orbit-dial--dragging')).toBe(false);
  });

  it('continues past the selected slot instead of swapping two products back and forth', async () => {
    fixture.componentInstance.ideas.update((ideas) => ideas.slice(0, 2));
    await fixture.whenStable();
    const outgoing = button('Mostrar las etapas de Idea 1');
    const incoming = button('Mostrar las etapas de Idea 2');
    incoming.click();
    await fixture.whenStable();
    expect(button('Mostrar las etapas de Idea 2')).toBe(incoming);
    expect(incoming.closest('.orbit-arm')?.getAttribute('style')).toContain('180deg');
    expect(outgoing.closest('.orbit-arm')?.getAttribute('style')).toContain('134deg');
    expect(outgoing.disabled).toBe(true);
    const nextOccurrence = button('Mostrar las etapas de Idea 1');
    expect(nextOccurrence).not.toBe(outgoing);
    expect(nextOccurrence.closest('.orbit-arm')?.getAttribute('style')).toContain('226deg');
    nextOccurrence.click();
    await fixture.whenStable();
    expect(button('Mostrar las etapas de Idea 1')).toBe(nextOccurrence);
    expect(nextOccurrence.closest('.orbit-arm')?.getAttribute('style')).toContain('180deg');
    expect(fixture.nativeElement.querySelectorAll('button:not(:disabled)')).toHaveLength(2);
  });

  it('renders no redundant navigation controls when there is only one idea', async () => {
    fixture.componentInstance.ideas.update((ideas) => ideas.slice(0, 1));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.orbit-navigation')).toBeNull();
    expect(fixture.nativeElement.querySelector('.orbit-help')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Idea anterior"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Idea siguiente"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.orbit-choice')).toHaveLength(1);
  });
});
