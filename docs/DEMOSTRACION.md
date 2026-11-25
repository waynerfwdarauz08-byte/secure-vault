# Demostración de 10 minutos

Preparar cuentas usuario A/B y administrador, con contraseñas entregadas por canal privado. Datos claramente rotulados como ejemplos, sin datos personales reales. Confirmar antes de clase que Render está disponible y CI aprobado. No mostrar .env, cookies, enlaces de recuperación ni llaves.

- 0:00–0:45: URL HTTPS, propósito del diario y arquitectura Vercel/Render/Supabase.
- 0:45–1:45: registro y login; explicar hash Argon2id y cookie opaca.
- 1:45–3:15: crear entrada de ejemplo visual, editar, leer y marcar favorito.
- 3:15–4:00: buscar, filtrar y consultar calendario.
- 4:00–4:45: teléfono enmascarado; revelado solo por dueño, ocultándolo al terminar.
- 4:45–5:30: BD con hash y ciphertext; explicar IV, tag, keyId, pérdida de llave y límites de cifrado de servidor.
- 5:30–6:30: administración de cuentas y eventos; último administrador protegido, admin sin acceso a diario ajeno.
- 6:30–7:30: recuperación real por correo (sin mostrar token), un solo uso y revocación.
- 7:30–9:15: tres ataques bloqueados: IDOR 404, escalada pública 422, fuerza bruta 429; adicional CSRF 403 o SQLi sin resultado.
- 9:15–10:00: CI, auditorías/reportes reales y riesgos residuales. Logout.

Ensayar con cronómetro y conservar resultados reales. Este guion no prueba por sí mismo el despliegue ni la ejecución de ataques.
