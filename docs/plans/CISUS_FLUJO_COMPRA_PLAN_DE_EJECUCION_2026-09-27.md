# Cisus: ejecución progresiva, una tarea por conversación

Fecha: 27 de septiembre de 2026.

Estado: plan maestro reparado el 27 de septiembre de 2026. Existen las 55 fichas en el [índice de ejecución](compra-a-entrega/README.md), con [protocolo](compra-a-entrega/PROTOCOLO.md), [prompt reutilizable](compra-a-entrega/PROMPT.md) y [asignación CF/EC](compra-a-entrega/TRAZABILIDAD.md). El índice conserva el estado actual y la siguiente tarea; este plan no duplica ese estado. Las decisiones comerciales pendientes y la autorización de despliegue conservan sus límites.

## 1. Objetivo y decisiones fijadas

Convertir la documentación del flujo completo en **fichas de ejecución pequeñas, verificables y utilizables en una conversación nueva con GPT-6 Luna**, sin depender de recordar este chat.

Queda definido:

- Primero completaremos **compra personal como invitado → preparación → entrega → atención**.
- El selector de las cuatro intenciones se construirá primero, **sin publicarlo**.
- La entrada pública se activará cuando conduzca a recorridos utilizables.
- Cada conversación ejecutará **una sola ficha**. Corregir y comprobar esa tarea forma parte de ella. Al verificarla, se preparará documentalmente una sola sucesora; programar esa sucesora requiere otra conversación. La preparación no se encadena más allá de esa sucesora.
- Las tareas se desarrollan directamente en el checkout principal `C:\Users\icard\Proyectos\Cisus`, rama `master`, sin ramas ni worktrees nuevos salvo petición expresa. Cada cierre verificado se registra en un commit local acotado; conservar cambios ajenos y comprobar el estado final, sin push ni despliegue por iniciativa propia.
- Importes, anticipos, duraciones y condiciones comerciales pendientes conservarán su bloqueo explícito. El programador no los inventará.
- Promoción del portavasos, puzle, consignación y generación automática de código G permanecerán en el alcance futuro acordado.

La documentación oficial presenta Luna como un modelo orientado a tareas acotadas. Eso respalda esta división, pero no garantiza ausencia de errores: la protección vendrá también del alcance explícito y las comprobaciones. [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)

## 2. Documentación y contrato de cada sesión

### Fuentes y organización

Se conservarán como fuentes de negocio:

- [Recorrido consolidado](CISUS_FLUJO_COMPRA_A_ENTREGA_2026-09-24.md).
- [Requisitos, decisiones y escenarios](CISUS_FLUJO_COMPRA_CONTROLES_Y_TRAZABILIDAD_2026-09-26.md).

El paquete de ejecución ya contiene:

1. **[Índice](compra-a-entrega/README.md):** orden, dependencias, estado y enlace a cada ficha; fuente única del traspaso a la próxima sesión.
2. **[Protocolo común](compra-a-entrega/PROTOCOLO.md):** instrucciones de inicio, límites, comprobación, preparación de una sucesora y cierre.
3. **Una ficha por tarea:** alcance, contrato funcional, dependencias, criterios y espacio de evidencia. T01 tiene su contrato técnico cerrado; las restantes son bases específicas que se precisan progresivamente.
4. **[Prompt](compra-a-entrega/PROMPT.md)** y **[trazabilidad CF/EC](compra-a-entrega/TRAZABILIDAD.md)** para continuar sin reconstruir el chat.

El índice concentrará el estado. Cada ficha conservará sus resultados y referencias, sin copiar toda la conversación.

Esta organización adapta la recomendación de Codex de mantener especificación, hitos comprobables e historial duradero. Aquí el agente se detendrá al terminar la ficha seleccionada. [Guía de trabajo con Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex)

### Contenido obligatorio de una ficha

| Campo | Contenido |
| --- | --- |
| Resultado | Una frase que describa qué podrá hacer alguien al terminar. |
| Origen | CF y EC aplicables, indicando qué parte cubre esta tarea. |
| Dependencias | Tareas y decisiones necesarias, con su estado comprobado. |
| Lecturas | Secciones concretas de documentación y archivos pertinentes. |
| Cambio autorizado | Pantalla, entrada, usuarios y comportamiento que cambian. |
| Comportamiento conservado | Acciones y consumidores que deben seguir funcionando. |
| Archivos | Rutas permitidas para modificar o crear, confirmadas antes de declarar la ficha lista. |
| Contrato | Entradas, salidas, permisos, errores y condiciones de avance pertinentes. |
| Comprobación | Casos positivos, regresiones relevantes y perfil de Juez. |
| Detención | Situaciones concretas que impiden continuar dentro del alcance. |
| Entrega | Cambios realizados, evidencia, limitaciones y estado final. |

**Una ficha con decisiones necesarias pendientes o rutas importantes por confirmar no estará “lista para ejecutar”.** Podrá formar parte de la secuencia, pero tendrá identificado qué falta y quién lo resuelve.

### Protección de componentes compartidos

Antes de modificar una pieza compartida, la ficha incluirá esta tabla:

| Uso | Cambio permitido | Comportamiento que se conserva | Comprobación |
| --- | --- | --- | --- |
| Consumidor solicitado | Cambio específico del encargo | Resto de sus acciones | Caso correspondiente |
| Otros consumidores | Solo cambios expresamente incluidos | Su funcionamiento vigente | Regresión pertinente |

Esto responde a dos hechos encontrados al preparar el plan:

- `HeroMediaEditor` se usa en **Portada, Productos y Proceso**.
- El botón principal de Productos y las fichas individuales de “Otras colecciones” usan actualmente el mismo diálogo de detalles.

Por tanto:

- Un archivo permitido **no autoriza cambiar todos sus usos**.
- Un cambio particular se aplicará mediante una condición o configuración explícita, conservando el comportamiento de los demás consumidores.
- No se harán sustituciones globales de textos, estilos o comportamientos para resolver una petición local.
- Si hace falta cambiar un contrato compartido fuera de la ficha, se documentará esa dependencia y se detendrá la ampliación.
- Las referencias del grafo se contrastarán con el archivo real: se encontró una versión de `Portfolio` desactualizada en el índice.

Estos hallazgos corresponden a la inspección realizada para este plan; deben contrastarse con el código vigente al preparar o ejecutar la ficha afectada.

### Secuencia de una sesión

1. Leer instrucciones, protocolo y ficha elegida.
2. Revisar dependencias y cambios preexistentes.
3. Confirmar los puntos de entrada y consumidores afectados.
4. Implementar únicamente el resultado autorizado.
5. Ejecutar la comprobación suficiente y corregir fallos propios dentro del alcance.
6. Revisar el diff contra los comportamientos autorizados y conservados.
7. Registrar el resultado. Si la tarea está verificada, preparar documentalmente una sola sucesora y actualizar el traspaso del índice, conforme al protocolo.
8. Comprobar la coherencia del traspaso y cerrar los cambios propios con commit local según el protocolo. Detenerse sin implementar la sucesora ni preparar una tercera ficha. Si la actual no se verificó, mantener el traspaso en ella y reportar el pendiente real.

El cierre distinguirá **implementado**, **verificado** y **bloqueado**. Una tarea con comprobaciones pendientes no se declarará verificada.

Usar el [prompt reutilizable vigente](compra-a-entrega/PROMPT.md). `TAREA: SIGUIENTE` toma el ID y la acción del índice. Si una ficha no está lista, la sesión es solo de preparación o resolución del bloqueo; no se prepara y programa esa misma ficha en la misma conversación. El cierre de una ficha ejecutada sí permite preparar documentalmente una sucesora, sin implementarla.

## 3. Secuencia de tareas

Cada fila tiene una ficha independiente enlazada desde el índice. Las tareas posteriores se precisarán contra el código vigente antes de quedar disponibles para ejecución; su posición en esta secuencia no autoriza resolver decisiones comerciales por inferencia.

Consultar el **[estado y dependencias vigentes](compra-a-entrega/README.md)**. En el corte de esta reparación, T01 está LISTA/PENDIENTE y las demás POR_PREPARAR/PENDIENTE. Las 55 fichas ya existen; la numeración no sustituye la comprobación de dependencias. Una ficha demasiado amplia puede dividirse documentalmente siguiendo el protocolo, conservando su alcance y sin ejecutar varias hijas en una sesión.

### A. Entrada y contratos

| ID | Resultado de la sesión |
| --- | --- |
| T01 | Crear el selector aislado de las cuatro intenciones, sin conectarlo todavía a la página pública. |
| T02 | Conservar producto y opciones compatibles al avanzar, retroceder o cambiar de intención. |
| T03 | Fijar el contrato técnico de borrador, solicitud, pedido y estados independientes, incluyendo su relación con ventas y proyectos existentes. |

### B. Compra personal como invitado

| ID | Resultado de la sesión |
| --- | --- |
| T04 | Configurar qué productos y opciones tienen una oferta comprable; conservar las condiciones de pedidos anteriores. |
| T05 | Obtener del servidor una oferta vigente con contenido, precio y condiciones; un concepto permanece como consulta. |
| T06 | Reservar y liberar disponibilidad sin sobreventa ante concurrencia, vencimientos o reintentos. |
| T07 | Consultar cobertura, servicio y tarifa de entrega; representar correctamente una respuesta desconocida o fallida. |
| T08 | Crear un pedido durable de invitado con contenido y condiciones aceptadas, sin duplicarlo al reintentar. |
| T09 | Consultar y recuperar ese pedido mediante acceso autorizado, sin conceder acceso por conocer un correo o número de pedido. |
| T10 | Construir el resumen de compra con comprador, destinatario, dirección, contenido y total confirmado por servidor. |
| T11 | Crear el intento y enlace de pago asociados al pedido y a sus condiciones vigentes. |
| T12 | Verificar notificaciones del proveedor y aplicar una sola vez sus efectos. |
| T13 | Resolver pagos tardíos, inciertos o pendientes mediante conciliación administrativa registrada. |
| T14 | Mostrar al comprador confirmación, espera, fallo y reintento sin confundir retorno del proveedor con pago confirmado. |
| T15 | Vincular posteriormente la compra a una cuenta nueva o existente, conservando el mismo pedido. |
| T16 | Recibir solicitudes corporativas, de reventa y de nuevas ideas con referencia y próximo paso, sin convertirlas automáticamente en pedidos. |

### C. Preparación, entrega y atención

| ID | Resultado de la sesión |
| --- | --- |
| T17 | Mostrar una cola operativa con responsable, próxima acción y pendientes de cada pedido. |
| T18 | Revisar el contenido comprometido: cantidades, personalización, complementos, regalos incorporados y correcciones. |
| T19 | Asignar contenido conforme a cajas identificadas, detectando faltantes y duplicaciones. |
| T20 | Autorizar despacho según pagos, destino, servicio y alcance completo o parcial acordado. |
| T21 | Generar etiquetas y resolver reintentos inciertos sin duplicar envíos. |
| T22 | Registrar la entrega efectiva al transportista, separada de la generación de etiqueta. |
| T23 | Actualizar seguimiento por caja, conservando fuente, fecha e incidencias. |
| T24 | Mostrar al cliente resumen, documentos permitidos, progreso y próxima acción sobre los hechos del pedido. |
| T25 | Emitir avisos relevantes y hacer visibles los fallos de notificación con un responsable. |
| T26 | Abrir y gestionar incidencias vinculadas a la compra, incluso después de la entrega logística. |
| T27 | Solicitar y resolver cancelaciones con autoridad administrativa y condiciones aplicables identificadas. |
| T28 | Aplicar los efectos autorizados de cancelación o reembolso una sola vez, conservando historia. |
| T29 | Conectar «Lo quiero» al recorrido completo: compra personal habilitada y solicitudes utilizables para las otras intenciones. |

**Primer hito:** una compra personal puede llegar hasta entrega y atención sin exigir cuenta.

### D. Fabricación y compra corporativa

| ID | Resultado de la sesión |
| --- | --- |
| T30 | Configurar materiales, tiempos, recursos y calendario de fabricación. |
| T31 | Calcular compromisos de preparación considerando capacidad, cantidades y pendientes del cliente. |
| T32 | Identificar interlocutor, pagador y aprobador del cliente por pedido corporativo. |
| T33 | Preparar y versionar una propuesta comercial con contenido, alcance, condiciones y vigencia. |
| T34 | Registrar la aceptación identificada de una versión y tratar propuestas vencidas. |
| T35 | Aplicar los hitos de pago acordados y bloquear compromisos o despacho cuando falte el respaldo requerido. |
| T36 | Gestionar el trabajo de diseño y sus revisiones dentro del alcance contratado. |
| T37 | Obtener la conformidad del cliente sobre una referencia visual concreta. |
| T38 | Registrar la aprobación final del administrador de Cisus sobre esa versión; conservar la separación de autoridades. |
| T39 | Preparar el paquete versionado de fabricación con archivos, medidas, materiales e instrucciones. |
| T40 | Liberar fabricación tras comprobar las condiciones comerciales, de arte, recursos y revisión técnica aplicables. |
| T41 | Registrar cantidades por etapa, correcciones y nueva revisión de las piezas corregidas. |
| T42 | Gestionar cambios posteriores y revalidar las dependencias afectadas, conservando lo ya ejecutado. |
| T43 | Incorporar conversación por pedido, distinguiendo mensajes compartidos y notas internas. |
| T44 | Habilitar el recorrido corporativo completo y comprobar sus diferencias respecto de la compra personal. |

### E. Captador, reventa y nuevas ideas

| ID | Resultado de la sesión |
| --- | --- |
| T45 | Presentar y compartir selecciones comerciales desde una vista del captador que proteja información interna. |
| T46 | Registrar oportunidades, encaje comercial, responsable y próxima acción dentro de sus facultades. |
| T47 | Traspasar una oportunidad o pedido mediante aceptación del nuevo responsable, conservando historial y atribución. |
| T48 | Configurar el convenio y acceso de reventa mayorista una vez ratificados sus términos. |
| T49 | Comprar para reventa con condiciones por cantidad autorizadas, reutilizando preparación y entrega. |
| T50 | Mostrar compras, reposición y las analíticas sustentadas por datos reales disponibles. |
| T51 | Convertir una nueva idea en una evaluación o desarrollo con alcance, entregables y condiciones definidos. |
| T52 | Integrar generación de imágenes para diseño con límites de uso, permisos sobre el material y versiones conservadas. |
| T53 | Habilitar el recorrido de reventa y verificar que no conceda permisos internos de Cisus. |
| T54 | Habilitar el recorrido de nuevas ideas con sus compromisos y límites visibles. |
| T55 | Cerrar la trazabilidad del alcance implementado y comprobar las interacciones relevantes entre recorridos. |

### F. Alcance futuro conservado

| Requisito | Tratamiento |
| --- | --- |
| CF-17: portavasos y puzle | Fichas futuras separadas. Antes de activar el portavasos se resolverán elegibilidad, canje y cancelación. |
| CF-32: consignación y comisión | Convenios y operación propios antes de habilitarlos; conservar los acuerdos existentes. |
| CF-40: código G y distribución automática | Proyecto posterior con preparación técnica, simulación y revisión del operario. |

Aunque una promoción futura no esté activa, **todo regalo efectivamente comprometido en un pedido debe entrar desde el inicio en su contenido y cumplimiento**.

## 4. Primera ficha y decisiones que bloquean otras tareas

### T01 — Selector de intención

Este apartado resume T01. La **[ficha ejecutable T01](compra-a-entrega/tareas/T01.md)** ya concreta los cinco archivos nuevos permitidos, tipos y eventos, interacción, consumidores conservados, casos y comprobación. Para ejecutar, usar esa ficha y el estado del índice; este resumen no reemplaza su contrato.

**Resultado:** disponer de un selector comprobable y aislado para continuar desde un producto.

**Contenido:**

- Título: **«¿Para qué lo quieres?»**
- **Para mí o para regalar.**
- **Para una empresa.**
- **Para vender en mi tienda.**
- **Quiero desarrollar una idea.**

Recibirá la referencia del producto y la selección editorial actual. Emitirá la intención elegida; elegirla no creará una cuenta, solicitud, reserva, pedido ni cobro.

La presentación utilizará un resumen breve del producto seleccionado. El selector tendrá cierre visible, operación mediante teclado y tratamiento del foco.

**Límite del cambio:** componente nuevo de intención y sus pruebas. La integración con el botón principal se realizará en T29. Los editores de imágenes y los diálogos actuales conservarán sus usos.

**Comprobación:**

- Cada opción devuelve la intención correspondiente y conserva la selección.
- Cancelar no inicia ninguna operación comercial.
- Cierre y foco funcionan en la prueba del componente.
- No se introduce una entrada pública nueva ni una llamada de escritura.
- Ejecutar una vez el perfil `frontend-local`.
- Declarar que las pruebas no acreditan apariencia real en navegador.

### Decisiones previas obligatorias

Las D01–D11 ya documentadas se asociarán a las fichas correspondientes. Su resolución será una sesión de definición cuando necesite intervención de John; no se mezclará silenciosamente con programación.

| Decisiones | Acción que permanece bloqueada |
| --- | --- |
| D01: facultades y delegación | Conceder permisos o habilitar aprobaciones administrativas. |
| D02: pagos y compromisos comerciales | Cobrar o comprometer trabajo bajo condiciones aún no definidas. |
| D03: convenio mayorista | Activar la reventa. |
| D04: cancelación, garantía y reembolso | Contratar bajo políticas incompletas o ejecutar resoluciones sin condiciones aplicables. |
| D05: datos reales de producto y capacidad | Prometer compra inmediata o fechas automáticas. |
| D06: acceso y tratamiento de datos | Exponer pedidos o habilitar recuperación y vinculación inseguras. |
| D08: diseño, archivos y servicios externos | Entregar derechos no acordados o enviar material a generación externa. |
| D09–D10: transporte y responsables | Prometer modalidades o atención sin operación definida. |
| D07: promoción futura | Publicar o canjear el incentivo. |

D11 queda precisada por las decisiones de esta planificación: compra personal primero, selector inicialmente sin publicar y una tarea por conversación. Los datos reales de la pieza piloto y los detalles de las fichas siguen sujetos a preparación; no se consideran resueltos por esta precisión de orden y alcance.

## 5. Comprobación, publicación y criterio de éxito

### Reglas técnicas

- La venta interna existente conservará su autorización. El checkout de invitado tendrá operaciones diferenciadas y validación en servidor.
- Se reutilizarán los gateways y controles existentes; el frontend no escribirá directamente en Firestore o Storage.
- Pedido, pago, arte, fabricación y entrega conservarán hechos y estados diferenciados.
- Las interfaces nuevas contemplarán versión aceptada, actor autorizado y tratamiento de repeticiones cuando corresponda.
- La relación con inventario, ventas y proyectos existentes se fijará antes de integrar escrituras, evitando descontar stock o registrar efectos dos veces.
- Las funciones futuras permanecerán sin activar y los pedidos existentes conservarán sus condiciones.

### Verificación proporcionada

Cada ficha indicará **un perfil suficiente de [Juez](../../quality/README.md)**. Documentación se comprobará mediante diff y referencias; Angular mediante `frontend-local`; Functions mediante `functions-local`; seguridad mediante `security`; contratos transversales mediante `full`.

Para la primera tarea de Angular, el comando previsto desde la raíz es:

```powershell
npm run verify -- --profile frontend-local
```

Las pruebas críticas incluirán, según la tarea:

- acceso de otra persona o empresa;
- instrucciones o aprobaciones desactualizadas;
- pagos y notificaciones repetidos;
- concurrencia sobre disponibilidad;
- regalo o caja faltante;
- cambios posteriores a la aprobación;
- fallo de transporte o notificación;
- conservación de los consumidores de componentes compartidos.

Los escenarios EC se repartirán entre las fichas. No se ejecutará toda la batería después de cada cambio pequeño ni se atribuirá a una prueba más cobertura de la que tiene.

### Publicación y cierre

Implementar una ficha no autoriza desplegar ni modificar datos productivos. La activación de un recorrido será una tarea explícita, con sus dependencias verificadas y comprobación de uso real cuando se solicite.

El plan funcionará si una conversación nueva puede responder, sin reconstruir este chat:

1. Qué debe conseguir esta tarea.
2. Qué puede cambiar y qué debe conservar.
3. Qué información falta y qué operación bloquea.
4. Qué evidencia permite cerrarla.
5. En qué punto debe detenerse.

El coste será mantener fichas y evidencia breves. La primera comprobación de utilidad será ejecutar T01 con Luna y revisar si logra el resultado sin cambios fuera de alcance. **Los 40 requisitos quedan contemplados en la secuencia o expresamente diferidos; eso acredita cobertura de planificación, todavía no implementación.** La [asignación CF/EC a fichas](compra-a-entrega/TRAZABILIDAD.md) ya existe. La evidencia se incorporará al ejecutar cada ficha; no se da por existente por crear documentación. El cierre prepara una sola sucesora para que la continuidad no dependa de recordar la conversación.
