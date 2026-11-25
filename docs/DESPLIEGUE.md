# Guía de Supabase, Render y Vercel

La aplicación usa exclusivamente el esquema **securevault**. Supabase utiliza
`vault` para su propia extensión: no borrarlo, cambiarle permisos ni trasladar
sus objetos. La migración inicial anterior falló dentro de una transacción en
Supabase, por lo que se puede repetir tras esta corrección. Si alguna instalación
anterior sí guardó datos de la aplicación en `vault`, detenerse y planificar una
migración de datos específica; esta corrección no los mueve ni los elimina.

Estado: configuración preparada; no hay cuentas, cadenas de conexión ni URLs públicas suministradas. Ejecutar desarrollo y producción en proyectos Supabase distintos. Pruebas usan otra base aislada. Nunca ejecutar integración contra producción.

## 1. Supabase para quien viene de MySQL

1. Crear organización y proyecto de desarrollo en Supabase. Guardar contraseña de BD en gestor de contraseñas. Elegir región cercana a Render. La base PostgreSQL se llama postgres: no hace falta administrar un servidor ni instalar MySQL.
2. En el panel Connect copiar la URI de PostgreSQL. Direct Connection sirve para un proceso persistente si la red admite IPv6 (o el proyecto ofrece IPv4). Session Pooler es alternativa habitual para redes IPv4 y mantiene semántica de sesiones. Evitar Transaction Pooler para estas migraciones/advisory locks sin pruebas específicas.
3. Reemplazar contraseña y codificar caracteres reservados de la URI (por ejemplo @ como %40). Nunca subirla a Git ni pegarla en capturas. Usar host/puerto/usuario del panel; no inventarlos.
4. Descargar la CA si el proyecto requiere su cadena propia. DB_TLS=true. DB_CA admite PEM con saltos de línea reales o secuencias literales \n. El código usa rejectUnauthorized:true y no permite sslmode de URL que debilite TLS. Si falla, corregir host/CA, no desactivar verificación.
5. En VS Code, terminal backend: Copy-Item .env.example .env. Completar DATABASE_URL con credencial de migración, SESSION_SECRET, DATA_ENCRYPTION_KEYS y orígenes localhost. Ejecutar npm ci y npm run migrate.
6. Se crea esquema securevault; no agregarlo a Exposed schemas de Data API. Revocar acceso a anon/authenticated además de PUBLIC. No usar service_role en frontend. Express hace sus propias comprobaciones aunque haya RLS en otros esquemas.
7. Crear rol de aplicación con LOGIN y contraseña aleatoria desde SQL Editor (es un secreto, no incluir en repositorio). Dar USAGE sobre securevault y SELECT/INSERT/UPDATE/DELETE únicamente en users, notes, sessions, password_reset_tokens, auth_attempts. Sobre security_events solo SELECT/INSERT. No dar CREATE, DDL, DELETE/UPDATE de auditoría ni acceso a migrations. El rol de migración conserva DDL y debe usarse solo para despliegues.

Ejemplo de permisos a ejecutar en SQL Editor después de crear el rol vault_app con secreto propio:

```sql
REVOKE ALL ON SCHEMA securevault FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA securevault TO vault_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON securevault.users, securevault.notes,
 securevault.sessions, securevault.password_reset_tokens, securevault.auth_attempts TO vault_app;
GRANT SELECT, INSERT ON securevault.security_events TO vault_app;
```

Con usuario personalizado, conexión directa usa vault_app como usuario; en Session Pooler suele usarse vault_app.PROJECT_REF. Conservá el host/puerto exactos del panel y comprobá el formato de usuario del pooler antes de conectar.

8. Cambiar DATABASE_URL a la credencial de aplicación para npm start/dev. Ejecutar npm run admin con credencial de aplicación (INSERT users) y contraseña interactiva oculta. No usar seeders con credenciales.
9. En SQL Editor comprobar que passwordHash comienza por $argon2id$ y encryptedPayload/sensitivePhoneEncrypted tienen version,keyId,iv,authTag,ciphertext. No descifrar ni mostrar secretos para la captura. PostgreSQL usa comillas dobles para nombres camelCase, por ejemplo SELECT id, "encryptedPayload" FROM securevault.notes LIMIT 1.
10. Crear proyecto independiente de producción; repetir migraciones con llaves y usuarios distintos. Mantener backups de BD y llaves por separado. No copiar datos privados reales a pruebas.

Fuentes: [Conexiones Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [TLS](https://supabase.com/docs/guides/platform/ssl-enforcement).

## 2. Repositorio y CI

Crear repositorio propio y revisar .gitignore antes de git add. El workspace inicial no tenía Git. Subir securevault como raíz para que .github y rootDir coincidan. No fabricar integrantes/historial.

GitHub Actions corre PostgreSQL 17 temporal, migraciones, lint, suites, build y auditoría. Activar branch protection y requerir SecureVault checks. La contraseña del contenedor CI es efímera y no es una credencial de producción. Las llaves CI se generan al ejecutar tools/ci-env.cjs sin imprimirlas.

## 3. Render

Antes del primer arranque, crear las tablas de producción. El endpoint /health
es de liveness: puede responder inicialmente aunque falten tablas, y la limpieza
periódica de sesiones fallará después. No usar ese primer 200 como prueba de
migraciones o persistencia.

Con ambos archivos locales privados configurados, desde la raíz securevault:

```powershell
node tools/production-database.mjs
```

Este paso solo lee metadatos, exige TLS y comprueba un destino diferente al de
desarrollo. Revisado el resultado y autorizada la aplicación, ejecutar:

```powershell
node tools/production-database.mjs --apply
```

Usa el runner versionado existente y verifica las tablas después; no inicia el
servidor ni requiere que Vercel y correo estén listos. No lee contenidos privados
ni modifica archivos .env. Si hay tablas sin registro de migraciones, se detiene
para revisión. Nunca usar la suite automatizada para preparar producción.

Crear Web Service desde repositorio, Root Directory backend, runtime Node 24, Build npm ci, Start npm start, health /health. render.yaml es plantilla. Auto-deploy apagado: publicar manualmente el SHA exacto de CI verde. Port provisto por Render; escucha 0.0.0.0.

En Environment configurar las variables necesarias de backend/.env.example. NODE_ENV=production, DB_TLS=true, DB_CA si hace falta, PUBLIC_APP_URL y FRONTEND_ORIGIN serán la URL HTTPS real de Vercel. Para Render Free usar MAIL_TRANSPORT=brevo, BREVO_API_KEY y MAIL_FROM con el correo del remitente verificado. El servicio envía por la API HTTPS fija de Brevo, con timeout de 10 segundos y sin redirecciones. No requiere SMTP_HOST/PORT/USER/PASS en ese modo. No escribir secretos en render.yaml.

Render Free bloquea los puertos SMTP habituales 25, 465 y 587; configurar Nodemailer con esos puertos no resuelve esa restricción. SMTP se conserva para desarrollo u otros entornos compatibles. La clave de Brevo debe tener acceso restringido a emails transaccionales, sin SMS/WhatsApp/contactos, y almacenarse solo en .env.production.local o el panel de secretos. Verificar vencimiento y renovarla a tiempo. Referencias: [Render SMTP](https://render.com/articles/can-i-send-email-over-smtp-from-render), [Brevo API](https://developers.brevo.com/docs/send-a-transactional-email).

La API recibe únicamente remitente, destinatario y texto de recuperación; no recibe entradas, teléfono ni perfil del diario. Un 201 confirma aceptación, no entrega al buzón: todavía se debe comprobar recepción y recuperación reales. Los errores del proveedor son genéricos y no registran el cuerpo, token, enlace ni clave. No hay fallback silencioso a SMTP/archivo si Brevo falla.

Migraciones: Render Free no ofrece pre-deploy command; usar una terminal local controlada con credencial de migración de producción en backend/.env.production.local. Con su configuración completa y sin variables de entorno de otra base exportadas en la terminal, ejecutar desde backend: node --env-file=.env.production.local scripts/migrate.js. Para administrador de producción: node --env-file=.env.production.local scripts/admin.js, con contraseña oculta ingresada localmente. npm run migrate y npm run admin siguen leyendo .env de desarrollo: no usarlos para seleccionar producción. Volver a la credencial de aplicación antes de arrancar el servidor. En plan compatible se puede usar pre-deploy con secretos apropiados; no correr DDL con usuario de aplicación ni improvisar sync(force/alter). Cambios futuros deben ser compatibles con la versión aún desplegada.

Render Free puede suspenderse tras 15 minutos de inactividad y tiene cuota mensual; no prometer continuidad. Elegir plan adecuado al período de evaluación. Disco efímero: BD y correo no dependen de archivos locales de Render.

## 4. Vercel

Importar mismo repositorio, Root Directory frontend, Install npm ci, Build npm run build, Output dist. Solo variables públicas. Reemplazar REPLACE_RENDER_HOST en vercel.json por host real de Render, sin cambiar orden: rewrite /api antes de fallback SPA. No publicar esta plantilla sin reemplazarlo.

Desactivar auto-deploy desde integración Git (o usar un control de builds equivalente) y publicar manualmente el commit validado por CI. Mantener evidencia del SHA revisado y del deploy. La protección de rama por sí sola no prueba que el proveedor espere el resultado del pipeline.

CSP del HTML se aplica desde Vercel, no solo desde Express. Scripts exclusivamente self, sin unsafe-inline. Recursos/fuentes locales, no-store, no-referrer y HSTS. Recargar /calendario o /entradas/nueva directamente debe servir index.html.

## 5. Proxy, cookies y aceptación pública

No asumir que localhost valida producción. TRUSTED_PROXIES queda vacío por defecto (no confiar en X-Forwarded-*). Establecer CIDRs de los proxies inmediatos reales y documentarlos después de comprobar el recorrido Vercel → Render. Express recorre X-Forwarded-For de derecha a izquierda hasta un salto no confiable. No usar true, listas públicas amplias ni un número de saltos sin garantizar rutas idénticas. Hasta confirmar esto, la cookie Secure puede no emitirse y los límites por IP pueden agrupar clientes: condición que bloquea la aceptación del deploy, no razón para debilitar cookies.

En herramientas del navegador verificar Set-Cookie __Host-sv con HttpOnly, Secure, SameSite=Lax, Path=/ y sin Domain. Comprobar que vuelve a Vercel en /api, persiste en recarga, rota en login, logout revoca y CSRF con Origin ajeno da 403. Probar IP efectiva y que X-Forwarded-For falso no cambia arbitrariamente el bucket. No publicar endpoint de debug para exponer cabeceras.

Si rewrite no conserva flujo de cookie, registrar evidencia y corregir proxy. El acceso directo a Render requeriría CORS exacto, credentials y SameSite=None; Secure, además de probar restricciones de cookies de terceros. Ese fallback NO está implementado ni validado.

Comprobar HTTPS y redirección HTTP de ambos proveedores, IDOR, 429, SMTP real, persistencia tras reiniciar Render y rutas SPA. Ejecutar ZAP baseline únicamente contra dominio propio autorizado; securityheaders.com objetivo A; SSL Labs sin inventar notas. Guardar reportes sin tokens/cookies/datos del diario. Ver EVIDENCIAS.md.

## Asistente educativo opcional
AI_PROVIDER admite openai o mistral; AI_MODEL y AI_API_KEY solo en backend. Destinos HTTPS están predefinidos, no se aceptan URLs del cliente. Timeout de 10 segundos, tema enumerado y salida limitada. Sin credenciales responde 503; no se realizaron llamadas pagadas. Referencias API: https://developers.openai.com/api/reference/resources/chat y https://docs.mistral.ai/api/endpoint/chat.
