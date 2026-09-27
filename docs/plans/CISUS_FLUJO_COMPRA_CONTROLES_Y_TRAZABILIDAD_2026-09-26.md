# Cisus: controles y trazabilidad del flujo de compra

Fecha: 26 de septiembre de 2026. Consolidación conceptual v1.

Documento complementario del [recorrido comercial](CISUS_FLUJO_COMPRA_A_ENTREGA_2026-09-24.md). Objetivo: que cada compromiso importante de la conversación llegue a un comportamiento verificable, con un responsable y una salida para los casos pendientes o fallidos. No es un esquema de base de datos ni una orden de implementación.

## Cómo usar esta matriz

- **A — Dirección acordada:** petición o aceptación expresa de John. Los detalles técnicos derivados siguen requiriendo diseño y verificación.
- **P — Propuesta de funcionamiento:** recomendación concreta para incorporar al plan, pendiente de ratificación en el alcance que la incluya. No se convierte en acuerdo por estar escrita.
- **F — Futuro o condicionado:** conservar la idea; solo implementar cuando se active expresamente su alcance y se resuelvan sus condiciones.
- **A/P:** el objetivo está acordado y el mecanismo indicado es una propuesta; la fila identifica esa diferencia.
- **CF:** requisito estable. **EC:** escenario de comprobación. **D:** decisión pendiente antes de activar la acción dependiente.

Todos los escenarios están **sin ejecutar**. La implementación de los requisitos no se ha auditado en esta tarea: no se afirma ausencia total de código existente ni cumplimiento por parecido con funciones actuales. Una matriz completa demuestra cobertura documental del alcance registrado, no ausencia de riesgos desconocidos ni funcionamiento del sistema.

Los valores y duraciones concretos están aplazados por John. Las decisiones pendientes bloquean únicamente su operación dependiente. Las partes independientes pueden definirse y planificarse; no se inventan parámetros para cobrar, fabricar o publicar una política.

## Fuentes de las decisiones

Referencias estables a hitos de esta conversación; el documento comercial desarrolla su contenido. Las palabras entre comillas son fragmentos breves del pedido que permiten reconocer el origen, no identificadores técnicos de mensajes.

| Origen | Hito y corrección que debe conservarse |
| --- | --- |
| S01 | John sitúa Productos como segunda sección editorial; pide «Lo quiero» y cuatro intenciones, y confirma «¿Para qué lo quieres?». |
| S02 | John corrige el registro obligatorio: visitante de Instagram compra, paga y decide después si conserva la compra en una cuenta. |
| S03 | John pide progreso y chat; explora un cupón por partes y después portavasos personalizado «en su próxima compra». Incentivo futuro, sin eficacia demostrada. |
| S04 | John indica tiempos y disponibilidad configurados en administración y envíos a Chile, normalmente Chilexpress, con continuidad de seguimiento. |
| S05 | John describe personalización, diseñador, generación de imágenes, SVG/3D, archivos para taller, futuro código G y avance de fabricación. |
| S06 | John exige una parte importante del pago corporativo para proteger a Cisus y después ordena aplazar análisis de valores. |
| S07 | Ante revisión de correspondencia, terminación y cantidad antes de embalar, John responde «así es perfecto». |
| S08 | John detecta la omisión del portavasos en embalaje. Se corrige el recorrido para incluir todo lo comprometido desde el canje. |
| S09 | Desarrollo conversado de autorización de despacho, cajas, etiquetas, pagos, destino y entrega al transportista, conservando invitado y cuenta. |
| S10 | John solicita cerrar debilidades, proteger el negocio e incorporar captador. Se proponen admisión, permisos, traspaso, cambios, incidencias y cierre por obligaciones. |
| S11 | John pide preguntas y retroalimentación por función y evitar omisiones al generar código. Se propone trazabilidad y luego autoriza consolidar. |
| S12 | Durante consolidación John pide investigar reventa y asigna aprobación del arte y condiciones de cancelación a administración: inicialmente él. |

La investigación externa fundamenta propuestas, no prueba resultados de Cisus. Los enlaces de Shopify, FNE, SERNAC, BDC, Salesforce, HubSpot, NASA, GOV.UK, Flow y Chilexpress figuran junto a su uso o en las referencias del documento comercial.

## Catálogo de requisitos

La columna de escenarios define comprobaciones propuestas. La relación inversa se obtiene buscando el identificador EC en esta tabla; evita mantener dos matrices manuales divergentes. Cada futura prueba debe referenciar sus CF y EC aplicables.

### Descubrimiento, identidad y compromiso

| ID | Estado / origen | Regla y criterio observable | Escenarios |
| --- | --- | --- | --- |
| CF-01 | A / S01 | Productos vende desde su presentación editorial; «Lo quiero» conserva producto, diseño y opciones. Volver no reinicia elecciones compatibles. Textos particulares y composición visual siguen propuestos. | EC-01 |
| CF-02 | A / S01 | Distinguir intención personal, corporativa, reventa y nueva idea. La intención pertenece a la compra. Una opción ofrecida, como canaleta, permanece en su producto; no obliga a desarrollo nuevo. | EC-01, EC-25, EC-26 |
| CF-03 | P / S01, S04 | Compra inmediata solo con información comercial calculable y vigente: pieza, medidas, material, opciones, disponibilidad, precio, entrega y total. Un concepto o precio referencial requiere evaluación identificada. | EC-01, EC-05, EC-17 |
| CF-04 | P / S02 | Distinguir borrador de solicitud enviada y pedido confirmado. Guardar o identificarse no genera por sí solo trabajo de taller ni reservas. Explicar límites de recuperación de un borrador local. | EC-01, EC-02 |
| CF-05 | A / S02 | Permitir compra de invitado durable, confirmación y atención. Cuenta opcional después, nueva o existente, también al retomar posteriormente; no crear nuevamente la compra ni cobrarla otra vez. | EC-02, EC-03 |
| CF-06 | P / S02, S10 | Verificar autoridad para vincular compra y acceder a empresa/proyecto. Separar comprador, destinatario, pagador, interlocutor y personal. Correo/RUT/cargo declarado no concede permisos. | EC-03, EC-27 |
| CF-07 | P / S05, S08 | Conservar versiones de propuesta y condiciones aceptadas, incluyendo contenido, pagos, entrega, fechas y documentos. La ficha o política actual no reescribe el pedido. | EC-06, EC-12, EC-22 |
| CF-08 | A/P / S04 | A: administración configura disponibilidad y tiempos. P: cálculo considera cola, capacidad, calendario, cantidades, opciones, revisión y embalaje; distingue preparación de tránsito y fecha requerida de evento. Reserva/aceptación no sobrecompromete recursos. | EC-05, EC-08, EC-20 |
| CF-09 | A/P / S06 | A: respaldo económico previo en corporativo. P: anticipo para trabajo comprometido y saldo antes de despacho, diseño pagado separado si procede; vencimientos, pagos tardíos y crédito requieren tratamiento explícito. Valores en D02. | EC-07, EC-09, EC-26 |
| CF-10 | P / S06 | Pago se confirma por proveedor o conciliación autorizada. Mantener cada cobro, saldo y referencia; retorno, comprobante y pedido recibido son hechos distintos. Reintentos/notificaciones duplicadas no repiten efectos. | EC-04, EC-09, EC-27 |

### Diseño, contenido y ejecución

| ID | Estado / origen | Regla y criterio observable | Escenarios |
| --- | --- | --- | --- |
| CF-11 | P / S05, S10 | Alcance de diseño y revisiones definido antes de comprometer trabajo. Cambio adicional solicita decisión; consultas o generación de imágenes no consumen recursos sin límite. | EC-08, EC-10, EC-26 |
| CF-12 | A / S05, S12 | Cliente confirma personalización cuando aplica; administrador autorizado de Cisus, inicialmente John, aprueba arte final. Registrar versión y ambas acciones. Taller conserva revisión técnica; el administrador de una tienda no recibe esta autoridad. | EC-07, EC-10, EC-27 |
| CF-13 | P / S05, S10 | Referencia aprobable muestra pieza, escala, ubicación y opciones relevantes; explica variaciones del material. Imagen generada o conceptual no acredita fabricabilidad ni reemplaza calidad. | EC-10, EC-11 |
| CF-14 | P / S05 | Paquete para taller vinculado a versión aprobada, con SVG/3D, medidas, material, cantidad e instrucciones aplicables. Revisar geometría, escala y operaciones antes de ejecutar; preservar versión liberada. | EC-10, EC-11 |
| CF-15 | P / S05, S06 | Aceptación comercial, pago, conformidad, aprobación interna, fabricación, embalaje, entrega e incidencia conservan estados separados y hechos necesarios. Saltar etapas no aplicables no inventa aprobaciones o trabajo. | EC-07, EC-16, EC-19 |
| CF-16 | A / S08 | Lista completa de obligaciones desde aceptación/canje: productos, componentes, regalos, personalizaciones, complementos, presentación y documentos. Precio cero no excluye preparación, envío, revisión ni atención. | EC-06, EC-12, EC-13, EC-22 |
| CF-17 | F / S03, S08 | Portavasos como incentivo futuro: disponible y canjeado son distintos; nombre confirmado, un canje según regla vigente y reserva/consumo recuperables según resultado. No penalizar cuenta existente; puzle de ideas se conserva como exploración separada. | EC-06, EC-22, EC-30 |
| CF-18 | A / S07 | Revisar correspondencia, acabado, cantidad y personalización antes de embalaje; registrar conformes, correcciones y responsable. Corregidas vuelven a revisión; disponible en stock omite fabricación ficticia. | EC-11, EC-12, EC-13 |
| CF-19 | P / S08 | Contenido conforme asignado a cajas identificadas; impedir doble asignación y detectar faltantes. Registrar peso/dimensiones y presentación. Diferencias con cotización no generan cargos automáticos. | EC-12, EC-13 |
| CF-20 | P / S09 | Autorizar salida solo con contenido/alcance acordado, cajas, destino, servicio y pagos requeridos; parcial deliberado necesita acuerdo. La dirección del perfil no reemplaza la del pedido. | EC-13, EC-14, EC-15 |

### Transporte, personas y relación comercial

| ID | Estado / origen | Regla y criterio observable | Escenarios |
| --- | --- | --- | --- |
| CF-21 | P / S09 | Etiqueta corresponde a caja y servicio; reintento resuelve resultado incierto sin duplicar envío. Retiro/depósito tiene responsable; generar etiqueta no acredita recepción del transportista. | EC-14, EC-15, EC-16 |
| CF-22 | P / S09, S10 | Seguimiento por caja con fuente/fecha; no cerrar por una sola entrega si quedan obligaciones. Permitir ayuda posterior y resolución ligada a compra original sin exigir respuesta «Todo llegó bien». | EC-16, EC-17, EC-18 |
| CF-23 | A/P / S10, S12 | A: administrador de Cisus define condiciones y autoriza cancelaciones. P: registrar solicitud, etapa, condiciones, resolución y efectos únicos en reservas, beneficios, pagos y documentos; separar retracto, garantía y cancelación comercial. | EC-18, EC-19, EC-22 |
| CF-24 | P / S10, S11 | Cambios conservan historia y revisan dependencias afectadas. Nuevo arte, cantidad, destino o beneficio no se ejecuta bajo una aprobación desactualizada. No retroactividad silenciosa de configuración. | EC-08, EC-10, EC-14, EC-20, EC-22 |
| CF-25 | P / S10, S12 | Excepciones comerciales con administrador autorizado, motivo y alcance. No permiten fabricar hechos de pago, conformidad, entrega o acceso. Promesas externas de personal se investigan y resuelven. | EC-07, EC-21, EC-27 |
| CF-26 | A/P / S10 | A: herramientas para captador. P: presentación móvil de oferta vigente y selección compartible, diferenciando concepto/real; vista al cliente sin costes, notas o datos ajenos. | EC-23, EC-24 |
| CF-27 | P / S10 | Captador registra oportunidad y próxima acción, califica encaje y prepara propuesta dentro de facultades. No suplanta al cliente ni promete capacidad o excepciones no autorizadas. | EC-21, EC-23, EC-27 |
| CF-28 | P / S10 | Traspaso aceptado por quien recibe; responsable anterior permanece hasta entonces. Diseñador participa sin perder coordinación; sustitución conserva historial. Atribuir origen/gestión sin duplicar ni apropiarse del cliente. | EC-23, EC-24, EC-29 |
| CF-29 | A/P / S03, S10 | A: espacio de progreso/conversación. P: resumen, próxima acción, documentos vigentes e hitos sobre mismos hechos; notas internas distintas de contenido compartido. No mantener relatos manuales duplicados. | EC-16, EC-24, EC-27, EC-29 |
| CF-30 | P / S03, S09 | Avisos relevantes y atención para cuenta/invitado sin exposición indebida a destinatario o pagador. Canales y responsables verificables; fallo de aviso deja una gestión visible, no una falsa entrega. | EC-02, EC-15, EC-29 |

### Reventa, continuidad y garantías de implementación

| ID | Estado / origen | Regla y criterio observable | Escenarios |
| --- | --- | --- | --- |
| CF-31 | P / S12 | Mayorista como modalidad inicial recomendada: tienda compra a Cisus, condiciones y pago autorizados, preparación/entrega trazables; su reventa es otra operación. No conceder crédito, devolución por rotación o exclusividad implícitos. | EC-25 |
| CF-32 | F / S12 | Consignación y derivación con comisión requieren autorización y condiciones propias. Inventario, custodia, ventas, liquidaciones, devoluciones y vendedor deben quedar definidos antes de activarse. No alterar por inferencia acuerdos existentes. | EC-25, EC-30 |
| CF-33 | A/P / S05, S12 | A: interés en analítica para tienda. P: distinguir compras/reposición de ventas finales reales; sin fuente no inventar ventas ni márgenes. Precios sugeridos no equivalen a utilidad obtenida ni se vuelven mínimos obligatorios por defecto. | EC-25 |
| CF-34 | P / S10 | Acordar entrega de piezas/archivos/derechos y uso de material aportado, publicación y servicios externos de IA. Solo compartir documentos autorizados; aprobación visual no concede exclusividad implícita. | EC-10, EC-26, EC-27 |
| CF-35 | P / S10 | Admisión y límites protegen trabajo; retirar una oferta para nuevos pedidos conserva compromisos aceptados. Registrar motivo de cierre y evaluar captación con cobros/concesiones/cancelaciones, sin fijar comisión. | EC-21, EC-28 |
| CF-36 | A / S11 | Cada función ve acción, referencia, faltante, responsable y salida; preguntas aplicables sin repetir datos. Distinguir bloqueo, aviso y desconocido. Una casilla o texto de IA no acredita un hecho físico. | EC-11, EC-21, EC-26, EC-29 |
| CF-37 | P / S11 | Aplicar permisos y condiciones críticas en servidor; resistir llamada directa, repetición, versión antigua y concurrencia. Incertidumbre de integración no confirma hechos. La IA sugiere y no autoriza hechos por sí sola. | EC-04, EC-05, EC-10, EC-14, EC-27 |
| CF-38 | P / S10 | Evidencia mínima por acción: referencia, fecha, actor/origen, versión y resultado. Documentos y acceso con finalidad y visibilidad definidas; devolución o reembolso conserva historial. Política de retención pendiente, sin recopilar datos indefinidos por defecto. | EC-03, EC-18, EC-19, EC-27 |
| CF-39 | A / S11 | Cada decisión del alcance se relaciona con requisito, tarea y evidencia; cada comportamiento nuevo justifica su origen. Distinguir propuesto, implementado y verificado; pruebas válidas para versión/alcance comprobados. | EC-28, EC-30 |
| CF-40 | F / S05 | Generación de código G y distribución automática solo en alcance futuro con origen, material, sujeción, herramienta, profundidades, compatibilidad, simulación y revisión del operario. Ninguna imagen aprobada basta para ejecutarlo. | EC-11, EC-30 |

## Controles por momento y función

Estos son controles de negocio propuestos. No se añaden formularios o bloqueos idénticos a las cuatro rutas. Los importes, duración de espera y nombres de responsables se resolverán por sus decisiones D.

| Momento / función | Información o pregunta pertinente | Condición y evidencia | Si falta o discrepa |
| --- | --- | --- | --- |
| Presentación / captador | ¿Encaja en la oferta vigente y en lo que el cliente necesita? | Producto real/concepto identificado; selección y próxima acción. | Evaluar desarrollo o cerrar oportunidad con motivo. CF-01, CF-02, CF-26, CF-27. |
| Propuesta / captador y administración | ¿Incluye todo lo prometido y está autorizado? | Versión vigente, alcance, contenido, fechas, pagos y excepción aprobada cuando aplique. | Completar o revisar antes de comprometerse. CF-07, CF-08, CF-09, CF-16, CF-25. |
| Confirmación / sistema y administración | ¿Se cumplen las condiciones de esta operación? | Pago verificado y aceptación correspondiente; capacidad válida. | Resolver pago tardío o diferencia; no inventar confirmación. CF-08, CF-10, CF-15. |
| Traspaso / coordinación | ¿Quién acepta hacerse cargo y qué sigue pendiente? | Receptor identificado acepta y cliente recibe presentación. | Responsable anterior mantiene atención; reasignar si no puede. CF-28, CF-29, CF-30. |
| Diseño / diseñador, cliente y administrador Cisus | ¿La versión muestra lo acordado y tiene ambas decisiones aplicables? | Referencia concreta, conformidad cliente y aprobación interna de John/administrador autorizado. | Pedir dato, corregir o revisar alcance; no aceptar por silencio. CF-11, CF-12, CF-13, CF-34. |
| Liberación / taller | ¿Archivo y preparación técnica corresponden al trabajo autorizado? | Paquete/versiones, recursos y pagos habilitantes revisados. | Bloquear ejecución afectada y elevar discrepancia. CF-14, CF-15, CF-24. |
| Calidad / taller o revisor | ¿Coinciden contenido, nombres, cantidad y acabado? | Unidades conformes/corrección identificadas y responsable. | Corregir y volver a revisar; notificar efecto relevante en plazo. CF-16, CF-18. |
| Embalaje / responsable | ¿Dónde está cada elemento comprometido? | Caja, contenido, presentación, peso y medidas confirmados sin duplicados. | Mostrar faltante; acuerdo explícito para entrega separada. CF-16, CF-19. |
| Despacho / responsable y sistema | ¿Estas cajas pueden salir a este destino con estas condiciones? | Pago habilitante, servicio, etiquetas y alcance; después respaldo de recepción física. | No declarar salida; resolver o registrar parcial/incidencia. CF-20, CF-21. |
| Recepción / coordinación | ¿Se cumplieron o resolvieron todas las obligaciones? | Información por caja, documentos y resolución de pendientes. | Mantener incidencia y atención; no cerrar por una señal parcial. CF-22, CF-29. |
| Cancelación / administrador Cisus | ¿Qué condición aplica y qué acciones deben ejecutarse? | Solicitud, hechos, derechos aplicables y resolución autorizada. | Conciliar antes de ejecutar efectos irreversibles; conservar evidencia. CF-23, CF-38. |

Siempre aplica CF-36: mensaje específico, responsable y acción disponible. Datos comprobables se completan automáticamente; observaciones físicas requieren persona competente. La excepción conserva sus límites CF-25. El sistema no adivina una confirmación por chat o mediante IA.

## Escenarios de comprobación propuestos

Los resultados siguientes son criterios de aceptación. El método apropiado podrá ser prueba automatizada de comportamiento, prueba de autorización, recorrido de uso o demostración operativa. No se ejecuta ahora una batería de pruebas por haber creado la tabla. Las rutas visuales se verifican solo bajo la autorización de navegador vigente; una revisión de código no se reporta como prueba de interacción real.

| ID | Situación | Resultado que debe comprobarse |
| --- | --- | --- |
| EC-01 | Elegir diseño/canaleta, cambiar intención y volver; abrir además una pieza conceptual. | Preservar opciones compatibles, identificar ruta y no vender un concepto como stock confirmado; ninguna navegación abre trabajo por sí sola. |
| EC-02 | Invitado compra stock disponible, rechaza cuenta y vuelve a consultar entrega. | Pedido durable, una compra, acceso autorizado a seguimiento/atención; sin fabricación ni registro obligatorio ficticios. |
| EC-03 | Vincular después a cuenta nueva/existente; probar otro correo, destinatario y enlace no autorizado. | Solo titular/autorizado accede; no duplicar pedido ni identidades por coincidencias comerciales. |
| EC-04 | Pago falla, se reintenta, se duplica callback y hay retorno antes de confirmación. | Un resultado por transacción, efectos idempotentes, pendiente visible y ningún cobro/fabricación inventados. |
| EC-05 | Dos compras compiten por stock/capacidad; cambia cobertura antes de confirmar. | Evitar sobreventa/fecha irreal, conservar selección y resolver nueva condición sin cargo silencioso. |
| EC-06 | Beneficio disponible frente a canje efectivo en próxima compra, con nombre por confirmar. | Solo el canje incorpora regalo y carga de preparación/envío; dato pendiente visible. Ni cuenta nueva ni existente pierde trato previsto. |
| EC-07 | Corporativo con coordinador, pagador y aprobador cliente distintos; probar pago sin aprobación y arte sin pago. | Exigir cada condición aplicable, incluida aprobación interna de Cisus; no confundir enlace de pago con autoridad. |
| EC-08 | Cliente demora aprobación para evento y vuelve con propuesta vencida. | Mantener fecha requerida y compromiso histórico; informar nueva programación y pedir aceptación cuando cambien condiciones. |
| EC-09 | Pago llega tras vencer reserva; saldo permanece pendiente al terminar. | Conciliación y resolución explícitas; no reactivar recursos agotados ni despachar fuera de condiciones. |
| EC-10 | Cambia arte por chat después de aprobar; otro actor intenta usar archivo anterior o pedir editables. | Revisión de alcance/derechos; conformidad, aprobación y paquete de versión correspondiente; rechazar uso desactualizado y compartir solo lo pactado. |
| EC-11 | Simulación visual no corresponde a escala o calidad física; producto estándar sí está disponible. | Detectar diferencia, revisar archivo/pieza y volver a verificar corrección. Producto de stock omite trabajo no aplicable. No generar/ejecutar código G por inferencia. |
| EC-12 | Tabla lista, portavasos sin grabar; o cantidad correcta con nombre equivocado. | Pedido conserva pendiente de contenido/personalización; no confunde cantidad con conformidad ni permite declarar todo embalado. |
| EC-13 | Pedido multicaja con accesorio y regalo; asignar una unidad a dos cajas o acordar entrega separada. | Detectar duplicado/falta; parcial solo autorizado, saldo de obligaciones visible y empaque de todo contenido tenido en cuenta. |
| EC-14 | Generación de etiqueta responde con incertidumbre; cambia dirección o servicio antes de entrega. | Consultar/reconciliar sin duplicar; revisar cobertura/etiquetas y autorización de salida; conservar versiones. |
| EC-15 | Regalo comprado por otra persona; etiqueta creada pero paquete sigue en taller. | No avisar «enviado»; verificar destinatario y mensajes necesarios sin exponer condiciones comerciales; responsable de entrega asignado. |
| EC-16 | Transportista recibe una de varias cajas y luego informa solo una como entregada. | Estados por caja y resumen consistente; mantener obligaciones restantes, historial común y pedido sin cierre falso. |
| EC-17 | API de seguimiento caída o entrega fallida por ausencia, dirección, pérdida o retorno. | Mostrar último dato/fecha y gestión pendiente; no inventar progreso ni culpar automáticamente al comprador. |
| EC-18 | Transportista informa entregado, pero falta regalo, documento o hay daño; cliente no pulsa confirmación. | Atención disponible, incidencia y resolución ligadas a compra; sin doble reposición/reembolso ni cierre por silencio. |
| EC-19 | Solicitar cancelación antes de aceptación, después de pago, con trabajo en curso y tras despacho. | Administrador resuelve según etapa/condiciones; efectos únicos en cobros, reserva, documentos y beneficios; no borrar hechos ni detener máquina automáticamente. |
| EC-20 | Falla material/máquina o cambia configuración con pedidos confirmados. | Conservar acuerdos y obra ejecutada; recalcular afectados y comunicar; sustitución requiere acuerdo, no cambio silencioso. |
| EC-21 | Captador ofrece extra/urgencia fuera de facultades; oportunidad no encaja o pide trabajo indefinido. | Control y motivo comprensibles; solicitar decisión, limitar trabajo nuevo; investigar promesa externa sin negar que existió. |
| EC-22 | Cambia promoción; falla pago del canje, se cancela o se intenta reutilizarlo. | Condiciones aceptadas preservadas, reserva/consumo conforme al estado; administrador resuelve cancelación sin duplicar beneficio o borrar obligación vigente. |
| EC-23 | Captador presenta, comparte selección y cliente completa en web. | Preservar contenido/origen sin suplantar cuenta; propuesta autorizada y siguiente responsable; vista pública sin datos privados. |
| EC-24 | Coordinador no acepta traspaso o captador se ausenta; diseñador participa después. | Hay responsable de cada pendiente, reasignación autorizada e historia compartida; notas internas no se publican por accidente. |
| EC-25 | Tienda pide precio privado, crédito, devolución por baja rotación y analíticas sin ventas registradas. | Solo convenio autorizado concede condiciones; mayorista distinto de reventa final; no activar consignación/comisión ni inventar métricas. |
| EC-26 | Nueva idea empieza desde producto; detalle todavía no permite cotizar fabricación. | Brief y evaluación, alcance de diseño autorizado, derechos de referencia y siguiente acción; no prometer aceptación, trabajo ilimitado o plazo definitivo. |
| EC-27 | Cliente de otra empresa, pagador, captador o administrador de tienda intenta cambiar arte, consultar archivo, confirmar pago o cancelar por llamada directa. | Rechazo acorde con permisos/identidad y registro pertinente; autoridad Cisus no se hereda de un cargo declarado ni de una URL. |
| EC-28 | Retirar oferta y preparar una entrega de código que omite una condición acordada. | Conservar compras vigentes; requisito omitido queda identificado y entrega no se declara completa para ese alcance. |
| EC-29 | Mensaje/aviso falla, cambia responsable o un bloqueo pide información ya conocida. | Pendiente visible con responsable, recuperación sin spam/duplicados y preguntas pertinentes; no falsa notificación o repetición innecesaria. |
| EC-30 | Plan de código incluye o excluye promoción, consignación, puzle o código G; prueba antigua aparece como evidencia. | Futuro y alcance explícitos; sin activación accidental ni evidencia válida para otra versión. Cada comportamiento tiene origen y cada requisito activo, comprobación. |

## Decisiones todavía necesarias

John ya resolvió la autoridad interna del arte y cancelaciones: administrador de Cisus, inicialmente él. Esta tabla no vuelve a pedir esa decisión. Valores y plazos continúan aplazados. Lo que sigue es un registro de dependencias para el futuro plan, no una lista de preguntas que deba contestarse toda ahora.

| ID | Decisión o parámetro pendiente | Responsable propuesto / momento límite | Requisitos afectados |
| --- | --- | --- | --- |
| D01 | Permisos concretos de captador, coordinación, taller y finanzas; delegación/suplencia administrativa e identificación del interlocutor cliente por pedido. | John define facultades; equipo implementa control antes de conceder accesos. | CF-06, CF-12, CF-25, CF-27, CF-28, CF-37 |
| D02 | Proveedor y medios de pago, anticipo/saldo, crédito, alcance del diseño pagado, vigencias, reservas y conciliación. Importes/duraciones después. | Administración, antes de habilitar aceptación/cobro real dependiente. | CF-08, CF-09, CF-10, CF-11, CF-20 |
| D03 | Ratificar mayorista como inicio y convenio de tienda: catálogo, condiciones por cantidad, precio sugerido, devoluciones comerciales, atención al comprador final y documentos. | Administración con revisión contable/jurídica pertinente, antes de activar reventa. | CF-31, CF-32, CF-33, CF-38 |
| D04 | Texto publicable y aplicación de cancelación, retracto, garantía, reembolso, trabajo ejecutado y espera. No todo anticipo es irrecuperable. | John define/aprueba política con revisión legal pertinente, antes de contratar bajo ella. | CF-09, CF-23, CF-38 |
| D05 | Datos reales de disponibilidad, materiales, capacidad, calendario, etapas de taller y correspondencia visual/física por producto. | Administración/taller/diseño, antes de prometer condiciones automáticas. | CF-03, CF-08, CF-13, CF-14, CF-18 |
| D06 | Acceso seguro de invitado, recuperación, vinculación y contacto erróneo; finalidad/retención de datos y límites de archivos compartidos. | Administración define política; implementación la verifica antes de exponer datos. | CF-05, CF-06, CF-29, CF-30, CF-34, CF-38 |
| D07 | Si se activa el portavasos: elegibilidad, opciones/nombre, vigencia, canje, cancelación y trato de cuentas existentes. | Administración, solo antes de publicar promoción. Puzle sigue futuro separado. | CF-16, CF-17, CF-23 |
| D08 | Alcance de entrega de diseño/archivos, exclusividad, referencias, publicación y envío de material a generación externa. | Administración y diseñador, antes de aceptar/usar esos materiales. | CF-11, CF-13, CF-34, CF-40 |
| D09 | Transporte efectivo, cuenta/integración, servicio, retiro/depósito, respaldo, parciales, dirección, devolución/reenvío y diferencias de tarifa. | Administración y despacho, antes de prometer o ejecutar modalidad. | CF-19, CF-20, CF-21, CF-22, CF-30 |
| D10 | Responsables nominativos, sustitución, canales y expectativa de atención/avisos; reglas de atribución comercial y futura compensación. | John, antes de asignar pedidos y prometer atención. | CF-26, CF-28, CF-29, CF-30, CF-35, CF-36 |
| D11 | Alcance y orden de implementación, copy y composición, datos reales de pieza piloto y qué futuros se excluyen expresamente. | John y quien implemente al preparar el plan. No activa código en esta tarea. | CF-01, CF-02, CF-17, CF-32, CF-39, CF-40 |

### Nuevas precisiones detectadas al consolidar

Las siguientes son derivaciones para revisar, no hechos ya acordados en todas sus variantes: respuesta a una integración de resultado incierto; política de retención/archivos; documentación tributaria por modalidad; continuidad ante ausencia del responsable; diferencias entre administrador Cisus y administrador cliente; y resolución de cobros que lleguen tras vencer una reserva. Se registran en D01–D10 y en sus escenarios para que no se rellenen por suposición durante el código.

## Contrato para el futuro plan de implementación

Conservar estos identificadores aunque cambien las pantallas. Un requisito sustituido registra sucesor y motivo; no se elimina para aparentar cobertura. Los cambios en conversación o negocio deben actualizar recorrido, matriz y escenarios afectados en el mismo encargo documental.

Cada tarea del plan incluirá:

| Campo | Contenido exigible |
| --- | --- |
| Objetivo y alcance | Resultado observable y CF incluidos; rutas a las que aplica. |
| Decisiones previas | D resueltas necesarias; asuntos diferidos y operación que permanece deshabilitada. |
| Comportamiento preservado | Acciones que deben seguir disponibles, incluidos invitado, stock y acuerdos existentes. |
| Implementación | Archivos/componentes/operaciones reales descubiertos durante esa tarea; no rutas inventadas de antemano. |
| Controles | Condiciones de servidor, pregunta/revisión humana, responsable, evidencia y salida de fallo. |
| Comprobación | EC aplicables, resultado esperado y pruebas que demuestran conducta; no pruebas espejo de implementación. |
| Evidencia de entrega | Revisión de código comprobada, entorno/configuración relevante, perfil y resultado, archivos de evidencia y límites. |
| Estado separado | Propuesto, implementado, verificado o pendiente; el resultado de una prueba antigua no acredita código nuevo. |

Revisar en ambos sentidos: **CF del alcance → tarea/comportamiento/evidencia** y **comportamiento nuevo → CF/origen**. Toda exclusión se explica. Una mera referencia al ID en código o una prueba no demuestra que lo cumple.

### Verificación proporcionada y Juez

Seguir [quality/README.md](../../quality/README.md): perfil suficiente por alcance, sin duplicar comandos o ejecutar suites por rutina. Reutilizar pruebas y contratos existentes. No se propone construir otro motor de validación ni una plataforma de reglas genérica.

- Documentación: revisar diff, enlaces, identificadores y coherencia de referencias. Sin build ni aplicación.
- Código: ejecutar el perfil que cubra el cambio y pruebas relevantes de comportamiento. Un control estático no demuestra autorización en ejecución ni aislamiento multiempresa.
- Uso: comprobar que las personas identifican su acción y resuelven pendientes; declarar si no se verificó interfaz real. El proyecto requiere petición explícita para navegador.
- Operación física: la prueba digital no certifica acabado, recepción o seguridad de mecanizado; necesita evidencia humana o externa adecuada.

Para cerrar un alcance de implementación, sus CF deben estar atendidos con evidencia suficiente, las decisiones dependientes resueltas, escenarios relevantes comprobados y limitaciones declaradas. Una compilación exitosa, una casilla o un porcentaje de cobertura documental no sustituyen eso.

### Coste y comprobación de esta propuesta

El coste es mantener decisiones, controles y evidencia alineados. Se limita usando un solo recorrido y esta matriz, reutilizando datos y comprobaciones. No se pide una confirmación humana para cada hecho automático ni una auditoría completa por cada cambio pequeño.

La primera comprobación de utilidad será tomar un alcance real y localizar, sin reconstruir el chat, qué se acordó, dónde se implementó y qué prueba su cumplimiento. El caso del portavasos, el traspaso del captador y el pago tardío permiten detectar omisiones distintas. Esa comprobación operativa queda para la implementación; hoy solo se verifica la consolidación documental.
