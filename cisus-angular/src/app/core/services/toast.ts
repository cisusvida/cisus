import { signal, Service } from '@angular/core';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

@Service()
export class Toast {
  private readonly messagesState = signal<ToastMessage[]>([]);
  readonly messages = this.messagesState.asReadonly();

  show(title: string, message: string, tone: ToastMessage['tone'] = 'success'): void {
    const id = Date.now();
    this.messagesState.update((items) => [...items, { id, title, message, tone }]);
    setTimeout(() => this.dismiss(id), 4200);
  }

  dismiss(id: number): void {
    this.messagesState.update((items) => items.filter((item) => item.id !== id));
  }
}
