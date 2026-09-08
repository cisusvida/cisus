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
    fixture.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
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
    expect(button('Mostrar las etapas de Idea 1').disabled).toBe(true);
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

  it('accepts one wheel detent per gesture and leaves browser zoom alone', async () => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const dial = fixture.nativeElement.querySelector('.orbit-dial') as HTMLElement;
    for (let index = 0; index < 8; index++) {
      dial.dispatchEvent(new WheelEvent('wheel', { deltaY: 35, cancelable: true }));
    }
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-1');
    now += 300;
    dial.dispatchEvent(new WheelEvent('wheel', { deltaY: 35 }));
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-2');
    const zoom = new WheelEvent('wheel', { deltaY: 35, ctrlKey: true, cancelable: true });
    dial.dispatchEvent(zoom);
    expect(zoom.defaultPrevented).toBe(false);
  });

  it('previews a drag on the arc and commits once, without the following click selecting again', async () => {
    const dial = fixture.nativeElement.querySelector('.orbit-dial') as HTMLElement;
    const pointer = (type: string, y: number) =>
      dial.dispatchEvent(
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
    button('Mostrar las etapas de Idea 1').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('idea-1');
    expect(dial.classList.contains('orbit-dial--dragging')).toBe(false);
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
