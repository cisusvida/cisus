import { computed, inject, Service, signal } from '@angular/core';
import type { AccessContext, ActiveAccessContext, User } from '../models/user';
import { FirebaseAuthGateway, type FirebaseIdentity } from './firebase-auth-gateway';

@Service()
export class Auth {
  private readonly gateway = inject(FirebaseAuthGateway);
  private readonly identityState = signal<FirebaseIdentity | undefined>(undefined);
  private readonly contextsState = signal<AccessContext[]>([]);
  private readonly activeContextState = signal<ActiveAccessContext | undefined>(undefined);
  private identityVersion = 0;
  private contextRefresh: Promise<void> | undefined;

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
      const identityChanged = this.identityState()?.uid !== identity?.uid;
      this.identityState.set(identity);
      if (identityChanged || !identity) {
        ++this.identityVersion;
        this.contextRefresh = undefined;
        this.contextsState.set([]);
        this.activeContextState.set(undefined);
      }
      if (identityChanged && identity) {
        void this.refreshContexts(false).catch(() => undefined);
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

  sendPasswordReset(email: string): Promise<void> {
    return this.gateway.sendPasswordReset(email);
  }

  async switchContext(scopeId: string): Promise<void> {
    if (!this.contextsState().some((context) => context.scopeId === scopeId)) {
      throw new Error('The requested context is not assigned to this user.');
    }
    const version = this.identityVersion;
    const context = await this.gateway.activateContext(scopeId);
    if (version === this.identityVersion) this.activeContextState.set(context);
  }

  async signOut(): Promise<void> {
    await this.gateway.signOut();
    this.identityState.set(undefined);
    this.contextsState.set([]);
    this.activeContextState.set(undefined);
  }

  private async refreshContexts(activateSingleContext: boolean): Promise<void> {
    const version = this.identityVersion;
    if (!this.contextRefresh) {
      const pending = (async () => {
        const contexts = await this.gateway.listContexts();
        if (version !== this.identityVersion) return;
        const restored = await this.gateway.restoreActiveContext(contexts);
        if (version !== this.identityVersion) return;
        this.contextsState.set(contexts);
        this.activeContextState.set(restored);
      })();
      this.contextRefresh = pending;
      const clearPending = () => {
        if (this.contextRefresh === pending) this.contextRefresh = undefined;
      };
      void pending.then(clearPending, clearPending);
    }
    await this.contextRefresh;
    if (version !== this.identityVersion) return;
    if (activateSingleContext && !this.activeContextState() && this.contextsState().length === 1) {
      await this.switchContext(this.contextsState()[0].scopeId);
    }
  }
}
