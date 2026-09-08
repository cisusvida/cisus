# Experiencia de Proceso: ideas y etapas independientes

## Responsabilidades

- `Process` conserva la idea elegida, la etapa activa y la suscripción pública de imágenes. Solo este componente mueve el carrusel de etapas.
- `ProcessIdeaOrbit` presenta un catálogo de ideas, controla clic, rueda, arrastre y teclado, y emite un identificador. No conoce las siete etapas ni modifica su posición.
- `idea-orbit.geometry.ts` calcula vueltas, posiciones y ventana visible a partir de índices y cantidad. No contiene coordenadas por producto.
- `ProcessIdeaIcon` conserva los SVG suministrados y su trazo animado. Cada instancia recibe un identificador único para evitar colisiones entre gradientes del selector y las tarjetas sin fotografía.

## Invariantes que no se deben romper

1. Cambiar de idea conserva la etapa actual. Las imágenes se eligen por idea y etapa; nunca se toma la fotografía de otra idea como respaldo.
2. El carrusel ocupa todo el ancho de la escena y tiene márgenes interiores simétricos. Primera, intermedias y última tarjeta alcanzan **el mismo centro**, compartido por la navegación inferior. El selector no reduce ese ancho.
3. En escritorio, el fondo protector está exclusivamente a la izquierda y termina antes de la tarjeta activa. No aplicar máscara, corte ni degradado en el extremo derecho del carrusel.
4. Los botones de ideas se desplazan sobre un arco y contrarrotan: los productos permanecen derechos, especialmente la taza. La trayectoria se expresa mediante movimiento, sin dibujar la antigua línea amarilla.
5. En pantallas de hasta 1050 px, el arco se dispone horizontalmente arriba del carrusel. El gesto horizontal del selector permite mantener el desplazamiento vertical de la página.
6. El trazo fino de hover/foco sigue la silueta SVG de la tabla y **solo la base portavasos** en el icono de café, nunca la taza, el vapor ni el disco del botón. La idea seleccionada mantiene un acento más tenue.
7. El brillo inferior de la tarjeta activa (`step-progress-glide`) y el borde de la última tarjeta (`final-border-orbit`) pertenecen al carrusel, no al selector. Con movimiento reducido conservan un acento estático.
8. Las ideas fuera de la ventana visible no reciben foco ni interacción. Las flechas de teclado trasladan el foco a la nueva selección. Los botones explícitos permiten usar ambas navegaciones sin gestos.

## Incorporar una idea

La presentación consume `id`, `label`, `illustration` y `status` del catálogo `MarketingContent.processIdeas`. No hay que añadir ángulos, selectores CSS ni condiciones por identificador. Si necesita un nuevo dibujo, extender `ProcessIdeaIllustration` y su representación en `ProcessIdeaIcon`.

Esto **no** hace arbitrarias las rutas de medios: antes de publicar una idea nueva, ampliar deliberadamente los tipos y targets permitidos en frontend/backend, conforme a [CISUS_PUBLIC_MEDIA.md](CISUS_PUBLIC_MEDIA.md). Mantener el gateway administrativo y la resolución de URLs existente. Los targets de Portavasos siguen siendo los históricos; no necesitan renombrarse ni migrarse en Storage.

`developing` presenta «En construcción» en las etapas que todavía no tienen foto. Cuando se publica una imagen por el flujo administrativo, esa etapa la muestra. No usar fotos de respaldo en assets del frontend.

## Verificación

```powershell
npm --prefix cisus-angular test -- --watch=false --include="src/app/features/home/components/process/*.spec.ts"
npm run verify -- --profile frontend-local
```

Las pruebas cubren catálogos de 1, 2, 3, 5 y 12 ideas, vueltas negativas, selección, foco, rueda con inercia, arrastre, independencia idea/etapa, URLs, interrupción de navegación y centrado con geometría simulada. No sustituyen la revisión visual.

Revisar en navegador escritorio y móvil: avance hasta 07, vuelta a 01, cambio de idea desde una etapa intermedia, foco visible, trazo SVG, brillos de tarjetas, ausencia de solapamiento entre botones y ausencia de corte derecho. En escritorio arrastrar verticalmente; en móvil horizontalmente.
