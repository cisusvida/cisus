# Medios públicos administrables de Cisus

Esta es la referencia operativa para imágenes editables de Home, Proceso y Productos. Su objetivo es evitar
redescubrir la arquitectura en cada cambio.

## Regla principal

Una imagen administrable no es un asset del frontend. El binario vive en Firebase Storage, Firestore conserva
únicamente su ruta activa y Angular resuelve una URL pública desde el backend. El dashboard es la vía normal de
edición para el rol `cisus_designer`.

```text
Dashboard → uploadPublicMedia → validar/recodificar WebP → Storage versionado
                                      ↓
                         Firestore (ruta) + audit_logs
                                      ↓
Angular snapshot → getPublicMediaUrls → URL pública revocable → componente
```

## Entorno conocido

| Recurso                  | Valor                             |
| ------------------------ | --------------------------------- |
| Firebase project         | `cisus-3b180`                     |
| Firestore database       | `cisusdb`                         |
| Storage bucket           | `cisus-3b180.firebasestorage.app` |
| Región de Functions      | `southamerica-west1`              |
| Variable backend de base | `FIRESTORE_DATABASE_ID=cisusdb`   |

No usar variables nuevas con prefijo `FIREBASE_`: Firebase CLI reserva ese prefijo. Para Functions, la configuración
local del proyecto se carga desde `functions/.env.cisus-3b180`, ignorado por Git.

## Contratos por tipo

### Personalización opcional por producto — 20 de septiembre de 2026

En **Editar imágenes → Personalización opcional**, el modal permite habilitar el botón, escribir el nombre
(hasta 40 caracteres; por ejemplo `canaleta`) y publicar su superposición. El botón muestra un signo
`+` dentro del círculo y el nombre; su etiqueta accesible anuncia `Agregar {nombre}` o `Quitar {nombre}`.
Guardar solo el nombre o deshabilitar el botón no exige volver a cargar la imagen.
La carga y la configuración son pasos independientes: si falla la configuración después de subir,
el editor conserva la imagen publicada para reintentar sin otra carga.

- `product_customization` usa `products/{productId}.customizationImagePath` y el prefijo versionado
  `public-media/product-customizations/{productId}/`. La configuración es `customization: { enabled, label }`.
- La superposición comparte proporción, lienzo y encuadre con `sceneImagePath`, sin consumir las seis capas
  editoriales ni participar en su animación. Reemplazar la base también valida la proporción de esta imagen.
- `configurePublicMedia` exige el mismo contexto fresco, permiso `public_media.manage` y rol interno existente;
  valida nombre, base y ruta propia antes de habilitar, y registra auditoría. Las reglas no cambian.
- `listPublicProducts` y `listCompanyCatalog` exponen solo nombre, estado y referencia prevista. La URL se
  resuelve mediante `getPublicMediaUrls`, únicamente para productos activos y públicos, con la caché existente.
- Los productos sin configuración siguen sin botón. No hay migración, imagen inicial ni habilitación automática.

### Imagen de las tarjetas en Otras colecciones — 23 de septiembre de 2026

En **Editar imágenes → Producto**, cada fila de imagen tiene un tick para elegirla como representación del producto
en las tarjetas de **Otras colecciones**. Solo se permite una capa a la vez; sin ticks se conserva la selección
automática (escena base → foto de catálogo). Una fila dedicada permite publicar una imagen exclusiva para las
tarjetas; la carga la selecciona en la misma escritura. `relatedImageSource` guarda `auto` o el rol administrado:
`product_scene`, `product`, `product_thumbnail`, `product_customization`, `product_related` o una capa `product_scene_2`
a `product_scene_6`. Los valores antiguos `scene`, `catalog` y `thumbnail` se normalizan al leerlos.

- La miniatura sigue siendo independiente para el selector de modelos, aunque el diseñador puede marcarla para la tarjeta.
- La configuración usa `configurePublicMedia` mediante `CommerceGateway`; exige contexto fresco de empresa,
  permiso `public_media.manage`, rol interno y auditoría. Una elección explícita requiere ruta administrada del mismo
  producto para la escena, catálogo, miniatura, personalización, imagen exclusiva o capa seleccionada; no acepta rutas ni IDs libres.
- La imagen exclusiva usa `product_related` y se guarda en `public-media/product-related/{productId}/`; no altera la foto de
  catálogo ni las capas de la escena.
- `listPublicProducts` y `listCompanyCatalog` exponen el valor validado desde un único mapeador. Si la imagen elegida
  deja de estar disponible o falla al cargar, Home vuelve al orden automático. La ficha, la escena principal y el
  selector de modelos mantienen sus propias fuentes.
- La escena base nueva recomienda **1600 × 989 px** (proporción áurea aproximada). Es una referencia editorial, no una
  validación de formato. La base histórica puede conservarse; las capas 2–6 y la personalización deben coincidir con
  sus dimensiones, y una transición a otra proporción requiere preparar esas capas antes.

La implementación local requiere desplegar `uploadPublicMedia`, `configurePublicMedia`, `getPublicMediaUrls`,
`listPublicProducts`, `listCompanyCatalog` y Hosting coordinadamente. Sin el callable actualizado, el sitio que usa
Firebase productivo rechazará el nuevo valor y la carga exclusiva; el editor informa ese caso por separado de los
errores de sesión. Hay que desplegar también `downloadPublicMedia` antes de usar el nuevo destino. La comprobación
de código corresponde a Juez `full`; la apariencia y alineación se comprueban con la imagen real cuando se autorice
revisar la UI. No se migran preferencias antiguas ni se cambia Storage Rules.

### Ampliación contextual del 17 de septiembre de 2026

Implementación local; requiere desplegar las Functions modificadas y nuevas antes de usar las acciones ampliadas contra producción. No se migran ni eliminan imágenes existentes.

- Portada: se conservan `hero` y `hero_carving`; las capas 3–6 usan targets `hero_layer_3` … `hero_layer_6`, campos `heroLayer3Path` … `heroLayer6Path` y el mismo prefijo versionado de Home por target.
- Producto: base `product_scene` / `sceneImagePath`; superposiciones `product_scene_2` … `product_scene_6`, campos `sceneLayer2Path` … `sceneLayer6Path`, objetos `public-media/product-layers/{productId}/{index}/`. La lista blanca admite hasta seis capas contando la base.
- Miniatura: `product_thumbnail` / `thumbnailImagePath`, objetos `public-media/product-thumbnails/{productId}/`; no sustituye `imagePath` ni `sceneImagePath`. En ausencia de miniatura sigue funcionando el fallback anterior.
- La configuración `heroAnimation` / `sceneAnimation` acepta `none`, `appear`, `disappear`.
  `heroAnimationLayerKeys` / `sceneAnimationLayerKeys` son el contrato canónico: Home guarda targets
  (`hero`, `hero_carving`, `hero_layer_3` … `hero_layer_6`) y producto guarda kinds
  (`product_scene`, `product_scene_2` … `product_scene_6`). Se permite una capa o la base junto con una
  superposición. Una lista vacía solo se usa con `none`; el editor la muestra como una elección pendiente.
  Los campos `heroAnimationTarget` / `sceneAnimationTarget` (`first`, `last`, `both`) se conservan para
  compatibilidad de lectura. Si falta la lista nueva, Home y `listPublicProducts` resuelven esos valores a
  las capas publicadas actuales. Un cliente antiguo que envía solo `animation` no puede sustituir claves
  estables ya guardadas.
- Antes de que una publicación agregue una capa a un documento antiguo, `uploadPublicMedia` fija las claves
  que correspondían al target anterior en la misma escritura de Firestore. `last` queda fijado a la última
  superposición que ya existía y `both` a la base más esa superposición. Si no había superposición para un
  target `last` o `both`, guarda `none` y una lista vacía; la persona debe elegir un destino después de
  publicar. No hay migración masiva. El orden de dibujo sigue siendo base y luego superposiciones; no hay
  reordenamiento.
- La personalización opcional no participa en la animación: se dibuja encima de toda la composición y
  mantiene su propio botón. Los efectos se reproducen una vez; **Reproducir** reinicia el efecto sin guardar
  configuración. `prefers-reduced-motion` conserva el estado final de aparecer o desaparecer.
- Los campos se crean en la primera publicación explícita, sin bootstrap masivo. `listPublicProducts` expone solo los nuevos campos editoriales previstos; el resolver sigue exigiendo producto activo y público.

El editor contextual identifica producto o idea de Proceso y enumera sus destinos; muestra proporciones, vista previa y calidad. El editor de composición es un diálogo con las vistas **Composición** y **Archivo** y una sola zona desplazable. La composición muestra primero las superposiciones y al final la base; descargar o reemplazar una fila no cambia el destinatario de animación. El pie de composición indica que los cambios se guardan automáticamente. En **Archivo**, Cancelar descarta el archivo elegido que aún no se publicó. Escape, el botón de cierre y el fondo cierran el diálogo, salvo durante la publicación. La vista pública existente sirve como vista previa.

`downloadPublicMedia` entrega el WebP activo en base64 al editor autenticado, con tamaño acotado a 8 MB. No recibe una URL ni una ruta libre: resuelve tipo/target contra su documento administrado. Así la descarga no depende de un fetch del navegador a Storage. `configurePublicMedia` guarda el modo de animación y su auditoría. Ambos usan `defineScopedCallable`, `public_media.manage`, contexto fresco de empresa y roles internos, igual que la carga; no se abren reglas.

Al cargar una superposición, el servidor comprueba proporción respecto de la base. Al reemplazar la base, comprueba las capas existentes. Se conservan márgenes transparentes y no se recortan para alinear. Las imágenes base históricas 1672 × 941 son referencia (~16:9), las miniaturas recomiendan 1:1 y Proceso ~3:4; en una composición ya publicada prevalece el lienzo real de la base.

Para desplegar este contrato, publicar primero Functions (`uploadPublicMedia`, `getPublicMediaUrls`, `listPublicProducts`, `listCompanyCatalog`, `downloadPublicMedia` y `configurePublicMedia`) y después Hosting con editor y renderizado. Esta tarea no publica recursos. No modificar reglas ni subir imágenes como prueba. Validar primero con Juez `full`; una prueba con límites de Firebase simulados no certifica la descarga real en el entorno desplegado.

| Tipo               | Ruta activa en Firestore      | Campos / condición                                                      | Prefijo exacto en Storage                  |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| Home               | `public_site_content/home`    | `heroImagePath`, `heroCarvingImagePath`, `portfolioBackgroundImagePath` | `public-media/home/{targetId}/`            |
| Proceso            | `public_site_content/process` | campos indicados abajo                                                  | `public-media/process/{targetId}/`         |
| Producto           | `products/{productId}`        | `imagePath`; producto `active` y `isPublic`                             | `public-media/products/{productId}/`       |
| Escena de producto | `products/{productId}`        | `sceneImagePath`; producto `active` y `isPublic`                        | `public-media/product-scenes/{productId}/` |

El proceso conserva siete etapas universales. Cada idea seleccionable tiene una secuencia de
imágenes para esas mismas etapas; nunca se acepta una ruta libre desde el navegador.

Portavasos usa deliberadamente los targets y campos históricos, por lo que las imágenes ya
publicadas siguen visibles sin renombrar ni mover objetos de Storage. Tablas usa targets nuevos.

| `stepId`     | Título         | Portavasos: target / campo Firestore | Tablas: target / campo Firestore                  |
| ------------ | -------------- | ------------------------------------ | ------------------------------------------------- |
| `idea`       | Idea           | `idea` / `ideaImagePath`             | `tablas_idea` / `tablasIdeaImagePath`             |
| `sketch`     | Boceto         | `sketch` / `sketchImagePath`         | `tablas_sketch` / `tablasSketchImagePath`         |
| `design`     | Diseño         | `design` / `designImagePath`         | `tablas_design` / `tablasDesignImagePath`         |
| `prototype`  | Prototipo      | `prototype` / `prototypeImagePath`   | `tablas_prototype` / `tablasPrototypeImagePath`   |
| `production` | Fabricación    | `production` / `productionImagePath` | `tablas_production` / `tablasProductionImagePath` |
| `delivery`   | Distribución   | `delivery` / `deliveryImagePath`     | `tablas_delivery` / `tablasDeliveryImagePath`     |
| `result`     | Hecho realidad | `result` / `resultImagePath`         | `tablas_result` / `tablasResultImagePath`         |

Los objetos de Tablas se publican bajo prefijos versionados tales como
`public-media/process/tablas_idea/`. Añadir otra idea requiere sus siete targets explícitos,
campos, prefijos y pruebas: esta lista blanca es intencional.

Los documentos `public_site_content/home` y `public_site_content/process` son read models públicos y solo contienen
rutas. Las reglas impiden toda escritura desde el cliente. Storage permanece deny-by-default.

## Escritura y autorización

`uploadPublicMedia` es la única vía usada por el dashboard:

1. exige Firebase Auth, App Check y contexto fresco con `scopeLevel === 'company'`;
2. exige `public_media.manage` y un rol de `PLATFORM_MEDIA_ROLES`;
3. acepta JPG, PNG o WebP de hasta 8 MB;
4. elimina metadatos implícitamente al recodificar con Sharp, limita a 1200 px para Proceso/Productos y 1920 px para Home/escenas;
5. escribe WebP en una ruta versionada, con calidad 82 por defecto; el parámetro opcional `quality`
   solo acepta 82 (recomendada), 76 (ligera) o 68 (compacta), manteniendo `alphaQuality: 100`;
6. guarda un `firebaseStorageDownloadTokens` nuevo en el objeto;
7. actualiza la ruta en Firestore y crea `audit_logs/public_media_uploaded` en el mismo lote lógico.

`cisus_designer` tiene el conjunto mínimo `companies.read`, `catalog.read` y `public_media.manage`. Solo
`platform_admin` puede asignar roles internos Cisus; un administrador de empresa asociada no puede escalar a este rol.

## Lectura pública

`PublicMediaUrlService` observa las rutas de Home o Proceso y solicita al callable `getPublicMediaUrls` solo las
referencias necesarias. El callable valida listas blancas y prefijos exactos; para productos, además confirma que sean
públicos y activos.

Los objetos nuevos usan una URL de descarga Firebase revocable basada en su token. Un objeto legado sin token intenta
una URL V4 firmada de siete días. Angular vincula la caché a la ruta versionada, por lo que publicar una ruta nueva
invalida de forma natural la URL anterior.

## Caché de imágenes y control de llamadas

Esta caché es independiente del Juez. Tiene dos capas:

- **URLs:** `PublicMediaUrlService` conserva las respuestas en memoria y en `localStorage`
  (`cisus.publicMedia.v1`). Una recarga normal reutiliza la URL mientras coincidan la ruta versionada
  y su vigencia; se renueva si quedan cinco minutos o menos. Se conservan las entradas del formato
  anterior y se limitan a 200 entradas válidas al guardar.
- **Binarios:** el dashboard y el importador publican objetos con
  `Cache-Control: public, max-age=604800, immutable` (siete días). El navegador puede reutilizar el
  archivo descargado con la misma URL según su caché HTTP. Guardar una URL en localStorage no guarda
  el binario. [Referencia de Cache-Control en Storage](https://cloud.google.com/storage/docs/caching).

Las consultas simultáneas, individuales o por lote, comparten la petición pendiente por tipo, target y
ruta. Las respuestas de lotes independientes se acumulan sin sobrescribir las entradas de otros lotes.
Si el almacenamiento local está bloqueado o lleno, se conserva la caché en memoria durante esa visita.
Los errores liberan la petición pendiente para permitir un reintento; no se guardan como imágenes válidas.

Publicar una imagen crea otra ruta y otra URL: se consulta y descarga la versión nueva, sin esperar siete
días. Una respuesta antigua no satisface una petición para la nueva ruta. Los listeners de Firestore
siguen consultando los read models para detectar cambios; esta caché no elimina esas lecturas ni App Check.

Para verificar el ahorro en el navegador, cargar Home, recargar normalmente y revisar Network:
`getPublicMediaUrls` no debe repetirse para rutas guardadas vigentes; las imágenes deberían proceder
de la caché HTTP cuando el navegador la conserva. Desactivar “Disable cache” en DevTools. Una recarga
forzada, borrar datos del sitio, una URL expirada o la expulsión de archivos de la caché pueden generar
tráfico. Revocar una URL no elimina copias que ya estén descargadas.

Las pruebas de `public-media-url.spec.ts` cubren reutilización tras recrear el servicio, concurrencia,
cambio de ruta, almacenamiento bloqueado, entradas corruptas, expiración y reintento. No miden tráfico
ni costos productivos; la verificación de Network comprueba la capa HTTP del entorno desplegado.

## Archivos fuente que gobiernan el flujo

| Responsabilidad                                | Archivo                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| Whitelists, IDs y prefijos                     | `functions/src/media/public-media-policy.js`                              |
| Upload, WebP, token, read model y URLs         | `functions/src/media/public-media.function.js`                            |
| Permisos y rol diseñador                       | `functions/src/security/role-catalog.js`                                  |
| Protección contra asignación de roles internos | `functions/src/access/manage-access-contract.function.js`                 |
| Servicio Angular de resolución y caché         | `cisus-angular/src/app/core/services/public-media-url.ts`                 |
| Inputs del panel                               | `cisus-angular/src/app/features/dashboard/pages/dashboard/dashboard.html` |
| Consumo del carrusel                           | `cisus-angular/src/app/features/home/components/process/process.ts`       |
| Read models públicos                           | `firestore.rules`                                                         |
| Seed de documentos                             | `scripts/bootstrap-cisus.cjs`                                             |
| Importación administrativa excepcional         | `functions/scripts/publish-process-media.cjs`                             |

## Qué hacer según la tarea

### Reemplazar una imagen existente

No requiere cambios de código ni despliegue.

- Preferir el input correspondiente en Dashboard → Administración → Imágenes públicas.
- La publicación reemplaza la referencia, no sobrescribe el objeto anterior.
- Verificar una sola vez en la UI que exista el `<img>`, su `src` sea HTTPS y `naturalWidth > 0`.
- No inspeccionar reglas, roles o toda la arquitectura salvo que aparezca un error concreto.

En la portada, el equipo Cisus con contexto de empresa y permiso `public_media.manage` abre **Editar portada**.
El diálogo separa la composición del archivo. La lista muestra primero la capa superior y al final la base,
con controles de destino de animación independientes de **Descargar** y **Reemplazar imagen**. Si se elige una
superposición, se puede incluir la imagen base como segundo destino. El efecto se guarda al cambiarlo y
**Reproducir** lo vuelve a ejecutar sin escribir de nuevo. Archivo conserva las miniaturas y destinos ajenos
a composición, como miniatura, catálogo y Otras colecciones.

El editor muestra el archivo original antes de optimizar y permite elegir 82, 76 o 68; la carga se publica
solo al pulsar **Publicar imagen**. Las opciones menores comprimen más el color y pueden perder detalle;
no son sin pérdida. La conversión se realiza una sola vez en el servidor y conserva la transparencia. Para
alinear el grabado con la base, mantener sus proporciones y posición dentro del lienzo. No se modifica el
fondo vectorial decorativo.

### Importar imágenes iniciales sin sesión de dashboard

Usar únicamente como operación administrativa controlada:

```powershell
node functions/scripts/publish-process-media.cjs `
  --idea "C:\ruta\idea.png" `
  --sketch "C:\ruta\boceto.png" `
  --design "C:\ruta\diseno.png" `
  --tablas-idea "C:\ruta\tabla-idea.png"
```

El script aplica el mismo tamaño, formato, estructura versionada y auditoría. Para comprobar únicamente las rutas:

```powershell
node functions/scripts/publish-process-media.cjs --verify
```

Para las piezas iniciales Felino, Delfín y Con relieve, el importador crea o actualiza únicamente
sus tres documentos de producto y publica las imágenes bajo el prefijo administrado correspondiente:

```powershell
node functions/scripts/publish-product-media.cjs `
  --felino "C:\ruta\felino.png" `
  --delfin "C:\ruta\delfin.png" `
  --relieve "C:\ruta\relieve.png"
```

La comprobación de esos registros no sube archivos ni modifica Firestore:

```powershell
node functions/scripts/publish-product-media.cjs --verify
```

La composición editorial de Home usa un fondo independiente, una escena transparente por tabla y
dos productos complementarios. La importación inicial mantiene las fotos del catálogo separadas de
las escenas:

```powershell
node functions/scripts/publish-portfolio-media.cjs `
  --hero "C:\\ruta\\tabla-portada.png" `
  --carving "C:\\ruta\\grabado-transparente.png" `
  --background "C:\\ruta\\portfolio-background.png" `
  --felino-scene "C:\\ruta\\felino-scene.png" `
  --delfin-scene "C:\\ruta\\delfin-scene.png" `
  --relieve-scene "C:\\ruta\\relieve-scene.png" `
  --mesa "C:\\ruta\\mesa-cauce.png" `
  --mueble "C:\\ruta\\mueble-linde.png"
```

### Añadir una idea, slot o etapa nueva

Esto sí cambia el contrato. Actualizar coordinadamente:

1. ID/modelo y contenido de marketing, incluidos los siete targets por idea;
2. whitelist de backend (`HOME_ASSETS` o `PROCESS_ASSETS`) y pruebas de prefijos;
3. mapa de campos de `PublicMediaUrlService` y su prueba pura;
4. input del dashboard y componente consumidor;
5. bootstrap, contrato de seguridad y documentación.

Ejecutar `npm run verify`. Desplegar solo los recursos modificados: Functions si cambió el callable y Firestore Rules
si cambió el read model. Una simple sustitución de archivo no justifica build ni deploy.

## Fallos conocidos y diagnóstico mínimo

- Tarjeta con clase de imagen pero `<img>` sin `src`: revisar primero errores `NG02952`; `NgOptimizedImage` no acepta
  un `sizes` compuesto solo por píxeles cuando genera `srcset` automáticamente.
- Firestore tiene la ruta pero el callable falla con `SigningError`: el objeto legado no tiene token y falló el fallback
  V4. Los uploads actuales siempre crean `firebaseStorageDownloadTokens`.
- El callable no recibe la petición: comprobar App Check y el origen autorizado antes de revisar permisos de negocio.
- `permission-denied` al publicar: comprobar contexto de empresa, proyección actualizada, `public_media.manage` y rol interno.
- Ruta ignorada: debe coincidir exactamente con el prefijo del tipo y target; nunca aceptar rutas libres enviadas por el cliente.

No ejecutar logs, redeploys o auditorías completas como rutina: hacerlo solo cuando la verificación directa indique cuál
de estas capas falló.
