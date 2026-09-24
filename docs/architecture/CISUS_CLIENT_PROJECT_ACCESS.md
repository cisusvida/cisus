# Acceso de clientes a proyectos y archivos

## Decisión de seguridad

Un cliente final no es personal de Cisus ni de una empresa asociada. Por eso no se representa con
un `access_contract`, no recibe permisos de operación y no consume un cupo nominal.

- El personal interno conserva el flujo `access_contracts` → `scoped_user_permissions` → token con
  contexto.
- Los clientes usan `client_project_memberships`, con una membresía explícita por UID y proyecto.
- Firestore y Storage continúan cerrados al SDK del navegador. Toda lectura privada pasa por Cloud
  Functions.
- Los archivos se guardan en `client-projects/{projectId}/files/...` y se abren con URLs V4 de diez
  minutos emitidas después de volver a validar la membresía.

## Colecciones

### `client_projects/{projectId}`

Contiene el resumen que el cliente puede ver: empresa, código, estado, cantidad, fechas y totales.
No contiene permisos ni rutas de Storage.

### `client_project_memberships/{projectId}__{uidHash}`

Fuente de verdad del acceso del cliente:

- `uid`
- `projectId`
- `accessRole: client_owner`
- `status: active | suspended`

El identificador usa un hash del UID; la Function calcula el mismo valor y hace una lectura directa.

### `client_project_files/{fileId}`

Metadatos backend-only. Cada registro debe tener `projectId`, `storagePath`, `visibility:
client_shared` y `status: active`. La ruta se rechaza si no pertenece al prefijo del proyecto.

## Functions

- `getMyClientProjects`: lista solo proyectos con una membresía activa para `request.auth.uid`.
- `getClientProjectFileUrl`: vuelve a validar membresía, visibilidad, estado y ruta antes de firmar el
  archivo. Cada apertura deja un registro en `audit_logs`.

Ambas requieren Firebase Authentication y App Check fuera del emulador.

## Roles internos recuperados

- `jonathan.maldonado.h@gmail.com`: `platform_admin`, sin cupo nominal.
- `designer@cisus.cl`: `cisus_designer`, limitado a lectura básica y `public_media.manage`.
- `jfloressm@frutoslaaguada.cl`: cliente final; únicamente las membresías de sus proyectos.

La cuenta `admin@cisus.cl` usada para administrar Google Cloud no reemplaza a la identidad de
aplicación de Jonathan.

## Semilla local y recuperación

La información privada no se versiona. El manifiesto `archivos/client-projects.seed.json` y sus
documentos fuente están ignorados por Git. El script versionado valida todos los archivos antes de
realizar cambios y es idempotente por email, proyecto, membresía, archivo y hash SHA-256.

Validación local, sin cambios remotos:

```powershell
npm run seed:client-projects
```

Aplicación al proyecto revisado:

```powershell
$env:FIREBASE_PROJECT_ID = 'cisus-3b180'
$env:FIRESTORE_DATABASE_ID = 'cisusdb'
$env:FIREBASE_STORAGE_BUCKET = 'cisus-3b180.firebasestorage.app'
$env:GOOGLE_CLOUD_QUOTA_PROJECT = 'cisus-3b180'
$env:CISUS_GOOGLE_ACCESS_TOKEN = gcloud auth print-access-token
npm run seed:client-projects -- --apply
```

El script no genera ni guarda contraseñas. Una cuenta nueva debe usar “¿La olvidaste?” en `/login`
para establecerla, o ingresar con Google cuando corresponda.

## Datos reconstruidos

La semilla recupera dos compras gestionadas por Jflores:

- Frutos La Aguada S.A.: OC 38675, 100 tablas, total facturado y pagado de $1.199.996.
- Servicios Agroindustriales Rosario Limitada: OC 292, 60 tablas, total facturado y pagado de
  $719.998.

Los estados se presentan como el último hecho respaldado por los archivos locales; no se infieren
hitos posteriores sin evidencia.
