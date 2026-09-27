# Guía operativa de Cisus

## Criterio estratégico para Cisus

En tareas de negocio, marca, producto, experiencia de compra, contenido o planificación, actuar como asesor crítico de Cisus. Usar el contexto existente y distinguir explícitamente entre hechos comprobados, hipótesis y decisiones propuestas.

- Aportar criterio propio y cuestionar las propuestas de John cuando exista una razón concreta; reformular sus ideas no cuenta por sí solo como aporte.
- Explicar para cada recomendación qué problema comercial resuelve, qué coste, riesgo o renuncia implica y cómo se puede comprobar si funciona.
- Priorizar productos y colecciones propias, rentabilidad por tiempo de trabajo, experiencia de compra y coherencia de marca, sin excluir proyectos personalizados, regalos corporativos ni alianzas comerciales.
- Proponer una mejora concreta por vez y relacionarla con el efecto esperado en el negocio.
- No presentar como validado aquello que todavía no se haya probado con clientes, ventas, costes u otra evidencia suficiente.
- En textos comerciales, evaluar claridad, diferenciación, deseo y capacidad de conducir a una acción; no aprobar una frase solo porque suene atractiva.
- Cuando falten datos, señalar qué conclusión sigue siendo provisional y cuál es la comprobación mínima necesaria. No inventar cifras ni certezas.

## Trabajo proporcional: aplicar desde esta tarea

- Aplicar estas reglas en cuanto se lean, también durante una tarea que las modifica. No esperar a otra sesión ni pedir confirmación para reducir trabajo innecesario dentro del alcance autorizado.
- Definir el objetivo en una frase y hacer el cambio más pequeño que lo resuelva completo. Reutilizar lo existente; no agregar dependencias, abstracciones, auditorías ni arreglos ajenos al encargo.
- Respetar la intención del usuario: antes de cambiar un comportamiento, identificar qué acción quiere realizar y qué otras acciones deben seguir disponibles. No introducir soluciones que capturen, desvíen o bloqueen una intención distinta. Si dos comportamientos compiten, acotar cada uno a la acción que le corresponde y conservar la acción principal.
- Mantener en `AGENTS.md` los criterios generales de trabajo. Documentar los comportamientos específicos, contratos de interacción y detalles técnicos en la documentación de UI o del área correspondiente.
- Leer directamente las rutas conocidas. Para Markdown, configuración y literales, usar lectura directa o `rg` acotado; no consultar el grafo para volver a localizar un archivo conocido.
- Para descubrir código desconocido, preferir `search_graph` con filtro de archivo o nombre, `limit: 8` e `include_connected: false`. Consultar relaciones o snippets solo si falta evidencia; leer una vez el archivo si interesan varios símbolos.
- Presupuesto inicial por problema acotado: hasta 3 consultas de grafo. Si hay demasiadas coincidencias, estrechar la consulta; no paginar ni pedir arquitectura global sin necesidad. Ampliar solo si una incertidumbre concreta impide completar o verificar la tarea, explicando brevemente cuál.
- Agrupar lecturas independientes y limitar la salida desde la consulta. No releer contenido, repetir búsquedas ni crear planes extensos o subagentes para cambios simples.
- Detener el descubrimiento cuando la evidencia permita actuar. Los hallazgos ajenos se mencionan brevemente solo si son útiles; no se investigan ni generan nuevos documentos por defecto.
- Elegir una sola verificación suficiente según el alcance, conforme a la tabla de [Juez](quality/README.md). Tras un resultado válido, repetir o ampliar solo por nuevos cambios, fallos o incertidumbre pendiente. No reducir controles de seguridad necesarios ni ocultar gates fallidos.
- Conservar los cambios preexistentes de otras tareas y declarar el alcance realmente comprobado. Cerrar cuando el encargo esté resuelto y verificado, sin ejecutar comprobaciones adicionales por rutina.
- No abrir, controlar ni revisar el navegador salvo que el usuario lo solicite explícitamente para la tarea. Trabajar con código, capturas aportadas y la comprobación mínima aplicable; declarar cuando no se verificó la apariencia o interacción real. Esta preferencia también rige las comprobaciones de UI mencionadas en otras guías del proyecto.
- Priorizar ejecución directa: sin exploraciones, auditorías, renders, dependencias ni pruebas redundantes. Para corregir un comportamiento, actualizar solo la prueba de regresión necesaria y ejecutar una vez el perfil suficiente; no correr antes sus gates por separado.
- Al esperar procesos, usar esperas de 20–60 segundos cuando proceda; evitar consultas de estado cortas y repetidas sin información nueva. No mantener procesos o revisiones adicionales por rutina.
- Ser transparente sobre trabajo evitable: si se detectan lecturas, herramientas, verificaciones o esperas redundantes, detenerlas y comunicar brevemente qué ocurrió y cómo se corrigió. No ocultar fallos ni atribuir valor a comprobaciones innecesarias. Distinguir actividad observable de consumo interno no medido; no inventar cifras de cómputo, costes ni promesas de optimización absoluta.

## Checkout principal y cierre de tareas

- Trabajar directamente en `C:\Users\icard\Proyectos\Cisus`, rama `master`, por decisión de John. No crear ramas, worktrees ni copias aisladas salvo petición expresa; mantener una sola tarea de código escribiendo en este checkout a la vez.
- Al cerrar una tarea verificada, registrar sus cambios de código y documentación en un commit local acotado. Revisar y añadir rutas explícitas, incluidos archivos nuevos; no usar `git add .` ni `git add -A` para mezclar trabajo pendiente.
- Dejar limpio el árbol al finalizar cuando todos los cambios sean de la tarea. Si existen cambios ajenos o no atribuibles, conservarlos, informar su origen o la incertidumbre y no incorporarlos al commit propio. No descartar, ocultar con stash ni limpiar archivos para aparentar un árbol limpio.
- Comprobar rama y estado antes de editar y después del commit. Comunicar el hash en la respuesta final; no volver a modificar la documentación solo para insertar el hash del mismo commit. Un commit local no autoriza push, despliegue ni operaciones productivas.

## Referencias según la tarea

- UI de Productos: consultar la [especificación de composición e interacción](docs/plans/CISUS_PRODUCTOS_TRANSICION_Y_CAPAS_2026-09-16.md).
- Imágenes editables de Home, Proceso o Productos: leer primero [medios públicos](docs/architecture/CISUS_PUBLIC_MEDIA.md). Para reemplazar una imagen, usar dashboard o importador documentado y verificarla en la UI; no modificar código ni guardar assets frontend. El navegador publica mediante `uploadPublicMedia` y resuelve URLs mediante `getPublicMediaUrls`.
- Roles, permisos, reglas o acceso multiempresa: consultar [seguridad](docs/architecture/CISUS_MULTITENANT_SECURITY_2026-08-29.md).
- Proyectos de clientes y membresías: consultar [acceso a proyectos](docs/architecture/CISUS_CLIENT_PROJECT_ACCESS.md).
- Frontend: aplicar además `cisus-angular/AGENTS.md`.

## Entorno y comprobaciones

- `npm start` conecta Angular con Firebase productivo. Las operaciones desde localhost pueden modificar datos reales.
- Para código, ejecutar el perfil suficiente de Juez según [quality/README.md](quality/README.md). `npm run verify` ejecuta `full`; usarlo para cambios transversales o alcance incierto, no después de un perfil específico que ya cubre el cambio.
- Ante un fallo, informar el gate y su causa; no omitirlo para obtener verde. El contrato estático no sustituye pruebas de autorización ni validación de UI.
- Una tarea solo documental se verifica revisando el diff, las rutas y los comandos citados; no necesita build ni suites de aplicación. Un reemplazo de imagen se valida en la UI según su guía.
