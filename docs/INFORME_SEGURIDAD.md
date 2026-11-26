# Informe de seguridad de SecureVault

Fecha: 26 de noviembre de 2026, Costa Rica. Trabajo individual, según confirmación del responsable. Alcance: aplicación propia, revisión de controles, pruebas aisladas y verificaciones públicas no destructivas. Código base de main a8112c2. Este informe no representa una certificación.

## 1. Sistema y alcance

- Repositorio: https://github.com/waynerfwdarauz08-byte/secure-vault
- Frontend: https://secure-vault-theta-bay.vercel.app/login
- API: https://secure-vault-wtev.onrender.com/health
- React/Vite en Vercel, Express en Render y PostgreSQL en Supabase. Esquema de aplicación securevault; vault pertenece a Supabase y no se modifica.
- Desarrollo y producción separados. Pruebas automatizadas exclusivamente en PostgreSQL temporal aislado; ninguna suite de pruebas ejecutada contra Supabase.
- Se conservaron las llaves existentes. No se exportaron entradas, teléfonos, contraseñas, tokens, cookies ni cadenas de conexión.

La creación autorizada de cuentas de evaluación es una operación administrativa, no una prueba destructiva. Se preparó un administrador con el comando existente scripts/admin.js y un usuario normal exclusivo para evaluación. Sus credenciales se guardaron únicamente en un archivo local ignorado por Git. La cuenta normal usa un dominio reservado sin buzón real: sirve para login y diario, no para comprobar entrega de correo. El usuario confirmó ingreso al panel y visualización de Usuarios y Eventos de seguridad.

## 2. Resultados ejecutados

Evidencias públicas saneadas: [directorio del 26/11](evidencias/2026-11-26/).

| Comprobación | Resultado real | Alcance o límite |
| --- | --- | --- |
| Backend unitarias | 18 aprobadas, 0 fallos | Incluye cifrado, correo simulado y protección del destino de producción |
| Integración PostgreSQL | 16 resultados aprobados, 0 fallos | 15 casos más prueba contenedora, base temporal aislada |
| Frontend | 12 pruebas aprobadas, 0 fallos | Incluye regresión CSRF y renderizado XSS como texto |
| npm audit | 0 vulnerabilidades en backend, frontend y herramientas | Estado de dependencias consultado en esta fecha, no garantía futura |
| HTTP a HTTPS | Vercel 308; Render 301 | Ambas redirecciones apuntan a HTTPS |
| Disponibilidad | Login y salud HTTP 200; ruta /register HTTP 200 | Muestra puntual; no prueba disponibilidad continua ni persistencia tras reinicio |
| Cookie de sesión | HttpOnly, Secure, SameSite=Lax, host-only, Path=/, prefijo __Host- | Se guardaron solo indicadores booleanos, sin valor de cookie |
| Protección CSRF | POST login sin token devuelve 403 | No se enviaron contraseñas ni se generaron fallos de autenticación |
| Panel sin autenticar | GET /api/admin/users devuelve 401 | Verificación anónima; no demuestra por sí sola RBAC entre usuarios |
| SSL Labs | READY: A+ y A en dos endpoints | Resultado conservador A; reporte JSON del proveedor guardado |
| SecurityHeaders | A+ informado por el usuario | Confirmación manual; el acceso automático recibió desafío Cloudflare. Falta adjuntar captura/exportación |
| ZAP 2.17.0 pasivo | 1 alerta media, 4 informativas; sin altas reportadas | Dos URLs, sin sesión, sin escaneo activo ni navegación autenticada |

La confirmación del usuario sobre login móvil correcto y documentación incorporada a main se registra como evidencia manual, diferenciada de las consultas automáticas.

## 3. Análisis de ZAP y límites

El escaneo ejecutado usó OWASP ZAP 2.17.0 portable con rastreo tradicional y análisis pasivo. Formularios deshabilitados, sin escáner activo, dirigido al login público y al endpoint de salud. Los binarios de ZAP y Java se descargaron desde sus repositorios oficiales y se verificó SHA-256. ZAP escuchó únicamente en 127.0.0.1 y se apagó al terminar. El JSON publicado omite cuerpos, cabeceras con valores de sesión y muestras potencialmente sensibles.

No se ejecutó el script Docker zap-baseline.py: Docker no estaba instalado. Este análisis pasivo es acotado y no debe presentarse como una ejecución del comando empaquetado, ni como una auditoría completa de la SPA. Si el docente exige ese artefacto exacto, queda pendiente ejecutar el baseline oficial.

Alerta 10098, Cross-Domain Misconfiguration, riesgo medio: ZAP observó Access-Control-Allow-Origin: * en el HTML público de /login. Ese HTML es la estructura pública de la SPA. En la respuesta API /api/auth/csrf consultada no se observó esa cabecera. Esto reduce el alcance observado, pero no elimina automáticamente la alerta ni demuestra que todos los endpoints estén bien configurados. Se conserva el hallazgo y queda pendiente decidir si restringir la cabecera del hosting. No se cambió configuración ni código para ocultarlo.

Las alertas 10015 y 10050 piden revisar caché; las consultas directas observaron Cache-Control: no-store. La alerta 10109 identifica una aplicación moderna: el rastreador tradicional no cubre todas las rutas renderizadas por JavaScript. No se encontró evidencia de fuga de datos privados en este recorrido público; esa ausencia no prueba que no existan vulnerabilidades.

Fuentes: [ZAP baseline oficial](https://www.zaproxy.org/docs/docker/baseline-scan/), [ZAP introducción](https://www.zaproxy.org/getting-started/), [SSL Labs](https://www.ssllabs.com/ssltest/).

## 4. OWASP Top 10:2025, mitigación y evidencia

| Categoría | Mitigación implementada | Evidencia y estado |
| --- | --- | --- |
| A01 Control de acceso | Rol en servidor, ownerId en consultas, denegación por defecto | Integración: IDOR GET/PATCH/DELETE y administrador ajeno. API pública anónima de administración: 401. Falta demostración de IDOR con cuentas reales en producción |
| A02 Configuración | Helmet, CSP, HSTS, errores genéricos y NODE_ENV production | JSON HTTPS/cookies; SecurityHeaders A+ comunicado por usuario. Conservar alerta CORS y verificar IP del proxy |
| A03 Cadena de suministro | Lockfiles, npm ci, Dependabot, auditorías y CI | Tres reportes npm audit con cero vulnerabilidades; .github/dependabot.yml y workflow ci.yml |
| A04 Criptografía | Argon2id, AES-256-GCM/AAD, TLS verificado, llaves externas | Unitarias e integración; agregados PostgreSQL: hashes Argon2id y sobre de notas; SSL Labs A/A+. No hay teléfonos en producción para comprobar una fila real |
| A05 Inyección | Sequelize parametrizado, Zod estricto, React como texto, CSP | Integración SQLi y pruebas frontend XSS. Falta demostración manual de ambos en producción |
| A06 Diseño | Modelo STRIDE, separación de ambientes, límites de tamaño y máximo 100 entradas | AMENAZAS.md, ARQUITECTURA.md; integración de concurrencia aprobada |
| A07 Autenticación | Sesión opaca regenerada, expiración, revocación y bloqueo progresivo | Integración 429 y sesión; cookie de producción verificada; login móvil confirmado por usuario. No se hizo fuerza bruta en producción |
| A08 Integridad | AES-GCM autenticado, sin eval/JWT/CDN, CI de pruebas | Pruebas de manipulación; .github/workflows/ci.yml. SRI no aplica a scripts locales. No se verificó gate entre CI y despliegue automático Vercel |
| A09 Registro y alertas | Eventos de acceso, cambios de rol y alerta tras fallos; logs con lista permitida | Integración de auditoría sin secretos. Falta captura saneada del panel real y muestra JSON operativa; alertas externas no implementadas |
| A10 Excepciones | Manejador global genérico, timeouts y cierre controlado | Integración fuerza error local y comprueba respuesta genérica. No se provocaron fallos ni reinicios en producción |

Referencias de implementación: [SEGURIDAD_OWASP.md](SEGURIDAD_OWASP.md), [pruebas](PRUEBAS.md), [OWASP 2025](https://owasp.org/Top10/2025/). Una prueba local no se atribuye a producción.

## 5. Criptografía y base de datos

Contraseñas: Argon2id con memoria 19456 KiB, dos iteraciones y paralelismo uno. Las contraseñas nunca se descifran. Tokens de recuperación: 32 bytes aleatorios, SHA-256 en base, vencimiento de 15 minutos y consumo transaccional de un solo uso.

Entradas y teléfono: AES-256-GCM con llave de 32 bytes, IV aleatorio de 12 bytes y tag de 16 bytes. El sobre contiene versión y keyId; AAD vincula registro y propietario. Base64 es codificación, no el mecanismo de cifrado. El servidor posee llaves y puede descifrar: no es cifrado de extremo a extremo.

La consulta agregada de producción confirmó que todas las contraseñas almacenadas tienen prefijo Argon2id y las cuatro notas existentes presentan los campos del sobre cifrado. No se imprimieron hashes ni ciphertext. Hay cero teléfonos cargados: el indicador agregado de formato no constituye evidencia de un teléfono real cifrado. El comportamiento criptográfico y la protección del teléfono se comprobaron en la base aislada.

Perder todas las copias de la llave hace irrecuperables los datos. Para rotar: agregar v2 conservando v1, activar v2 para nuevas escrituras y leer según keyId. No retirar v1 hasta recifrar y verificar registros y backups. El recifrado masivo reanudable no está implementado ni es requisito básico; está documentado como límite.

La conexión de producción verificó TLS. El rol conectado no es superusuario, pero puede CREATE en securevault: falta separar privilegios de migración y ejecución. No se alteraron permisos remotamente porque el cambio exige coordinar la credencial de ejecución con Render para evitar dejar el servicio sin acceso.

## 6. Riesgos residuales y cierre

Prioridad antes de declarar cumplimiento completo:

1. Panel administrador confirmado por el usuario; entregar cuentas por canal privado. No subir el archivo de credenciales.
2. Adjuntar captura/exportación de SecurityHeaders A+; la nota actual es una confirmación manual del usuario.
3. Ensayar o grabar demostración de diez minutos con tres ataques bloqueados. Hay guion, no una grabación terminada.
4. Mostrar IDOR, SQLi/XSS, recuperación de un solo uso y logs con datos de demostración. No ejecutar suites contra Supabase.
5. Verificar proxy/IP efectiva, permisos mínimos del runtime, persistencia tras reinicio y el gate de CI antes del despliegue.
6. Resolver o aceptar justificadamente la alerta media de CORS. Ampliar cobertura pasiva de la SPA si se requiere baseline completo.

El hosting gratuito puede dormir; mantener la URL accesible durante evaluación requiere comprobar arranque antes de clase. No se añadieron MFA, OAuth ni funcionalidades de bonificación. No se inventaron commits de integrantes: el trabajo fue declarado individual.

## 7. Evidencias conservadas

- evidencias/2026-11-26/npm-audit-backend.json
- evidencias/2026-11-26/npm-audit-frontend.json
- evidencias/2026-11-26/npm-audit-tools.json
- evidencias/2026-11-26/https-cookies-csrf.json
- evidencias/2026-11-26/ssllabs-vercel.json
- evidencias/2026-11-26/zap-pasivo.json
- evidencias/2026-11-26/postgresql-agregados.json
- evidencias/2026-11-26/pruebas-resumen.json
- evidencias/2026-11-26/securityheaders-confirmacion.json

Consulta y verificación: 26/11/2026, Costa Rica. Los resultados describen esta ejecución y sus límites; no garantizan ausencia de vulnerabilidades futuras.
