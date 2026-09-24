import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import { ClientProjectsGateway } from '../../../../core/services/client-projects-gateway';
import { Toast } from '../../../../core/services/toast';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly clientProjects = inject(ClientProjectsGateway);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(Toast);
  protected readonly errorMessage = signal('');
  protected readonly resetPending = signal(false);
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
        const destination = await this.destinationAfterLogin();
        this.toast.show(
          'Bienvenido de vuelta',
          destination === '/mis-proyectos'
            ? 'Tus proyectos y documentos ya están disponibles.'
            : 'Selecciona tu empresa o sucursal para continuar.',
        );
        await this.router.navigateByUrl(destination);
      } catch {
        this.errorMessage.set('No pudimos iniciar sesión. Intenta nuevamente.');
      }
    });
  }

  protected async loginWithGoogle(): Promise<void> {
    try {
      this.errorMessage.set('');
      await this.auth.signInWithGoogle();
      const destination = await this.destinationAfterLogin();
      this.toast.show(
        'Sesión iniciada',
        destination === '/mis-proyectos'
          ? 'Tus proyectos y documentos ya están disponibles.'
          : 'Ingresaste con tu cuenta de Google.',
      );
      await this.router.navigateByUrl(destination);
    } catch {
      this.errorMessage.set('No pudimos iniciar sesión con Google. Intenta nuevamente.');
    }
  }

  protected async resetPassword(): Promise<void> {
    const accountEmail = this.model().email.trim();
    if (!accountEmail) {
      this.errorMessage.set('Escribe primero el correo de la cuenta que quieres recuperar.');
      return;
    }
    this.resetPending.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.sendPasswordReset(accountEmail);
      this.toast.show(
        'Revisa tu correo',
        'Si la cuenta existe, Firebase enviará un enlace para crear una nueva contraseña.',
      );
    } catch {
      this.errorMessage.set('No pudimos enviar el enlace de recuperación. Intenta nuevamente.');
    } finally {
      this.resetPending.set(false);
    }
  }

  private async destinationAfterLogin(): Promise<string> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) return returnUrl;
    if (this.auth.hasActiveContext() || this.auth.contexts().length > 0) return '/cuenta';
    try {
      if ((await this.clientProjects.listProjects()).length > 0) return '/mis-proyectos';
    } catch {
      // The account page remains the safe fallback if the client endpoint is unavailable.
    }
    return '/cuenta';
  }
}
