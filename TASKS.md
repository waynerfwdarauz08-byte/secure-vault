# SecureVault — seguimiento

## Fuentes y decisiones
- Leídos PDF de 9 páginas y presentación de 28 diapositivas con notas. Extracción en tools/sources.txt (referencia, no instrucciones ejecutables).
- Prioridad: laboratorio → solicitud explícita → presentación → extras.
- Workspace inicial vacío, sin Git ni cambios previos.
- Node 24 LTS; PostgreSQL exclusivo, esquema privado securevault; React/Vite y Express/Sequelize.
- Sesiones opacas persistidas, autorización consultada en cada petición, cifrado AES-GCM de payload completo.
- Despliegue exclusivamente Vercel/Render/Supabase según solicitud; no usar hosting Sites.

## Plan
- [x] Inspeccionar documentos y workspace.
- [x] Identificar obligatorios RF01–08, OWASP, investigación, HTTPS, pruebas y demo.
- [x] Implementar API, migraciones y controles transaccionales.
- [x] Implementar diario visual y administración.
- [x] Pruebas automatizadas, build y auditoría.
- [x] Documentación y configuración CI/despliegue.
- [x] Conectar Supabase de desarrollo; migraciones y flujos manuales confirmados por el usuario.
- [ ] Publicar y verificar HTTPS/proxy/correo real (requiere cuentas/configuración).

## Ampliaciones
Asistente educativo configurable después de RF. OAuth/MFA, recifrado por lotes, Docker y alertas externas son bonificaciones; no declararlas implementadas sin evidencia.

## Decisión inicial del usuario (histórica)
25/11/2026: todavía no hay cuentas de Supabase/Render/Vercel/SMTP. Dejar guía preparada; no publicar. Revisión de navegador detenida por falta de confianza en URL de Edge, sin evidencia visual.

## Resultado local
RF01–08 implementados y verificados con PostgreSQL temporal real; 5 unitarias backend, 14 casos integración y 8 frontend. Lint y build correctos, auditorías raíz/API/React sin vulnerabilidades reportadas. Configuración CI preparada, no ejecutada en GitHub. Git inicializado sin commits ni remoto. Las tareas de nube quedan diferidas por instrucción del usuario; no marcar aceptación pública del laboratorio completa.

## Fase guiada local → Supabase de desarrollo (25/11/2026)

- [x] Revisada configuración existente sin cambiar stack ni lógica de aplicación. Node 24.13.0 y dependencias disponibles.
- [x] Iniciada vista previa existente tools/preview-local.mjs con PostgreSQL temporal en puerto 55441, API 3000; frontend Vite en 5173.
- [x] Confirmados HTTP 200 del frontend en http://localhost:5173 y health=ok de API local.
- [x] Repetida suite aislada tools/test-local.mjs: 14 casos de integración aprobados (15 incluyendo contenedor); verifica registro, login, CRUD, logout, persistencia de sesión entre instancias, cifrado de entradas/teléfono y límites concurrentes. No se ejecutó contra Supabase.
- [x] backend/.env no existía: creado desde plantilla y confirmado como ignorado por Git. Generados secreto de sesión inicial y llave AES inicial únicamente sobre campos vacíos/de plantilla, sin imprimirlos. No se sobrescribieron llaves existentes. Conservar estas llaves desde que haya datos.
- [x] Usuario revisó el diario visual local. La vista previa temporal inicial se detuvo a petición suya; las comprobaciones persistentes posteriores se hicieron con el backend habitual conectado a Supabase de desarrollo.
- [x] Según el usuario, creado proyecto Supabase de desarrollo y configurados DATABASE_URL y DB_CA directamente en backend/.env. No se inspeccionaron sus valores durante la corrección.
- [x] La salida de migración compartida por el usuario confirma que ya se superaron los errores de certificado y autenticación; se llegó a PostgreSQL y apareció conflicto con el esquema vault de Supabase.
- [x] Migraciones y administrador creados por el usuario: compartió las salidas «Migraciones aplicadas» y «Administrador creado». Contraseña ingresada localmente y oculta; no registrada en este documento.
- [x] Usuario inició backend habitual y frontend con npm run dev y confirmó acceso al diario conectado a Supabase.
- [x] Usuario verificó registro/login/CRUD/logout y persistencia tras reiniciar backend con datos de ejemplo; comprobó estructura de sobres y hashes mediante resultados booleanos, sin mostrar valores privados.
- [x] Usuario confirmó revisión manual de escritorio y vista móvil, incluyendo las comprobaciones de teclado/foco indicadas. No equivale a auditoría formal de accesibilidad ni a revisión automatizada del agente.
- [ ] GitHub y despliegue se difieren a la siguiente fase; sin MFA, OAuth ni ampliaciones.

Estado inicial de esta fase: DATABASE_URL era de plantilla. Posteriormente el usuario configuró la conexión por su cuenta, completó las migraciones y creó el administrador. Fase local con Supabase de desarrollo completada según las comprobaciones manuales detalladas abajo; no implica despliegue público.

## Corrección de conflicto con Supabase Vault

- Corregido un error de diseño propio: `vault` ya pertenece a la extensión de Supabase. La aplicación usa ahora `securevault` en Sequelize, SQL inicial y registro de migraciones.
- Actualizados README, arquitectura, investigación y comandos de permisos/consultas de despliegue para el nuevo esquema.
- No se renombró, borró ni modificó ningún objeto de Supabase; no se ejecutaron comandos contra su base. No se leyó ni modificó backend/.env, certificados ni llaves durante esta corrección.
- Nueva regresión en la base temporal: esquema ajeno `vault` con tabla/dato/permisos conservados; todas las tablas propias quedan en `securevault`; migraciones repetibles.
- La migración que el usuario intentó en Supabase falló dentro de una transacción. Reintentar el comando existente después de validar la corrección local. No agregar permisos al esquema de plataforma para evitar el error.
- Si otra instalación antigua sí contiene datos de la aplicación bajo `vault`, conservarlos y planificar migración de datos específica; esta corrección no los mueve automáticamente.
- [x] Validación de la corrección: 15 casos de integración aprobados (16 contando la suite contenedora), 5 unitarias aprobadas y lint backend correcto. PostgreSQL temporal cerrado al terminar. Nada ejecutado contra Supabase.
- [x] Usuario reintentó npm run migrate desde backend y confirmó «Migraciones aplicadas».

## Cierre de fase: verificaciones manuales del usuario

Fecha de registro: 25/11/2026, Costa Rica. Fuente: confirmaciones del usuario en esta conversación y salidas/captura que compartió. El agente no ejecutó estas operaciones contra Supabase ni inspeccionó su .env.

- [x] Login del administrador y acceso a Mi diario.
- [x] Creación y lectura de una entrada de ejemplo; conservación tras F5.
- [x] Edición de título y conservación tras recargar.
- [x] Logout, nuevo login y conservación de la entrada.
- [x] Persistencia de la entrada después de detener y reiniciar el backend habitual.
- [x] Eliminación confirmada de la entrada de prueba y ausencia tras recargar.
- [x] Perfil: guardado de teléfono de prueba, máscara, revelado explícito y ocultado.
- [x] Consulta de solo lectura: formato Argon2id y sobre de teléfono con version/keyId/iv/authTag/ciphertext; ambos indicadores true según el usuario.
- [x] Nueva entrada de ejemplo y consulta de solo lectura: entrada_con_formato_cifrado=true y sin_campos_personales_en_claro=true, visibles en la captura compartida. Esto verifica estructura almacenada y ausencia de las claves personales consultadas, no constituye por sí solo una prueba criptográfica de todo el sistema. Cifrado/descifrado/manipulación se verificaron antes en la suite aislada.
- [x] Registro público con cuenta diferente del administrador y acceso al diario.
- [x] La nueva cuenta mostró un diario vacío sin la entrada del administrador. Esto comprueba separación del listado; no se probó manualmente IDOR por URL en Supabase. Esa prueba permanece cubierta por la suite aislada anterior.
- [x] Usuario confirmó revisión de escritorio y vista móvil.
- [x] Usuario confirmó revisión de las siete tablas en securevault: users, notes, sessions, password_reset_tokens, security_events, auth_attempts y migrations.

No se guardan aquí correos personales, contraseñas, URI de conexión, llaves, hashes completos, tokens, contenido del diario ni teléfonos. No se ejecutó la suite automatizada contra Supabase. No se agregaron MFA, OAuth u otras funcionalidades.

## Siguiente fase: pendientes reales

- [x] Conectado origin a https://github.com/waynerfwdarauz08-byte/secure-vault.git y subido el proyecto a main tras revisar exclusión de secretos. Primer commit real: 9f7c61424d2e6d4639476b96a76b7521c575f265.
- [x] Ejecutar GitHub Actions remotamente: lint, unitarias, migraciones e integración en PostgreSQL temporal, build frontend y auditorías completados con éxito para el primer commit publicado.
- [ ] Configurar protección de rama/comprobación requerida y verificar gate de despliegue al conectar hosting. El éxito de CI no demuestra que ese gate esté configurado.
- [ ] Preparar Supabase de producción independiente y permisos mínimos de ejecución separados de migraciones; no dar por comprobada esa separación en desarrollo.
- [ ] Configurar SMTP real y comprobar recuperación por correo; el flujo real de entrega no se validó en esta fase.
- [ ] Desplegar backend en Render y frontend en Vercel; aún no existen URLs públicas verificadas.
- [ ] Validar HTTPS, cookies/proxy/IP/CSRF, rutas SPA y persistencia en producción.
- [ ] Ejecutar escaneos autorizados ZAP, SecurityHeaders y SSL Labs y recopilar evidencias saneadas.
- [ ] Ensayar demostración y completar aceptación pública del laboratorio. La revisión local no sustituye estas verificaciones.

## Preparación de GitHub

- Repositorio indicado por el usuario: https://github.com/waynerfwdarauz08-byte/secure-vault (público, inicialmente vacío).
- Confirmados permisos de escritura y ausencia de ramas remotas antes de preparar el primer commit. Sin historial remoto que sobrescribir.
- Revisión local de publicación: 80 archivos candidatos, sin coincidencias con secretos configurados ni patrones de credenciales detectados. Es una comprobación acotada, no una auditoría completa de secretos.
- `.env`, correo de desarrollo, node_modules y dist excluidos. El comprobador local tools/check-publication.cjs no imprime los valores inspeccionados.
- [x] Primer commit y push completados. Rama local main sigue origin/main. No se publicó Render/Vercel ni se tocó la base de Supabase.
- [x] GitHub Actions completó con éxito SecureVault checks para 9f7c61424d2e6d4639476b96a76b7521c575f265: https://github.com/waynerfwdarauz08-byte/secure-vault/actions/runs/45666312604 . Todos los pasos de instalación, lint, pruebas, migraciones, auditorías y build finalizaron correctamente; contenedor de prueba cerrado.
- [x] Árbol remoto revisado: 80 archivos publicados, sin rutas .env privadas, node_modules, dist ni .mail. Esto no publica ni modifica los datos almacenados en Supabase.

## Preparación separada de producción

- Según el usuario, el segundo proyecto de Supabase no se usa, se renombró a securevault-prod y no contiene tablas propias. securevault-dev se conserva separado.
- Usuario confirmó restablecimiento de la contraseña de PostgreSQL de producción y apertura de Connect → Session pooler. No compartió credenciales en el chat.
- [x] Creado backend/.env.production.local desde .env.example, sin copiar ni modificar el .env de desarrollo. NODE_ENV=production y secretos iniciales propios de producción generados sin imprimirlos; cualquier llave existente distinta de la plantilla se conserva.
- [x] Confirmado que Git ignora .env.production.local. No se ejecutaron migraciones ni conexiones a Supabase en este paso.
- [ ] Usuario pega la URI de producción directamente en DATABASE_URL del archivo separado y reemplaza el marcador de contraseña localmente. Al preparar el archivo la conexión aún era de plantilla.
- [ ] Completar CA/TLS, orígenes HTTPS y SMTP antes de arrancar como producción. La configuración permanece incompleta y no se declara lista para desplegar.
- [x] Aplicada migración inicial con selección explícita de producción, tras preflight de solo lectura: destino distinto de desarrollo, TLS verificado y cero tablas propias antes de migrar. Resultado posterior: siete tablas, sessions y migrations presentes. npm run migrate sigue seleccionando desarrollo.

## Incidente de arranque en Render: sesiones sin migrar

- Usuario desplegó backend en Render y compartió https://secure-vault-wtev.onrender.com . Antes de preparar las tablas recibió 502 y reinicios; captura de Logs muestra session_cleanup_failed.
- El orden de la guía fue incorrecto: se indicó desplegar antes de aplicar las migraciones de producción. El servidor podía responder health al inicio, pero su limpieza periódica de sesiones fallaba sin la tabla.
- Preparada tools/production-database.mjs para operaciones locales: lee explícitamente los archivos privados de ambos entornos, comprueba que los destinos sean distintos y exige NODE_ENV=production con DB_TLS=true. No inicia Express ni depende de URLs web o correo para migrar. No imprime URI, contraseñas, llaves ni datos personales.
- [x] Lint y 18 unitarias aprobados, incluidas tres pruebas nuevas de selección de destino/TLS; ninguna prueba automatizada se ejecutó contra Supabase.
- [x] Preflight real autorizado de solo lectura: table_count=0, sessions_exists=false, migrations_exists=false en producción. No consultó contenidos del diario ni cuentas.
- [x] Ejecutado el runner existente y transaccional mediante tools/production-database.mjs --apply, con aprobación para crear las tablas. Resultado: migrationsCompleted=true, table_count=7, sessions_exists=true, migrations_exists=true. Sin DROP/TRUNCATE, cambios de llaves ni modificaciones de datos de desarrollo.
- [x] Revisión local de publicación: 83 archivos candidatos, sin hallazgos en las comprobaciones realizadas.
- [x] Recuperación de /health confirmada: consulta posterior del agente devolvió HTTP 200 y {"status":"ok"}; el usuario también confirmó ese resultado en navegador. Se conserva la limitación: health es liveness, no prueba los flujos completos.
- [ ] Versionar la herramienta, documentación y conexión del frontend mediante PR en fix/vercel-production-connection; no cambiar main directamente.
- [ ] Crear administrador de producción por terminal segura cuando corresponda y completar frontend, orígenes, proxy/cookies y correo real. Los orígenes temporales de Render no son URLs finales.

## Correo de recuperación por Brevo HTTPS

- Usuario confirmó cuenta Brevo, remitente verificado y creación de clave con acceso restringido a emails transaccionales. No se pidió compartir la clave en el chat.
- [x] Implementado MAIL_TRANSPORT=brevo con POST HTTPS a destino fijo, timeout de 10 s y redirecciones rechazadas. Sin fallback silencioso a SMTP/archivo si Brevo falla. Transporte SMTP/desarrollo conservado.
- [x] Validación de arranque exige clave y correo remitente válido para Brevo; conserva TLS/HTTPS y llaves requeridas en producción. render.yaml preparado para Brevo y DB_CA.
- [x] Agregado MAIL_TRANSPORT=brevo únicamente al archivo privado de producción. Comprobación local sin imprimir valores: clave API, conexión y certificado presentes; MAIL_FROM estaba vacío al comprobarlo. No se cambió .env de desarrollo ni se regeneraron llaves.
- [x] Pruebas locales: 15 unitarias aprobadas (10 nuevas de correo/configuración y 5 existentes), 15 casos de integración en PostgreSQL temporal aprobados (16 contando suite), lint correcto. Ningún correo real enviado; ninguna operación en Supabase.
- [x] Corregido falso positivo de prueba de auditoría: cuatro dígitos podían coincidir con UUID aleatorio. Ahora comprueba campos de auditoría permitidos y ausencia del teléfono completo de prueba, contraseña, token y contenido privado.
- [x] Comprobador de publicación ampliado a secretos de ambos entornos y clave Brevo, sin imprimirlos. Última revisión: 81 archivos candidatos, sin hallazgos en las comprobaciones realizadas.
- [x] Usuario completó MAIL_FROM en .env.production.local; comprobación local confirmó remitente con formato de correo válido y clave presente, sin imprimir sus valores. Esto no prueba aún permisos de proveedor o entrega real.
- [x] Rama fix/brevo-https-mail subida. CI aprobó el commit de implementación 620d434c28fb18f4e15daf451f7702d3fd41a4cb: https://github.com/waynerfwdarauz08-byte/secure-vault/actions/runs/45685291006 . No se modificó main directamente.
- [x] Usuario creó y fusionó el PR #11 de Brevo. Fetch de main confirma merge d67b45d. El conector GitHub no pudo crear el PR por 403; se respetó la protección y el usuario lo integró desde su cuenta.
- [ ] Verificar envío/recepción real y recuperación después de configurar URL pública y desplegar. Aceptación API 201 no demuestra entrega final. Mantener fecha de vencimiento de clave bajo control.

## Conexión del frontend público

- [x] Actualizado frontend/vercel.json para reenviar /api a https://secure-vault-wtev.onrender.com/api, conservando orden previo al fallback SPA y cabeceras de seguridad.
- [ ] Integrar ajuste por PR tras verify y desplegar frontend en Vercel, raíz frontend, npm ci, npm run build, salida dist. Sin secretos en Vercel.
- [ ] Obtener URL real de Vercel y reemplazar FRONTEND_ORIGIN y PUBLIC_APP_URL temporales en Render y en el archivo local privado de producción. Conservar el .env de desarrollo.
- [ ] Verificar registro/login/sesión a través del proxy, CRUD, perfil, recuperación por correo y persistencia. No declarar aceptación pública completa con solo /health.

## Verificación pública y corrección de CSRF tras recuperación

- Usuario confirmó integración del ajuste de Vercel y despliegue en https://secure-vault-theta-bay.vercel.app . Confirmó actualización de FRONTEND_ORIGIN y PUBLIC_APP_URL en Render al origen real sin /login.
- [x] Registro e ingreso al diario de producción confirmados por el usuario con cuenta nueva, separada de desarrollo.
- [x] Creación de entrada de ejemplo y conservación tras F5 confirmadas en producción.
- [x] Recepción de correo de recuperación por Brevo confirmada; usuario también confirmó visualización móvil. No se guardan correos, enlaces, tokens ni contraseñas en evidencias.
- Usuario reportó después «Solicitud no autorizada» al iniciar sesión desde celular tras recuperación; desde computadora sí pudo entrar. También reportó 429 tras varios intentos. No se desactivaron límites ni se borraron registros de seguridad; cooldown puede llegar a 15 minutos.
- [x] Reproducido el fallo de CSRF obsoleto con dos pruebas simuladas que fallaban antes del cambio: reset elimina cookie pero el cliente conserva CSRF; otra pestaña puede revocar la sesión cacheada.
- [x] Cliente descarta CSRF y usuario después de reset exitoso y obtiene token vigente antes de cada login. Backend conserva Origin, cookies y protección CSRF; no se agregaron reintentos automáticos de mutaciones rechazadas.
- [x] Pruebas frontend finales: 12/12 aprobadas (cuatro nuevas de ciclo CSRF), lint y build correctos. Revisión local de publicación: 84 archivos, sin hallazgos en las comprobaciones realizadas. Ninguna prueba nueva utilizó credenciales reales o Supabase.
- [ ] Integrar fix/mobile-login-csrf por PR tras verify y confirmar despliegue Vercel de la corrección.
- [ ] Tras finalizar el cooldown, confirmar login móvil desde navegador normal y recuperación completa. El éxito de escritorio no prueba por sí solo todos los contextos móviles.
- [ ] Antes de cerrar seguridad pública: revisar IP efectiva/proxies y límites en infraestructura real; evitar agrupar clientes por IP del proxy sin aceptar cabeceras falsificables. No se modificó trust proxy durante esta corrección.

## Entrega — 25/11/2026
- [x] Investigación de diez preguntas actualizada con arquitectura real y fuentes oficiales.
- [x] Enlaces públicos comprobados: Vercel /login 200 y Render /health 200.
- [x] Cabeceras CSP/HSTS y otras verificadas en Vercel.
- [x] Corrección CSRF móvil presente en main 4908c04.
- [ ] Repetir login móvil tras despliegue y bloqueo por intentos.
- [ ] Administrador de producción: identificar cuenta correcta; no usar MAIL_FROM como identidad supuesta.
- [ ] Reportes ZAP, SecurityHeaders y SSL Labs; rol mínimo PostgreSQL e IP efectiva de proxy.
- Detalle de evidencias y límites: docs/ENTREGA.md.


## Cierre de evidencias — 26/11/2026
- [x] Login móvil y documentación en main confirmados por el usuario.
- [x] Administrador de producción creado con comando existente; usuario confirmó Usuarios y Eventos.
- [x] Usuario normal de evaluación preparado; credenciales locales ignoradas por Git, no publicadas.
- [x] 18 unitarias backend, 16 resultados integración aislada y 12 pruebas frontend aprobados.
- [x] Tres npm audit con cero vulnerabilidades y reportes guardados.
- [x] HTTP a HTTPS, cookies sin valores, CSRF 403 y admin anónimo 401 verificados.
- [x] SSL Labs READY A+/A; reporte real conservado.
- [x] SecurityHeaders A+ confirmado por usuario (falta captura).
- [x] ZAP 2.17 pasivo ejecutado: 1 alerta media CORS en HTML público, 4 informativas; no escaneo activo.
- [x] Agregados PostgreSQL verifican hashes y sobres de notas, sin contenido privado.
- [x] Informe consolidado con mapa OWASP, criptografía y riesgos; trabajo individual declarado.
- [ ] Adjuntar captura SecurityHeaders y evidencia visual de producción.
- [ ] Entregar credenciales por canal privado y realizar demo de diez minutos con tres ataques.
- [ ] Verificar proxy/IP y rol mínimo runtime; decidir alerta CORS y ampliar baseline si se exige script Docker.
- No se cambió código de aplicación ni se regeneraron llaves. Los pendientes históricos resueltos quedan supersedidos por esta sección.

## Cuaderno 3D — 26/11/2026
- [x] Rediseño frontend: tapa de cuero, lomo, hojas con grosor y animación de páginas.
- [x] Personalización local de tapa, papel, tipografía, escritorio y ambiente; nunca guarda entradas ni secretos en localStorage.
- [x] Fondo con luz, sombras y partículas; controles sin movimiento y soporte prefers-reduced-motion.
- [x] Diseño adaptable, navegación con teclado y gestos; usuario revisó y aprobó la vista local.
- [x] Frontend: 16 pruebas aprobadas, lint y compilación correctos.
- [ ] Publicación en Vercel y verificación del bundle público en esta fase.
- Sin cambios de backend, base de datos, llaves ni dependencias.

