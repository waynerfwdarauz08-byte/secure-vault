# Entrega de SecureVault

Actualización: 26 de noviembre de 2026, Costa Rica. Trabajo individual.

- Repositorio: https://github.com/waynerfwdarauz08-byte/secure-vault
- Aplicación: https://secure-vault-theta-bay.vercel.app/login
- API: https://secure-vault-wtev.onrender.com/health
- [Diez preguntas con fuentes](INVESTIGACION_DESPLIEGUE.md) y [PDF de investigación](Investigacion_Despliegue_SecureVault.pdf).
- [Informe de seguridad](INFORME_SEGURIDAD.md) y [PDF](Informe_Seguridad_SecureVault.pdf).
- [Reportes reales saneados](evidencias/2026-11-26/).

## Resultado real

Frontend en Vercel, backend en Render y PostgreSQL en Supabase. Desarrollo y producción separados; migraciones aplicadas. Brevo HTTPS para correo; llaves existentes conservadas. El usuario confirmó login móvil, documentación en main y acceso del administrador a Usuarios y Eventos.

El 26/11 se repitieron 18 pruebas unitarias backend, 16 resultados de integración en PostgreSQL temporal y 12 pruebas frontend: todos aprobados. Tres reportes npm audit sin vulnerabilidades. No se ejecutaron suites contra Supabase ni pruebas destructivas en producción.

Verificación pública: HTTP redirige a HTTPS en ambos proveedores; login y salud 200; cookie HttpOnly/Secure/SameSite=Lax/host-only; POST sin CSRF 403; administración sin sesión 401. SSL Labs: A+ y A. SecurityHeaders: A+ informado por el usuario; falta captura porque el acceso automático recibió desafío interactivo.

ZAP 2.17 ejecutó rastreo y análisis pasivo: una alerta media CORS en HTML público y cuatro informativas. La API consultada no devolvió CORS abierto. No se ejecutó script Docker baseline ni escaneo activo. Se conserva el hallazgo.

Administrador y usuario normal de evaluación preparados. Credenciales únicamente en archivo local ignorado por Git: entregar por canal privado. El usuario normal no tiene buzón real y no sirve para probar entrega de correo.

## Pendientes

- Adjuntar captura SecurityHeaders y evidencias visuales saneadas de producción.
- Entregar credenciales en privado y ensayar o grabar demo de diez minutos con tres ataques bloqueados.
- Evidencia de producción de IDOR, SQLi/XSS, recuperación de un solo uso y logs. Esos casos sí están probados en base aislada.
- Verificar IP del proxy, rol mínimo PostgreSQL, persistencia tras reinicio y gate CI/Vercel.
- Resolver o aceptar justificadamente alerta CORS; ejecutar baseline empaquetado si el docente exige ese procedimiento exacto.
- No hay teléfonos cargados en producción; no se presenta una comprobación vacía como evidencia de una fila cifrada.

El informe no declara cumplimiento completo mientras falten las evidencias indicadas. No contiene secretos ni contenido privado.
