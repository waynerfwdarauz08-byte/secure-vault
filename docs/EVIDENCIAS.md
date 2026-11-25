# Registro de evidencias

## Reales locales

Código de pruebas en backend/tests y frontend/src/pages/diary.test.jsx. PRUEBAS.md registra comandos y resultados observados. Cifrado verificado leyendo filas reales de PostgreSQL temporal desde integración; no son capturas de Supabase. No se incluye contenido sensible ni credenciales.

## A recopilar al desplegar

1. URL pública real de Vercel y backend Render; fecha, SHA y CI verde.
2. Captura de sesión con atributos de cookie (ocultar valor) y CSRF 403.
3. Registro/login/logout y persistencia tras reiniciar backend.
4. Entrada creada/editada, tarjetas/favoritos/calendario; marcar datos demostrativos como ejemplos.
5. Teléfono enmascarado y revelado por dueño, sin revelar teléfonos en informe compartido.
6. SQL Editor de Supabase con hash Argon2id y sobre de ciphertext; ocultar credenciales/contenido.
7. Usuario B/admin reciben 404 para nota de A; registro con role da 422; 429 después de fallos. Bitácora muestra alerta.
8. Recuperación real SMTP; ocultar enlace/token y no capturar buzón personal innecesariamente.
9. Reportes ZAP baseline, securityheaders.com y SSL Labs sobre recursos propios autorizados.
10. Capturas desktop/móvil y recorrido con teclado; pendientes por bloqueo de Computer Use.

Plantilla por evidencia: fecha/hora Costa Rica, ambiente, SHA, comando/acción, resultado esperado, resultado observado, ruta al archivo saneado, responsable. No fabricar calificaciones A, ausencia de hallazgos ni disponibilidad pública. La aceptación del laboratorio permanece pendiente sin estos puntos.
