import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import type { ClientProject, ClientProjectFile } from '../../../../core/models/client-project';
import {
  buildClientProjectWorkspace,
  type ClientProjectWorkspace,
} from '../../../../core/models/client-project-workspace';
import { ClientProjectsGateway } from '../../../../core/services/client-projects-gateway';
import { Toast } from '../../../../core/services/toast';
import { Footer } from '../../../../shared/footer/footer';

type WorkspacePanel = 'overview' | 'timeline' | 'updates' | 'files';

const STATUS_LABELS: Record<ClientProject['status'], string> = {
  quoted: 'Cotizado',
  confirmed: 'Confirmado',
  in_production: 'En producción',
  ready: 'Listo para entrega',
  delivered: 'Entregado',
};

const PANELS: ReadonlyArray<{ id: WorkspacePanel; label: string }> = [
  { id: 'overview', label: 'Resumen' },
  { id: 'timeline', label: 'Proceso' },
  { id: 'updates', label: 'Seguimiento' },
  { id: 'files', label: 'Archivos' },
];

@Component({
  imports: [Footer],
  selector: 'app-client-projects',
  styleUrl: './client-projects.scss',
  templateUrl: './client-projects.html',
})
export class ClientProjects {
  private readonly gateway = inject(ClientProjectsGateway);
  private readonly toast = inject(Toast);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly projects = signal<ClientProject[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly openingFile = signal<string | undefined>(undefined);
  protected readonly activePanel = signal<WorkspacePanel>('overview');
  protected readonly requestedProjectId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('projectId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('projectId') ?? '' },
  );
  protected readonly selectedProject = computed(() => {
    const projectId = this.requestedProjectId();
    return projectId
      ? this.projects().find((project) => project.projectId === projectId)
      : undefined;
  });
  protected readonly workspace = computed<ClientProjectWorkspace | undefined>(() => {
    const project = this.selectedProject();
    return project ? buildClientProjectWorkspace(project) : undefined;
  });
  protected readonly panels = PANELS;

  constructor() {
    void this.load();
  }

  protected statusLabel(status: ClientProject['status']): string {
    return STATUS_LABELS[status];
  }

  protected formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected formatDate(value: string): string {
    if (!value) return 'Sin fecha disponible';
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return value;
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  protected fileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected fileMark(file: ClientProjectFile): string {
    if (file.contentType === 'application/pdf') return 'PDF';
    if (file.contentType.startsWith('video/')) return '▶';
    return 'IMG';
  }

  protected selectProject(project: ClientProject): void {
    this.activePanel.set('overview');
    void this.router.navigate(['/mis-proyectos', project.projectId]);
  }

  protected showProjectList(): void {
    this.activePanel.set('overview');
    void this.router.navigateByUrl('/mis-proyectos');
  }

  protected selectPanel(panel: WorkspacePanel): void {
    this.activePanel.set(panel);
  }

  protected async openFile(project: ClientProject, file: ClientProjectFile): Promise<void> {
    const popup = window.open('', '_blank');
    if (popup) popup.opener = null;
    this.openingFile.set(file.fileId);
    try {
      const { url } = await this.gateway.getFileUrl(project.projectId, file.fileId);
      if (popup) popup.location.href = url;
      else window.location.href = url;
    } catch {
      popup?.close();
      this.toast.show('No pudimos abrir el archivo', 'Actualiza la página e inténtalo nuevamente.');
    } finally {
      this.openingFile.set(undefined);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.projects.set(await this.gateway.listProjects());
    } catch {
      this.error.set(
        'No pudimos cargar tus proyectos. Vuelve a iniciar sesión e inténtalo nuevamente.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
