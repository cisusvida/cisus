# Perfil Cisus para Juez

Cisus declara gates portables en `quality/contracts/`. El motor Juez permanece externo y debe recibir la raíz del repositorio consumidor, sin copiarse dentro de Cisus.

El equivalente local del perfil `full` es:

```bash
npm run verify
```

Incluye build y pruebas de Angular, build/pruebas de Functions y el contrato estático multiempresa. El perfil no inicia emuladores, no requiere Java, no usa credenciales y no lee ni escribe datos productivos. Los registros usan `schemaVersion`, huellas por área y comandos relativos a la raíz para que el runner ejecute solo los gates afectados y produzca evidencia sobre este árbol sin sobrecómputo:

```bash
npm --prefix <ruta-al-juez> run judge -- --root <ruta-a-cisus> --profile full --no-write
```
