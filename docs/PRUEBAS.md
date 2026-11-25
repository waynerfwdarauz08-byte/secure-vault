# Pruebas y resultados

## Corrección del esquema para Supabase

La aplicación usa `securevault`, sin tocar el esquema de plataforma `vault`.
Verificación ejecutada con PostgreSQL temporal aislado mediante
`node tools/test-local.mjs`: 15 casos de integración correctos (16 contando la
suite contenedora). La nueva regresión verifica tablas propias en `securevault`,
idempotencia y conservación de propietario, permisos, tabla y dato del esquema
ajeno `vault`. También pasaron las 5 unitarias y lint backend. La primera
ejecución de esta regresión requirió ajustar la consulta de catálogo porque
Sequelize transforma automáticamente la respuesta de su consulta de listado de
tablas; la repetición final pasó completa. No se ejecutaron migraciones ni
pruebas contra Supabase durante la corrección, ni se abrió o modificó el .env.

Los resultados siguientes corresponden a rondas anteriores.

Entorno: Windows, Node 24.13.0, PostgreSQL 17 temporal mediante embedded-postgres. Base aislada securevault_test y credenciales aleatorias. No se accedió a Supabase ni a producción.

Ejecutado durante la implementación:

- Backend npm test: 5/5 unitarias (Argon2id, AES-GCM/AAD, IV único, manipulación, validación y configuración).
- PostgreSQL real: 14 casos de integración más suite contenedora, 15/15 pasan. Migración aplicada y repetida de forma idempotente. Registro/rol/correo único; CSRF/Origin; login; CRUD/ciphertext; IDOR y admin; teléfono; último admin/desactivación; recuperación vencida/usada/concurrente; límite 100 concurrente; SQLi/429/alerta; logout/expiración/error genérico; auditoría sin secretos.
- Frontend: 8/8 pruebas de componentes y formularios (texto XSS, filtros/favoritos, calendario, editor, vacío, login, registro y recuperación).
- Lint backend/frontend y build Vite correctos.
- Auditoría backend tras actualizar Nodemailer y override uuid: 0 vulnerabilidades. Frontend 0 al instalar. Repetir tras cualquier cambio de lockfile.

La primera ejecución encontró una expectativa de recuperación incorrecta (cookie eliminada requiere bootstrap CSRF) y se corrigió antes de repetir exitosamente. La primera compilación en sandbox falló por acceso de esbuild a directorios padre; se ejecutó con permiso y pasó.

Reproducción: backend npm run lint y npm test; frontend npm run lint, npm test, npm run build. Desde raíz npm ci y node tools/test-local.mjs para integración con PostgreSQL temporal. Alternativamente usar servicio PostgreSQL dedicado cuyo nombre termine _test, NODE_ENV=test y npm run test:integration desde backend. Suite rechaza otros nombres/ambientes. CI usa PostgreSQL como servicio, sin embedded-postgres.

Revisión visual: intentada en navegador local, bloqueada porque Computer Use no pudo determinar con suficiente confianza la URL de Edge. No hay capturas visuales verificadas. Pendientes manuales: teclado completo, foco de diálogos, móvil real, contraste de texto secundario, navegación y flujo completo de formularios con navegador.

Pendientes de producción: cookie/proxy/IP, sesiones tras reinicio Render, SMTP real, rutas SPA directas, HTTPS y redirección, ZAP baseline, securityheaders (objetivo A) y SSL Labs. No se atribuyen resultados a esas herramientas sin ejecutarlas.

La ampliación de formularios detectó que la descripción de error cambiaba el nombre accesible del campo. Se separaron label y descripción (aria-describedby) y la suite pasó al repetir. Cambio de rol, expiración por inactividad y persistencia entre instancias también probados. Auditorías finales raíz/backend/frontend: cero vulnerabilidades reportadas.
