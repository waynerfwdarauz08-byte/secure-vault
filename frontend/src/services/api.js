let csrf;
let expired = () => {};
export function onExpired(fn) {
  expired = fn;
}
export function clearSession() {
  csrf = undefined;
}
export async function bootstrap() {
  const r = await fetch("/api/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!r.ok) throw new Error("No pudimos conectar con SecureVault");
  csrf = (await r.json()).csrfToken;
}
export async function api(path, { method = "GET", body } = {}) {
  // El login puede llegar desde una pestaña cuya sesión fue revocada al resetear.
  if (method !== "GET" && (!csrf || path === "/auth/login")) await bootstrap();
  const r = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRF-Token": csrf } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = r.status === 204 ? {} : await r.json();
  if (data.csrfToken) csrf = data.csrfToken;
  if (!r.ok) {
    if (r.status === 401) {
      clearSession();
      expired();
    }
    const e = new Error(
      data.error?.message ?? "No pudimos completar la solicitud",
    );
    e.fields = data.error?.fields;
    e.status = r.status;
    throw e;
  }
  if (method === "POST" && path === "/auth/reset-password") {
    // El backend revoca sesiones y elimina la cookie: descartar también estado local.
    clearSession();
    expired();
  }
  return data;
}
