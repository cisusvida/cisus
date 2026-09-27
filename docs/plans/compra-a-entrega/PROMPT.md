# Prompt reutilizable

Versión revisada tras T01: 27 de septiembre de 2026. Copiar este bloque completo en una conversación nueva del proyecto y sustituir el prompt anterior; no concatenar versiones. SIGUIENTE toma el traspaso del índice; se puede reemplazar por un ID explícito. La preparación documental de una sucesora está autorizada; la ejecución de varias fichas en la misma conversación no.

```text
Trabaja en C:\Users\icard\Proyectos\Cisus.
Usa el checkout principal y la rama master. No crees ramas, worktrees ni copias aisladas.
TAREA: SIGUIENTE

Lee los AGENTS.md aplicables y:
docs/plans/compra-a-entrega/README.md
docs/plans/compra-a-entrega/PROTOCOLO.md

Usa el traspaso del índice para seleccionar exactamente una ficha, o el ID que indique en TAREA. Lee esa ficha y solo sus referencias pertinentes.

Si está LISTA, contrasta su vigencia con el código y ejecuta únicamente su alcance. Conserva cambios preexistentes y consumidores no incluidos. Respeta archivos autorizados, decisiones de negocio, controles de servidor y verificación suficiente de Juez.

Si no está LISTA, realiza únicamente su preparación documental o identifica el bloqueo. No prepares y programes esa misma ficha en esta sesión ni inventes decisiones pendientes.

Cuando la tarea ejecutada quede VERIFICADA, registra su evidencia y prepara documentalmente una sola ficha sucesora según el protocolo. Déjala LISTA solo si están cerrados sus contratos, archivos, dependencias y pruebas; de lo contrario registra el faltante y su estado real. Actualiza el traspaso del índice y comprueba que coincida con el cierre de la ficha siguiente: podrá preparar su propia sucesora después de verificarse, sin implementarla.

Después de verificar el trabajo y revisar el diff, incluidos archivos nuevos, crea un commit local con las rutas propias de la tarea y su cierre documental. Comprueba el estado del árbol. Conserva y reporta cambios ajenos; no los mezcles, borres ni ocultes para aparentar limpieza. No hagas push.

No implementes la sucesora, no encadenes preparaciones, no abras otras conversaciones ni despliegues. Si la tarea actual no se verifica, el traspaso permanece en ella.

Cierra indicando la tarea realizada, comprobaciones y límites, commit y estado del árbol, y el ID, estado y acción de la próxima sesión. Detente.
```
