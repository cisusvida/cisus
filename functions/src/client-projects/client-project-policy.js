'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
exports.allowedClientFilePath = allowedClientFilePath;
exports.buildPublicClientActivity = buildPublicClientActivity;
exports.buildPublicClientTimeline = buildPublicClientTimeline;
exports.clientMembershipId = clientMembershipId;
exports.isDocumentId = isDocumentId;
exports.publicClientFile = publicClientFile;
exports.publicClientProject = publicClientProject;

const { createHash } = require('node:crypto');

const DOCUMENT_ID = /^[a-z0-9][a-z0-9-]{2,119}$/;
const PROJECT_STATUSES = new Set(['quoted', 'confirmed', 'in_production', 'ready', 'delivered']);
const CLIENT_TIMELINE_STATUSES = new Set(['completed', 'current', 'upcoming']);
const CLIENT_TIMELINE_MAX_STAGES = 12;
const CLIENT_TIMELINE_MAX_FILE_IDS = 48;
const CLIENT_FILE_CATEGORY_LABELS = {
  quote: 'Cotización',
  purchase_order: 'Orden de compra',
  invoice: 'Facturación',
  payment: 'Pago',
  design: 'Diseño',
  production_update: 'Avance de producción',
  production_video: 'Videos de producción',
  delivery: 'Entrega',
};

function isDocumentId(value) {
  return typeof value === 'string' && DOCUMENT_ID.test(value);
}

function clientMembershipId(uid, projectId) {
  if (typeof uid !== 'string' || uid.length < 1 || uid.length > 128 || !isDocumentId(projectId)) {
    throw new Error('Invalid client membership identity.');
  }
  const uidFingerprint = createHash('sha256').update(uid).digest('hex').slice(0, 24);
  return `${projectId}__${uidFingerprint}`;
}

function allowedClientFilePath(projectId, storagePath) {
  if (!isDocumentId(projectId) || typeof storagePath !== 'string') return false;
  const prefix = `client-projects/${projectId}/files/`;
  return (
    storagePath.startsWith(prefix) &&
    storagePath.length > prefix.length &&
    !storagePath.includes('..') &&
    !storagePath.includes('\\') &&
    storagePath.split('/').every(Boolean)
  );
}

function text(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function number(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function clientText(value, fallback = '', maximumLength = 240) {
  const normalized = text(value).trim().replace(/\s+/g, ' ');
  return normalized ? normalized.slice(0, maximumLength) : fallback;
}

function clientDate(value) {
  const date = clientText(value, '', 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function clientFileIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isDocumentId))).slice(0, CLIENT_TIMELINE_MAX_FILE_IDS);
}

function publicConfiguredClientTimeline(value) {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set();

  return value.slice(0, CLIENT_TIMELINE_MAX_STAGES).flatMap((stage, index) => {
    const title = clientText(stage?.title, '', 120);
    if (!title) return [];

    const id = isDocumentId(stage?.id) ? stage.id : `stage-${index + 1}`;
    if (seenIds.has(id)) return [];
    seenIds.add(id);

    return [
      {
        id,
        title,
        detail: clientText(stage?.detail, '', 360),
        date: clientDate(stage?.date),
        status: CLIENT_TIMELINE_STATUSES.has(stage?.status) ? stage.status : 'upcoming',
        fileIds: clientFileIds(stage?.fileIds),
      },
    ];
  });
}

function clientFileCategoryLabel(category) {
  return CLIENT_FILE_CATEGORY_LABELS[category] ?? 'Documento compartido';
}

function filesForCategories(files, categories) {
  return files.filter((file) => categories.includes(file.category));
}

function latestFileDate(files, fallback = '') {
  return files.reduce(
    (latest, file) => (file.documentDate > latest ? file.documentDate : latest),
    fallback,
  );
}

function hasEvidence(files, date) {
  return files.length > 0 || Boolean(date);
}

function projectStageRank(status) {
  return {
    quoted: 1,
    confirmed: 2,
    in_production: 3,
    ready: 4,
    delivered: 5,
  }[status];
}

function clientTimelineStage(id, title, detail, date, status, files) {
  return { id, title, detail, date, status, fileIds: files.map((file) => file.fileId) };
}

function defaultClientTimeline(project, files) {
  const rank = projectStageRank(project.status);
  const quoteFiles = filesForCategories(files, ['quote']);
  const orderFiles = filesForCategories(files, ['purchase_order']);
  const invoiceFiles = filesForCategories(files, ['invoice']);
  const paymentFiles = filesForCategories(files, ['payment']);
  const designFiles = filesForCategories(files, ['design']);
  const productionFiles = filesForCategories(files, ['production_update', 'production_video']);
  const deliveryFiles = filesForCategories(files, ['delivery']);

  const quoteComplete = hasEvidence(quoteFiles, project.dates.order);
  const orderComplete = hasEvidence(orderFiles, project.dates.order);
  const invoiceComplete = hasEvidence(invoiceFiles, project.dates.invoice);
  const paymentComplete =
    project.financial.paymentStatus === 'paid' || hasEvidence(paymentFiles, project.dates.payment);
  const financialStatus = paymentComplete ? 'completed' : invoiceComplete ? 'current' : 'upcoming';
  const designComplete = designFiles.length > 0;
  const productionStatus = rank > 3 ? 'completed' : rank === 3 ? 'current' : 'upcoming';
  const deliveryStatus =
    rank >= 5 || deliveryFiles.length > 0 || Boolean(project.dates.delivery)
      ? 'completed'
      : rank === 4
        ? 'current'
        : 'upcoming';

  return [
    clientTimelineStage(
      'quote',
      'Cotización preparada',
      'La cotización quedó incorporada al respaldo del proyecto.',
      latestFileDate(quoteFiles, project.dates.order),
      quoteComplete ? 'completed' : 'upcoming',
      quoteFiles,
    ),
    clientTimelineStage(
      'order',
      'Compra confirmada',
      'La orden de compra autorizada respalda el inicio del proyecto.',
      latestFileDate(orderFiles, project.dates.order),
      orderComplete ? 'completed' : 'upcoming',
      orderFiles,
    ),
    clientTimelineStage(
      'financial',
      'Facturación y pago',
      paymentComplete
        ? 'El pago figura respaldado junto con la documentación tributaria disponible.'
        : 'La facturación o el pago aún no tienen un respaldo disponible para esta cuenta.',
      latestFileDate(
        paymentFiles,
        latestFileDate(invoiceFiles, project.dates.payment || project.dates.invoice),
      ),
      financialStatus,
      [...invoiceFiles, ...paymentFiles],
    ),
    clientTimelineStage(
      'design',
      'Diseño compartido',
      designComplete
        ? 'Hay referencias y diseños de personalización disponibles para revisar.'
        : 'Aún no hay un diseño compartido en el proyecto.',
      latestFileDate(designFiles),
      designComplete ? 'completed' : 'upcoming',
      designFiles,
    ),
    clientTimelineStage(
      'production',
      'Producción',
      productionStatus === 'current'
        ? project.currentStage || 'El proyecto está en producción.'
        : productionStatus === 'completed'
          ? 'La producción cuenta con evidencia disponible en el proyecto.'
          : 'La producción todavía no registra un avance compartido.',
      latestFileDate(productionFiles, project.lastConfirmedAt),
      productionStatus,
      productionFiles,
    ),
    clientTimelineStage(
      'delivery',
      'Entrega',
      deliveryStatus === 'completed'
        ? 'La entrega cuenta con respaldo disponible para esta compra.'
        : deliveryStatus === 'current'
          ? 'El proyecto está listo para coordinar su entrega.'
          : 'La entrega se mostrará aquí cuando exista un respaldo compartido.',
      latestFileDate(deliveryFiles, project.dates.delivery),
      deliveryStatus,
      deliveryFiles,
    ),
  ];
}

/**
 * Returns the only project lifecycle the client may see. Future projects can define
 * `clientTimeline` in their project document; otherwise the safe standard lifecycle is used.
 */
function buildPublicClientTimeline(project, files) {
  const configuredTimeline = project.clientTimeline;
  const timeline = configuredTimeline.length
    ? configuredTimeline
    : defaultClientTimeline(project, files);
  const allowedFileIds = new Set(files.map((file) => file.fileId));

  return timeline.map((stage) => ({
    ...stage,
    fileIds: stage.fileIds.filter((fileId) => allowedFileIds.has(fileId)),
  }));
}

function activityCopy(project, file, isCurrent) {
  const documentName = `“${file.name}”`;
  switch (file.category) {
    case 'quote':
      return {
        title: 'Cotización disponible',
        message: `Se dejó disponible la cotización ${documentName} como respaldo de la propuesta inicial.`,
      };
    case 'purchase_order':
      return {
        title: 'Compra confirmada',
        message: `Se incorporó ${documentName}, confirmando la compra para este proyecto.`,
      };
    case 'invoice':
      return {
        title: 'Documento tributario incorporado',
        message: `Se agregó ${documentName} como respaldo tributario de la compra.`,
      };
    case 'payment':
      return {
        title: 'Pago respaldado',
        message: `Se agregó ${documentName} como respaldo del pago registrado.`,
      };
    case 'design':
      return {
        title: 'Diseño compartido',
        message: `Se compartió ${documentName} para revisar la personalización del pedido.`,
      };
    case 'production_update':
      return {
        title: 'Avance de producción',
        message: isCurrent
          ? `Cisus confirmó el estado actual: ${project.currentStage}. El respaldo ${documentName} muestra el último avance disponible.`
          : `Se agregó ${documentName} como evidencia del avance de producción.`,
      };
    case 'production_video':
      return {
        title: 'Registro de producción',
        message: `Se incorporó el registro audiovisual ${documentName} como evidencia de producción.`,
      };
    case 'delivery':
      return {
        title: 'Entrega respaldada',
        message: `Se incorporó ${documentName} como evidencia de entrega del pedido.`,
      };
    default:
      return {
        title: 'Documento incorporado',
        message: `Se incorporó ${documentName} como respaldo del proyecto.`,
      };
  }
}

function buildPublicClientActivity(project, files, timeline) {
  const currentFileIds = new Set(
    timeline.filter((stage) => stage.status === 'current').flatMap((stage) => stage.fileIds),
  );

  return [...files]
    .sort(
      (left, right) =>
        right.documentDate.localeCompare(left.documentDate) || left.sortOrder - right.sortOrder,
    )
    .map((file) => {
      const isCurrent = currentFileIds.has(file.fileId);
      const copy = activityCopy(project, file, isCurrent);
      return {
        id: `activity-${file.fileId}`,
        author: isCurrent ? 'Cisus · Etapa actual' : 'Cisus · Historial reconstruido',
        title: copy.title,
        message: copy.message,
        date: file.documentDate,
        status: isCurrent ? 'current' : 'completed',
        source: `${file.categoryLabel} · ${file.name}`,
        fileId: file.fileId,
      };
    });
}

function publicClientProject(projectId, data) {
  if (!isDocumentId(projectId)) throw new Error('Invalid client project id.');
  const status = PROJECT_STATUSES.has(data?.status) ? data.status : 'confirmed';
  return {
    projectId,
    projectCode: text(data?.projectCode, projectId),
    companyName: text(data?.companyName, 'Empresa'),
    title: text(data?.title, 'Proyecto Cisus'),
    summary: text(data?.summary),
    status,
    quantity: number(data?.quantity),
    unitLabel: text(data?.unitLabel, 'unidades'),
    currentStage: text(data?.currentStage),
    lastConfirmedAt: text(data?.lastConfirmedAt),
    dates: {
      order: text(data?.dates?.order),
      invoice: text(data?.dates?.invoice),
      payment: text(data?.dates?.payment),
      delivery: text(data?.dates?.delivery),
    },
    financial: {
      currency: text(data?.financial?.currency, 'CLP'),
      net: number(data?.financial?.net),
      tax: number(data?.financial?.tax),
      total: number(data?.financial?.total),
      paymentStatus: data?.financial?.paymentStatus === 'paid' ? 'paid' : 'pending',
      paymentTerms: text(data?.financial?.paymentTerms),
    },
    clientTimeline: publicConfiguredClientTimeline(data?.clientTimeline),
  };
}

function publicClientFile(fileId, data) {
  if (!isDocumentId(fileId) || !isDocumentId(data?.projectId)) {
    throw new Error('Invalid client project file identity.');
  }
  if (!allowedClientFilePath(data.projectId, data.storagePath)) {
    throw new Error('Client file path is outside its project.');
  }
  return {
    fileId,
    projectId: data.projectId,
    name: text(data?.name, 'Archivo'),
    category: text(data?.category, 'other'),
    categoryLabel: clientFileCategoryLabel(text(data?.category, 'other')),
    contentType: text(data?.contentType, 'application/octet-stream'),
    size: number(data?.size),
    documentDate: text(data?.documentDate),
    sortOrder: number(data?.sortOrder),
  };
}
