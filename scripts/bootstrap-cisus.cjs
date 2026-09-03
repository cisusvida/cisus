'use strict';

const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE;
const adminUid = process.env.CISUS_BOOTSTRAP_ADMIN_UID;
const companyId = process.env.CISUS_BOOTSTRAP_COMPANY_ID || 'cisus_partner_demo';
const companyName = process.env.CISUS_BOOTSTRAP_COMPANY_NAME || 'Empresa asociada Cisus';
const branchId = process.env.CISUS_BOOTSTRAP_BRANCH_ID || `${companyId}_principal`;
const branchName = process.env.CISUS_BOOTSTRAP_BRANCH_NAME || 'Sucursal principal';

const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{3,180}$/.test(value);
for (const [name, value] of Object.entries({ FIREBASE_PROJECT_ID: projectId, FIREBASE_FIRESTORE_DATABASE: databaseId })) {
  if (!validId(value)) {
    console.error(`Define ${name} con un identificador válido en el entorno local.`);
    process.exit(1);
  }
}
if (!validId(adminUid)) {
  console.error('Define CISUS_BOOTSTRAP_ADMIN_UID con el UID real del administrador inicial.');
  process.exit(1);
}
for (const [name, value] of Object.entries({ companyId, branchId })) {
  if (!validId(value)) {
    console.error(`${name} debe usar solo letras, números, guion o guion bajo.`);
    process.exit(1);
  }
}

const app = initializeApp({ credential: applicationDefault(), projectId });
const database = getFirestore(app, databaseId);

async function bootstrap() {
  await getAuth(app).getUser(adminUid);
  const timestamp = FieldValue.serverTimestamp();
  const contractId = `${companyId}__${adminUid}__admin`;
  const batch = database.batch();
  batch.set(database.collection('companies').doc(companyId), {
    name: companyName, status: 'active', createdAt: timestamp, updatedAt: timestamp,
  }, { merge: true });
  batch.set(database.collection('business_units').doc(companyId), {
    companyId, name: companyName, type: 'company', status: 'active', updatedAt: timestamp,
  }, { merge: true });
  batch.set(database.collection('business_units').doc(branchId), {
    companyId, name: branchName, type: 'branch', status: 'active', updatedAt: timestamp,
  }, { merge: true });
  batch.set(database.collection('partner_agreements').doc(companyId), {
    companyId,
    status: 'active',
    commercialModels: ['wholesale', 'consignment', 'commission'],
    pricingAuthority: 'company_freedom',
    currency: 'CLP',
    contractVersion: 1,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(database.collection('subscription_entitlements').doc(companyId), {
    companyId,
    status: 'active',
    planId: 'partner_full',
    subscriptionVersionNonce: 1,
    entitlements: ['multi_branch', 'customer_identity', 'advanced_pricing', 'margin_promotions', 'stock_transfers', 'advanced_analytics'],
    limits: { seats: { max: 10 } },
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(database.collection('access_contracts').doc(contractId), {
    uid: adminUid,
    companyId,
    scopeUnitId: companyId,
    jobRoleId: 'company_admin',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy: 'bootstrap-script',
  }, { merge: true });
  batch.set(database.collection('products').doc('cisus_tabla_clasica'), {
    sku: 'CIS-TAB-001',
    name: 'Tabla Cisus clásica',
    description: 'Tabla de madera Cisus para compartir y regalar.',
    imagePath: null,
    basePrice: 28990,
    currency: 'CLP',
    status: 'active',
    isPublic: true,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(database.collection('public_site_content').doc('home'), {
    heroImagePath: null,
    updatedAt: timestamp,
    updatedBy: 'bootstrap-script',
  }, { merge: true });
  batch.set(database.collection('company_product_offers').doc(`${companyId}__cisus_tabla_clasica`), {
    companyId,
    productId: 'cisus_tabla_clasica',
    enabled: true,
    commercialModel: 'wholesale',
    fixedPrice: 28990,
    minPrice: 26990,
    maxPrice: 32990,
    commissionRate: 0,
    updatedBy: 'bootstrap-script',
    updatedAt: timestamp,
  }, { merge: true });
  await batch.commit();
  console.log(`Base Cisus creada en ${projectId}/${databaseId}.`);
  console.log(`Empresa: ${companyId}; sucursal: ${branchId}; contrato: ${contractId}.`);
  console.log('La proyección y el cupo se crearán mediante onAccessContractChange.');
}

bootstrap().catch((error) => {
  console.error('No fue posible crear la base Cisus:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
