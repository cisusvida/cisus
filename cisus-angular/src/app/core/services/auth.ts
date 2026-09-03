import { computed, inject, Service, signal } from '@angular/core';
import type { AccessContext, ActiveAccessContext, User } from '../models/user';
import { FirebaseAuthGateway, type FirebaseIdentity } from './firebase-auth-gateway';

@Service()
export class Auth {
  private readonly gateway = inject(FirebaseAuthGateway);
  private readonly identityState = signal<FirebaseIdentity | undefined>(undefined);
  private readonly contextsState = signal<AccessContext[]>([]);
  private readonly activeContextState = signal<ActiveAccessContext | undefined>(undefined);

  readonly contexts = this.contextsState.asReadonly();
  readonly activeContext = this.activeContextState.asReadonly();
  readonly user = computed<User | undefined>(() => {
    const identity = this.identityState();
    if (!identity) return undefined;
    return {
      id: identity.uid,
      name: identity.displayName || identity.email?.split('@')[0] || 'Usuario Cisus',
      email: identity.email,
      role: this.activeContextState()?.jobRoleId ?? 'unscoped',
    };
  });
  readonly isAuthenticated = computed(() => Boolean(this.identityState()));
  readonly hasActiveContext = computed(() => Boolean(this.activeContextState()));
  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CU'
    );
  });

  constructor() {
    this.gateway.observeIdentity((identity) => {
      this.identityState.set(identity);
      if (!identity) {
        this.contextsState.set([]);
        this.activeContextState.set(undefined);
      }
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    this.identityState.set(await this.gateway.signIn(email, password));
    await this.refreshContexts(true);
  }

  async signInWithGoogle(): Promise<void> {
    this.identityState.set(await this.gateway.signInWithGoogle());
    await this.refreshContexts(true);
  }

  async signUp(name: string, email: string, password: string): Promise<void> {
    this.identityState.set(await this.gateway.signUp(name, email, password));
    await this.refreshContexts(false);
  }

  async switchContext(scopeId: string): Promise<void> {
    if (!this.contextsState().some((context) => context.scopeId === scopeId)) {
      throw new Error('The requested context is not assigned to this user.');
    }
    this.activeContextState.set(await this.gateway.activateContext(scopeId));
  }

  async signOut(): Promise<void> {
    await this.gateway.signOut();
    this.identityState.set(undefined);
    this.contextsState.set([]);
    this.activeContextState.set(undefined);
  }

  private async refreshContexts(activateSingleContext: boolean): Promise<void> {
    const contexts = await this.gateway.listContexts();
    this.contextsState.set(contexts);

    const restored = await this.gateway.restoreActiveContext(contexts);
    if (restored) {
      this.activeContextState.set(restored);
      return;
    }
    if (activateSingleContext && contexts.length === 1) {
      await this.switchContext(contexts[0].scopeId);
    }
  }
}
