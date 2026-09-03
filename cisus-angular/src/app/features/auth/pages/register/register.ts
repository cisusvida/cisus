import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { Toast } from '../../../../core/services/toast';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  protected readonly model = signal({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  protected readonly registerForm = form(this.model, (path) => {
    required(path.name, { message: 'Ingresa tu nombre.' });
    minLength(path.name, 3, { message: 'Escribe tu nombre completo.' });
    required(path.email, { message: 'Ingresa tu email.' });
    email(path.email, { message: 'El email no es válido.' });
    required(path.password, { message: 'Crea una contraseña.' });
    minLength(path.password, 8, { message: 'Usa al menos 8 caracteres.' });
    required(path.confirmPassword, { message: 'Repite la contraseña.' });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(path.password)
        ? undefined
        : { kind: 'passwordMatch', message: 'Las contraseñas no coinciden.' },
    );
    validate(path.acceptTerms, ({ value }) =>
      value() ? undefined : { kind: 'terms', message: 'Debes aceptar los términos.' },
    );
  });

  protected register(): void {
    submit(this.registerForm, async () => {
      await this.auth.signUp(this.model().name, this.model().email, this.model().password);
      this.toast.show('Cuenta creada', 'Un administrador debe asignarte un contexto de trabajo.');
      await this.router.navigateByUrl('/cuenta');
    });
  }
}
