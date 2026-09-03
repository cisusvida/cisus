import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { Toast } from '../../../../core/services/toast';

@Component({
  imports: [FormField],
  selector: 'app-contact',
  styleUrl: './contact.scss',
  templateUrl: './contact.html',
})
export class Contact {
  private readonly toast = inject(Toast);
  protected readonly model = signal({ name: '', email: '', phone: '', message: '' });
  protected readonly contactForm = form(this.model, (path) => {
    required(path.name, { message: 'Cuéntanos tu nombre.' });
    minLength(path.name, 2, { message: 'Escribe al menos 2 caracteres.' });
    required(path.email, { message: 'Necesitamos tu email.' });
    email(path.email, { message: 'Ingresa un email válido.' });
    required(path.message, { message: 'Cuéntanos qué necesitas saber sobre Cisus.' });
    minLength(path.message, 12, { message: 'Agrega un poco más de contexto.' });
  });

  protected onSubmit(): void {
    submit(this.contactForm, async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.toast.show('Mensaje enviado', 'Gracias. Te contactaremos dentro de un día hábil.');
      this.model.set({ name: '', email: '', phone: '', message: '' });
      this.contactForm().reset();
    });
  }
}
