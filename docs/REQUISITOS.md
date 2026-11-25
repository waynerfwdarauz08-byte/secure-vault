# Matriz de requisitos

Fuente obligatoria: laboratorio páginas 2–9. La presentación aporta RBAC, propiedad, sesiones y CSRF; sus ejemplos OAuth no son requisitos del diario.

- RF01: registro estricto, correo único, Argon2id → services/auth.js; integración registro/rol/hash.
- RF02: sesiones PostgreSQL, regeneración, expiración y revocación → middlewares/session.js; integración login/logout.
- RF03: roles y último administrador → services/admin.js; integración permisos/transacciones.
- RF04: CRUD propietario y límite serializado de 100 → services/notes.js; integración IDOR/concurrencia.
- RF05: teléfono cifrado, máscara y revelado explícito → controllers/profile.js; integración perfil.
- RF06: hash de token, 15 minutos, consumo atómico → services/auth.js; integración recuperación.
- RF07: DTO y paginación de usuarios/eventos → services/admin.js; integración administración.
- RF08: salud mínima → app.js; integración health.
- OWASP A01–A10: docs/SEGURIDAD_OWASP.md.
- Despliegue HTTPS y escaneos: pendientes de credenciales; docs/EVIDENCIAS.md.
- Investigación: docs/INVESTIGACION_DESPLIEGUE.md; seis fuentes oficiales como mínimo.
- Diario visual: tarjetas, calendario, favoritos, editor, perfil; pruebas frontend y revisión visual.

No se considera completado el laboratorio hasta verificar la aplicación pública y adjuntar evidencias reales.

## Estado de entrega local (25/11/2026)
RF01–08 cuentan con implementación y pruebas locales con PostgreSQL real temporal. Fuentes de investigación verificadas y documentación completa en docs. CI y hosting preparados; GitHub Actions no se ejecutó remotamente. El usuario pidió dejar guía sin publicación por falta de cuentas. No hay evidencia de Supabase, SMTP real, cookies de proxy público ni escaneos externos; la aceptación pública del laboratorio queda pendiente.
