# Experiencia de Proceso: ideas y etapas independientes

## Relevo para Sol — 2026-09-08

**Objetivo:** terminar el desvanecido izquierdo y sustituir la flecha por el SVG del usuario, conservando el carrusel y el trabajo ya realizado. El usuario pidió detener la implementación y dejar este plan. Los pendientes siguientes NO están aplicados.

### Estado de partida comprobado

- Hay cambios sin commit en `process.html`, `process.scss`, `process-idea-orbit.{ts,html,scss,spec.ts}`, `idea-orbit.geometry.{ts,spec.ts}`, `process.spec.ts` y `core/services/marketing-content.ts`, bajo `cisus-angular/src/app/`. Conservarlos y revisar el diff antes de continuar. Hay otros cambios ajenos en el repositorio: no incluirlos ni revertirlos.
- Ya están implementados: texto «De una idea a la realidad» con descripción debajo, menor separación vertical en móvil, eliminación del halo rectangular y del distintivo de selección ✓, rueda y comienzo del arrastre solo sobre los discos, y giro por ocurrencias de una rueda continua en lugar de intercambiar dos nodos por producto.
- `process.ts` y `process-idea-icon.*` no tienen cambios en este trabajo. Se conservan la lógica de desplazamiento de etapas y los SVG de productos con sus trazos animados.
- El perfil `frontend-local` pasó después de esos cambios (build Angular y pruebas). No certifica la fluidez visual ni los pendientes siguientes. Chrome no estuvo disponible para las herramientas; no atribuirle una validación realizada en el navegador integrado.
- La flecha actual sigue siendo el dibujo provisional `M4 5C8 40 34 51 77 38M66 31L78 38L69 49`, no el SVG enviado después por el usuario.

### 1. Desvanecido espacial continuo, independiente de la selección

**Causa identificada en `process.scss`:** `.process-experience::before` tiene `z-index: 1`; `.step--active` tiene `z-index: 2`; `.steps-shell` no crea un contexto de apilamiento propio. Cuando `updateActiveStep()` cambia la clase activa, la tarjeta saliente pasa de encima a debajo del degradado. El cambio de capa es discreto, aunque la opacidad de la tarjeta tenga transición. Además, el degradado alcanza 100 px dentro de la posición de la tarjeta centrada. Esta combinación explica el salto de ocultación; no justifica cambiar la física del scroll.

Implementación acotada en `process.scss`:

1. Encapsular **todas** las tarjetas en un contexto de apilamiento de `.steps-shell` (`position: relative; z-index: 1`). Colocar el protector izquierdo encima de ese contexto (`z-index: 2`) y conservar el selector encima (`z-index: 3`). La tarjeta activa puede mantener su `z-index` interno para sus efectos: ya no debe atravesar la capa protectora.
2. Hacer que el degradado termine antes del borde izquierdo de la tarjeta **centrada**, no de la tarjeta marcada activa durante el movimiento. Usar la geometría existente: `C = (ancho de la escena - ancho de tarjeta) / 2`. El extremo transparente debe quedar en `C - margen`, con un margen inicial de 8 px. Eliminar el actual `+ 100px`.
3. Mantener una zona completamente opaca detrás de ambos iconos y una transición fija y suave entre esa zona y `C - margen`. No usar `activeIndex`, clases por etapa, temporizadores ni cambios de capa por tarjeta para ocultar contenido.
4. Ajustar **junto con el degradado** la posición horizontal del selector. Solo acortar el protector repetiría el problema de las fotos detrás del icono no seleccionado. Con la geometría actual (radio 220 px, ángulo vecino 226°, disco 112 px escalado a 0,76), el borde derecho del disco vecino está aproximadamente a 250 px del inicio de `.idea-stage`. Actualmente este empieza en `C - 288px`, por lo que ese disco llega hasta `C - 38px`: no cabe en una zona opaca que termine antes de una transición de 70–80 px.
5. Punto de partida calculado, **no resultado visual aprobado**: selector en `max(0px, C - 336px)`, transición de 72 px que termine en `C - 8px`. El disco vecino quedaría cerca de `C - 86px` y la transición comenzaría en `C - 80px`. Medir los rectángulos reales antes de fijar valores; comprobar también el recorrido de los discos, el foco y el ancho cercano a 1050 px. No compensar moviendo el carrusel ni agregando margen a sus tarjetas.
6. Conservar el protector desactivado en el diseño horizontal de hasta 1050 px, donde el selector está arriba. Actualizar el comentario de capas para describir el resultado real.

**Aceptación:** al pasar lentamente y rápido por el punto donde cambia la etapa activa, la parte visible de la tarjeta no salta de opacidad por cambiar de capa. Se desvanece según su posición horizontal, vuelve progresivamente al retroceder y queda libre de este protector al centrarse. No aparece borde vertical duro, foto detrás de los discos en reposo ni ocultación a la derecha.

### 2. Flecha exacta suministrada por el usuario

Modificar únicamente el SVG de `.orbit-heading__arrow` en `process-idea-orbit.html` y su regla en `process-idea-orbit.scss`:

- Conservar el color actual `#c9b789`.
- Aplicar **38 % de transparencia = `opacity: 0.62`**, interpretación comunicada al usuario. No confundirlo con 38 % de opacidad.
- Usar el dibujo relleno siguiente, preservando sus transformaciones, con proporción 71:56. Retirar el `fill="none"` y el trazo de la flecha provisional; usar `fill: currentColor`, sin añadir un contorno que engrose el dibujo.
- La opacidad solo corresponde a la flecha, no al rótulo, a los discos ni a `--trace-opacity` de los SVG de producto. Conservar `aria-hidden` y `focusable="false"` porque es decorativa. Verificar su orientación hacia los iconos en ambos diseños, sin redibujarla.

```html
<svg class="orbit-heading__arrow" viewBox="0 0 71 56" aria-hidden="true" focusable="false">
  <g transform="matrix(1,0,0,1,-382.757181,-315.313644)">
    <g transform="matrix(0.055094,0.998481,-0.998481,0.055094,737.66637,-93.257035)">
      <path d="M392.134,375.065C405.602,374.253 413.125,365.586 419.163,354.95C425.376,344.007 426.916,332.369 424.205,319.552C420.483,325.755 418.77,332.867 412.034,337.801C412.328,336.01 412.216,335.046 412.629,334.439C416.913,328.132 419.694,321.166 421.863,313.914C422.138,312.996 422.444,312.059 422.914,311.233C424.195,308.986 425.96,308.564 428.135,309.925C428.673,310.261 429.16,310.698 429.61,311.15C433.873,315.435 438.182,319.656 444.077,321.896C438.587,324.284 434.352,321.755 430.288,318.331C430.288,323.994 430.726,329.256 430.205,334.42C428.674,349.599 422.394,362.462 409.935,371.647C406.691,374.038 402.556,375.384 398.652,376.663C395.856,377.579 394.999,376.991 392.134,375.065Z" fill-rule="nonzero" />
    </g>
  </g>
</svg>
```

### 3. Cierre y riesgos concretos que faltan comprobar

- La rueda nueva conserva nodos por posición absoluta (`track item.position`) y un colchón de posiciones ocultas. No volver a `track idea.id`: produciría nuevamente el intercambio entre dos productos. Los tests prueban la geometría y la continuidad de nodos; falta observar el recorrido real en ambos sentidos, especialmente el retroceso con dos ideas, cuando entra una ocurrencia antes oculta.
- Rueda fuera del disco: debe desplazar la página sin cambiar de idea. Dentro: un avance por gesto, conservando el bloqueo de inercia actual. En táctil: gesto vertical sobre el disco debe permitir bajar; horizontal debe navegar ideas. Confirmar con eventos reales, no solo `dispatchEvent`.
- Riesgo concreto de interacción ya presente: `suppressClick` se activa al arrastrar y solo vuelve a `false` en otro `pointerdown`. Reproducir arrastre y luego activación con Enter/Espacio, que no generan `pointerdown`. Si bloquea esa activación, limitar la supresión al clic posterior al arrastre y añadir una prueba de regresión; no modificar el carrusel para resolverlo.
- Corregir la frase de distribución en `marketing-content.ts`, actualmente «Preparamos cada pieza para que llegue a tus manos o a quienes quieras compartirla». Redacción propuesta: «Preparamos cada pieza para que llegue a tus manos o a las personas con quienes quieras compartirla». No cambiar otras secciones del Home.
- No reintroducir botones anterior/siguiente, contadores inferiores, subtítulos de ideas, encabezados redundantes entre selector y tarjetas, biseles o la línea amarilla. Mantener solo el título de la idea seleccionada y la taza derecha.
- No modificar `process.ts`, los eventos del rail, `scroll-snap-type`, `scroll-snap-align`, el padding simétrico, el ancho/gap de las tarjetas ni los efectos `step-progress-glide` y `final-border-orbit` para arreglar estas capas. No reintroducir `scroll-snap-stop: always`.
- Revisar en Chrome y, por separado, en el integrado: 01 → 07 → 01, desplazamiento lento/rápido, inversión a mitad de gesto, clic en una tarjeta lateral y cambio de idea en una etapa intermedia. Primera y última deben alcanzar el mismo centro. Si Chrome no está disponible, declararlo como comprobación pendiente, no prometer equivalencia.
- Comprobar escritorio amplio, el límite 1050/1051 px y móvil (por ejemplo 390 px): sin solapamientos, espacio vertical proporcionado, flecha legible y foco visible. Restablecer cualquier tamaño de navegador temporal.
- Después de implementar los pendientes, ejecutar una sola vez el perfil `frontend-local` indicado al final. Añadir una comprobación de la jerarquía de capas y del extremo del protector antes de la tarjeta centrada; no presentar pruebas DOM simuladas como certificación de fluidez.

**Entrega de Sol:** resumir los archivos realmente cambiados y las comprobaciones efectivamente realizadas. No afirmar «restaurado exactamente» ni «sin regresiones» basándose únicamente en un build verde. No hacer un reset ni un commit global del árbol sucio.

## Responsabilidades

- `Process` conserva la idea elegida, la etapa activa y la suscripción pública de imágenes. Solo este componente mueve el carrusel de etapas.
- `ProcessIdeaOrbit` presenta un catálogo de ideas, controla clic, rueda, arrastre y teclado, y emite un identificador. No conoce las siete etapas ni modifica su posición.
- `idea-orbit.geometry.ts` calcula vueltas, posiciones y ventana visible a partir de índices y cantidad. No contiene coordenadas por producto.
- `ProcessIdeaIcon` conserva los SVG suministrados y su trazo animado. Cada instancia recibe un identificador único para evitar colisiones entre gradientes del selector y las tarjetas sin fotografía.

## Invariantes que no se deben romper

1. Cambiar de idea conserva la etapa actual. Las imágenes se eligen por idea y etapa; nunca se toma la fotografía de otra idea como respaldo.
2. El carrusel ocupa todo el ancho de la escena y tiene márgenes interiores simétricos. Primera, intermedias y última tarjeta alcanzan **el mismo centro**. El selector no reduce ese ancho y no necesita navegación inferior redundante.
3. Objetivo del pendiente descrito arriba: en escritorio, el fondo protector está exclusivamente a la izquierda y termina antes de la tarjeta centrada, sin depender de su selección. No aplicar máscara, corte ni degradado en el extremo derecho del carrusel.
4. Los botones de ideas se desplazan sobre un arco y contrarrotan: los productos permanecen derechos, especialmente la taza. Se conservan ocurrencias por posición absoluta para continuar la rueda incluso con dos ideas. La trayectoria se expresa mediante movimiento, sin dibujar la antigua línea amarilla.
5. En pantallas de hasta 1050 px, el arco se dispone horizontalmente arriba del carrusel. Rueda y comienzo de arrastre pertenecen solo a los discos; el espacio vacío no captura esos gestos. El gesto horizontal táctil permite mantener el desplazamiento vertical de la página.
6. El trazo fino de hover/foco sigue la silueta SVG de la tabla y **solo la base portavasos** en el icono de café, nunca la taza, el vapor ni el disco del botón. La idea seleccionada mantiene un acento más tenue.
7. El brillo inferior de la tarjeta activa (`step-progress-glide`) y el borde de la última tarjeta (`final-border-orbit`) pertenecen al carrusel, no al selector. Con movimiento reducido conservan un acento estático.
8. Las ideas fuera de la ventana visible no reciben foco ni interacción. Las flechas de teclado trasladan el foco a la nueva selección; rueda y arrastre cambian la idea sin controles redundantes bajo el selector.

## Incorporar una idea

La presentación consume `id`, `label`, `illustration` y `status` del catálogo `MarketingContent.processIdeas`. No hay que añadir ángulos, selectores CSS ni condiciones por identificador. Si necesita un nuevo dibujo, extender `ProcessIdeaIllustration` y su representación en `ProcessIdeaIcon`.

Esto **no** hace arbitrarias las rutas de medios: antes de publicar una idea nueva, ampliar deliberadamente los tipos y targets permitidos en frontend/backend, conforme a [CISUS_PUBLIC_MEDIA.md](CISUS_PUBLIC_MEDIA.md). Mantener el gateway administrativo y la resolución de URLs existente. Los targets de Portavasos siguen siendo los históricos; no necesitan renombrarse ni migrarse en Storage.

`developing` presenta «En construcción» en las etapas que todavía no tienen foto. Cuando se publica una imagen por el flujo administrativo, esa etapa la muestra. No usar fotos de respaldo en assets del frontend.

## Verificación

```powershell
npm run verify -- --profile frontend-local
```

Las pruebas cubren catálogos de 1, 2, 3, 5 y 12 ideas, vueltas negativas, selección, foco, rueda con inercia, arrastre, independencia idea/etapa, URLs, interrupción de navegación y centrado con geometría simulada. No sustituyen la revisión visual.

Revisar en navegador escritorio y móvil: avance hasta 07, vuelta a 01, cambio de idea desde una etapa intermedia, foco visible, trazo SVG, brillos de tarjetas, ausencia de solapamiento entre botones y ausencia de corte derecho. En escritorio arrastrar verticalmente; en móvil horizontalmente.
