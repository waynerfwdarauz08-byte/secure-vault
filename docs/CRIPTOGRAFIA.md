# Criptografía

Contraseña: Argon2id, memoria 19456 KiB, timeCost 2, paralelismo 1. Librería genera sal y verifica. Política académica 12–128 caracteres con mayúscula, minúscula, número y símbolo. No modificar ni truncar; permitir pegar/gestores.

Entradas/teléfono: AES-256-GCM, llave 32 bytes, IV aleatorio nuevo 12 bytes, tag 16 bytes. Sobre version=1, keyId, iv, authTag, ciphertext. Base64 solo codifica. AAD vincula versión/keyId/tipo/propietario/registro. Se valida forma, tamaños y versión; manipulación falla sin devolver contenido parcial. Validación también tras descifrar.

Recuperación: randomBytes(32) como hex; guardar SHA-256. Su alta entropía permite hash rápido, a diferencia de contraseñas. Expira en 15 min. Nueva emisión borra anteriores. Usuario y token bloqueados: usedAt, contraseña y revocación se confirman atómicamente.

HMAC-SHA256 pseudonimiza IP/correo como claves AuthAttempt usando secreto de servidor; uso real de integridad/autenticación de identificadores. No es cifrado ni anonimización absoluta, no sustituye Argon2. GCM ya autentica ciphertext.

Llaves y SESSION_SECRET separados, generados una vez con node:crypto. config/env.js rechaza ausencias y tamaños/Base64 incorrectos. Desarrollo usa .env ignorado; producción panel de secretos. Respaldar llaves cifradas y restringir acceso. Perder todas las copias hace irrecuperables los datos: restaurar BD no alcanza.

Rotación diseñada: agregar v2 conservando v1, activar v2 para nuevas escrituras y usar keyId en lectura. Recifrado por lotes reanudable NO implementado. No retirar v1 antes de recifrar/verificar todos los registros y considerar backups. Cambiar secreto de sesión altera pseudónimos de bloqueos.

Backend puede descifrar: no hay cifrado de extremo a extremo. HTTPS protege tránsito. Referencias: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Node crypto](https://nodejs.org/api/crypto.html).
