import { Component, inject } from '@angular/core';
import { Toast as ToastService } from '../../core/services/toast';

@Component({
  imports: [],
  selector: 'app-toast',
  styleUrl: './toast.scss',
  templateUrl: './toast.html',
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
