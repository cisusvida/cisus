import { Component, ElementRef, output, signal, viewChild } from '@angular/core';
import type { PurchaseIntent, PurchaseIntentChoice, PurchaseIntentContext } from './purchase-intent.types';

interface IntentOption {
  readonly intent: PurchaseIntent;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-purchase-intent-dialog',
  standalone: true,
  templateUrl: './purchase-intent-dialog.html',
  styleUrl: './purchase-intent-dialog.scss',
})
export class PurchaseIntentDialog {
  private static nextInstanceId = 0;

  protected readonly titleId = `purchase-intent-title-${PurchaseIntentDialog.nextInstanceId++}`;
  protected readonly context = signal<PurchaseIntentContext | null>(null);
  protected readonly intents: readonly IntentOption[] = [
    {
      intent: 'personal',
      title: 'Para mí o para regalar',
      description: 'Elegir una o algunas piezas.',
    },
    {
      intent: 'corporate',
      title: 'Para una empresa',
      description: 'Regalos corporativos y pedidos por cantidad.',
    },
    {
      intent: 'resale',
      title: 'Para vender en mi tienda',
      description: 'Conocer la oferta y condiciones de reventa.',
    },
    {
      intent: 'new_idea',
      title: 'Quiero desarrollar una idea',
      description: 'Explorar una pieza a partir de este producto.',
    },
  ];

  readonly intentSelected = output<PurchaseIntentChoice>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly firstIntent = viewChild<ElementRef<HTMLButtonElement>>('firstIntent');
  private isOpen = false;
  private returnFocusTo: HTMLElement | null = null;

  open(context: PurchaseIntentContext, returnFocusTo?: HTMLElement): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) return;

    const alreadyOpen = this.isOpen;
    this.context.set(this.copyContext(context));

    if (!alreadyOpen) {
      this.returnFocusTo = returnFocusTo ?? this.activeHTMLElement();
      dialog.showModal();
      this.isOpen = true;
    }

    this.firstIntent()?.nativeElement.focus({ preventScroll: true });
  }

  close(): void {
    if (!this.isOpen) return;

    this.finish();
    this.cancelled.emit();
    this.restoreFocus();
  }

  protected choose(intent: PurchaseIntent): void {
    const context = this.context();
    if (!this.isOpen || !context) return;

    this.finish();
    this.intentSelected.emit({ intent, context: this.copyContext(context) });
    this.restoreFocus();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  private finish(): void {
    this.isOpen = false;
    this.dialog()?.nativeElement.close();
    this.context.set(null);
  }

  private restoreFocus(): void {
    const target = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  private activeHTMLElement(): HTMLElement | null {
    const active = document.activeElement;
    return typeof HTMLElement !== 'undefined' && active instanceof HTMLElement ? active : null;
  }

  private copyContext(context: PurchaseIntentContext): PurchaseIntentContext {
    return { ...context, optionLabels: [...context.optionLabels] };
  }
}
