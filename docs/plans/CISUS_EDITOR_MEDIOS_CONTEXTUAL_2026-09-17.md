# Edición contextual de medios: portada, producto y Proceso

Fecha: 17 de septiembre de 2026. Actualización: 19 de septiembre de 2026. Estado: implementado localmente; validación productiva pendiente.

## Entrega local y límites de verificación

- Código en `C:/Users/icard/Proyectos/Cisus`: editor contextual de portada, producto, miniatura y Proceso; hasta seis capas de portada/producto; animación opcional de la capa superior; cierre exterior/Escape; recomendaciones y descarga mediante callable autenticado.
- Juez `full` pasó el 17 de septiembre (Angular, Functions y contrato estático de seguridad). La corrección responsive posterior se comprueba con `frontend-local`.
- En navegador se comprobaron cambio Felino/Delfín, destino independiente de miniatura, recomendaciones de Proceso, cierre exterior y Escape. No se publicaron imágenes de prueba ni se desplegó desde esta tarea.
- El 19 de septiembre se confirmó que las dos imágenes de portada conservan 1672 × 941. La reducción móvil provenía del CSS: contener el lienzo horizontal completo dejaba la composición con unos 210 px de alto. Se corrigió con una ventana móvil de `clamp(360px, 100vw, 530px)`, encuadre derecho/inferior idéntico para todas las capas y cobertura del lienzo. Se recorta ambiente lateral, no se recortan los archivos ni sus márgenes alpha por separado. La tabla actual se ve completa y con mayor presencia.
- Comprobados anchos 390, 768, 1280 y 1920: capas con geometría idéntica, fondo de ancho completo y sin desbordamiento horizontal. La proporción del archivo no obliga a mostrar todo su espacio vacío en una pantalla estrecha. Nuevas composiciones con sujeto en otra posición requieren revisar su encuadre.
- Pendiente: desplegar los recursos enumerados en la guía de medios con autorización y comprobar descarga real en el entorno desplegado. La comprobación final de sesión/productos está además limitada por `auth/network-request-failed` de Firebase observado en el navegador. No atribuir ese error a la imagen ni considerar un test simulado como descarga productiva verificada.

## Objetivo

Extender el editor de portada existente al producto seleccionado, sus miniaturas y cada imagen de Proceso; permitir capas alineadas en portada/producto y corregir descarga, cierre y encuadre responsive. Conservar la jerarquía comercial y las imágenes actuales. John prepara los recortes; no usar generación de imágenes.

## Evidencia inicial

- En localhost, «Descargar Capa 1 · Imagen base» muestra error y no produce evento de descarga. El motivo de red no quedó demostrado: no asumir CORS ni atribuirlo a conexión del usuario sin diagnosticarlo.
- El panel de capas no se cierra al pulsar el título fuera de él.
- Base y grabado de portada y escena Felino publicados: 1672 × 941, aproximadamente 16:9. Las miniaturas actuales reutilizan escenas completas.
- Proceso tiene imágenes verticales de 911 × 1200, 960 × 1200 y 900 × 1200; la tarjeta observada ronda 309 × 402. No recomendar el 16:9 de portada para esas tarjetas.
- En CSS actual, el fondo de portada está dentro de `.hero-stage`, limitado a 1540 px. La escena móvil usa anchos de 145–180vw y desplazamiento lateral. En Productos, la escena también puede superar el ancho del contenedor. Son problemas de composición, no una falta que se resuelva solo cambiando el archivo.

## Comportamiento requerido

1. **Edición contextual:** identificar siempre destino y nombre: «Producto · Felino», «Miniatura · Delfín», «Proceso · Portavasos · Idea». Cambiar selección no debe enviar una subida pendiente al nuevo producto/etapa. Mantener edición reservada al equipo autorizado, nunca visible ni operativa para visitante.
2. **Capas de portada/producto:** permitir una imagen o agregar dos o más capas. Orden de abajo hacia arriba visible. Reutilizar imagen base actual y superposición actual sin migración destructiva. Cada capa se carga, descarga y reemplaza por separado. Todas usan el mismo lienzo, proporción, escala, posición y punto de referencia; no recortar automáticamente los márgenes transparentes ni aplicar encuadres independientes.
3. **Animación:** solo la capa más alta puede tener «Aparecer» o «Desaparecer»; «Sin animación» desactiva el efecto. Definir y documentar un disparo claro al mostrar/cambiar la escena, sin bucles automáticos ni transformaciones que desalineen. Con una sola capa, conservar el producto visible; no hacer desaparecer la única imagen. Respetar movimiento reducido con estado final legible.
4. **Proceso:** edición de la imagen de cada etapa y de cada idea existente por separado. No ampliar a capas de Proceso sin necesidad del encargo. Conservar navegación y avance del carrusel; operar el editor no debe seleccionar otra etapa accidentalmente.
5. **Miniaturas:** referencia independiente de escena y foto de catálogo. Si no hay miniatura propia, conservar el fallback actual. El cambio de miniatura no altera el producto protagonista ni otras miniaturas.
6. **Cierre:** panel de capas se cierra al pulsar fuera o Escape; clic dentro no lo cierra. Modal también admite cierre mediante fondo, Escape y botón. Gestionar selecciones pendientes y una publicación en curso explícitamente: no fingir cancelar una operación ya enviada ni cambiar su destino. Restaurar foco de forma accesible.
7. **Descarga:** entregar el archivo publicado de la capa/miniatura/etapa elegida con nombre reconocible. Comprobar descarga real, contenido no vacío y tipo correcto. Un toast o abrir la imagen no constituye descarga verificada. Resolver el fallo dentro del flujo de medios existente, sin exponer recursos privados ni abrir permisos globales.

## Proporciones y acabado

Mostrar la recomendación tanto en el panel pequeño como en el editor del archivo, junto con tamaño actual y tamaño propuesto cuando se selecciona un archivo. Para capas añadidas, manda el lienzo de la base publicada; indicar esa dimensión y advertir/bloquear incompatibilidades que impidan calzar. No deformar para forzar coincidencia.

- Portada y composición editorial actual de tablas: referencia 1672 × 941 (~16:9); ejemplo nuevo 1920 × 1080 solo cuando se preparen conjuntamente todas las capas de esa composición. No reemplazar una capa existente con otra proporción silenciosamente.
- Producto de otra familia: derivar de su base, no asumir que todos los pomos y tiradores tienen el mismo lienzo que Felino.
- Miniatura independiente: recomendar lienzo cuadrado 1:1 con pieza completa centrada y márgenes; mostrar con contención, sin cortar tiradores largos. No confundir tamaño de la tarjeta con recorte obligatorio del objeto.
- Proceso: recomendar composición vertical aproximadamente 3:4, por ejemplo 900 × 1200, y avisar del pequeño ajuste de encuadre de la tarjeta responsive; comprobar texto y zona importante dentro del área visible.
- Fondo: cubrir todo el ancho de la sección/viewport, separado del límite de ancho del texto. Puede recortarse el ambiente al adaptarse; no la silueta importante del producto. «Cubrir» y «mostrar el objeto completo» son roles distintos.

La proporción por sí sola no evita cortes: revisar contenedores, límites de ancho y desplazamientos. Todas las capas deben reaccionar como una sola composición en móvil y escritorio. No estirar bitmaps ni añadir overflow oculto para encubrir una geometría incorrecta. Si el archivo ya contiene un corte de origen, señalarlo sin inventar una reparación de imagen.

## Backend y comprobación

Leer [medios públicos](../architecture/CISUS_PUBLIC_MEDIA.md). Reutilizar editor, gateway, `uploadPublicMedia`, `getPublicMediaUrls`, Storage versionado, read models y auditoría. Extensiones necesarias para capas y miniaturas deben ser retrocompatibles y validadas en servidor: tipo, destino, índice/límite de capas, tamaño, formato, rol y contexto. Sin assets administrables en frontend, rutas arbitrarias ni escrituras directas desde Angular. Conservar fotos existentes.

No cambiar datos reales para probar uploads: localhost usa Firebase productivo. Usar gateways simulados o emulador para creación de capa y reemplazo independiente. No desplegar ni publicar imágenes por inferencia de autorización; informar recursos pendientes de despliegue.

Comprobar 390, 768, 1280 y 1920 px: fondo hasta bordes, siluetas sin cortes involuntarios, capas calzadas, sin desplazamiento horizontal de página y acciones visibles. Verificar teclado, cierre exterior/interior/Escape, descarga real, recomendación por sección, elección de archivo incompatible, edición de Felino frente a Delfín, miniatura independiente e idea+etapa de Proceso. Cubrir cambio de contexto durante lectura/subida y no edición por visitante. Aplicar Juez según alcance; si cambian frontend y backend/contratos, usar `full` y declarar los límites de lo probado.

## Criterio comercial

La edición en contexto reduce el riesgo de reemplazar la imagen equivocada y permite mantener la presentación sin tocar código. Las capas permiten reutilizar una composición; no justifican efectos que distraigan de la pieza o su acción comercial. Coste: mayor contrato de medios y validación de encuadres. Se comprueba con edición inequívoca y presentación consistente, sin prometer aumento de ventas.
