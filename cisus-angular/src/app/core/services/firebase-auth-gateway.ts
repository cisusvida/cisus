import { inject, Service } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import type { AccessContext, ActiveAccessContext } from '../models/user';
import { FirebaseClient } from './firebase-client';

export interface FirebaseIdentity {
  uid: string;
  displayName: string | null;
  email: string | null;
}

interface AvailableContextsResponse {
  contexts: AccessContext[];
}

interface EntityAccessResponse {
  customToken: string;
  context: ActiveAccessContext;
}

@Service()
export class FirebaseAuthGateway {
  private readonly client = inject(FirebaseClient);

  observeIdentity(listener: (identity: FirebaseIdentity | undefined) => void): () => void {
    return onAuthStateChanged(this.client.auth, (user) => listener(this.toIdentity(user)));
  }

  async signIn(email: string, password: string): Promise<FirebaseIdentity> {
    const credential = await signInWithEmailAndPassword(this.client.auth, email, password);
    return this.requiredIdentity(credential.user);
  }

  async signInWithGoogle(): Promise<FirebaseIdentity> {
    const credential = await signInWithPopup(this.client.auth, new GoogleAuthProvider());
    return this.requiredIdentity(credential.user);
  }

  async signUp(name: string, email: string, password: string): Promise<FirebaseIdentity> {
    const credential = await createUserWithEmailAndPassword(this.client.auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return this.requiredIdentity(credential.user);
  }

  async listContexts(): Promise<AccessContext[]> {
    const callable = httpsCallable<undefined, AvailableContextsResponse>(
      this.client.functions,
      'getAvailableContexts',
    );
    return (await callable()).data.contexts;
  }

  async activateContext(scopeId: string): Promise<ActiveAccessContext> {
    const callable = httpsCallable<{ scopeId: string }, EntityAccessResponse>(
      this.client.functions,
      'getEntityAccess',
    );
    const response = (await callable({ scopeId })).data;
    await signInWithCustomToken(this.client.auth, response.customToken);
    return response.context;
  }

  async restoreActiveContext(contexts: AccessContext[]): Promise<ActiveAccessContext | undefined> {
    const currentUser = this.client.auth.currentUser;
    if (!currentUser) return undefined;
    const claims = (await currentUser.getIdTokenResult()).claims;
    const scopeId = typeof claims['scopeId'] === 'string' ? claims['scopeId'] : undefined;
    const selected = contexts.find((context) => context.scopeId === scopeId);
    if (!selected) return undefined;

    const pv = claims['pv'];
    const sv = claims['sv'];
    const permissions = claims['permissions'];
    if (
      typeof pv !== 'number' ||
      typeof sv !== 'number' ||
      !Array.isArray(permissions) ||
      permissions.some((permission) => typeof permission !== 'string')
    ) {
      return undefined;
    }
    return { ...selected, pv, sv, permissions: permissions as string[] };
  }

  signOut(): Promise<void> {
    return signOut(this.client.auth);
  }

  private toIdentity(user: FirebaseUser | null): FirebaseIdentity | undefined {
    return user ? { uid: user.uid, displayName: user.displayName, email: user.email } : undefined;
  }

  private requiredIdentity(user: FirebaseUser): FirebaseIdentity {
    const identity = this.toIdentity(user);
    if (!identity) throw new Error('Firebase did not return an authenticated identity.');
    return identity;
  }
}
