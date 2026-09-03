# Cisus

Plataforma Angular multiempresa para comercializar productos Cisus mediante empresas asociadas y sus sucursales. Usa Firebase Authentication, Cloud Functions v2, una base Firestore nombrada y reglas cliente deny-by-default.

## Capacidades

- Una identidad Firebase puede trabajar en varias empresas y sucursales.
- Contratos de acceso, roles, permisos, cupos nominativos y revocación por versiones `pv`/`sv`.
- Acuerdos mayorista, consignación y comisión con precio fijo, bandas o libertad comercial.
- Catálogo público, ofertas por empresa y promociones de descuento/margen.
- Inventario por sucursal con recepciones, ajustes, transferencias, ventas y devoluciones auditables.
- Comprador final con nombre y RUT/teléfono opcionales; esos datos nunca autentican ni autorizan.

## Estructura

```text
cisus-angular/       aplicación Angular 22 oficial
functions/           Cloud Functions y autorización multiempresa
shared/identity/     normalización de documentos de identidad
quality/contracts/   perfil consumidor del Juez portable
docs/architecture/   contrato técnico y de negocio
archivos/            antecedentes comerciales locales (no versionados)
```

## Desarrollo

```bash
npm install
npm --prefix cisus-angular install
npm --prefix functions install
npm start
```

`npm start` inicia únicamente Angular en `http://localhost:4200`, conectado directamente al proyecto productivo configurado localmente: Auth, Firestore, Storage y Functions desplegadas. `npm run dev` queda como alias equivalente. El proyecto no usa emuladores. El entorno de desarrollo y las Functions usan Node.js 22.

Los identificadores reales no se versionan. Copia `.firebaserc.example`, `firebase.example.json` y `cisus-angular/public/runtime-config.example.js` a sus nombres sin `.example`, y completa los valores solo en tu equipo o en el sistema de despliegue. Define además `FIREBASE_PROJECT_ID` y `FIREBASE_FIRESTORE_DATABASE` para Functions y el bootstrap.

Este modo puede modificar datos reales. Usa cuentas y datos de prueba controlados cuando trabajes desde localhost.

## Verificación

```bash
npm run verify
```

Ejecuta build y pruebas Angular, build/pruebas de Functions y el contrato estático multiempresa. El Juez no inicia emuladores ni toca producción; usa huellas por área para evitar repetir gates no afectados.

## Base inicial

El bootstrap no contiene usuarios ni credenciales. Requiere Application Default Credentials y un UID Firebase ya creado:

```powershell
$env:FIREBASE_PROJECT_ID = 'ID_PROYECTO_LOCAL'
$env:FIREBASE_FIRESTORE_DATABASE = 'ID_BASE_LOCAL'
$env:CISUS_BOOTSTRAP_ADMIN_UID = 'UID_REAL'
npm run bootstrap
```

Variables opcionales: `CISUS_BOOTSTRAP_COMPANY_ID`, `CISUS_BOOTSTRAP_COMPANY_NAME`, `CISUS_BOOTSTRAP_BRANCH_ID` y `CISUS_BOOTSTRAP_BRANCH_NAME`. El script crea empresa, casa matriz, sucursal, acuerdo mixto, suscripción, contrato administrador, primer producto y oferta.

## Despliegue

La app web está registrada en App Check con reCAPTCHA Enterprise y su clave pública vive
en `cisus-angular/public/runtime-config.js`. Antes de habilitar enforcement para Functions y
Firestore, despliega esta versión y comprueba que las métricas de App Check reciben solicitudes
verificadas. El desarrollo local se conecta directamente a los servicios desplegados y usa la misma
configuración pública de App Check.

Las imágenes administrables no se hacen públicas en Storage: `uploadPublicMedia` las normaliza a
WebP y `getPublicMediaUrls` entrega URLs temporales a visitantes anónimos con App Check válido.

```bash
npm run deploy
```

No se despliega automáticamente desde pruebas ni desde el bootstrap. El destino se toma de la configuración Firebase local ignorada por Git.
