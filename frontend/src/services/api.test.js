import { afterEach, beforeEach, expect, it, vi } from "vitest";

const oldToken = "a".repeat(64);
const newToken = "b".repeat(64);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

it("descarta CSRF y usuario tras reset exitoso antes de la siguiente mutación", async () => {
  let current = oldToken;
  const fetchMock = vi.fn(async (url, options) => {
    if (url === "/api/auth/csrf") return json({ csrfToken: current });
    if (options.headers["X-CSRF-Token"] !== current) {
      return json({ error: { message: "Solicitud no autorizada" } }, 403);
    }
    if (url === "/api/auth/reset-password") current = newToken;
    return json({ data: { ok: true } });
  });
  vi.stubGlobal("fetch", fetchMock);
  const { bootstrap, api, onExpired } = await import("./api");
  const expired = vi.fn();
  onExpired(expired);
  await bootstrap();
  await api("/auth/reset-password", {
    method: "POST",
    body: { token: "test-only", password: "test-only" },
  });
  await expect(
    api("/auth/forgot-password", {
      method: "POST",
      body: { email: "unit@example.com" },
    }),
  ).resolves.toEqual({ data: { ok: true } });
  expect(expired).toHaveBeenCalledOnce();
  expect(
    fetchMock.mock.calls.filter(([url]) => url === "/api/auth/csrf"),
  ).toHaveLength(2);
});

it("login renueva CSRF aunque haya uno cacheado de otra pestaña o sesión", async () => {
  let current = oldToken;
  const fetchMock = vi.fn(async (url, options) => {
    if (url === "/api/auth/csrf") return json({ csrfToken: current });
    if (options.headers["X-CSRF-Token"] !== current) {
      return json({ error: { message: "Solicitud no autorizada" } }, 403);
    }
    return json({ data: { id: "unit-user" }, csrfToken: newToken });
  });
  vi.stubGlobal("fetch", fetchMock);
  const { bootstrap, api } = await import("./api");
  await bootstrap();
  current = newToken; // Otra pestaña/restablecimiento invalidó la sesión anterior.
  await expect(
    api("/auth/login", {
      method: "POST",
      body: { email: "unit@example.com", password: "test-only" },
    }),
  ).resolves.toMatchObject({ data: { id: "unit-user" } });
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    "/api/auth/csrf",
    "/api/auth/csrf",
    "/api/auth/login",
  ]);
});

it("un reset fallido conserva la sesión y su CSRF", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(json({ csrfToken: oldToken }))
    .mockResolvedValueOnce(json({ error: { message: "Enlace inválido" } }, 400))
    .mockResolvedValueOnce(json({ data: { ok: true } }));
  vi.stubGlobal("fetch", fetchMock);
  const { bootstrap, api, onExpired } = await import("./api");
  const expired = vi.fn();
  onExpired(expired);
  await bootstrap();
  await expect(
    api("/auth/reset-password", { method: "POST", body: {} }),
  ).rejects.toMatchObject({ status: 400 });
  await api("/profile", { method: "PATCH", body: { name: "Ejemplo" } });
  expect(expired).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock.mock.calls[2][1].headers["X-CSRF-Token"]).toBe(oldToken);
});

it("no reintenta mutaciones rechazadas con 403 ni relaja la seguridad", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(json({ csrfToken: oldToken }))
    .mockResolvedValueOnce(
      json({ error: { message: "Acceso denegado" } }, 403),
    );
  vi.stubGlobal("fetch", fetchMock);
  const { bootstrap, api } = await import("./api");
  await bootstrap();
  await expect(
    api("/admin/users/unit/role", {
      method: "PATCH",
      body: { role: "usuario" },
    }),
  ).rejects.toMatchObject({ status: 403 });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
