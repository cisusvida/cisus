import { Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PurchaseIntentDialog } from './purchase-intent-dialog';
import type { PurchaseIntentChoice, PurchaseIntentContext } from './purchase-intent.types';

@Component({
  imports: [PurchaseIntentDialog],
  template: `
    <button #trigger type="button" (click)="open()">Abrir selector</button>
    <app-purchase-intent-dialog
      #selector
      (intentSelected)="onSelected($event)"
      (cancelled)="onCancelled()"
    />
  `,
})
class PurchaseIntentDialogHost {
  @ViewChild('trigger', { read: ElementRef }) trigger!: ElementRef<HTMLButtonElement>;
  @ViewChild('selector') selector!: PurchaseIntentDialog;

  context: PurchaseIntentContext = {
    productId: 'tabla-felino',
    productName: 'Felino',
    optionLabels: ['Con canaleta'],
    isConcept: false,
  };
  readonly choices: PurchaseIntentChoice[] = [];
  cancellationCount = 0;

  open(context = this.context): void {
    this.selector.open(context, this.trigger.nativeElement);
  }

  onSelected(choice: PurchaseIntentChoice): void {
    this.choices.push(choice);
  }

  onCancelled(): void {
    this.cancellationCount += 1;
  }
}

describe('PurchaseIntentDialog', () => {
  let fixture: ComponentFixture<PurchaseIntentDialogHost>;
  let host: PurchaseIntentDialogHost;
  let dialog: HTMLDialogElement;

  const openDialog = async (): Promise<void> => {
    host.trigger.nativeElement.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PurchaseIntentDialogHost] }).compileComponents();
    fixture = TestBed.createComponent(PurchaseIntentDialogHost);
    host = fixture.componentInstance;
    await fixture.whenStable();

    dialog = fixture.nativeElement.querySelector('dialog');
    Object.defineProperty(dialog, 'showModal', {
      configurable: true,
      value: vi.fn(() => dialog.setAttribute('open', '')),
    });
    Object.defineProperty(dialog, 'close', {
      configurable: true,
      value: vi.fn(() => dialog.removeAttribute('open')),
    });
  });

  it('shows the captured product, options, and four intentions in order without mutating the source', async () => {
    const source = {
      ...host.context,
      optionLabels: [...host.context.optionLabels],
    };

    host.open(source);
    source.optionLabels.push('Cambio externo');
    await fixture.whenStable();

    expect(dialog.querySelector('h2')?.textContent?.trim()).toBe('¿Para qué lo quieres?');
    expect(dialog.textContent).toContain('Felino');
    expect(dialog.textContent).toContain('Opciones: Con canaleta');
    expect(dialog.textContent).not.toContain('Cambio externo');
    expect(
      [...dialog.querySelectorAll<HTMLButtonElement>('[data-intent]')].map(
        (button) => button.dataset['intent'],
      ),
    ).toEqual(['personal', 'corporate', 'resale', 'new_idea']);
    expect(dialog.getAttribute('aria-labelledby')).toBe(dialog.querySelector('h2')?.id);
    expect(document.activeElement).toBe(dialog.querySelector('[data-intent="personal"]'));
  });

  it.each([
    ['personal', 'Para mí o para regalar'],
    ['corporate', 'Para una empresa'],
    ['resale', 'Para vender en mi tienda'],
    ['new_idea', 'Quiero desarrollar una idea'],
  ] as const)('emits the %s choice once with its captured context', async (intent, title) => {
    await openDialog();
    const choiceButton = dialog.querySelector<HTMLButtonElement>(`[data-intent="${intent}"]`);
    expect(choiceButton?.textContent).toContain(title);

    choiceButton?.click();
    await fixture.whenStable();
    choiceButton?.click();

    expect(host.choices).toEqual([{ intent, context: host.context }]);
    expect(host.cancellationCount).toBe(0);
    expect(dialog.close).toHaveBeenCalledOnce();
    expect(host.trigger.nativeElement.isConnected).toBe(true);
    expect(document.activeElement).toBe(host.trigger.nativeElement);
  });

  it('cancels from the close button once and restores focus', async () => {
    await openDialog();
    const closeButton = dialog.querySelector<HTMLButtonElement>(
      'button[aria-label="Cerrar selección"]',
    );

    expect(closeButton?.textContent).toContain('Cerrar');
    closeButton?.click();
    host.selector.close();
    await fixture.whenStable();

    expect(host.choices).toEqual([]);
    expect(host.cancellationCount).toBe(1);
    expect(dialog.close).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(host.trigger.nativeElement);
  });

  it('treats Escape as one cancellation and restores focus', async () => {
    await openDialog();
    const escape = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(escape);
    await fixture.whenStable();

    expect(escape.defaultPrevented).toBe(true);
    expect(host.choices).toEqual([]);
    expect(host.cancellationCount).toBe(1);
    expect(dialog.close).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(host.trigger.nativeElement);
  });

  it('updates context when reopened while open without calling showModal again', async () => {
    await openDialog();
    const updatedContext: PurchaseIntentContext = {
      productId: 'pomo-orbita',
      productName: 'Órbita',
      optionLabels: ['Acabado natural'],
      isConcept: true,
    };

    host.open(updatedContext);
    await fixture.whenStable();

    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.textContent).toContain('Órbita');
    expect(dialog.textContent).not.toContain('Felino');
    dialog.querySelector<HTMLButtonElement>('[data-intent="new_idea"]')?.click();

    expect(host.choices).toEqual([{ intent: 'new_idea', context: updatedContext }]);
    expect(host.cancellationCount).toBe(0);
  });

  it('uses the latest context after a completed choice and a later opening', async () => {
    const firstContext = host.context;
    await openDialog();
    dialog.querySelector<HTMLButtonElement>('[data-intent="personal"]')?.click();
    await fixture.whenStable();

    host.context = {
      productId: 'pomo-orbita',
      productName: 'Órbita',
      optionLabels: [],
      isConcept: true,
    };
    const secondContext = host.context;
    await openDialog();
    dialog.querySelector<HTMLButtonElement>('[data-intent="corporate"]')?.click();

    expect(host.choices).toEqual([
      { intent: 'personal', context: firstContext },
      { intent: 'corporate', context: secondContext },
    ]);
    expect(dialog.showModal).toHaveBeenCalledTimes(2);
  });

  it('shows only the evaluation notice for a concept', async () => {
    host.context = {
      productId: 'idea',
      productName: 'Propuesta · Repisa orgánica',
      optionLabels: [],
      isConcept: true,
    };
    await openDialog();

    expect(dialog.textContent).toContain(
      'Modelo en desarrollo · Su fabricación requiere evaluación.',
    );
    expect(dialog.textContent).not.toMatch(/precio|disponibilidad|pago/i);
  });

  it('does not throw or restore focus to a trigger that has been removed', async () => {
    await openDialog();
    host.trigger.nativeElement.remove();

    expect(() => host.selector.close()).not.toThrow();
    await fixture.whenStable();

    expect(host.cancellationCount).toBe(1);
  });

  it('emits nothing when the component is destroyed', async () => {
    await openDialog();

    fixture.destroy();

    expect(host.choices).toEqual([]);
    expect(host.cancellationCount).toBe(0);
  });
});
