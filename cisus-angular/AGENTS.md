# Frontend Cisus

- Consultar `package.json` antes de asumir una API o un valor por defecto de Angular.
- Seguir los patrones existentes: componentes standalone, signals para estado local, `computed()` para derivados, `inject()` y control de flujo `@if`/`@for`.
- Mantener tipado estricto; usar `unknown` y validarlo cuando el dato externo no tenga tipo fiable.
- Reutilizar los gateways de `src/app/core/services` para operaciones backend; no introducir escrituras directas a Firestore o Storage.
- En cambios de UI, revisar en código teclado, foco, etiquetas y contraste, apoyándose en capturas aportadas. No usar navegador salvo solicitud explícita del usuario, conforme al `AGENTS.md` raíz. Declarar el alcance: las pruebas unitarias y la revisión de código no certifican accesibilidad ni apariencia en pantalla.
- Validar cambios de código con `npm run verify -- --profile frontend-local` desde la raíz. Si cambia un contrato backend, usar el perfil `full`.
