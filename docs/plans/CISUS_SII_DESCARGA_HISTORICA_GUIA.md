# SII: ruta para descargar el historial de Cisus

Guía para continuar con otro modelo. Basada en la navegación realizada el 11 de septiembre de 2026. No implica una nueva consulta ni confirma que la sesión siga activa.

## Entrada que funcionó

1. Usar la sesión del navegador con el acceso personal de John como persona autorizada de **CISUS SPA, RUT 77.545.792-9**. El Sistema de Facturación Gratuito rechazó el acceso con RUT y clave de la empresa; permitió continuar con la persona autorizada.
2. Abrir [Sistema de facturación gratuito del SII](https://www.sii.cl/servicios_online/1039-1183.html).
3. Expandir **Historial de DTE y respuesta a documentos recibidos**.
4. Entrar en **Ver documentos recibidos - Generar respuesta al emisor** y seleccionar Cisus si lo solicita.

Acceso directo observado:

https://www1.sii.cl/cgi-bin/Portal001/mipeLaunchPage.cgi?OPCION=1&TIPO=4

Listado sin filtros observado:

https://www1.sii.cl/cgi-bin/Portal001/mipeAdminDocsRcp.cgi?RUT_EMI=&FOLIO=&RZN_SOC=&FEC_DESDE=&FEC_HASTA=&TPO_DOC=&ESTADO=&ORDEN=&NUM_PAG=1

Si el enlace directo pide autenticación o no conserva el contexto de empresa, usar la entrada del menú anterior. No inventar parámetros ni reutilizar identificadores de sesión.

## Qué hacer en el listado

- Dejar vacíos emisor, folio, razón social y fechas; seleccionar **Todos los Documentos** y **Todos los Estados**. Revisar el total y todas las páginas que existan.
- **Archivo Respaldo** descarga XML; **Archivo Excel** descarga una planilla con encabezados y detalles. También existen **Informe** y **Archivo Texto**, no descargados en la sesión anterior.
- Abrir cada documento mediante su enlace **Ver**. En **Otros detalles documento** aparece **VISUALIZACIÓN DOCUMENTO (pdf)**.
- Consultar y descargar únicamente. No usar **Dar Respuesta comercial**, **Dar Acuse de Recibo Ley 19.983**, ni modificar registros tributarios.

## Lo ya obtenido y la diferencia que hay que resolver

El listado sin filtros mostró **14 facturas recibidas**, entre **14/07/2022 y 19/12/2025**. Sin embargo, los dos archivos descargados contienen solo **5 facturas de 2025**. Por tanto, no afirmar que ya se descargaron las 14 ni que el listado representa todo el historial tributario de Cisus.

Archivos descargados, conservados en su ubicación original:

- `C:/Users/icard/Downloads/DTE_DOWN775457922026-09-11.xml` — 5 documentos completos en el XML.
- `C:/Users/icard/Downloads/DTE_DOWN775457922026-09-11.xls` — 5 facturas con detalles; el SII lo entrega como tabla HTML con extensión `.xls`.

Folios incluidos: **240878, 1218269, 968, 209350 y 961**.

Los otros nueve folios del listado: **1005014, 1005009, 6324, 123308480, 120378265, 120257945, 120378264, 4181802 y 119664309**. Intentar su descarga individual o por filtros y comprobar el archivo obtenido; la causa de su ausencia en la exportación masiva todavía no se determinó. No hay PDF individual confirmado como descargado.

Enlaces individuales observados de Maderas Quimán:

- [Factura 961, 18/11/2025](https://www1.sii.cl/cgi-bin/Portal001/mipeGesDocRcp.cgi?CODIGO=2585358346&ALL_PAGE_ANT=2).
- [Factura 968, 02/12/2025](https://www1.sii.cl/cgi-bin/Portal001/mipeGesDocRcp.cgi?CODIGO=2599845848&ALL_PAGE_ANT=2).
- [Visualización PDF de la factura 961](https://www1.sii.cl/cgi-bin/Portal001/mipeShowPdf.cgi?CODIGO=2585358346).

## Para cubrir el historial completo hasta la fecha de ejecución

Además de recibidas, consultar **Ver documentos emitidos** en el mismo menú. Su enlace fue observado, pero no se consultó el historial:

https://www1.sii.cl/cgi-bin/Portal001/mipeLaunchPage.cgi?OPCION=2&TIPO=4

Contrastar ambos historiales con el [Registro de Compras y Ventas](https://www4.sii.cl/consdcvinternetui/#/index), seleccionando Cisus y los períodos desde el inicio de actividades que figure en el SII hasta la fecha real de ejecución. La primera factura encontrada no demuestra la fecha de inicio de la empresa. El RCV dispone de **Descargar Detalles** y, dentro del detalle, **Exportar Csv**.

Existe una diferencia concreta que justifica ese contraste: en el RCV de noviembre de 2025 apareció la factura **11090453**, emisor **77398220-1**, fecha **27/11/2025**, total **$23.600**, ausente de las 14 del listado de recibidas. El nombre del emisor no se confirmó. Las consultas anteriores sin resultados en otros meses no prueban ausencia de documentos: diciembre sí aparece en el historial de recibidas.

Guardar los respaldos en `archivos/contabilidad/sii/`, distinguiendo recibidos y emitidos, sin sobrescribir los originales. Comprobar claves **RUT emisor + tipo de documento + folio**, cantidades y totales entre listados y archivos. Informar qué documentos se recuperaron completos y cuáles siguen pendientes. Este encargo es obtener respaldos; conciliar bancos, clasificar costos y determinar impuestos requiere trabajo posterior.
