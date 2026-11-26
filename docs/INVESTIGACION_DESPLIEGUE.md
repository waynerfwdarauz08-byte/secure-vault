# Investigación de despliegue de SecureVault

Fecha de consulta: 25 de noviembre de 2026, Costa Rica. Alcance previsto: 2–4 páginas al exportar con tipografía 11–12 pt. Síntesis contrastada con documentación oficial; límites gratuitos deben revisarse otra vez al crear las cuentas. La investigación se complementa con el estado real documentado en ENTREGA.md; no sustituye los reportes de seguridad pendientes.

## Resumen ejecutivo

SecureVault maneja información personal, por lo que el despliegue incluye algo más que subir una SPA: requiere persistencia, secretos estables, TLS, cookies de sesión, aislamiento de ambientes y pruebas posteriores. La arquitectura elegida por el proyecto es React estático en Vercel, API Express persistente en Render y PostgreSQL gestionado en Supabase. Esta división permite aprender autenticación propia sin reemplazarla con Supabase Auth. El backend concentra autorización, descifrado, correo y acceso a datos; el navegador solo consume /api.

Los planes gratuitos sirven para demostración, pero sus suspensiones y cuotas impiden prometer disponibilidad continua. Para la evaluación hay que preparar un ensayo, comprobar el arranque tras inactividad y decidir si hace falta un plan pago. El cifrado no protege frente a un servidor comprometido que posee las llaves; son necesarias prácticas operativas, backups y control del acceso a los paneles. La investigación informa decisiones, mientras que los escaneos y capturas de producción siguen pendientes de adjuntar como reportes fechados de los servicios reales.

## 1. PaaS, contenedores y VPS/IaaS

Un PaaS administra despliegue, terminación TLS y ciclo del proceso; reduce administración, con límites de plataforma y menor control. Un contenedor empaqueta proceso y dependencias; necesita igualmente una plataforma o máquina que lo ejecute. Un VPS/IaaS ofrece control del sistema operativo, pero el equipo asume parches, firewall, proxy, TLS, backups y monitoreo. Docker no sustituye esas responsabilidades. El costo debe contemplar tiempo de operación además del precio de cómputo. Para este laboratorio, un proceso Node gestionado reduce trabajo operativo sin ocultar la seguridad de Express. [Render Web Services](https://render.com/docs/web-services)

## 2. Tres plataformas comparadas

| Plataforma y plan | Ejecución y límites | Inactividad | Datos y HTTPS | Regiones / decisión |
| --- | --- | --- | --- | --- |
| Render Free | Web Service Node persistente, 750 horas compartidas por workspace al mes; sin disco persistente free | Suspende tras 15 min | PostgreSQL es producto separado; TLS gestionado | Elegir región de servicio cercana a BD; candidato seleccionado para Express |
| Koyeb Free Instance | Una instancia por organización; 512 MB RAM, 0.1 vCPU, 2 GB disco; no volúmenes | Escala a cero tras una hora | BD gestionada separada; TLS automático en dominios | Free limitado a Frankfurt o Washington D.C.; alternativa para Express |
| Vercel Hobby | Hosting estático y funciones con cuotas; uso personal/no comercial, no proceso Express permanente | SPA estática distribuida; no equivale a un servidor que duerme | Conectar BD externa desde servidor; HTTPS gestionado | Entrega global de SPA; región de funciones según configuración. Seleccionado solo para frontend |

La comparación no trata a Supabase como una plataforma equivalente de hosting Express: aquí es proveedor de PostgreSQL. En Vercel el modelo de funciones tiene restricciones diferentes al de un servidor persistente; por eso no se traslada la API sin adaptar sesiones y conexiones. No se asume que las ofertas gratuitas de BD tengan el mismo ciclo de vida que sus servicios web. [Render Free](https://render.com/docs/free), [regiones Render](https://render.com/docs/regions), [Koyeb instances](https://www.koyeb.com/docs/reference/instances), [Koyeb TLS](https://www.koyeb.com/docs/run-and-scale/domains), [Vercel Hobby](https://vercel.com/docs/plans/hobby)

## 3. Variables y gestores de secretos

Las variables separan configuración del código; un gestor añade control de acceso, almacenamiento protegido y procedimientos de rotación. Un .env local no organiza acceso de equipo, auditoría ni recuperación y puede filtrarse en Git o backups. Guardar DATABASE_URL, llaves y credenciales de correo solo en Render; frontend no necesita secretos. En Vercel, desde agosto de 2026 la documentación distingue Config y Secret: Secret oculta su valor después de guardarlo. Aun así, cualquier variable incorporada al bundle React deja de ser secreta. Respaldar llaves AES fuera de la BD y limitar acceso a paneles. [Vercel Config/Secret](https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types)

## 4. TLS, Let's Encrypt y HSTS

TLS autentica al servidor y protege tráfico de red. Let's Encrypt usa ACME para demostrar control de dominio y automatizar emisión/renovación; el despliegue gestionado puede resolverlo por el usuario. HSTS instruye al navegador a preferir HTTPS después de recibir la política por una conexión segura; no reemplaza el certificado ni su verificación. No habilitar preload o includeSubDomains sin comprobar todos los subdominios. También la conexión API→PostgreSQL requiere TLS verificado: HTTPS del frontend no cifra automáticamente el enlace a BD. [Let's Encrypt](https://letsencrypt.org/how-it-works/), [MDN HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security)

## 5. Proxy inverso y trust proxy

Un proxy recibe peticiones y las reenvía, pudiendo resolver TLS, rutas y límites. Vercel permite rewrites hacia orígenes externos: /api conserva una interfaz del mismo origen para el navegador. En Express, trust proxy cambia cómo se interpretan protocolo e IP. Confiar en cabeceras arbitrarias permite falsificar identidad de red y eludir límites. La configuración debe corresponder a los saltos reales; usar CIDRs verificados, no true o un número copiado. El rewrite está desplegado y el usuario confirmó sesiones reales en escritorio. La renovación CSRF del login móvil fue corregida en main; el usuario confirmó posteriormente que el login móvil funciona. La IP efectiva del proxy requiere validación adicional. [Vercel rewrites](https://vercel.com/docs/routing/rewrites), [Express proxies](https://expressjs.com/en/guide/behind-proxies/)

## 6. PM2/systemd y gestión PaaS

PM2 supervisa procesos Node; systemd administra servicios del sistema. Son útiles en una VM donde el equipo configura arranque/reinicio y logs. En Render esa supervisión pertenece a la plataforma: añadir otro supervisor puede complicar señales y ocultar fallos. Node debe escuchar PORT y 0.0.0.0, cerrar conexiones al recibir SIGTERM y terminar ante estado irrecuperable para permitir un reinicio limpio. Un reinicio no debe perder sesiones ni notas: ambas viven en PostgreSQL. [Render Web Services](https://render.com/docs/web-services)

## 7. CI/CD con GitHub Actions

CI valida el cambio: npm ci para reproducir lockfiles, lint, unitarias, integración con PostgreSQL limpio, build React y npm audit. GitHub documenta servicios de contenedor en runners Linux; el proyecto usa PostgreSQL 17 efímero. CD publica el mismo SHA aprobado. El repositorio ya ejecuta GitHub Actions y main está protegido con el check verify. Render tiene despliegue manual y Vercel está conectado a GitHub. No se afirma que el despliegue automático de Vercel esté condicionado al resultado de CI. Apagar auto-deploy independiente evita publicar antes de pruebas. Branch protection y mínimo permiso completan la revisión. [GitHub PostgreSQL services](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)

## 8. Bases gestionadas y conexión segura

Supabase y Neon ofrecen PostgreSQL gestionado; MongoDB Atlas utiliza otro modelo, no elegido aquí. La aplicación emplea exclusivamente Supabase PostgreSQL con pg/Sequelize. Una conexión directa conviene a procesos persistentes si la red lo admite; Session Pooler es alternativa para IPv4. Pool de aplicación limitado a cinco conexiones. Verificar certificados y hostname, credenciales distintas para DDL y ejecución, esquema securevault no expuesto a Data API y permisos mínimos. RLS no reemplaza ownerId en Express. Separar desarrollo, producción y pruebas reduce daño por errores operativos. [Supabase conexiones](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase TLS](https://supabase.com/docs/guides/platform/ssl-enforcement)

## 9. Desarrollo frente a producción

Local usa Vite proxy, HTTP localhost y correo de desarrollo en archivo ignorado. Producción exige NODE_ENV=production, correo real mediante Brevo HTTPS, cookie Secure y TLS de BD. Deben conservarse llaves estables entre reinicios: generar otra en cada arranque destruiría acceso a datos existentes. Los errores públicos son genéricos y los logs estructurados excluyen URL sensible, cuerpo y credenciales. Migraciones explícitas reemplazan sync(force/alter). Mantener versiones Node LTS compatibles y repetir auditorías al actualizar dependencias. [Node releases](https://nodejs.org/en/about/previous-releases)

## 10. Verificaciones posteriores

Comprobar HTTPS/redirección, cookie host-only/HttpOnly/Secure/SameSite, CSRF y Origin, IP efectiva, IDOR entre dos usuarios y administrador, 429 persistente, correo de recuperación, rutas SPA y persistencia al reiniciar. Ejecutar ZAP baseline solo contra dominio propio, securityheaders (objetivo A) y SSL Labs. Guardar reportes fechados y saneados con SHA. Ninguna cabecera ni un escaneo aislado demuestra seguridad total. Si el proxy falla, documentar el hecho y probar cualquier alternativa antes de cambiar SameSite o CORS. [OWASP Top 10:2025](https://owasp.org/Top10/2025/)

## Plan elegido y riesgos

Supabase desarrollo y producción ya están separados y las migraciones de producción se aplicaron. Render aloja la API y Vercel la SPA con rewrite externo y CSP. El correo usa la API HTTPS de Brevo porque Render Free restringe SMTP. Queda pendiente separar el rol DDL del rol de ejecución y verificar la IP efectiva del proxy. Arquitectura y pasos detallados en ARQUITECTURA.md y DESPLIEGUE.md. Riesgos: suspensión free, dependencia de tres proveedores, entrega SMTP, topología cambiante y pérdida de llave. El 25/11/2026 se verificaron HTTP 200 en https://secure-vault-theta-bay.vercel.app/login y https://secure-vault-wtev.onrender.com/health. Se observaron CSP, HSTS y otras cabeceras defensivas. Actualización del 26/11: ZAP pasivo ejecutado con una alerta media y cuatro informativas; SSL Labs A+/A; SecurityHeaders A+ confirmado manualmente por el usuario. Alcances y evidencias en INFORME_SEGURIDAD.md. Las referencias enlazadas junto a cada afirmación son las fuentes originales consultadas; no sustituyen evidencia del sistema desplegado.


Fuentes de correo en producción: [restricciones SMTP de Render](https://render.com/articles/can-i-send-email-over-smtp-from-render), [API transaccional Brevo](https://developers.brevo.com/docs/send-a-transactional-email).
