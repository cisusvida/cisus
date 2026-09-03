import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { Toast } from '../../../../core/services/toast';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(Toast);
  protected readonly errorMessage = signal('');
  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Ingresa tu email.' });
    email(path.email, { message: 'El email no es válido.' });
    required(path.password, { message: 'Ingresa tu contraseña.' });
    minLength(path.password, 6, { message: 'Usa al menos 6 caracteres.' });
  });

  protected login(): void {
    submit(this.loginForm, async () => {
      try {
        this.errorMessage.set('');
        await this.auth.signIn(this.model().email, this.model().password);
        this.toast.show('Bienvenido de vuelta', 'Selecciona tu empresa o sucursal para continuar.');
        await this.router.navigateByUrl(
          this.route.snapshot.queryParamMap.get('returnUrl') || '/cuenta',
        );
      } catch {
        this.errorMessage.set('No pudimos iniciar sesión. Intenta nuevamente.');
      }
    });
  }

  protected async loginWithGoogle(): Promise<void> {
    try {
      this.errorMessage.set('');
      await this.auth.signInWithGoogle();
      this.toast.show('Sesión iniciada', 'Ingresaste con tu cuenta de Google.');
      await this.router.navigateByUrl('/cuenta');
    } catch {
      this.errorMessage.set('No pudimos iniciar sesión con Google. Intenta nuevamente.');
    }
  }
}
