# Frontend Angular Cisus

Aplicación standalone en Angular 22 con rutas lazy, Signals, Signal Forms y Firebase SDK modular.

Incluye catálogo público, registro e inicio de sesión, selector de empresa/sucursal y operación protegida de inventario, ventas, compradores, sucursales, accesos, precios y promociones. Los controles visuales respetan permisos, pero toda autorización definitiva ocurre nuevamente en Cloud Functions.

```bash
npm install
npm start
npm run build
npm test -- --watch=false
```

La configuración pública Firebase vive en `public/runtime-config.js`. En localhost usa Emulator Suite; en el hosting desplegado usa Firebase real.
