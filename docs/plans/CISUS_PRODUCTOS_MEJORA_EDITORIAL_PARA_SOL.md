# Mejora editorial de Productos Cisus — plan ejecutable para Sol

Estado: **plan preparado; esta revisión todavía no está implementada**.
Fecha: 10 de septiembre de 2026.
Responsable de ejecución previsto: Sol.

Revisión estratégica del 14 de septiembre: [Dirección y propuesta de valor](CISUS_DIRECCION_Y_VALOR.md) propone colocar Productos antes de Proceso y explicar el valor de cada pieza. Es una recomendación documentada, todavía no ejecutada ni aprobada como cambio de orden; la composición visual de este plan se conserva.

## 1. Objetivo y autoridad de las referencias

Recomponer la sección Productos del Home para reproducir la composición, las proporciones y la jerarquía de las dos referencias nuevas: una escena editorial a ancho completo en escritorio y una secuencia compacta en móvil.

Entrega en `/#portfolio`, después de Proceso. Orden del Home: Hero → Proceso → Productos → Contacto → Footer.

Este documento **sustituye las instrucciones de diseño e interacción** de [CISUS_PRODUCTOS_PLAN_PARA_SOL.md](CISUS_PRODUCTOS_PLAN_PARA_SOL.md). No combinar ambas especificaciones. El documento anterior queda como historial, aunque su encabezado diga que fue implementado.

Referencias persistentes, copiadas sin edición desde los adjuntos:

- [Escritorio: 924 × 592](references/productos-editorial-2026-09-10/desktop.png).
- [Móvil: 361 × 820](references/productos-editorial-2026-09-10/mobile.png).
- [Los 25 criterios originales del usuario](references/productos-editorial-2026-09-10/criterios-del-usuario.txt).

Estas capturas son objetivos visuales; no se deben utilizar como una imagen de fondo que contenga toda la interfaz. Los nombres, selectores, textos y acciones deben ser HTML accesible.

**Aclaración confirmada por el usuario:** en móvil deben verse **dos tarjetas completas y parte de una tercera**. Esto reemplaza la cantidad de 1,3–1,6 tarjetas indicada en el punto 14 del texto.

Prioridad: aclaraciones posteriores del usuario → decisiones explícitas de este plan → imágenes para geometría y jerarquía → texto adjunto para comportamiento. Las diferencias resueltas se enumeran en la sección 3; no improvisar otra interpretación.

## 2. Qué falló antes y cómo se evita repetirlo

La revisión de esta planificación encontró contradicciones entre el plan anterior, el código entregado y la apariencia esperada. Que las pruebas pasaran no acreditaba el parecido visual.

| Evidencia anterior | Consecuencia | Corrección exigida |
| --- | --- | --- |
| El plan anterior pedía una tarjeta ampliada por familia y tipos al pie. | Sol podía cumplir aquel documento y alejarse de estas referencias. | Una sola escena; selectores arriba; variantes pequeñas; relacionados claramente separados. |
| El documento anterior prescribe «Más detalle +» y un desplegable de precio. | La acción parece un acordeón. | «Ver detalles →» vinculado a la ficha existente del producto. |
| Se dieron porcentajes genéricos sin comprobar límites de texto y silueta. | Producto recortado, controles encima de la madera y títulos secundarios diminutos. | Rejilla con zonas protegidas y comparación con hitos medidos en las dos capturas. |
| El CSS actual impone `height: clamp(760px, 56.28vw, 941px)`. | A 924 px de ancho la sección mide al menos 760 px, frente a los 592 px de la referencia. | Calibrar a 924 × 592 y escalar la composición, sin heredar esa altura mínima. |
| En móvil hay alturas mínimas de 1280/1680 px y márgenes superiores de 470/430 px. | Grandes huecos y una experiencia mucho más larga que la referencia de 820 px. | Composición móvil propia, con flujo natural y una zona fotográfica de proporciones controladas. |
| `.companion-card` separa foto y texto en dos columnas. | Las tarjetas no coinciden con las referencias. | Nombre, resumen y acción superpuestos en el tercio inferior de la fotografía. |
| `.more-thumbs` y «+ más productos» siguen presentes; falta el encabezado «Otros productos». | Navegación ambigua y jerarquía secundaria poco clara. | Encabezado explícito, tarjetas editoriales y puntos de posición. |
| Las capturas previas no cubrieron de forma comparable ambas referencias ni todas las selecciones. | Se declaró terminado con desviaciones visibles. | Dos capturas de referencia comparables, recorrido de estados y lista de diferencias corregidas antes de cerrar. |

Reutilizar la carga, los IDs y los medios administrados que funcionan. Esta tarea no requiere reconstruir la plataforma, añadir una biblioteca de carrusel ni modificar roles.

## 3. Decisiones que Sol debe aplicar

1. **Escena exterior:** ancho total del Home, bordes rectos y sin marco crema. Las miniaturas y tarjetas secundarias sí llevan el radio fino de las referencias.
2. **Jerarquía:** Tablas → Conceptuales/Con relieve → producto principal → acción asociada → variantes → Otros productos. En el modelo existente, Tablas sigue siendo la familia y Conceptuales/Relieve siguen siendo tipos; no migrar taxonomía por el vocabulario del brief.
3. **Color activo:** icono y texto naranja en el tipo activo. En escritorio se admite su borde fino; en móvil los tipos son ligeros, sin cajas protagonistas. Nunca un subrayado naranja de selección.
4. **CTA:** texto único «Ver detalles» y flecha SVG. En escritorio, botón naranja compacto inmediatamente debajo del título, como en la imagen. En móvil, contorno naranja pequeño a la derecha del título; pasa debajo solo si no cabe con texto ampliado.
5. **Destino del CTA, decisión de este plan:** enlace a `/catalogo?producto=<id activo>`, que ya selecciona la ficha del producto. Quitar el acordeón de Home y su precio oculto. La permanencia en la escena es obligatoria para cambiar variantes, no para abrir la ficha. La prohibición de navegar del documento anterior queda sustituida.
6. **Orden informativo:** título → metadato → descripción; el CTA se asocia visualmente al título. Mantener un orden DOM lógico y un único enlace, sin duplicar controles para móvil/escritorio.
7. **Móvil:** dos tarjetas completas y una parte visible de la tercera, confirmado por el usuario. No aplicar 1,5 tarjetas.
8. **Controles de relacionados:** swipe + puntos pequeños. El par de flechas del encabezado móvil puede conservarse al tamaño discreto de la imagen, con objetivo táctil suficiente; no se añaden flechas grandes ni otro navegador. Es una misma paginación con entradas equivalentes. Sin autoplay.
9. **Menú de la esquina móvil:** la captura es una sección dentro del Home. Reutilizar el menú global existente cuando se vea; no crear una segunda hamburguesa dentro de Productos ni un botón sin función. Comparar el recorte de Productos y revisar aparte la convivencia con el encabezado global.
10. **Naranja decorativo:** quitar las reglas naranjas sin función de la implementación actual. Conservar divisores neutros. «TABLAS» mantiene el pequeño acento de marca de la referencia; no propagar ese tratamiento a más ornamentos.

## 4. Plano de escritorio

La referencia maestra mide 924 × 592 px. Las coordenadas siguientes son aproximaciones visuales para calibrar, relativas a la esquina superior izquierda de la sección; no son instrucciones de posicionar cada texto absolutamente.

| Elemento | Hito en la referencia |
| --- | --- |
| Margen izquierdo | x ≈ 28 px, común a familia, título, CTA, metadatos y variantes |
| «TABLAS» | y ≈ 44 px |
| Selector de tipos | x ≈ 28, y ≈ 68; conjunto de unos 276 × 50 px |
| Título Felino | x ≈ 28, y ≈ 139; serif de aproximadamente 68 px |
| CTA | x ≈ 28, y ≈ 219; unos 150 × 39 px |
| Metadato y descripción | y ≈ 279 y 301; ancho de lectura de unos 240 px |
| Variantes | imágenes en y ≈ 390–472; nombres alineados en y ≈ 488 |
| Silueta principal | aproximadamente x = 322–618, y = 23–542; tabla completa y asa visible |
| División de la columna derecha | x ≈ 661, desde y ≈ 38 |
| Encabezado «Otros productos» | x ≈ 680, y ≈ 44; «Ver todos →» en su extremo derecho |
| Tarjetas secundarias | x ≈ 680, ancho ≈ 216; y ≈ 76 y 339; altura ≈ 250 cada una, la segunda termina cerca de 557 |
| Puntos | centrados bajo las tarjetas, y ≈ 575 |

Estructura: zona izquierda ≈ 29%, escena central ≈ 42%, columna secundaria ≈ 29%, incluyendo separaciones y margen exterior. Ajustar con la silueta real, no sumando anchos mínimos que excedan la sección.

- Usar CSS Grid para las zonas informativas y posicionamiento de capas únicamente para fotografía, ambiente y degradados. La derecha es una columna con sus dos tarjetas, no cuatro columnas de foto/texto.
- A 924 px mantener el diseño extendido; el breakpoint no puede mandar esa referencia al diseño móvil.
- Punto de partida para escritorio: desde 900 px. La relación 924:592 guía la altura inicial; permitir crecimiento si accesibilidad o contenido lo exige.
- En 1280/1440/1672 px aumentar espacios y tipografía de forma coordinada. No limitar solo el texto a 1672 px mientras la escena sigue creciendo y pierde alineación.
- La tabla debe dominar el centro, con márgenes suficientes para no cortar el asa ni el borde inferior. El nombre no se apoya sobre el grabado.
- Fondo y escena son capas independientes. No aplicar `object-fit: cover` a la escena entera sin comprobar cuánto recorta el producto. Ajustar escala y posición por producto: un Delfín redondo y una tabla horizontal de Relieve necesitan encuadres distintos.
- Tarjetas: fotografía completa como superficie, gradiente localizado abajo, nombre serif, descripción breve, flecha circular fina. Un solo enlace por tarjeta; la flecha es parte del enlace.
- No reducir palabras como «Almacenamiento» hasta hacerlas ilegibles ni partirlas arbitrariamente a mitad para conservar un ancho mal calculado.

## 5. Plano móvil

La referencia maestra mide 361 × 820 px. Aquí se recompone el contenido: no se reduce a escala el diseño de tres columnas.

| Elemento | Hito en la referencia |
| --- | --- |
| Eje principal | x ≈ 21 px; final ≈ 344 px |
| «TABLAS» | y ≈ 15 px |
| Tipos ligeros | y ≈ 47–76; separador vertical neutro; ambos caben |
| Escena principal | tabla aproximadamente x = 140–326, y = 95–380 |
| Claim opcional | x ≈ 21, y ≈ 134, tres líneas pequeñas |
| Fila Felino / CTA | y ≈ 340–378; título ≈ 42 px; CTA visual ≈ 98 × 26 px |
| Metadato | y ≈ 386 |
| Descripción breve | y ≈ 411–436 |
| Tres miniaturas | y ≈ 465–511; unos 94–103 px de ancho por control |
| Nombres de variantes | y ≈ 522, sobre un mismo eje |
| Separación de relacionados | divisor neutro en y ≈ 547 |
| «Otros productos» y frase | y ≈ 567 y 593 |
| Carrusel | y ≈ 614–774; tarjetas ≈ 149 × 160 px; huecos ≈ 11 px |
| Puntos inferiores | y ≈ 800 |

Requisitos:

- En 361 px de ancho, el estado inicial debe conservar una densidad próxima a 820 px de alto, incluyendo relacionados e indicadores. No volver a 1280/1680 px por alturas mínimas heredadas.
- No imponer 820 px de altura fija que corte texto. Los hitos sirven para la captura con tipografía y textos previstos; a 200% de texto o con contenido más largo debe crecer.
- Reservar una zona fotográfica real en el layout y apoyar el bloque del título cerca del borde inferior de esa zona. No simular su lugar con 430/470 px de margen vacío.
- La foto sigue presente detrás del título y del ambiente; su degradado se funde con el fondo inferior, sin corte rectangular.
- «Arte funcional para tu espacio» es pequeño y secundario; se puede omitir a 320 px o con texto ampliado si compite con la información útil.
- Los tipos comparten altura y objetivos táctiles de unos 44 px aunque su presentación sea ligera. No hacerlos un carrusel de dos grandes botones de 205 px.
- Las tres variantes deben caber simultáneamente en 361/390 px, con el mismo espacio de interacción y nombres alineados.
- Relacionados usa una franja con desbordamiento horizontal local y `scroll-snap`. A 361 px, referencia: primera tarjeta x ≈ 17, segunda x ≈ 177 y tercera comienza x ≈ 340.
- Para conservar dos tarjetas y una fracción de la tercera al variar el ancho móvil, tomar ≈ 41–42% del ancho de la sección por tarjeta y un gap ≈ 10–12 px. Verificar el resultado medido, no solo esa fórmula.
- En 600–899 px aplicar una composición intermedia coherente: protagonista amplio y relacionados debajo. No añadir columnas estrechas con texto cortado.
- Scroll vertical libre, sin desbordamiento horizontal de toda la página.

## 6. Variantes, estado y transiciones

Selección inicial: Tablas → Conceptuales de animales → Felino. Orden visible: Felino, Delfín, Zorro.

- Variantes: misma caja, mismo alto aparente del producto, padding común y mismo eje del nombre. `object-fit: contain` para la miniatura del producto, con encuadre preparado; no alternar arbitrariamente `cover` y recortes.
- Estado activo: nombre naranja + un único borde fino en la miniatura. Inactivos neutros. Quitar todos los subrayados independientes.
- Cambiar variante actualiza a la vez escena, nombre, metadato, descripción y destino de «Ver detalles». No cambia la URL, no desplaza el scroll ni vuelve a descargar el catálogo.
- Al elegir Con relieve, seleccionar su primer producto válido y mostrar sus variantes. No conservar el metadato «Tabla conceptual» del Felino.
- Predecodificar la siguiente escena antes de confirmar el cambio. Mientras carga, conservar juntos la imagen y el texto anteriores; no mostrar título nuevo con foto vieja.
- Transición real de opacidad de 250–400 ms por cambio; la animación actual aplicada a un único `img` no se reinicia necesariamente al cambiar `src`. Implementar las dos capas temporales o el mecanismo mínimo equivalente.
- Clics rápidos: gana la última selección solicitada. Descartar resultados tardíos y limpiar recursos al destruir el componente.
- Fallo de escena: liberar el estado de espera y permitir reintento. No guardar permanentemente una precarga fallida como éxito ni mostrar la imagen de otro modelo.
- Si falla el catálogo, conservar error/reintento dentro de la composición. Si faltan referencias, excluirlas sin romper el estado activo. No confundir una ausencia de contenido con un resultado visual terminado.
- Movimiento reducido elimina la animación, pero conserva el cambio conjunto.
- Usar botones con `aria-pressed` y nombres «Mostrar Felino», etc.; selección accesible además del color. El foco queda en el control pulsado. Anunciar solo el cambio breve del producto.

## 7. Otros productos: tarjetas y paginación reales

Encabezado explícito «Otros productos». En escritorio incluir «Ver todos →» a `/catalogo`. En móvil añadir «Descubre más piezas para tu espacio.» y, si se usan, flechas pequeñas equivalentes al swipe.

- Contenido inicial: Mesas personalizadas y Almacenamiento artesanal. Imagen, título, resumen y flecha deben quedar dentro de cada tarjeta.
- Quitar `moreProducts`, `.more-thumbs`, los círculos/óvalos fotográficos y el texto «+ más productos».
- Misma colección y mismo orden en ambos tamaños. Desktop muestra dos tarjetas apiladas por página; móvil muestra el carrusel horizontal.
- Puntos discretos, con área interactiva accesible mayor que su dibujo; activo naranja, restantes neutros. Su estado debe seguir la posición real del carrusel, incluidos swipe y redimensionado.
- No pintar tres puntos fijos que no navegan. Con dos productos y dos visibles hay una sola página de escritorio: no simular otras.
- Para reproducir también las tres posiciones del diseño se necesita contenido secundario suficiente. El inventario actual de `portfolioCompanionProductIds` solo contiene dos IDs. Sol debe resolver ese contenido según la sección 8 y calcular las páginas reales.
- No repetir Mesas/Almacenamiento bajo distintos IDs para fabricar páginas. Tampoco colocar Felino, Delfín o Zorro en «Otros productos» para rellenar: son las variantes de la selección principal.
- Sin autoplay ni cambios de relacionados cuando se elige una variante. Los enlaces abren su producto real y «Ver todos» abre el catálogo.

## 8. Contenido y medios: lo que existe y lo que falta

Estado comprobado **en el código y los importadores locales**, no una nueva auditoría de Firebase:

| Pieza | ID | Situación para esta revisión |
| --- | --- | --- |
| Felino | `cisus_tabla_felino` | Referenciado; tiene flujo de foto y escena |
| Delfín | `cisus_tabla_delfin` | Referenciado; tiene flujo de foto y escena |
| Con relieve | `cisus_tabla_relieve` | Referenciado; tiene flujo de foto y escena |
| Mesas personalizadas | `cisus_mesa_cauce` | Relacionado existente |
| Almacenamiento artesanal | `cisus_mueble_linde` | Relacionado existente |
| Zorro | `cisus_tabla_zorro` propuesto | Falta referencia, foto/escena y registro acreditado |
| Tercera tarjeta secundaria y siguientes | Por resolver en inventario | Faltan en la selección actual; necesarias para el peek y páginas adicionales |

Al iniciar la ejecución, obtener una sola vez el catálogo y cotejar estos IDs. Las publicaciones anteriores no prueban que un archivo o un registro siga siendo el activo.

**Zorro forma parte del objetivo nuevo, no es opcional.** Preparar su foto limpia, escena y metadatos con el mismo sistema. Si se crea a partir de la referencia como propuesta visual, identificarlo como propuesta y no afirmar que ya es una pieza fabricada. Los precios ficticios están autorizados para diseño en la conversación; no inventar existencias, medidas o certificaciones. No exigir otra confirmación de los precios ya autorizados.

Para relacionados, usar primero líneas públicas existentes fuera de Tablas. Si no alcanzan, preparar las propuestas adicionales y su contenido antes de dar por terminado el diseño. La referencia solo muestra parcialmente la tercera tarjeta: no inferir su nombre exacto a partir de letras cortadas. Si hacen falta definiciones comerciales nuevas, presentar ese pendiente concreto y continuar la composición; no esconder la falta con puntos falsos.

Texto de Felino:

- Metadato de referencia: «Tabla conceptual · Madera de Coihue». «Coihue» aparece como ejemplo en el brief; comprobar que corresponde al producto antes de tratarlo como dato comercial. Mientras tanto, usar «Tabla conceptual · Madera» sin detener el layout.
- Descripción escritorio: «Una pieza funcional y decorativa, con una composición lineal de felino que aporta carácter y calidez a tu espacio.»
- Descripción móvil: «Una pieza funcional con silueta felina, pensada para servir, decorar y regalar.»
- Conservar el nombre «Felino», no cambiarlo a «Puma» por el motivo visual.

Contrato mínimo si faltan estos datos: añadir a `CatalogProduct` solo `materialLabel?: string | null` y `shortDescription?: string | null`; la descripción editorial larga usa el campo `description` existente. Mapearlos en `mapProduct` y actualizar los registros concretos mediante el flujo administrativo. El metadato de tipo se deriva del tipo seleccionado. No duplicar precios, nombres, imágenes o materiales en `MarketingContent`.

Medios:

- Reutilizar [CISUS_PUBLIC_MEDIA.md](../architecture/CISUS_PUBLIC_MEDIA.md), el fondo `home:portfolio_background`, `imagePath` y `sceneImagePath`. Ya existen los slots, resolución y controles de dashboard; no volver a implementarlos.
- Los adjuntos completos viven en `docs/plans/references/` para comparación, nunca en el frontend como pantalla horneada.
- Examinar las escenas actuales sobre verde oscuro. Delfín y Relieve necesitaron corrección de damero en la entrega previa; tener canal alfa no certifica que el borde sea limpio. Revisar halo, hojas y el agujero del asa.
- Preservar el trabajo visual existente de Felino. Antes de regenerar, comprobar si su capa actual admite el recorte y encuadre de ambas referencias.
- Si hace falta un recurso nuevo, usar el flujo de imágenes para prepararlo y revisarlo antes de publicarlo. Comprobar que el alfa contiene transparencia real, no damero dibujado, y que la madera y el grabado no se deformaron.
- Preferir reencuadrar una misma escena con CSS por breakpoint. Añadir un slot móvil independiente solo si una captura comparativa demuestra que el asset existente no permite ambos encuadres; en ese caso completar whitelist, servicio, dashboard, importador y pruebas correspondientes.
- Dashboard o importador documentado → WebP versionado → Firestore → resolución HTTPS. No URLs locales en producción, no base64 en el template, no bootstrap global que sobrescriba lo ya publicado.

## 9. Archivos y secuencia de ejecución

Aplicar la guía Angular del proyecto (actualmente 22.1), signals, `computed()`, `inject()` y gateways existentes. Mantener cambios preexistentes.

| Archivo, relativo a la raíz | Cambio concreto |
| --- | --- |
| `cisus-angular/src/app/features/home/components/portfolio/portfolio.html` | Rejilla semántica, título/metadato/CTA, variantes uniformes, relacionados con texto superpuesto y controles |
| `cisus-angular/src/app/features/home/components/portfolio/portfolio.scss` | Rehacer geometría desktop/móvil; retirar offsets, alturas rígidas, subrayados y círculos anteriores |
| `cisus-angular/src/app/features/home/components/portfolio/portfolio.ts` | Retirar acordeón y lista de círculos; selección atómica, transición y paginación sincronizada |
| `cisus-angular/src/app/features/home/components/portfolio/portfolio.spec.ts` | Actualizar pruebas del comportamiento final; retirar las expectativas del acordeón anterior |
| `cisus-angular/src/app/core/services/marketing-content.ts` | Orden y referencias de Zorro y relacionados; no copiar datos comerciales |
| `cisus-angular/src/app/core/models/commerce.ts` | Los dos campos editoriales opcionales, si se incorporan |
| `functions/src/catalog/catalog.function.js` | Mapear los campos opcionales sin romper consumidores existentes |
| `functions/scripts/publish-portfolio-media.cjs` | Extender destinos concretos si faltan piezas; importación acotada e idempotente |
| `cisus-angular/src/app/features/catalog/pages/catalog/catalog.ts` | Reutilizar lectura de `?producto=`; modificar solo si falla la navegación comprobada |

Secuencia:

1. **Congelar objetivos:** abrir ambas referencias, leer los 25 criterios y esta resolución de diferencias. Inspeccionar el catálogo una vez y anotar contenido faltante.
2. **Preparar geometría y recursos:** establecer las tres zonas desktop, la escena móvil y los encuadres por producto. Resolver miniaturas homogéneas y contenido secundario; no probar fidelidad con imágenes equivocadas.
3. **Cerrar escritorio a 924 × 592:** comparar contra referencia y corregir proporciones, textos dentro de tarjetas, espacio negativo y silueta. Guardar captura.
4. **Cerrar móvil a 361 × 820:** componer en flujo natural; tres variantes visibles; dos cards más peek; respiración y dots. Guardar captura.
5. **Conectar interacción completa:** Felino/Delfín/Zorro/Relieve, CTA por ID, swipe/puntos/flechas, teclado, errores y movimiento reducido.
6. **Publicar solo recursos necesarios para que Home los consuma:** datos y medios por vía documentada; Functions específicas si cambia su contrato. `npm start` usa producción. Una modificación de CSS no requiere redeploy backend.
7. **Verificar y comparar:** ejecutar el perfil suficiente y la matriz visual siguiente. Corregir las diferencias antes de declarar terminada la revisión.

Cada etapa tiene una salida verificable. No sustituir los pasos 3 y 4 por un build verde, una captura con otro viewport o una afirmación de «se ve bien».

## 10. Aceptación: funcionamiento y fidelidad son comprobaciones distintas

Para este plan documental: revisar referencias, enlaces, rutas y cambios del documento. No ejecutar builds ni suites en esta etapa.

Durante la implementación, elegir una vez el perfil suficiente de [Juez](../../quality/README.md):

- Solo Angular: `npm run verify -- --profile frontend-local`.
- Angular y contrato de catálogo/medios: `npm run verify`.
- Sustitución de binarios sin código adicional: validar en UI según la guía de medios.
- No repetir perfiles por rutina; repetir solo después de nuevos cambios o fallos relacionados.

Pruebas de comportamiento mínimas:

1. Entrada en Felino y correspondencia de foto, metadato, texto y enlace.
2. Cambios Delfín/Zorro/Relieve, selección rápida y ausencia de refetch/scroll.
3. Falla de imagen sin espera infinita y reintento correcto.
4. Paginación según contenido, swipe/flechas/puntos sincronizados y ajuste tras redimensionar.
5. Carga, error con reintento, vacío y referencias ausentes.
6. CTA navega al ID seleccionado; el acordeón anterior y sus enlaces ocultos dejan de existir.

Comparación visual obligatoria:

- Capturar el **elemento de Productos completo** en Home real, con viewport de 924 px de ancho y, por separado, 361 px. El encabezado global no forma parte de los píxeles de referencia; comprobar aparte que no tapa Productos al seguir el ancla.
- No redimensionar una captura deformándola para que encaje en 924 × 592 o 361 × 820. Si la sección tiene altura incorrecta, corregir su layout.
- Preparar comparación lado a lado y superposición al 50% con cada referencia. No usar solo diferencia de píxeles global: variaciones fotográficas pueden ocultar errores de layout.
- A tamaños maestros: desviación de ejes y controles de hasta aproximadamente 6 px en escritorio y 4 px en móvil; silueta y columnas dentro de un margen aproximado del 3%. Son objetivos geométricos, no una autorización a omitir partes.
- Revisar también 320, 390, 768, 1024 y 1440 px de ancho; no necesitan todos artefactos nuevos si no se encuentra un fallo. A 320/200% de texto, aceptar crecimiento vertical y mantener todo legible.
- Guardar evidencia del estado inicial en ambos tamaños y al menos una selección alternativa en cada uno; comprobar las cuatro selecciones aunque solo se conserven las capturas relevantes.
- Revisar teclado, foco visible, enlaces, touch, contraste sobre fotos y movimiento reducido. El precio provisional no aparece como titular ni se ocultan controles interactivos solo mediante opacidad.
- Verificar imágenes HTTPS cargadas (`naturalWidth > 0`), integridad de la silueta y ausencia de damero/halo.

Lista final para entregar:

- [ ] Escena extendida equivalente: tres zonas, tabla completa, relacionados subordinados.
- [ ] Móvil equivalente: densidad compacta, título/CTA asociados, tres variantes, dos cards + tercera visible.
- [ ] Sin «Más detalle +», «Otros diseños», círculos fotográficos ni subrayados naranjas independientes.
- [ ] «Otros productos» tiene encabezado propio, contenido real y navegación que corresponde a sus páginas.
- [ ] Zorro y el contenido adicional están resueltos; ningún placeholder se usa para afirmar que la entrega está completa.
- [ ] Lectura inmediata: Tablas, Conceptuales, Felino y cómo cambiar a Delfín/Zorro.
- [ ] Comparaciones visuales adjuntas y comprobaciones técnicas informadas con su alcance real.
- [ ] Toda diferencia pendiente con las referencias se declara explícitamente.

**No declarar «exactamente terminado» si faltan Zorro, tarjetas, recursos o evidencia móvil.** Reportar por separado composición implementada, contenido publicado y fidelidad comprobada. La entrega anterior es la base funcional; estas dos imágenes definen el nuevo criterio de terminado.
