# Compra a entrega: índice de ejecución

Reparación documental: 27 de septiembre de 2026. Este índice controla las 55 fichas del [plan maestro](../CISUS_FLUJO_COMPRA_PLAN_DE_EJECUCION_2026-09-27.md). **Una conversación implementa una ficha; su cierre puede preparar documentalmente una sucesora.**

## Traspaso actual

- **Tarea:** [T02](tareas/T02.md).
- **Acción de la próxima sesión:** EJECUTAR.
- **Preparación:** LISTA; T01 está verificada y T02 tiene API local, rutas, compatibilidad explícita y casos concretos.
- **Ejecución:** PENDIENTE.
- **Motivo del traspaso:** T01 creó el selector aislado y pasó `frontend-local`. T02 conserva su contrato sin integrarlo a Home.
- **Lecturas de la próxima sesión:** T02, el protocolo, la evidencia pertinente de T01 y las referencias de código de solo lectura consignadas en T02.
- **Cierre de la próxima sesión:** ejecutar únicamente T02; después de verificarla, preparar documentalmente solo T03, registrar el cierre en un commit local y detenerse. No implementar T03 ni conectar Home.
- **Checkout:** `C:\Users\icard\Proyectos\Cisus`, rama `master`; sin ramas ni worktrees nuevos.

## Cómo usarlo

1. Copiar el [prompt reutilizable](PROMPT.md) en una conversación nueva del proyecto. SIGUIENTE selecciona el traspaso anterior; se puede indicar un ID concreto.
2. Leer el [protocolo](PROTOCOLO.md) y la ficha seleccionada, no todas las fichas.
3. Si está LISTA, contrastar vigencia y ejecutar solo esa tarea.
4. Si no está LISTA, realizar únicamente preparación documental o registrar el bloqueo; otra sesión ejecutará la ficha cerrada.
5. Tras verificar una tarea, actualizar este índice y preparar una sola sucesora conforme al protocolo. Nunca programarla en la misma conversación.
6. Revisar y registrar las rutas propias en un commit local en `master`; comprobar el estado del árbol. Conservar e identificar cualquier pendiente ajeno. Usar el prompt vigente completo, sustituyendo versiones anteriores.

Las 55 fichas existen con resultado, contrato funcional, límites, dependencias, decisiones, escenarios y comprobación prevista. **T03–T55 son fichas base POR_PREPARAR**, porque las rutas técnicas finales dependen de código futuro y algunas decisiones siguen abiertas. T02 ya está LISTA con alcance aislado y sin integración pública. No presentar las fichas POR_PREPARAR como órdenes de implementación completas.

El trabajo de preparación de una sucesora puede fijar interfaces/rutas y pruebas a partir de lo implementado; no puede inventar políticas. Si falta una decisión, dejar BLOQUEADA con pregunta concreta. No marcar la tarea anterior fallida por ese bloqueo posterior.

## Índice y estado único

La columna Preparación indica si se puede programar. Ejecución informa trabajo real, no cuánto texto tiene la ficha. Mantener las dependencias al dividir una ficha amplia; el protocolo define agrupadores Tnn y ejecuciones Tnn-A, Tnn-B.

| ID | Resultado | Preparación | Ejecución | Predecesoras |
| --- | --- | --- | --- | --- |
| [T01](tareas/T01.md) | Crear el selector aislado de las cuatro intenciones, sin conectarlo todavía a la página pública. | LISTA | VERIFICADA | Ninguna |
| [T02](tareas/T02.md) | Conservar producto y opciones compatibles al avanzar, retroceder o cambiar de intención. | LISTA | PENDIENTE | T01 |
| [T03](tareas/T03.md) | Fijar el contrato técnico de borrador, solicitud, pedido y estados independientes, incluyendo su relación con ventas y proyectos existentes. | POR_PREPARAR | PENDIENTE | T02 |
| [T04](tareas/T04.md) | Configurar qué productos y opciones tienen una oferta comprable; conservar las condiciones de pedidos anteriores. | POR_PREPARAR | PENDIENTE | T03 |
| [T05](tareas/T05.md) | Obtener del servidor una oferta vigente con contenido, precio y condiciones; un concepto permanece como consulta. | POR_PREPARAR | PENDIENTE | T04 |
| [T06](tareas/T06.md) | Reservar y liberar disponibilidad sin sobreventa ante concurrencia, vencimientos o reintentos. | POR_PREPARAR | PENDIENTE | T05 |
| [T07](tareas/T07.md) | Consultar cobertura, servicio y tarifa de entrega; representar correctamente una respuesta desconocida o fallida. | POR_PREPARAR | PENDIENTE | T05 |
| [T08](tareas/T08.md) | Crear un pedido durable de invitado con contenido y condiciones aceptadas, sin duplicarlo al reintentar. | POR_PREPARAR | PENDIENTE | T06, T07 |
| [T09](tareas/T09.md) | Consultar y recuperar ese pedido mediante acceso autorizado, sin conceder acceso por conocer un correo o número de pedido. | POR_PREPARAR | PENDIENTE | T08 |
| [T10](tareas/T10.md) | Construir el resumen de compra con comprador, destinatario, dirección, contenido y total confirmado por servidor. | POR_PREPARAR | PENDIENTE | T02, T05, T07, T08, T09 |
| [T11](tareas/T11.md) | Crear el intento y enlace de pago asociados al pedido y a sus condiciones vigentes. | POR_PREPARAR | PENDIENTE | T08, T09, T10 |
| [T12](tareas/T12.md) | Verificar notificaciones del proveedor y aplicar una sola vez sus efectos. | POR_PREPARAR | PENDIENTE | T11 |
| [T13](tareas/T13.md) | Resolver pagos tardíos, inciertos o pendientes mediante conciliación administrativa registrada. | POR_PREPARAR | PENDIENTE | T12 |
| [T14](tareas/T14.md) | Mostrar al comprador confirmación, espera, fallo y reintento sin confundir retorno del proveedor con pago confirmado. | POR_PREPARAR | PENDIENTE | T10, T12, T13 |
| [T15](tareas/T15.md) | Vincular posteriormente la compra a una cuenta nueva o existente, conservando el mismo pedido. | POR_PREPARAR | PENDIENTE | T09, T14 |
| [T16](tareas/T16.md) | Recibir solicitudes corporativas, de reventa y de nuevas ideas con referencia y próximo paso, sin convertirlas automáticamente en pedidos. | POR_PREPARAR | PENDIENTE | T03, T09 |
| [T17](tareas/T17.md) | Mostrar una cola operativa con responsable, próxima acción y pendientes de cada pedido. | POR_PREPARAR | PENDIENTE | T08, T12, T16 |
| [T18](tareas/T18.md) | Revisar el contenido comprometido: cantidades, personalización, complementos, regalos incorporados y correcciones. | POR_PREPARAR | PENDIENTE | T17 |
| [T19](tareas/T19.md) | Asignar contenido conforme a cajas identificadas, detectando faltantes y duplicaciones. | POR_PREPARAR | PENDIENTE | T18 |
| [T20](tareas/T20.md) | Autorizar despacho según pagos, destino, servicio y alcance completo o parcial acordado. | POR_PREPARAR | PENDIENTE | T13, T19 |
| [T21](tareas/T21.md) | Generar etiquetas y resolver reintentos inciertos sin duplicar envíos. | POR_PREPARAR | PENDIENTE | T07, T20 |
| [T22](tareas/T22.md) | Registrar la entrega efectiva al transportista, separada de la generación de etiqueta. | POR_PREPARAR | PENDIENTE | T21 |
| [T23](tareas/T23.md) | Actualizar seguimiento por caja, conservando fuente, fecha e incidencias. | POR_PREPARAR | PENDIENTE | T22 |
| [T24](tareas/T24.md) | Mostrar al cliente resumen, documentos permitidos, progreso y próxima acción sobre los hechos del pedido. | POR_PREPARAR | PENDIENTE | T09, T15, T23 |
| [T25](tareas/T25.md) | Emitir avisos relevantes y hacer visibles los fallos de notificación con un responsable. | POR_PREPARAR | PENDIENTE | T09, T14, T17, T24 |
| [T26](tareas/T26.md) | Abrir y gestionar incidencias vinculadas a la compra, incluso después de la entrega logística. | POR_PREPARAR | PENDIENTE | T24, T25 |
| [T27](tareas/T27.md) | Solicitar y resolver cancelaciones con autoridad administrativa y condiciones aplicables identificadas. | POR_PREPARAR | PENDIENTE | T13, T17, T26 |
| [T28](tareas/T28.md) | Aplicar los efectos autorizados de cancelación o reembolso una sola vez, conservando historia. | POR_PREPARAR | PENDIENTE | T06, T12, T27 |
| [T29](tareas/T29.md) | Conectar «Lo quiero» al recorrido completo: compra personal habilitada y solicitudes utilizables para las otras intenciones. | POR_PREPARAR | PENDIENTE | T01, T02, T15, T16, T28 |
| [T30](tareas/T30.md) | Configurar materiales, tiempos, recursos y calendario de fabricación. | POR_PREPARAR | PENDIENTE | T03, T17 |
| [T31](tareas/T31.md) | Calcular compromisos de preparación considerando capacidad, cantidades y pendientes del cliente. | POR_PREPARAR | PENDIENTE | T06, T30 |
| [T32](tareas/T32.md) | Identificar interlocutor, pagador y aprobador del cliente por pedido corporativo. | POR_PREPARAR | PENDIENTE | T09, T16 |
| [T33](tareas/T33.md) | Preparar y versionar una propuesta comercial con contenido, alcance, condiciones y vigencia. | POR_PREPARAR | PENDIENTE | T05, T31, T32 |
| [T34](tareas/T34.md) | Registrar la aceptación identificada de una versión y tratar propuestas vencidas. | POR_PREPARAR | PENDIENTE | T33 |
| [T35](tareas/T35.md) | Aplicar los hitos de pago acordados y bloquear compromisos o despacho cuando falte el respaldo requerido. | POR_PREPARAR | PENDIENTE | T13, T34 |
| [T36](tareas/T36.md) | Gestionar el trabajo de diseño y sus revisiones dentro del alcance contratado. | POR_PREPARAR | PENDIENTE | T33, T35 |
| [T37](tareas/T37.md) | Obtener la conformidad del cliente sobre una referencia visual concreta. | POR_PREPARAR | PENDIENTE | T36 |
| [T38](tareas/T38.md) | Registrar la aprobación final del administrador de Cisus sobre esa versión; conservar la separación de autoridades. | POR_PREPARAR | PENDIENTE | T37 |
| [T39](tareas/T39.md) | Preparar el paquete versionado de fabricación con archivos, medidas, materiales e instrucciones. | POR_PREPARAR | PENDIENTE | T38 |
| [T40](tareas/T40.md) | Liberar fabricación tras comprobar las condiciones comerciales, de arte, recursos y revisión técnica aplicables. | POR_PREPARAR | PENDIENTE | T31, T35, T39 |
| [T41](tareas/T41.md) | Registrar cantidades por etapa, correcciones y nueva revisión de las piezas corregidas. | POR_PREPARAR | PENDIENTE | T18, T40 |
| [T42](tareas/T42.md) | Gestionar cambios posteriores y revalidar las dependencias afectadas, conservando lo ya ejecutado. | POR_PREPARAR | PENDIENTE | T28, T34, T35, T38, T39, T41 |
| [T43](tareas/T43.md) | Incorporar conversación por pedido, distinguiendo mensajes compartidos y notas internas. | POR_PREPARAR | PENDIENTE | T24, T25, T32 |
| [T44](tareas/T44.md) | Habilitar el recorrido corporativo completo y comprobar sus diferencias respecto de la compra personal. | POR_PREPARAR | PENDIENTE | T29, T42, T43 |
| [T45](tareas/T45.md) | Presentar y compartir selecciones comerciales desde una vista del captador que proteja información interna. | POR_PREPARAR | PENDIENTE | T02, T05, T16, T29 |
| [T46](tareas/T46.md) | Registrar oportunidades, encaje comercial, responsable y próxima acción dentro de sus facultades. | POR_PREPARAR | PENDIENTE | T17, T45 |
| [T47](tareas/T47.md) | Traspasar una oportunidad o pedido mediante aceptación del nuevo responsable, conservando historial y atribución. | POR_PREPARAR | PENDIENTE | T25, T43, T46 |
| [T48](tareas/T48.md) | Configurar el convenio y acceso de reventa mayorista una vez ratificados sus términos. | POR_PREPARAR | PENDIENTE | T03, T32 |
| [T49](tareas/T49.md) | Comprar para reventa con condiciones por cantidad autorizadas, reutilizando preparación y entrega. | POR_PREPARAR | PENDIENTE | T20, T34, T35, T48 |
| [T50](tareas/T50.md) | Mostrar compras, reposición y las analíticas sustentadas por datos reales disponibles. | POR_PREPARAR | PENDIENTE | T49 |
| [T51](tareas/T51.md) | Convertir una nueva idea en una evaluación o desarrollo con alcance, entregables y condiciones definidos. | POR_PREPARAR | PENDIENTE | T16, T33, T36 |
| [T52](tareas/T52.md) | Integrar generación de imágenes para diseño con límites de uso, permisos sobre el material y versiones conservadas. | POR_PREPARAR | PENDIENTE | T36, T37 |
| [T53](tareas/T53.md) | Habilitar el recorrido de reventa y verificar que no conceda permisos internos de Cisus. | POR_PREPARAR | PENDIENTE | T29, T47, T50 |
| [T54](tareas/T54.md) | Habilitar el recorrido de nuevas ideas con sus compromisos y límites visibles. | POR_PREPARAR | PENDIENTE | T44, T51, T52 |
| [T55](tareas/T55.md) | Cerrar la trazabilidad del alcance implementado y comprobar las interacciones relevantes entre recorridos. | POR_PREPARAR | PENDIENTE | T29, T44, T53, T54 |

Las dependencias son mínimas; todas se verifican antes de marcar LISTA. La condición real del piloto puede requerir revisar el orden: T29 no autoriza vender fabricación por encargo sin las tareas de fabricación correspondientes. Dejar explícita esa dependencia si el producto piloto no puede salir de existencias verificadas.

## Fuentes y cobertura

- [Recorrido](../CISUS_FLUJO_COMPRA_A_ENTREGA_2026-09-24.md).
- [Matriz CF, EC y decisiones D](../CISUS_FLUJO_COMPRA_CONTROLES_Y_TRAZABILIDAD_2026-09-26.md).
- [Asignación de requisitos y escenarios a fichas](TRAZABILIDAD.md).
- [Juez](../../../quality/README.md).

CF-17, CF-32 y CF-40 siguen diferidos; T55 comprueba que no se activen accidentalmente. La cobertura de planificación no acredita implementación, cumplimiento comercial ni pruebas ejecutadas.

## Registro histórico de la reparación previa a T01

Se crearon las 55 fichas, protocolo, prompt y matriz de asignación. Se concretó T01 contra Angular/archivos actuales. No se modificaron componentes, reglas, dependencias ni datos productivos. No se ejecutó T01 ni se preparó su código.

Verificación documental: 55 IDs únicos y ordenados, dependencias existentes y sin ciclos, coincidencia de dependencias entre índice y fichas, 40 CF y 30 EC asignados, enlaces locales válidos, fences y whitespace revisados. Se comprobó que T01 sigue sin archivos de aplicación creados y que solo ella figura LISTA. No se ejecutaron build ni suites de aplicación por este cambio documental.

## Revisión posterior a T01 — 27 de septiembre de 2026

Se revisó el chat «Ejecuta únicamente la tarea T01», los cinco archivos entregados y la evidencia de Juez: alcance respetado, T02 preparada sin implementarla y `frontend-local` aprobado tras corregir un stub de JSDOM. No se identificó un cambio de código necesario dentro de T01; esta revisión no abrió navegador ni volvió a ejecutar las suites.

Se corrigió la contradicción del traspaso que prohibía a T02 preparar T03. El protocolo ahora comprueba consistencia entre índice y fichas, incluye archivos nuevos en la revisión del diff y cierra cada tarea con commit local en el checkout principal `master`. Los pendientes anteriores del plan y T01 se conservan al incorporarlos a Git. La preferencia de trabajar aquí no activa el selector en Home: esa integración mantiene su alcance acordado.
