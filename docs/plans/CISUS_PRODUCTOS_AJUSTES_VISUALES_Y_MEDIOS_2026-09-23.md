# Productos: ajustes de composición, controles e imagen de «Otras colecciones»

Fecha: 23 de septiembre de 2026. Estado: implementación y verificación local completadas; despliegue de producción y revisión en navegador pendientes.

## Objetivo

Pulir la segunda sección de Home para que el producto, su personalización y las otras colecciones se lean y operen con claridad, y permitir elegir desde «Editar imágenes» la imagen que representa a cada producto en «Otras colecciones».

## Evidencia y decisiones de alcance

- **Hechos comprobados en el código:** la personalización aparece bajo los tipos, con el rótulo «Personaliza tu tabla» y el botón «Agregar {nombre}»; `portfolio.html` ya tiene una fila de título y «Ver detalles». La tarjeta completa de «Otras colecciones» es un botón. Allí conviven flechas superiores, barra de desplazamiento y puntos. La imagen de cada tarjeta sale de `sceneImageUrl` y, si falta, de `imageUrl`; la tarjeta de familia representa su primer modelo. El nombre grande del producto fuerza Georgia, mientras `--font-brand` usa Jura y el logotipo visible es un SVG. El editor recomienda 16:9 cuando no conoce la base; el backend conserva la proporción de las capas existentes.
- **Corrección indicada con las capturas del 23 de septiembre:** ampliar el espacio vacío entre los selectores y el título del producto (por ejemplo, Felino). En pantalla ancha, la escena principal debe extenderse por debajo del panel de «Otras colecciones», con el panel y sus tarjetas por delante.
- **Ajuste solicitado durante la ejecución:** se conserva el espacio que ocupaba «Personaliza tu tabla» como una separación amplia entre selectores y título, no como un margen corto. La imagen principal se introduce debajo de «Otras colecciones» en pantalla ancha.
- **Decisión propuesta:** 1600 × 989 px será la referencia editorial de una **nueva** escena de producto (aproximación entera a la proporción áurea, 1,618). No convertir ni recortar imágenes ya publicadas por código. Capas 2–6 y personalización seguirán el lienzo real de su base. Portada, Proceso, fotografía de catálogo y miniaturas mantienen sus recomendaciones propias.
- **Decisión para la selección de imagen:** guardar por producto `relatedImageSource` como `auto` o el rol de una capa administrada publicada (`product_scene`, catálogo `product`, miniatura, personalización, imagen exclusiva o capas 2–6). En el editor se marca una sola capa; sin selección explícita rige `auto` (escena → catálogo). La fila de imagen exclusiva permite subir un recorte propio para las tarjetas y se selecciona al publicarse.

## Secuencia de implementación

### 1. Reubicar la personalización y ordenar el texto del producto

Archivos: `cisus-angular/src/app/features/home/components/portfolio/portfolio.html`, `.scss` y, solo si hace falta para la etiqueta accesible, `.ts`.

1. Retirar el bloque `.product-customization` de `.product-navigation` y no mostrar «Personaliza tu tabla» ni «Personaliza tu producto». Conservar vacío el espacio vertical de ese bloque para que el título del producto permanezca más abajo.
2. Bajo el nombre del producto, crear una fila de acciones con «Ver detalles» a la izquierda y el botón de personalización a su derecha. Mantener ambos visibles y sin superposición en escritorio, tableta y móvil; permitir que la fila envuelva en anchos estrechos.
3. Mostrar `+ {nombre}` (ejemplo: `+ Canaleta`) cuando esté desactivado, sin la palabra visible «Agregar». Centrar geométricamente el signo dentro del círculo con CSS o SVG; al activar, mostrar un estado visual inequívoco. Mantener `aria-pressed`, el nombre accesible de agregar/quitar, el reintento tras fallo y el reinicio al cambiar de producto. No alterar la lógica de superposición ni precios/pedidos.
4. Dejar solo una separación breve entre la descripción y las miniaturas. Reservar el espacio amplio entre los selectores de tipos y el título con una separación explícita antes del título; ubicar la altura sobrante después de las miniaturas.
5. Cambiar **solo** la tipografía del nombre grande del producto a `var(--font-brand)` (Jura), ya cargada, y ajustar peso, tamaño, interletrado y altura de línea para nombres cortos y largos. Conservar la jerarquía semántica de encabezados y la lectura de botones/cuerpo. El SVG del logotipo no se convierte en fuente web.
6. Cambiar en `cisus-angular/src/app/core/services/marketing-content.ts` la etiqueta del tipo `relieve` de «Con relieve» a **«Relieve de paisajes»**, sin cambiar su ID ni su lista de modelos. Actualizar el fixture de `portfolio.spec.ts` que replica ese contenido.

### 2. Ajustar lienzo y alineación visual

Archivos: `portfolio.scss`, `hero-media-editor.ts` y, si ayuda a comunicar la recomendación, `hero-media-editor.html`; documentar el comportamiento en `docs/architecture/CISUS_PUBLIC_MEDIA.md`.

1. Dar al área visual de la escena nueva una referencia `aspect-ratio: 1600 / 989` y `object-fit: contain`. Conservar el mismo rectángulo y encuadre para base, capas y personalización; no cortar siluetas ni mover una capa con independencia de las otras.
2. En pantalla ancha, extender la escena protagonista por debajo del panel de «Otras colecciones» y mantener el panel y sus tarjetas por encima. Ubicar el primer borde de tarjeta debajo del encabezado lateral y darle aire frente al divisor. Reservar espacio para «Editar imágenes» para que no tape el título lateral, como sucede en la captura 1.
3. En «Editar imágenes», para la **escena base de producto**, indicar siempre «Referencia para imagen nueva: 1600 × 989 px · proporción áurea aproximada». Si hay base publicada, mostrar también su tamaño real y explicar que las capas y la personalización deben coincidir con él; sustituir una base histórica por otra proporción requiere preparar antes sus capas. Mantener 1:1 en miniatura, la referencia de portada y las demás indicaciones específicas. Esta es una recomendación, no una validación nueva que rechace formatos históricos.
4. Mantener el límite actual de recodificación WebP y la comprobación de proporción del backend. La adopción de una imagen real de 1600 × 989 se hará después mediante el flujo administrado, con los recortes proporcionados por John; este plan no autoriza subir ni reemplazar imágenes productivas.

### 3. Simplificar «Otras colecciones» sin perder navegación

Archivos: `portfolio.html`, `.scss` y `.ts` solo para retirar lógica que quede sin uso.

1. Quitar los dos botones de flecha de la cabecera (captura 2) y el botón «Ver todos» con su diálogo no solicitado. Ocultar la barra horizontal visible en escritorio y móvil (captura 3), dejando **solo los puntos** como indicador y control de páginas. Conservar el desplazamiento horizontal táctil/ratón, la selección con teclado, los puntos clicables y la sincronización entre desplazamiento y punto activo. El movimiento vertical de la página y el zoom no deben interceptarse.
2. Quitar la flecha circular dentro de **todas** las tarjetas (captura 4). La tarjeta completa sigue siendo el botón; conservar etiqueta accesible, foco visible y una respuesta discreta a hover/focus. Esto elimina también el descentrado de la cuarta tarjeta sin añadir otro control.
3. Mantener el orden editorial de familias y fichas, la familia activa excluida, y la navegación de vuelta desde Pomos y tiradores. No cambiar destinos ni convertir las fichas individuales en familias.

### 4. Elegir y guardar la imagen de cada tarjeta

Archivos: `portfolio.ts`/`.html`, `hero-media-editor.ts`/`.html`, `cisus-angular/src/app/core/models/commerce.ts`, `cisus-angular/src/app/core/services/commerce-gateway.ts`, `cisus-angular/src/app/core/services/public-media-url.ts`, `functions/src/media/public-media-policy.js`, `functions/src/media/public-media.function.js`, `functions/src/catalog/catalog.function.js` y documentación de medios. Usar los gateways existentes; ninguna escritura directa a Firestore desde Angular.

1. Añadir en cada fila de imagen publicada del panel **Editar imágenes → Producto** un tick «Usar en Otras colecciones»; solo puede quedar uno marcado. Si no hay selección, conservar `auto`. Añadir una fila «Imagen exclusiva · Otras colecciones» que permita subir un recorte dedicado y se marque automáticamente al publicarlo. La miniatura conserva además su uso independiente en el selector de modelos.
2. Persistir `relatedImageSource` en `products/{productId}` mediante `configurePublicMedia` o una operación del mismo gateway con los controles vigentes: contexto fresco de empresa, `public_media.manage`, rol interno y auditoría. Validar el valor enumerado y la existencia de una ruta administrada del **mismo** producto; para la imagen exclusiva, usar `product_related` y su destino administrado. Rechazar IDs y fuentes arbitrarios. No ampliar Storage Rules.
3. Exponer el campo validado en `listPublicProducts` (y en `listCompanyCatalog` solo si el mapeador compartido lo exige). Añadirlo al tipo Angular; ausencia o valor legado equivale a `auto`. Actualizar el estado local al guardar para que la tarjeta cambie de inmediato y persista al recargar.
4. En `editorialImageUrl`, resolver la capa elegida para las tarjetas de familia y las fichas individuales, con respaldo seguro si una imagen no carga. No cambiar la foto usada en la ficha, la escena principal ni la miniatura del selector. Una familia seguirá representada por su primer modelo; esta preferencia elige **la imagen de ese producto**, no otro modelo de la familia.
5. Si el producto representante no tiene escena, foto, miniatura, superposición o imagen exclusiva publicadas, mostrar el estado de imagen faltante ya usado en la sección; no guardar una opción vacía como explícita.

## Verificación y cierre para Luna 6

1. Antes de editar, revisar el `git status`: hay cambios preexistentes en los archivos de Home, Angular y Functions. Modificar solo los tramos necesarios y conservar esas diferencias.
2. Actualizar regresiones existentes: `portfolio.spec.ts` para posición/texto/estado de personalización, etiqueta «Relieve de paisajes», ausencia de flechas internas y superiores, navegación por puntos y elección/fallback de imagen; prueba del editor para tick por capa, fila de carga exclusiva y diagnóstico de guardado; prueba de Functions para enum, rutas propias, carga exclusiva, permisos y auditoría. No crear pruebas que solo repitan CSS.
3. Ejecutar `npm run verify` desde la raíz cuando cambian Angular y el contrato de Functions. Corregir cualquier gate fallido; no sustituirlo por un perfil parcial. Revisar diff y documentación del nuevo campo. Resultado inicial: `JUEZ VERDE: full` (`angular-build`, `angular-test`, `functions-test`, `multitenant-security`). Tras la corrección visual del 24 de septiembre, `JUEZ VERDE: frontend-local` (`angular-build`, `angular-test`).
4. Revisar en código teclado, foco, etiquetas y contraste. Comprobar las posiciones previstas frente a las cuatro capturas aportadas y dejar explícito en la entrega que la apariencia real en navegador no se verificó; `AGENTS.md` prohíbe abrirlo salvo solicitud expresa. Si John pide esa revisión después, comprobar entonces escritorio y móvil, incluidos Felino, Pomos, una tarjeta de la cuarta posición y el editor.
5. No desplegar Functions/Hosting ni publicar medios como parte implícita de la implementación. Para que la preferencia y la carga exclusiva funcionen en producción, hará falta desplegar el callable de medios, la lectura de catálogo, la resolución pública de medios y Hosting coordinadamente cuando se autorice.

## Efecto comercial y límite de evidencia

El nombre con tipografía de marca, las acciones agrupadas y las tarjetas despejadas deberían facilitar reconocer el diseño y descubrir otras colecciones. El coste es un cambio de contrato para guardar la imagen representativa y una revisión responsive cuidadosa. Es una hipótesis de claridad, no una mejora de conversión demostrada; la comprobación mínima con personas ajenas al proyecto es pedirles que encuentren Pomos, cambien de modelo, regresen a Tablas y entiendan cómo activar Canaleta sin ayuda.
