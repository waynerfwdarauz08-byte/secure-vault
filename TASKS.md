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

- [ ] Conectar repositorio remoto de GitHub y subir código tras revisar exclusión de secretos; todavía sin commits ni remoto según la última revisión local.
- [ ] Ejecutar GitHub Actions remotamente y verificar comprobaciones/gate de despliegue.
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
- [ ] Registrar primer commit, push y resultado real de GitHub Actions. Sin publicar Render/Vercel ni tocar la base de Supabase.
