import { inject, Service } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import type { ClientProject } from '../models/client-project';
import { FirebaseClient } from './firebase-client';

@Service()
export class ClientProjectsGateway {
  private readonly functions = inject(FirebaseClient).functions;

  async listProjects(): Promise<ClientProject[]> {
    const callable = httpsCallable<undefined, { projects: ClientProject[] }>(
      this.functions,
      'getMyClientProjects',
    );
    return (await callable()).data.projects;
  }

  async getFileUrl(projectId: string, fileId: string): Promise<{ url: string; expiresAt: number }> {
    const callable = httpsCallable<
      { projectId: string; fileId: string },
      { url: string; expiresAt: number }
    >(this.functions, 'getClientProjectFileUrl');
    return (await callable({ projectId, fileId })).data;
  }
}
