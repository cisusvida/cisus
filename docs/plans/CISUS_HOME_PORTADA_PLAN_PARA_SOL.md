# Cisus: portada de Home — plan para Sol

Marco comercial en revisión: [Dirección y propuesta de valor de Cisus](CISUS_DIRECCION_Y_VALOR.md). Allí se documentan el valor para el comprador y la recomendación de mostrar Productos antes de Proceso; preparar los textos o materiales de esta portada no acredita que esas decisiones estén implementadas.

Creado: 11 de septiembre de 2026. Actualizado: 14 de septiembre de 2026. Estado: implementación parcial; pendiente integrar el PNG aprobado y el SVG definitivo. Ejecución a cargo de Sol.

## Pendiente inmediato para retomar con Sol

La tarea «Ejecuta plan de portada Home» dejó informado que la carga de la imagen estaba pendiente de una sesión administrativa. Después se creó y refinó el fondo SVG en esta conversación. Actualizar este documento y preparar los archivos no reanuda ni ejecuta automáticamente aquella tarea. La captura compartida por John el 14 de septiembre sigue mostrando la escena anterior de una tabla horizontal sobre una mesa.

Retomar la implementación leyendo esta versión del plan y completar únicamente lo pendiente:

1. Publicar [el PNG original aprobado](references/home-2026-09-11/tabla-planta-cisus-naranja.png) por el sistema administrable y comprobar que la portada carga esa imagen. La escena anterior de comedor debe dejar de aparecer.
2. Integrar [el SVG definitivo con rayos difuminados](references/home-2026-09-11/fondo-portada-carbon-ambar-v2.svg) detrás del PNG. Mantener las dos capas separadas y ajustar las superposiciones oscuras existentes para que no oculten el fondo nuevo ni apaguen la tabla.
3. Mostrar la portada real en escritorio y móvil con ambos archivos visibles. El cierre requiere esas capturas; tener textos, botones y compilación listos no completa la integración visual.

Conservar los textos, botones y logo ya trabajados mientras se completa esta integración. El diagnóstico anterior se basa en el cierre informado por Sol y la captura de John; no es una revisión del código actual.

## Objetivo y alcance

Presentar a Cisus como una marca que diseña, fabrica y vende productos propios, y conducir al visitante hacia esos productos y su compra online. Los proyectos a medida, regalos corporativos y negocios aliados siguen formando parte del modelo, pero la portada dará protagonismo a las colecciones propias.

Este encargo comprende únicamente la cabecera y la portada de Home en escritorio y móvil. La referencia vigente elegida por John combina fondo negro carbón, ambiente natural con luz cálida, madera protagonista, tipografía elegante y el naranja del logo como acento. El resto de Home y la futura página interna «Dirección de Cisus» quedan para sus propios planes. Contabilidad y descargas quedan fuera de este encargo.

## Referencias elegidas por John

- [Estilo vigente de escritorio](references/home-2026-09-11/estilo-escritorio-naranja.png).
- [Estilo vigente de móvil](references/home-2026-09-11/estilo-movil-naranja.png).
- [Escena vigente de la tabla con la planta Cisus](references/home-2026-09-11/tabla-planta-cisus-naranja.png).

Son copias sin editar de los últimos tres adjuntos de John (04:47:21, 05:15:00 y 05:18:27 p. m.). Sustituyen como guía visual las referencias anteriores con acentos verdes, que quedan conservadas solo como antecedentes. Las dos primeras fijan botones, colores, tipografía y composición; sus textos no quedan aprobados por aparecer en ellas. **La tercera es la imagen obligatoria para la pieza protagonista: debe utilizarse el archivo aportado por John.** Está conservada aquí para su posterior publicación mediante el sistema de medios administrables, sin copiarla al frontend.

## Corrección de la portada implementada

La captura comunicada por John muestra una tabla horizontal sobre una mesa de comedor. Esa imagen debe reemplazarse: cambiar textos, botones y logo sobre el fondo anterior no cumple este encargo. La instrucción anterior «No generar imágenes nuevas» fue incorrecta y queda sustituida por los requisitos siguientes.

### Dos capas visuales obligatorias

1. **Pieza protagonista:** usar `references/home-2026-09-11/tabla-planta-cisus-naranja.png`, correspondiente al adjunto de las 05:18:27 p. m. Es la tabla vertical con grabado botánico y marca Cisus, acompañada de pedestal, piedras, tela y follaje naranja. Conservar esa pieza y sus detalles; no generar otra tabla ni sustituirla por una foto del catálogo. Comprobar la transparencia real del archivo antes de montarlo: el negro del visor no demuestra que exista un fondo negro. Si necesita preparación, conservar el original y obtener una copia que mantenga intacta la pieza.
2. **Fondo vectorial, decisión vigente de John:** usar [fondo-portada-carbon-ambar-v2.svg](references/home-2026-09-11/fondo-portada-carbon-ambar-v2.svg). John solicita un fondo hecho con buen código, ligero y sin necesidad de vegetación. El SVG recrea luz ámbar sobre carbón mediante degradados y cinco haces amplios y difuminados en abanico desde arriba a la izquierda, ajustados el 14 de septiembre y comprobados visualmente con el PNG original, sin fotos incrustadas, filtros, scripts ni animaciones. Pesa menos de 4 KB y conserva su definición al escalar. Colocar el PNG original de John por encima como capa independiente, conservando su pedestal y elementos de la base. Esta entrega prepara el gráfico; Sol lo integrará en la web.

El fondo fotográfico v1 y su prompt se conservan únicamente como antecedentes: no cargarlos junto al SVG ni generar otra fotografía para este encargo. Adaptar el encuadre del SVG en escritorio y móvil; el diseño no requiere una imagen raster adicional para móvil. Textos, botones y logo de cabecera se incorporan como elementos de la web, separados del fondo.

## Textos propuestos

**Antetítulo:** DISEÑOS PROPIOS EN MADERA

**Titular:** Objetos que nacen de una idea.

**Descripción:** Creamos y fabricamos nuestras propias colecciones. Elige tu pieza, compra online y recíbela en casa.

**Acción principal:** Explorar productos → sección o catálogo público de Productos ya existente.

**Acción secundaria:** Conocer Cisus → sección Nosotros ya existente, con menor énfasis visual.

Se conserva el titular de la referencia por su relación con la creación y el diseño. El antetítulo y la descripción hacen explícitos los productos propios y la venta online. La portada no dirige la acción principal a cotización, contacto o WhatsApp.

La visita que llegue desde una publicación sobre un producto deberá poder ir directamente a su ficha; no necesita pasar por esta portada. Este principio comercial no implica implementar campañas o nuevas rutas en este encargo.

## Composición visual

- **Escritorio:** texto a la izquierda y la imagen obligatoria de la tabla vertical a la derecha, con su pedestal integrado sobre el fondo nuevo. Mantener la planta, veta, grabado y luz cálida legibles; conservar espacio oscuro tranquilo detrás del texto. Ajustar las capas por separado para que la tabla no invada el texto ni pierda su base por un recorte de fondo.
- **Móvil:** cabecera compacta, texto y acciones primero, tabla debajo dentro de una escena continua. Ajustar los espacios de la referencia para que el titular, la descripción y la acción principal aparezcan sin un desplazamiento largo. La tabla puede continuar bajo el primer encuadre; no reducirla hasta perder sus detalles.
- Mantener jerarquía tipográfica de la referencia: titular serif blanco cálido, «idea» con énfasis cursivo naranja; descripción y controles sans serif en tonos claros neutros. Reutilizar las fuentes existentes cuando correspondan al estilo elegido.
- El naranja debe corresponder al del logo oficial y unificar énfasis del titular, botón principal, flechas y acentos botánicos o líneas decorativas. Tomar el color de marca existente, sin inventar otro naranja ni conservar los acentos verdes de la propuesta anterior. El fondo será negro carbón con luz ámbar y madera cálida, como en las referencias vigentes.
- **Botón principal:** fondo oscuro o transparente sobre la escena, borde fino naranja, texto y flecha naranja, esquinas suavemente redondeadas. Seguir las referencias adjuntas; no convertir su estado normal en un botón naranja macizo.
- **Botón secundario:** mismo lenguaje y geometría, fondo oscuro o transparente, contorno gris claro neutro y texto y flecha claros. Su contraste visual es menor que el del principal; no usar contorno verde.
- Mantener contraste legible, foco visible, áreas táctiles cómodas y ausencia de desbordamiento horizontal. Los estados de interacción deben conservar esta paleta.
- Textos, botones y navegación deben ser elementos reales de la página. No usar las capturas con textos incrustados como portada terminada.
- No reproducir «Editar», el icono de compartir ni otros controles del visor que aparecen sobre la captura.
- La escena presenta diseño propio. No añadir precio, disponibilidad, certificaciones o promesas de entrega no confirmadas.

## Logo y cabecera

Usar el logo oficial existente. John solicita un **borde blanco fino de 1 px alrededor del cuadro negro del logo**, para distinguir sus límites sobre fondos oscuros. Respetar proporciones y contorno, sin halo, sombra o marco grueso. Aplicarlo a su presentación en la interfaz; no modificar el grabado de la tabla ni redibujar el logo.

Mantener la navegación existente y el acceso claro a Productos. Las letras «CISUS» de las referencias orientan la colocación de marca, pero no sustituyen automáticamente el logo oficial por otro diseño.

## Ejecución y cierre para Sol

1. Leer las instrucciones de frontend y localizar únicamente la cabecera, portada y sus medios existentes. Conservar la navegación; adaptar la estructura de la portada lo necesario para soportar las dos capas exigidas.
2. Preparar la imagen obligatoria de John y utilizar el fondo separado ya generado y enlazado en este documento. Integrarlos en escritorio y móvil. Después ajustar textos, botones y borde del logo sobre esa composición.
3. Publicar el PNG de la tabla mediante el sistema administrable de [CISUS_PUBLIC_MEDIA.md](../architecture/CISUS_PUBLIC_MEDIA.md): dashboard o importador documentado, cargas con `uploadPublicMedia` y resolución con `getPublicMediaUrls`; no copiar ese PNG al frontend ni fijar su URL. Integrar el SVG como decoración vectorial de la portada, con `aria-hidden="true"` y sin interceptar clics. Puede incorporarse como SVG inline, siguiendo las convenciones existentes: no rasterizarlo ni crear un nuevo target de medios para un fondo que ahora se define por código. Mantener administrable la imagen del producto.
4. Comprobar la portada renderizada en escritorio y móvil junto a las respectivas referencias. El cierre requiere capturas que demuestren: imagen exacta de John visible y sin deformación; fondo nuevo integrado sin rectángulos o cortes; ausencia de la antigua escena de comedor; texto legible; botones con contornos naranja y gris; logo con borde blanco fino; y ausencia de desbordamiento horizontal. Verificar también ambos destinos de los botones. Entregar las capturas y la ubicación de los medios utilizados. No dar por terminada la tarea si falta la imagen suministrada o el fondo nuevo; indicar el requisito pendiente.
5. Antes de publicar una promesa de compra online, comprobar el recorrido existente desde Productos. Si la compra no está disponible, informar esa dependencia a John; no ampliar este encargo a construir un checkout ni reemplazar silenciosamente la compra por una cotización.
6. Elegir una sola verificación suficiente según [Juez](../../quality/README.md), además de la revisión visual pertinente. Informar el alcance realmente comprobado.

La tarea actual se verifica solo como documentación: coherencia del plan, referencias conservadas y enlaces válidos. No requiere build, navegación ni pruebas de aplicación.
