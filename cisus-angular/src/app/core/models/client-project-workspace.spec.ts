import { describe, expect, it } from 'vitest';
import type { ClientProject } from './client-project';
import { buildClientProjectWorkspace } from './client-project-workspace';

const project: ClientProject = {
  projectId: 'project-one',
  projectCode: 'OC-1',
  companyName: 'Empresa',
  title: 'Tablas personalizadas',
  summary: 'Proyecto de prueba',
  status: 'in_production',
  quantity: 20,
  unitLabel: 'tablas',
  currentStage: 'Producción — último avance disponible',
  lastConfirmedAt: '2026-01-14',
  dates: { order: '2025-11-10', invoice: '2025-11-21', payment: '2026-01-05', delivery: '' },
  financial: {
    currency: 'CLP',
    net: 100,
    tax: 19,
    total: 119,
    paymentStatus: 'paid',
    paymentTerms: 'Contado',
  },
  clientTimeline: [
    {
      id: 'brief',
      title: 'Brief aprobado',
      detail: 'La propuesta quedó respaldada para producción.',
      date: '2025-11-04',
      status: 'completed',
      fileIds: ['quote-one'],
    },
    {
      id: 'fabricacion',
      title: 'Fabricación en curso',
      detail: 'El último avance está disponible para revisar.',
      date: '2026-01-14',
      status: 'current',
      fileIds: ['production-one'],
    },
    {
      id: 'entrega',
      title: 'Entrega',
      detail: 'La entrega se mostrará cuando exista un respaldo.',
      date: '',
      status: 'upcoming',
      fileIds: [],
    },
  ],
  clientActivity: [
    {
      id: 'activity-production-one',
      author: 'Cisus · Etapa actual',
      title: 'Avance de producción',
      message: 'El último avance está disponible para revisar.',
      date: '2026-01-14',
      status: 'current',
      source: 'Avance de producción · Avance',
      fileId: 'production-one',
    },
    {
      id: 'activity-quote-one',
      author: 'Cisus · Historial reconstruido',
      title: 'Cotización disponible',
      message: 'La cotización quedó disponible para revisar.',
      date: '2025-11-04',
      status: 'completed',
      source: 'Cotización · Cotización',
      fileId: 'quote-one',
    },
  ],
  files: [
    {
      fileId: 'quote-one',
      projectId: 'project-one',
      name: 'Cotización',
      category: 'quote',
      categoryLabel: 'Cotización',
      contentType: 'application/pdf',
      size: 120,
      documentDate: '2025-11-04',
      sortOrder: 10,
    },
    {
      fileId: 'production-one',
      projectId: 'project-one',
      name: 'Avance',
      category: 'production_update',
      categoryLabel: 'Avance de producción',
      contentType: 'image/jpeg',
      size: 120,
      documentDate: '2026-01-14',
      sortOrder: 20,
    },
  ],
};

describe('buildClientProjectWorkspace', () => {
  it('renders the future-proof timeline supplied by the server and associates only its public files', () => {
    const workspace = buildClientProjectWorkspace(project);

    expect(workspace.timeline.map((entry) => entry.id)).toEqual([
      'brief',
      'fabricacion',
      'entrega',
    ]);
    expect(workspace.timeline.find((entry) => entry.id === 'fabricacion')?.status).toBe('current');
    expect(workspace.timeline.find((entry) => entry.id === 'fabricacion')?.files).toHaveLength(1);
    expect(workspace.timeline.find((entry) => entry.id === 'entrega')?.status).toBe('upcoming');
  });

  it('reconstructs one dated history entry per real document and keeps the current evidence visible', () => {
    const workspace = buildClientProjectWorkspace(project);

    expect(workspace.updates.map((entry) => entry.id)).toEqual([
      'activity-production-one',
      'activity-quote-one',
    ]);
    expect(workspace.updates[0]).toMatchObject({
      title: 'Avance de producción',
      status: 'current',
      source: 'Avance de producción · Avance',
    });
    expect(workspace.fileGroups[0].label).toBe('Cotización');
  });
});
