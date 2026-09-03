# Cisus multiempresa: seguridad y modelo comercial

Estado: implementado el 2026-08-30.

Angular es el único frontend. Una identidad Firebase puede tener contratos independientes con varias empresas y sucursales. El RUT, teléfono y correo del comprador son datos comerciales opcionales y nunca claves de autenticación, autorización o tenant.

## Cadena de acceso

```text
Firebase Auth uid
  -> access_contracts/{contractId}                 fuente de verdad
  -> scoped_user_permissions/{scopeId}             proyección
  -> user_permission_state/{uid}.permissionVersionNonce (pv)
  -> subscription_entitlements/{companyId}.subscriptionVersionNonce (sv)
  -> token {pv, sv, cid, entityId, jobRoleId, scopeId, scopeLevel, permissions}
  -> Cloud Function con validación fresca
```

Cada operación tenant valida autenticación/App Check, `pv`, `sv`, suscripción activa, empresa, unidad, proyección, cupo nominativo, permiso granular, entitlement y ownership del recurso. Storage es backend-only y Firestore también, salvo el read model explícito `public_site_content/home`, que solo expone rutas de imágenes ya visibles en la portada y nunca acepta escrituras del cliente.

## Medios públicos

Las imágenes administrables de portada y productos viven bajo `public-media/home/{asset}/**` y `public-media/products/{productId}/**`. Storage no permite leerlas ni escribirlas directamente, incluso sin login. `getPublicMediaUrls` acepta únicamente assets de portada conocidos o productos activos y públicos, exige App Check, aplica rate limiting y entrega URLs v4 de siete días. Angular persiste cada URL por ruta y la renueva cinco minutos antes de expirar; una ruta nueva invalida naturalmente la caché anterior.

`uploadPublicMedia` es la única vía de carga: exige contexto fresco completo, `catalog.manage` y un rol interno de Cisus, valida máximo 8 MB y formatos JPG/PNG/WebP, elimina metadatos al recodificar con Sharp, genera WebP versionado y registra auditoría. Los activos estáticos de marca continúan en Angular Hosting.

App Check usa reCAPTCHA Enterprise en la app web, con los dominios autorizados de Hosting y el origen de desarrollo `localhost`. La clave pública vive en el archivo local ignorado `runtime-config.js`; los identificadores del entorno y los secretos no se almacenan en el repositorio. El frontend local usa Firebase producción de forma explícita y no activa emuladores por hostname. El enforcement de Functions y Firestore se habilita solo después de desplegar esta versión y observar solicitudes verificadas en las métricas.

## Dominio

- Plataforma: `companies`, `business_units`, `access_contracts`, `scoped_user_permissions`, `user_permission_state`, `subscription_entitlements`, `company_seat_allocations`, `partner_agreements`, `audit_logs`.
- Comercio: `products`, `company_product_offers`, `promotions`, `sales`, `sale_lines`, `returns`.
- Inventario: `branch_inventory` como saldo transaccional y `stock_movements` inmutables.
- Compradores: `customers`, `customer_documents` y `customer_company_links` para visibilidad por empresa.

Todo registro operacional contiene `companyId`; los registros de sucursal también contienen `branchId`. Las transferencias comprueban que origen y destino pertenezcan a la empresa activa.

## Modelo comercial

`partner_agreements` permite mayorista, consignación y comisión. La autoridad de precio es `cisus_fixed`, `cisus_bands` o `company_freedom`. La Cloud Function de venta recalcula precio, descuento, margen/comisión y stock; nunca confía en un total enviado por Angular.

Las suscripciones activan módulos y límites. Los roles con operación consumen cupos nominativos; una sesión por sí sola no consume cupo. Una modificación de acceso incrementa `pv`, revocando tokens previos sin impedir los demás contextos válidos del mismo usuario.

## Roles iniciales

`platform_admin`, `cisus_commercial_admin`, `cisus_operations`, `company_admin`, `branch_manager`, `sales_associate`, `inventory_operator` y `finance_viewer`. Los roles son plantillas; la proyección efectiva y sus permisos son la autoridad.

## Juez

Cisus consume un motor Juez externo y portable mediante `quality/contracts`. `npm run verify` ejecuta localmente el perfil completo: Angular, Functions y contrato multiempresa, sin iniciar emuladores ni acceder a producción.

## Políticas que el negocio debe fijar

- finalidad, consentimiento y retención de RUT/teléfono;
- documento tributario por modelo comercial;
- ventana de devolución/anulación;
- aprobaciones por monto para mermas, ajustes y transferencias;
- calendario y fórmula final de liquidaciones.
