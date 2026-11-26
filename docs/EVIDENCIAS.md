# Registro de evidencias

Actualizado: 26/11/2026, Costa Rica. Interpretación y límites en [INFORME_SEGURIDAD.md](INFORME_SEGURIDAD.md).

## Ejecutadas y conservadas

- [Pruebas y confirmaciones](evidencias/2026-11-26/pruebas-resumen.json): 18 unitarias backend, 16 resultados integración aislada y 12 frontend aprobados; login móvil y panel administrador confirmados por el usuario.
- [Auditoría backend](evidencias/2026-11-26/npm-audit-backend.json), [frontend](evidencias/2026-11-26/npm-audit-frontend.json) y [herramientas](evidencias/2026-11-26/npm-audit-tools.json): cero vulnerabilidades.
- [HTTPS, cookies y CSRF](evidencias/2026-11-26/https-cookies-csrf.json): redirecciones 308/301, cabeceras, atributos de cookie sin su valor, CSRF 403 y administrador anónimo 401.
- [SSL Labs](evidencias/2026-11-26/ssllabs-vercel.json): READY, endpoints A+ y A; resultado conservador A.
- [SecurityHeaders](evidencias/2026-11-26/securityheaders-confirmacion.json): A+ comunicado por usuario, no obtenido automáticamente; falta captura/exportación.
- [ZAP pasivo](evidencias/2026-11-26/zap-pasivo.json): 1 alerta media y 4 informativas; dos URLs públicas sin autenticación ni escaneo activo. No es ejecución del script Docker baseline.
- [PostgreSQL agregados](evidencias/2026-11-26/postgresql-agregados.json): administrador activo, prefijos Argon2id y sobres de notas; sin datos privados. Cero teléfonos en producción: comprobación vacía no demuestra una fila real.

## Falta adjuntar o demostrar

1. Captura SecurityHeaders y panel Usuarios/Eventos, ocultando datos personales.
2. Demo de diez minutos con tres ataques bloqueados y entrega privada de cuentas de evaluación.
3. Evidencia de producción para IDOR, SQLi/XSS, recuperación, logs y persistencia tras reinicio. La evidencia automatizada disponible corresponde a base aislada.
4. Verificar proxy/IP, rol mínimo PostgreSQL y gate CI/despliegue.

Cada evidencia nueva debe indicar fecha/hora Costa Rica, ambiente, SHA, acción, resultado esperado, observado y ruta al archivo saneado. Nunca publicar cookies, contraseñas, enlaces de recuperación, llaves o entradas privadas. Las confirmaciones del usuario se identifican como tales.
