# Juez en Cisus

`npm run verify` invoca el motor portable externo y ejecuta el perfil `full`: build y pruebas Angular, build/pruebas de Functions y contrato estático multiempresa. Un gate fallido devuelve un código de salida distinto de cero.

El adaptador busca el motor en `../Juez`. Si está instalado en otra carpeta, define `CISUS_JUDGE_ROOT` con su ruta. El motor necesita sus dependencias instaladas; no se copia a Cisus ni se descarga automáticamente.

Desde la raíz:

```bash
npm run verify
npm run verify -- --profile frontend-local
npm run verify -- --profile functions-local
npm run verify -- --profile security
npm run verify -- --no-write
```

La evidencia se guarda en `.juez/latest-run.json` (ignorada por Git), con resultado, duración y salida de cada gate. `--no-write` evita guardar el manifiesto, pero los builds siguen generando sus archivos habituales.

Los registros de `quality/contracts/` son la fuente de los comandos y perfiles. El motor actual ejecuta todos los gates del perfil seleccionado: no implementa caché ni selección por huellas. Los metadatos `fingerprintInputs` describen entradas para futuros consumidores; no implican reutilización de resultados.

## Elegir la comprobación suficiente

El agente aplica esta selección desde que lee `AGENTS.md`, incluida la tarea que actualice esas instrucciones. La selección es una regla de trabajo del agente: el CLI mantiene `full` como valor predeterminado y requiere `--profile` para otro perfil.

| Alcance del cambio | Comprobación |
| --- | --- |
| Solo documentación o instrucciones (`AGENTS.md`) | Revisar diff, rutas y comandos citados; sin build ni suites de aplicación. |
| Solo Angular, sin cambios de acceso o seguridad | `npm run verify -- --profile frontend-local` |
| Solo Functions, sin cambios de acceso o seguridad | `npm run verify -- --profile functions-local` |
| Reglas o contratos de seguridad | `npm run verify -- --profile security`; si también cambia Angular, añadir `frontend-local` o usar `full`. |
| Varias áreas, dependencias/configuración compartidas o alcance incierto | `npm run verify` |
| Reemplazo de medios públicos | Comprobación de UI descrita en [la guía de medios](../docs/architecture/CISUS_PUBLIC_MEDIA.md). |

Si se modifican el adaptador o los registros de Juez, validar su carga con el motor y ejecutar los perfiles afectados. Una modificación del motor se verifica en su propio repositorio con `npm test`; esa prueba no sustituye los gates de un consumidor cuyo código también cambió.

No ejecutar primero los comandos individuales y después el perfil que los repite, ni añadir `full` por rutina después de un perfil suficiente. No atribuir una verificación de esta tarea a cambios preexistentes que no cubrió. No usar `verify:changed`, `verify:resume` o el gateway de descubrimiento de Óptica como si existieran aquí: su implementación no forma parte del runner portable actual.

Estas comprobaciones no inician emuladores ni acceden a producción. El gate de seguridad es una revisión estática de patrones y archivos versionados: no prueba las reglas en ejecución, no cubre secretos en archivos sin seguimiento y no demuestra por sí solo aislamiento multiempresa. Las pruebas de Functions cubren las políticas incluidas en su suite. Los cambios visuales requieren comprobar la UI.
