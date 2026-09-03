# Cloud Functions Cisus

Backend Firebase Functions v2 en `southamerica-west1`, conectado a la base nombrada indicada por `FIREBASE_FIRESTORE_DATABASE`.

Cada callable tenant usa `defineScopedCallable`, que valida autenticación, App Check fuera del emulador, versiones de permiso/suscripción, empresa, unidad, proyección, cupo, permiso granular y entitlement. Los callables de bootstrap de contexto son `getAvailableContexts` y `getEntityAccess`; el catálogo público es deliberadamente no tenant.

```bash
npm install
npm run build
npm test
```

Los dominios activos son acceso, empresa/sucursales, catálogo/precios, promociones, compradores, inventario y ventas. Firestore y Storage no se consumen directamente desde Angular.
