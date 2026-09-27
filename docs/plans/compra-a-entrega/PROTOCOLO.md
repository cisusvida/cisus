# Protocolo de ejecución y preparación de la siguiente ficha

Revisión: 27 de septiembre de 2026. Aplicable a T01–T55 y a sus eventuales divisiones documentadas. El [índice](README.md) es la fuente única del estado; el [plan maestro](../CISUS_FLUJO_COMPRA_PLAN_DE_EJECUCION_2026-09-27.md) fija el recorrido.

## 1. Unidad de trabajo

Una conversación implementa **una ficha seleccionada**. Incluye su código, pruebas, documentación y correcciones propias. Al verificarla, el cierre puede preparar documentalmente **una sola sucesora**, sin implementarla. La preparación no se encadena a una tercera ficha.

Trabajar en el checkout principal `C:\Users\icard\Proyectos\Cisus`, rama `master`, con una sola tarea de código activa sobre él. No crear ramas, worktrees, copias aisladas, conversaciones, agentes ni automatizaciones por seguir este protocolo. Esta ubicación no cambia el alcance funcional: un componente todavía sin integración pública se desarrolla en este mismo checkout.

La invocación genérica autoriza el trabajo de la ficha, su traspaso documental y el commit local de cierre conforme a AGENTS; no autoriza push, despliegue ni operaciones sobre producción. `npm start` conecta con Firebase productivo: no usarlo como entorno de pruebas de escrituras.

## 2. Estado y selección

El índice separa preparación y ejecución:

| Preparación | Significado |
| --- | --- |
| LISTA | Contrato concreto, rutas de edición, dependencias, condiciones, consumidores y verificación cerrados para este alcance. |
| POR_PREPARAR | Existe ficha base específica; falta concretar aspectos técnicos con los resultados de sus predecesoras. No autoriza código. |
| BLOQUEADA | Hay un faltante identificado que no se puede resolver con inspección: decisión de negocio, acceso, dependencia fallida o cambio de alcance. |

| Ejecución | Significado |
| --- | --- |
| PENDIENTE | Sin implementación atribuida a esta ficha. |
| EN_CURSO | Trabajo empezado y todavía no entregado. |
| IMPLEMENTADA | Cambios hechos, comprobación incompleta o fallida. |
| VERIFICADA | Criterios de esta ficha comprobados, con evidencia y límites declarados. |

El índice mantiene un **traspaso** con ID y acción: EJECUTAR, PREPARAR, RESOLVER BLOQUEO o CERRADO. `TAREA: SIGUIENTE` usa ese traspaso; un ID explícito selecciona únicamente ese ID. Un ID ya verificado se informa como tal y no autoriza ejecutar otro.

Si la ficha seleccionada no está LISTA, la sesión es **solo de preparación**: precisar esa ficha y su estado, o registrar la decisión faltante; después detenerse. No prepararla y programarla en la misma sesión. La excepción es el cierre documental de una tarea ya implementada: se prepara la sucesora sin programarla.

Una ficha EN_CURSO o IMPLEMENTADA requiere revisar su evidencia y diff antes de reanudar; no empezar de cero ni atribuirse cambios ajenos. El repositorio con cambios sin commit no está bloqueado por esa sola razón.

## 3. Lecturas de inicio y vigencia

Leer AGENTS aplicables, índice, este protocolo y la ficha seleccionada. Consultar únicamente sus CF/EC/D y referencias necesarias; no cargar las 55 fichas ni reconstruir todo el chat.

Antes de editar:
1. Confirmar checkout y rama `master`; registrar revisión de Git, estado y cambios preexistentes relevantes. Si la ubicación no coincide, informar la discrepancia antes de editar; no mover ni descartar trabajo para corregirla automáticamente.
2. Confirmar que dependencias verificadas corresponden a código todavía vigente.
3. Contrastar rutas, APIs y consumidores autorizados con archivos actuales. Preferir el grafo según AGENTS; si está desactualizado o no basta, lectura acotada de archivos.
4. Revisar únicamente discrepancias materiales. Un cambio de HEAD o de documentación ajena no invalida automáticamente la ficha. Si cambió su contrato o alcance, actualizar la preparación y detenerse antes de implementarlo.

La base esperada entre tareas es un árbol limpio gracias al commit de cierre anterior. Si hay pendientes, identificar si pertenecen a la tarea que se reanuda o son ajenos. No hacer reset, stash, limpieza destructiva ni incorporar archivos ajenos para lograr limpieza aparente; detener solo el trabajo que entre en conflicto y explicar el pendiente.

## 4. Cuándo una ficha está lista

Debe contener:
- Un resultado observable y acotado; CF/EC y la parte que realmente cubre.
- Predecesoras verificadas o explicación concreta de por qué no se necesitan.
- Decisiones necesarias resueltas. Separar configuración real necesaria para activar de diseño necesario para programar: una pantalla de configuración puede construirse sin inventar valores, pero no prometer esos valores.
- Lista exacta de archivos existentes a editar y archivos nuevos a crear. Distinguirlos de lecturas y áreas candidatas. Un directorio amplio no es una lista de edición.
- Contrato de entradas/salidas, autoridad, persistencia, errores, reintentos y estados pertinentes. No imponer campos irrelevantes a una tarea visual.
- Consumidores afectados y preservados; casos positivos y de regresión.
- Comando de comprobación realmente conectado a las pruebas, evidencia y criterios de cierre.
- Base inspeccionada y salida para las discrepancias.

La preparación puede resolver detalles técnicos dentro de las decisiones aceptadas, reutilizando el sistema. No puede fijar precios, plazos, políticas, derechos o permisos empresariales pendientes. Registrar decisiones del usuario en su fuente D correspondiente antes de usarlas; una recomendación P no equivale a una política aprobada.

## 5. Alcance y piezas compartidas

Antes de editar una pieza compartida, consignar sus consumidores, cuál cambia y qué se preserva en cada uno. En este corte, HeroMediaEditor sirve a Portada, Productos y Proceso; openDetails de Portfolio también se usa desde fichas relacionadas. Revalidar cuando una tarea los alcance.

- El permiso sobre un archivo no autoriza cambios globales de comportamiento.
- Usar variación explícita y acotada cuando proceda; no cambiar defaults de otros consumidores.
- No sustituir globalmente nombres, clases, textos o estilos.
- No hacer refactors vecinos ni corregir hallazgos ajenos.
- Si la solución requiere salir de los archivos o contratos autorizados, registrar el cambio de preparación. No ejecutar esa ampliación en la sesión por iniciativa propia.
- Ante un fallo propio, corregir dentro del alcance. Un fallo preexistente ajeno se reporta con evidencia; no se oculta ni habilita una reparación general.

## 6. Tamaño de la siguiente ficha

La tabla T01–T55 es una secuencia de resultados; no supone que cualquier resultado amplio quepa en Luna sin dividirlo.

Al preparar una ficha, si contiene resultados independientes, varias migraciones o fronteras que no se pueden verificar juntas con claridad, dividir **solo esa ficha** en Tnn-A, Tnn-B, etc. Mantener el ID padre como agrupador, conservar todos sus CF/EC y registrar dependencias y orden en el índice. La primera hija hereda las dependencias externas; las demás dependen de la hija pertinente, no de su padre. El padre solo se satisface cuando todas sus hijas están verificadas. No programar varias hijas en una conversación.

No dividir automáticamente por número de archivos ni juntar tareas para ahorrar una sesión. Documentar la razón concreta; no ampliar el negocio al dividir.

## 7. Verificación y evidencia

Seguir [Juez](../../../quality/README.md). Ejecutar una vez el perfil suficiente después del cambio; ampliar o repetir por fallos, cambios nuevos o riesgos concretos, no por rutina.

- Documentación: diff, enlaces, IDs, dependencias y contratos; sin build.
- Angular: frontend-local; Functions sin acceso: functions-local; seguridad: security; contrato transversal o Angular más backend/seguridad: full.
- Inspeccionar la inclusión real de pruebas nuevas. Actualmente functions/package.json enumera directorios de tests: una spec en un directorio nuevo puede quedar fuera. La ficha que añada el primer módulo nuevo debe incluir el ajuste mínimo de descubrimiento de tests en su lista de archivos; un comando en verde que no ejecuta esa spec no acredita su comportamiento.
- No debilitar expectativas de consumidores conservados para hacer pasar las pruebas.
- La prueba de autorización en ejecución no se sustituye por el control estático.
- Pruebas y revisión de código no certifican apariencia, accesibilidad real ni hechos de taller. Respetar autorización de navegador; registrar qué quedó fuera.

En la ficha ejecutada conservar: revisión y cambios relevantes de la base, archivos modificados, comando/perfil, resultado, referencia a evidencia y límites. `.juez/latest-run.json` se sobrescribe: guardar el resumen y referencia suficiente de esta ejecución en la ficha; no reutilizar a futuro el archivo sin comprobar su revisión.

La revisión de alcance incluye archivos nuevos: `git diff` sin staging no muestra contenido sin seguimiento. Enumerarlos y revisar su contenido; antes del commit comprobar también `git diff --cached --stat` y `git diff --cached --check` sobre las rutas añadidas explícitamente. No declarar un diff vacío como prueba de que una tarea con archivos nuevos no cambió código.

No confundir entrega de código verificado con activación comercial o publicación. Las tareas de activación preparan y verifican el recorrido; cualquier despliegue o dato productivo requiere autorización aplicable.

## 8. Cierre con preparación de una sucesora

Solo si la tarea actual está VERIFICADA:
1. Registrar su evidencia y actualizar su ejecución en el índice.
2. Elegir una sucesora documental: por defecto la primera tarea pendiente en el orden del índice. No saltar un bloqueo de negocio silenciosamente ni seleccionar varias. Un orden alternativo requiere quedar justificado con dependencias y sin cambiar prioridades acordadas.
3. Leer su ficha base y los resultados de las predecesoras necesarios. Completar rutas exactas, contrato y pruebas. Se autoriza editar **documentación** de esa sucesora, índice y referencias estrictamente afectadas.
4. Si todo está resuelto, marcarla LISTA. Si falta inspección más extensa, dejar POR_PREPARAR con trabajo preciso; si falta una decisión o dependencia, BLOQUEADA con pregunta y responsable. No inventar una solución para mantener la cadena.
5. Actualizar el traspaso: ID, acción, motivo, lecturas y faltantes. Expresar el límite desde la próxima sesión: «ejecutar Tnn; al verificarla preparar documentalmente su sucesora, sin implementarla». No copiar al nuevo traspaso la prohibición que solo correspondía al cierre anterior.
6. Comprobar coherencia entre el traspaso, la fila de estado y el cierre de la ficha siguiente: deben señalar la misma tarea ejecutable y permitir la misma preparación documental. El índice conserva el estado actual; los apartados históricos no lo sustituyen ni requieren duplicarlo en el plan maestro.
7. Registrar en un commit local las rutas propias de la tarea y su cierre documental, verificar el estado final y detenerse conforme al apartado siguiente.

Si la tarea actual falla o queda incompleta, el traspaso sigue apuntando a ella. No preparar sucesoras como si estuviera terminada.

Una sucesora bloqueada no borra ni invalida el trabajo verificado de la actual. Si el usuario aporta una decisión en una sesión de preparación, cerrar la ficha y terminar esa sesión; la próxima invocación podrá ejecutarla.

## 9. Commit y árbol de trabajo

Después de la verificación y el traspaso, añadir únicamente las rutas revisadas de la tarea, su evidencia, el índice y la preparación de una sucesora. Revisar el staging y crear un commit local en `master`, preferentemente con el ID de tarea en el mensaje. Las sesiones exclusivamente documentales también cierran con su commit después de la revisión documental.

Guardar toda la evidencia y el traspaso antes de ese commit. Comunicar su hash en la respuesta final; no generar otro cambio de documentación para insertar dentro del mismo commit su propio hash. La historia de Git relaciona los archivos con la entrega.

Comprobar `git status --short --branch` al finalizar. Si quedan cambios ajenos, conservarlos e identificarlos; si falla el commit, informar la causa sin omitir hooks ni declarar el árbol limpio. Una verificación técnica válida no equivale a haber completado el cierre Git. Ante fallo técnico, conservar los cambios sin marcar VERIFICADA ni ocultar el fallo para forzar un commit de tarea terminada.

## 10. Respuesta final mínima

Informar ID, resultado y estado de la tarea; archivos; verificación y límites; commit local y estado del árbol; ID/acción/estado de la próxima sesión. Si hubo solo preparación, decirlo explícitamente. Nunca presentar como ejecutada la sucesora por haber preparado su documentación.
