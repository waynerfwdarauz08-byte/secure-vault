# API REST

Base /api. JSON; respuesta exitosa {data:...}; errores {error:{message,fields?},requestId}. Sin serialización automática de User. Toda respuesta no-store. Fechas ISO. Códigos: 400 solicitud/token inválido; 401 sin sesión; 403 CSRF/rol; 404 recurso ajeno/inexistente; 409 correo/límite/último admin; 422 validación; 429 límites; 500 genérico.

## Sesión y CSRF

Primero GET /api/auth/csrf: devuelve csrfToken y cookie anónima. Todas las mutaciones POST/PATCH/DELETE requieren Origin exacto de FRONTEND_ORIGIN y X-CSRF-Token. Referer es respaldo cuando Origin falta. No guardar tokens en localStorage/sessionStorage. Tras login usar el nuevo csrfToken. Si se pierde sesión, repetir bootstrap antes de volver a iniciar sesión; no reintentar automáticamente una mutación.

- POST /auth/register: {name,email,password}. 201, rol usuario. Campos adicionales rechazados.
- POST /auth/login: {email,password}. 200, data de cuenta y csrfToken nuevo. Credenciales incorrectas dan mensaje genérico.
- POST /auth/logout: invalida store y elimina cookie. 200.
- GET /auth/me: DTO de cuenta autenticada.
- POST /auth/forgot-password: {email}. Mensaje idéntico exista o no la cuenta. No devuelve token.
- POST /auth/reset-password: {token,password}. Un solo uso, 15 min. Invalida sesiones y cookie. Token del enlace se lleva en fragmento, no query, para evitar enviarlo al hosting como URL.

## Perfil

- GET /profile: id,name,email,role,isActive,phoneMasked. Nunca teléfono completo.
- PATCH /profile: name opcional y phone opcional; null borra teléfono. Sin cambio de correo/rol.
- POST /profile/reveal-sensitive: solo dueño, data.phone completo. Acción auditada.

## Entradas

- GET /notes: todas las entradas propias, máximo 100; meta {limit:100,total}. Respuesta acotada sin paginación adicional para búsqueda/calendario. No existe filtro SQL sobre contenido cifrado.
- POST /notes: 201. Payload title (1–120), body (0–10000), entryDate (YYYY-MM-DD real), mood ('','sereno','feliz','cansado','reflexivo'), tags (máximo 5 de 1–24), isFavorite, cardColor ('sage','clay','lavender','paper'), coverId ('botanical','sunrise','waves','none').
- GET /notes/:id: entrada propia.
- PATCH /notes/:id: reemplazo completo del payload editable, mismo esquema que creación. No enviar id, ownerId ni timestamps. Última escritura gana.
- DELETE /notes/:id: 204. Interfaz pide confirmación; borrado permanente.

## Administración

- GET /admin/users?page=1&limit=20: máximo limit=50. DTO sin hashes/teléfonos/entradas.
- PATCH /admin/users/:id/role: {role:'usuario'|'administrador'}.
- PATCH /admin/users/:id/status: {isActive:boolean}.
- GET /admin/security-events?page=1&limit=20&eventType=login&outcome=failure. Filtros opcionales exactos; incluye alertas login.alert y requestId. No hay mutaciones de eventos.

GET /health (fuera de /api) devuelve solo {status:'ok'}; es liveness, no verifica BD. POST /api/help autenticado recibe solo {topic:'passwords'|'encryption'|'phishing'|'sessions'|'csrf'}. 503 si no configurado. Sin texto libre ni datos de diario.
