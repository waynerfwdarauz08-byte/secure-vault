# OWASP Top 10:2025

Referencia: [edición oficial 2025](https://owasp.org/Top10/2025/). Evidencia local automatizada en backend/tests/integration/api.test.js, backend/tests/unit/crypto.test.js y frontend/src/pages/diary.test.jsx. Resultados públicos del 26/11/2026 y límites en [INFORME_SEGURIDAD.md](INFORME_SEGURIDAD.md).

- A01 Broken Access Control: services/notes.js filtra ownerId; services/admin.js aplica rol y transacción; no hay fetch de URLs arbitrarias. Integración IDOR GET/PATCH/DELETE, admin ajeno y RBAC.
- A02 Security Misconfiguration: app.js Helmet, sin X-Powered-By, errores genéricos; frontend/vercel.json CSP para HTML, HSTS, no-referrer. Integración cabeceras locales; SecurityHeaders A+ confirmado manualmente por el usuario; falta adjuntar captura.
- A03 Software Supply Chain Failures: lockfiles, npm ci, auditorías y Dependabot; override uuid compatible con Sequelize y Nodemailer actualizado. No usar audit fix --force. Auditoría local final y CI; no garantiza ausencia de vulnerabilidades futuras.
- A04 Cryptographic Failures: services/crypto.js Argon2id/AES-GCM/AAD, config valida llaves, database.js verifica TLS. Unitarias de IV/manipulación/hash, integración ciphertext. TLS público verificado por SSL Labs (A+/A); agregados de Supabase verifican prefijos hash y sobres de notas sin exportarlos. No hay teléfonos cargados en producción.
- A05 Injection: Zod strict, Sequelize parametrizado, React como texto; sin dangerouslySetInnerHTML. Integración inyección SQL, prueba frontend de texto script no ejecutable. CSP pública observada en el reporte HTTPS.
- A06 Insecure Design: AMENAZAS.md STRIDE, ARQUITECTURA.md flujo/permisos, bloqueo de fila para límite 100. Integración concurrencia 201/409.
- A07 Authentication Failures: sessions, hash de ID, expiración/regeneración, bloqueo progresivo persistido por IP/cuenta, rate limit general. Integración 429 y revocación. General es por proceso; requiere store compartido al escalar.
- A08 Software or Data Integrity Failures: CI valida antes de publicación manual del SHA aprobado; GCM autentica payload; no eval/JWT/CDN. SRI no aplica porque no hay scripts CDN. El hosting está conectado; falta comprobar gate equivalente entre CI y el despliegue de Vercel.
- A09 Security Logging and Alerting Failures: audit.js persiste login correcto/fallido, logout, denegaciones, recuperación, cambios; login.alert al quinto fallo sin repetir cada intento. Logs JSON solo requestId/método/status/duración/tipo error; no cuerpo, URL/token/cookie. Integración auditoría sin secretos y alerta. No alertas externas.
- A10 Mishandling of Exceptional Conditions: app.js middleware global genérico; DB 10 s, JSON 64 KiB, fetch/SMTP con timeout; server.js cierra ante señales y errores no recuperables. Integración fuerza fallo internamente mediante sustitución controlada, sin endpoint público de fallo. Reinicio PaaS pendiente de evidencia.

Los controles no equivalen a una certificación. Infraestructura, cuentas, TLS real, proxies y escaneos deben verificarse después del despliegue. MFA, Docker, recifrado y alertas externas no se declaran implementados.
