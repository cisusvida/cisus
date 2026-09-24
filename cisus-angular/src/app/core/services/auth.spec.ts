import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { FirebaseAuthGateway, type FirebaseIdentity } from './firebase-auth-gateway';
import type { ActiveAccessContext } from '../models/user';
import { vi } from 'vitest';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

describe('Auth session restoration', () => {
  let identityChanged: (identity: FirebaseIdentity | undefined) => void;
  const context: ActiveAccessContext = {
    scopeId: 'designer',
    companyId: 'cisus',
    companyName: 'Cisus',
    entityId: 'cisus',
    entityName: 'Cisus',
    jobRoleId: 'cisus_designer',
    scopeLevel: 'company',
    pv: 1,
    sv: 1,
    permissions: ['public_media.manage'],
  };
  const identity: FirebaseIdentity = { uid: 'designer', displayName: 'Designer', email: null };
  const listContexts = vi.fn();
  const restoreActiveContext = vi.fn();
  beforeEach(() => {
    listContexts.mockReset().mockResolvedValue([context]);
    restoreActiveContext.mockReset().mockResolvedValue(context);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FirebaseAuthGateway,
          useValue: {
            observeIdentity: (listener: typeof identityChanged) => {
              identityChanged = listener;
            },
            listContexts,
            restoreActiveContext,
          },
        },
      ],
    });
  });
  it('restores the designer context when Firebase restores a saved session', async () => {
    const auth = TestBed.inject(Auth);
    identityChanged(identity);
    await vi.waitFor(() => expect(auth.activeContext()).toEqual(context));
    expect(auth.user()?.role).toBe('cisus_designer');
    identityChanged(identity);
    expect(listContexts).toHaveBeenCalledOnce();
  });
  it('does not restore permissions after sign-out while a request is pending', async () => {
    let resolve!: (value: ActiveAccessContext) => void;
    restoreActiveContext.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const auth = TestBed.inject(Auth);
    identityChanged(identity);
    await vi.waitFor(() => expect(restoreActiveContext).toHaveBeenCalledOnce());
    identityChanged(undefined);
    resolve(context);
    await Promise.resolve();
    await Promise.resolve();
    expect(auth.activeContext()).toBeUndefined();
    expect(auth.contexts()).toEqual([]);
  });
});
