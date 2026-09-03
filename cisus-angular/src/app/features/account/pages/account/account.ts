import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth';
import type { CompanyWorkspace } from '../../../../core/models/commerce';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { Footer } from '../../../../shared/footer/footer';
import { signal } from '@angular/core';

@Component({
  imports: [RouterLink, Footer],
  selector: 'app-account',
  styleUrl: './account.scss',
  templateUrl: './account.html',
})
export class Account {
  protected readonly auth = inject(Auth);
  private readonly commerce = inject(CommerceGateway);
  protected readonly workspace = signal<CompanyWorkspace | undefined>(undefined);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() {
    if (this.auth.hasActiveContext()) void this.loadWorkspace();
  }

  protected async switchContext(event: Event): Promise<void> {
    const scopeId = (event.target as HTMLSelectElement).value;
    if (scopeId) {
      await this.auth.switchContext(scopeId);
      await this.loadWorkspace();
    }
  }

  private async loadWorkspace(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.workspace.set(await this.commerce.getCompanyWorkspace());
    } catch {
      this.error.set('No pudimos cargar la empresa activa. Revisa tu contrato y suscripción.');
    } finally {
      this.loading.set(false);
    }
  }
}
