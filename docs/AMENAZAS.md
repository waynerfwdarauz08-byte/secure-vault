# STRIDE

Activos: contraseñas, diario, teléfono, sesiones, llaves, tokens y eventos. Fronteras: navegador/internet; Vercel/Render; API/BD; API/correo. Flujo en ARQUITECTURA.md.

- Suplantación: fijación/robo de sesión → aleatoriedad, hash del ID, regeneración, expiración, HttpOnly/Secure y revocación. Integración login/logout.
- Manipulación: alterar o mover ciphertext → AES-GCM con AAD del tipo, propietario e ID. Pruebas unitarias de tag/AAD.
- Repudio: negar cambios administrativos → evento y cambio en misma transacción, requestId generado por servidor.
- Filtración: IDOR, administrador curioso, logs → ownerId en consultas, DTO, máscara y logs con lista permitida. Un operador con llave puede descifrar: riesgo residual.
- Denegación de servicio: fuerza bruta/notas enormes/concurrencia → límites por IP/cuenta, bloqueo persistido, JSON 64 KiB, cuerpo 10 000 caracteres, máximo 100 con lock. Timeouts BD/SMTP/IA.
- Escalada: role/ownerId inyectado y último administrador → esquemas strict, rol público fijo, guard servidor y advisory lock.

Casos verificables: ID ajeno da 404 en GET/PATCH/DELETE incluso para admin; dos creaciones con 99 entradas dan 201/409; dos consumos del token dan solo un éxito; desactivación revoca cookie. Solo atacar recursos propios autorizados.

Riesgos residuales: compromiso de servidor/llaves, XSS por cambios futuros, bloqueo temporal abusivo de cuentas, dependencia del correo y suspensión free. Mitigar con actualizaciones, backups cifrados y monitoreo. No inferir diagnósticos a partir de ánimos.
