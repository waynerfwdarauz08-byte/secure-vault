# Entrega de SecureVault

Fecha: 25 de noviembre de 2026.

- Repositorio: https://github.com/waynerfwdarauz08-byte/secure-vault
- Aplicación: https://secure-vault-theta-bay.vercel.app/login
- Estado de API: https://secure-vault-wtev.onrender.com/health
- Investigación: [diez preguntas y fuentes](INVESTIGACION_DESPLIEGUE.md).
- Documento para entregar: [PDF de investigación](Investigacion_Despliegue_SecureVault.pdf).

## Resultado real

Frontend React/Vite en Vercel, backend Express en Render y PostgreSQL en Supabase, con ambientes de desarrollo y producción separados. Las migraciones de producción fueron aplicadas; existen siete tablas de aplicación en el esquema securevault. El correo de recuperación usa Brevo por HTTPS. Las llaves de cifrado existentes se conservaron.

Verificación directa del 25/11/2026: /login de Vercel responde HTTP 200 y /health de Render responde HTTP 200 con status ok. Vercel entrega CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy y Cache-Control no-store. Esto confirma accesibilidad y cabeceras, no constituye una auditoría completa.

El usuario confirmó registro, acceso y persistencia del diario en producción, recepción de correo y visualización móvil. En desarrollo confirmó CRUD, logout, persistencia y consultas booleanas de cifrado sin exponer información privada. Pruebas anteriores: 18 unitarias backend, 16 resultados de integración con PostgreSQL aislado y 12 pruebas frontend. No se ejecutaron pruebas automatizadas destructivas contra Supabase.

La corrección de renovación CSRF para login móvil está incluida en main (4908c04). Falta repetir la prueba móvil después del despliegue y del vencimiento del bloqueo por intentos. No se declara resuelto solo por haber fusionado el cambio.

## Pendientes explícitos

- Confirmar login móvil tras el bloqueo, sin repetir intentos consecutivos.
- Preparar administrador de producción con el comando seguro existente; falta identificar la cuenta correcta. No se cambió la contraseña ni se asignaron permisos a una cuenta supuesta.
- Verificar topología de proxies/IP efectiva y separar rol PostgreSQL de migración del rol de ejecución con privilegios mínimos.
- Ejecutar y adjuntar reportes reales de ZAP, SecurityHeaders y SSL Labs. No se atribuye una nota A sin escaneo.
- Completar evidencia visual de demostración y validar recuperación completa con token de un solo uso en producción.

Los documentos describen controles implementados y límites de verificación. No contienen contraseñas, cadenas de conexión, llaves ni contenido privado del diario.
