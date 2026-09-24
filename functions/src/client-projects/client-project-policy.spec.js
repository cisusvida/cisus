'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  allowedClientFilePath,
  buildPublicClientActivity,
  buildPublicClientTimeline,
  clientMembershipId,
  publicClientFile,
  publicClientProject,
} = require('./client-project-policy');

test('membership ids are stable and do not expose the Firebase uid', () => {
  const first = clientMembershipId('sensitive-client-uid', 'frutos-la-aguada-oc-38675');
  const second = clientMembershipId('sensitive-client-uid', 'frutos-la-aguada-oc-38675');
  assert.equal(first, second);
  assert.equal(first.includes('sensitive-client-uid'), false);
});

test('client file paths stay inside the assigned project', () => {
  assert.equal(
    allowedClientFilePath(
      'frutos-la-aguada-oc-38675',
      'client-projects/frutos-la-aguada-oc-38675/files/cotizacion.jpg',
    ),
    true,
  );
  assert.equal(
    allowedClientFilePath(
      'frutos-la-aguada-oc-38675',
      'client-projects/agroindustrial-rosario-oc-292/files/factura.pdf',
    ),
    false,
  );
  assert.equal(
    allowedClientFilePath(
      'frutos-la-aguada-oc-38675',
      'client-projects/frutos-la-aguada-oc-38675/files/../private.pdf',
    ),
    false,
  );
});

test('public project serialization excludes internal ownership fields', () => {
  const project = publicClientProject('frutos-la-aguada-oc-38675', {
    companyName: 'Frutos La Aguada S.A.',
    title: '100 tablas personalizadas',
    status: 'in_production',
    quantity: 100,
    ownerUid: 'must-not-leak',
    financial: { total: 1199996, paymentStatus: 'paid' },
  });
  assert.equal(project.companyName, 'Frutos La Aguada S.A.');
  assert.equal(project.financial.total, 1199996);
  assert.equal('ownerUid' in project, false);
});

test('public file serialization validates its project path and omits the path', () => {
  const file = publicClientFile('factura-la-aguada', {
    projectId: 'frutos-la-aguada-oc-38675',
    storagePath: 'client-projects/frutos-la-aguada-oc-38675/files/factura.pdf',
    name: 'Factura 2',
    contentType: 'application/pdf',
    visibility: 'client_shared',
  });
  assert.equal(file.name, 'Factura 2');
  assert.equal('storagePath' in file, false);
  assert.equal('visibility' in file, false);
});

test('the public timeline accepts future project stages and associates only shared public files', () => {
  const project = publicClientProject('frutos-la-aguada-oc-38675', {
    status: 'in_production',
    currentStage: 'Producción activa',
    clientTimeline: [
      {
        id: 'design-review',
        title: 'Revisión de diseño',
        detail: 'El cliente puede revisar la personalización.',
        date: '2026-01-02',
        status: 'current',
        fileIds: ['design-la-aguada', 'not-shared-file'],
        ownerUid: 'must-not-leak',
      },
    ],
  });
  const files = [
    publicClientFile('design-la-aguada', {
      projectId: 'frutos-la-aguada-oc-38675',
      storagePath: 'client-projects/frutos-la-aguada-oc-38675/files/design.jpeg',
      name: 'Diseño final',
      category: 'design',
      documentDate: '2026-01-02',
      sortOrder: 1,
    }),
  ];

  const timeline = buildPublicClientTimeline(project, files);
  assert.deepEqual(timeline, [
    {
      id: 'design-review',
      title: 'Revisión de diseño',
      detail: 'El cliente puede revisar la personalización.',
      date: '2026-01-02',
      status: 'current',
      fileIds: ['design-la-aguada'],
    },
  ]);
  assert.equal('ownerUid' in timeline[0], false);
});

test('the server builds a safe standard timeline and activity when a future project has no custom stages', () => {
  const project = publicClientProject('frutos-la-aguada-oc-38675', {
    status: 'in_production',
    currentStage: 'Producción activa',
    lastConfirmedAt: '2026-01-14',
    dates: { order: '2025-11-04', invoice: '', payment: '', delivery: '' },
    financial: { paymentStatus: 'pending' },
  });
  const files = [
    publicClientFile('quote-la-aguada', {
      projectId: 'frutos-la-aguada-oc-38675',
      storagePath: 'client-projects/frutos-la-aguada-oc-38675/files/quote.jpg',
      name: 'Cotización',
      category: 'quote',
      documentDate: '2025-11-04',
      sortOrder: 1,
    }),
    publicClientFile('production-la-aguada', {
      projectId: 'frutos-la-aguada-oc-38675',
      storagePath: 'client-projects/frutos-la-aguada-oc-38675/files/advance.jpeg',
      name: 'Avance de producción',
      category: 'production_update',
      documentDate: '2026-01-14',
      sortOrder: 2,
    }),
  ];

  const timeline = buildPublicClientTimeline(project, files);
  const activity = buildPublicClientActivity(project, files, timeline);

  assert.deepEqual(
    timeline.map((stage) => stage.id),
    ['quote', 'order', 'financial', 'design', 'production', 'delivery'],
  );
  assert.equal(timeline.find((stage) => stage.id === 'production')?.status, 'current');
  assert.equal(activity[0].fileId, 'production-la-aguada');
  assert.equal(activity[0].status, 'current');
  assert.equal(activity[0].source, 'Avance de producción · Avance de producción');
  assert.equal('storagePath' in activity[0], false);
});
