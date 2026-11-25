# SecureVault

El esquema PostgreSQL de la aplicación es `securevault`. El esquema `vault` de
Supabase pertenece a la plataforma y no debe modificarse. Esta corrección no
cambia credenciales, llaves ni contenido cifrado.

Tu espacio para escribir y guardar lo que importa. Diario privado en español: React/Vite, Express, Sequelize y PostgreSQL. La entrega pública requiere todavía configurar Supabase, SMTP, Vercel y Render. No hay URLs de producción inventadas.

## Ejecutar en Windows / VS Code

1. Instalá Node.js 24 LTS actualizado. Abrí PowerShell en securevault, dentro del workspace SV.
2. Desde backend ejecutá npm ci. Repetí desde frontend.
3. Desde backend: Copy-Item .env.example .env. Completá DATABASE_URL y TLS siguiendo docs/DESPLIEGUE.md.
4. Generá dos secretos diferentes: node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))". Uno para SESSION_SECRET y otro dentro de DATA_ENCRYPTION_KEYS: {"v1":"BASE64_GENERADO"}. ACTIVE_ENCRYPTION_KEY_ID=v1. Respaldá las llaves en forma segura.
5. Desde backend: npm run migrate, luego npm run admin. El comando pide contraseña oculta; no hay cuentas predeterminadas.
6. Desde backend: npm run dev (puerto 3000). En otra terminal desde frontend: npm run dev. Abrí http://localhost:5173.
7. Creá una cuenta desde la interfaz. El registro público siempre asigna rol usuario.

## Configuración

backend/.env.example enumera todas las variables. Sin secretos en React. El navegador usa /api a través del proxy de Vite o Vercel. No se usa Supabase Auth. En desarrollo con MAIL_TRANSPORT=smtp y sin SMTP_HOST, los mensajes se guardan en backend/.mail/*.json: abrí el último archivo localmente para usar el enlace. Son archivos sensibles ignorados por Git: eliminarlos después de usarlos y nunca incluirlos en evidencias. En producción se exige correo real: Render Free usa MAIL_TRANSPORT=brevo, BREVO_API_KEY y MAIL_FROM (correo del remitente verificado), mediante HTTPS. SMTP sigue disponible para entornos que permitan sus puertos. Nunca poner claves reales en los archivos .env.example.

## Carpetas

frontend/src contiene components, pages, routes, services, context y styles; index.html está en frontend. backend/src contiene config, models, controllers, services, middlewares, validators, utils, app.js y server.js. Migraciones SQL versionadas en backend/migrations; administrador en scripts. docs contiene requisitos, arquitectura, amenazas, API, investigación, despliegue y demostración. tools contiene lectura de fuentes y entorno de pruebas.

## Pruebas

Desde backend: npm run lint y npm test. Para integración: NODE_ENV=test y DATABASE_URL a una base dedicada cuyo nombre termine en _test; npm run test:integration. La suite rechaza otros ambientes.

Alternativa sin PostgreSQL instalado: desde securevault ejecutar npm ci y node tools/test-local.mjs. Usa PostgreSQL 17 real temporal con credenciales aleatorias, fuera de las bases de aplicación. En Windows restringido necesita permiso para iniciar y cerrar procesos. Desde frontend: npm run lint, npm test y npm run build. Ver docs/PRUEBAS.md para resultados y límites reales.

## Despliegue

Seguí docs/DESPLIEGUE.md para Supabase, Vercel y Render. Reemplazá REPLACE_RENDER_HOST en frontend/vercel.json. render.yaml desactiva auto-deploy: publicar manualmente únicamente SHA con CI verde. Desactivar también despliegue automático de Vercel hasta tener un gate equivalente. Migraciones son un paso controlado, no sequelize.sync.

## Privacidad y límites

Argon2id para contraseñas, AES-256-GCM para payload completo y teléfono. El servidor puede descifrar: no es cifrado de extremo a extremo. IDs, propietario, cantidades y timestamps son metadatos visibles. Nombre y correo de cuenta permanecen en texto. Máximo 100 entradas; búsqueda y calendario en memoria, sin almacenamiento privado persistente del navegador. Sin adjuntos, imágenes externas, publicaciones ni HTML arbitrario.

La colección de entradas está acotada a 100 y contiene cuerpos para búsqueda. PATCH reemplaza todos los campos editables; ediciones simultáneas conservan la última escritura. Rate limiting general por proceso; bloqueo de login persistido por cuenta e IP. Antes de escalar hace falta store distribuido. No hay MFA, OAuth, recifrado por lotes ni alertas externas. IA opcional solo recibe un tema enumerado; sin credenciales muestra no configurado.

## Solución de problemas

- Arranque falla: revisar secretos, JSON de llaves y conexión. No se imprimen credenciales.
- TLS falla: revisar hostname y CA; nunca desactivar validación.
- IPv6 no disponible: elegir Session Pooler en Supabase Connect.
- 403: usar localhost:5173, FRONTEND_ORIGIN correcto y renovar CSRF tras perder sesión.
- Cookie Secure ausente: comprobar proxies confiables reales, no copiar trust proxy=true.
- Render free puede dormir; no hay garantía de disponibilidad continua.

Inicializar Git después de revisar .gitignore. No se fabricaron commits ni historial de integrantes. Entregar credenciales al docente por canal privado.

Repositorio: https://github.com/waynerfwdarauz08-byte/secure-vault . Rama principal main, con origin configurado y primer commit publicado. Si tu Git advierte dubious ownership por archivos creados por el sandbox, comprobá que esta carpeta es tu proyecto; podés usar git -c safe.directory=C:/Users/FWD8D/OneDrive/Desktop/SV/securevault status para esa operación, sin cambiar configuración global. No agregar excepciones para repositorios desconocidos.
