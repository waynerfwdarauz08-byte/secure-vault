import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mailer } from "../../src/services/mail.js";
import { config } from "../../src/config/env.js";

// Todas las peticiones y credenciales son simuladas; sin correo ni BD reales.
const settings = {
  NODE_ENV: "production",
  MAIL_TRANSPORT: "brevo",
  BREVO_API_KEY: "simulated-api-key-for-unit-tests",
  MAIL_FROM: "sender@example.com",
  PUBLIC_APP_URL: "https://diary.example.com",
};
const resetToken = "a".repeat(64);
const source = () => ({
  ...settings,
  DATABASE_URL: "postgresql://unit:unit@localhost/securevault_test",
  DB_TLS: "true",
  SESSION_SECRET: randomBytes(48).toString("base64"),
  DATA_ENCRYPTION_KEYS: JSON.stringify({
    v1: randomBytes(32).toString("base64"),
  }),
  ACTIVE_ENCRYPTION_KEY_ID: "v1",
  FRONTEND_ORIGIN: "https://diary.example.com",
});

test("Brevo usa HTTPS fijo, API key, timeout y solo correo de recuperación", async () => {
  let calls = 0;
  const send = mailer(
    { ...settings, SMTP_HOST: "unused.example.com" },
    {
      createTransport: () => assert.fail("No debe utilizar SMTP"),
      fetchImpl: async (url, options) => {
        calls++;
        assert.equal(url, "https://api.brevo.com/v3/smtp/email");
        assert.equal(options.method, "POST");
        assert.equal(options.redirect, "error");
        assert.equal(options.headers["api-key"], settings.BREVO_API_KEY);
        assert.ok(options.signal instanceof AbortSignal);
        assert.equal(options.signal.aborted, false);
        const payload = JSON.parse(options.body);
        assert.deepEqual(Object.keys(payload).sort(), [
          "sender",
          "subject",
          "textContent",
          "to",
        ]);
        assert.deepEqual(payload.sender, {
          name: "SecureVault",
          email: settings.MAIL_FROM,
        });
        assert.deepEqual(payload.to, [{ email: "recipient@example.com" }]);
        assert.ok(
          payload.textContent.includes(
            "https://diary.example.com/restablecer#token=" + resetToken,
          ),
        );
        assert.equal(
          payload.textContent.includes(settings.BREVO_API_KEY),
          false,
        );
        return new Response(JSON.stringify({ messageId: "simulated" }), {
          status: 201,
        });
      },
    },
  );
  await send("recipient@example.com", resetToken);
  assert.equal(calls, 1);
});

test("Brevo rechaza errores y respuestas no aceptadas sin exponer cuerpo ni secretos", async () => {
  for (const status of [200, 401, 403, 429, 500]) {
    const send = mailer(settings, {
      fetchImpl: async () =>
        new Response(settings.BREVO_API_KEY + resetToken, { status }),
    });
    await assert.rejects(send("recipient@example.com", resetToken), (error) => {
      assert.equal(error.message, "Email delivery failed");
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test("Brevo trata errores de red y timeout como fallos genéricos, sin fallback", async () => {
  for (const name of ["Error", "TimeoutError"]) {
    const send = mailer(settings, {
      createTransport: () => assert.fail("No debe usar SMTP como fallback"),
      fetchImpl: async () => {
        const error = new Error(settings.BREVO_API_KEY + resetToken);
        error.name = name;
        throw error;
      },
    });
    await assert.rejects(send("recipient@example.com", resetToken), {
      message: "Email delivery failed",
    });
  }
});

test("Brevo sin clave o remitente falla antes de enviar", () => {
  assert.throws(() => mailer({ ...settings, BREVO_API_KEY: "" }));
  assert.throws(() => mailer({ ...settings, MAIL_FROM: "" }));
});

test("SMTP existente mantiene TLS y envío por Nodemailer", async () => {
  let calls = 0;
  const send = mailer(
    {
      ...settings,
      MAIL_TRANSPORT: "smtp",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: 587,
    },
    {
      fetchImpl: () => assert.fail("No debe llamar API"),
      createTransport: (options) => {
        assert.equal(options.requireTLS, true);
        assert.equal(options.disableFileAccess, true);
        assert.equal(options.disableUrlAccess, true);
        return {
          sendMail: async (message) => {
            calls++;
            assert.equal(message.to, "recipient@example.com");
            assert.ok(message.text.includes(resetToken));
          },
        };
      },
    },
  );
  await send("recipient@example.com", resetToken);
  assert.equal(calls, 1);
});

test("producción sin transporte no escribe correo en archivo", async () => {
  const send = mailer({ ...settings, MAIL_TRANSPORT: "smtp", SMTP_HOST: "" });
  await assert.rejects(send("recipient@example.com", resetToken), {
    message: "Email unavailable",
  });
});

test("configuración de producción acepta Brevo sin credenciales SMTP", () => {
  const c = config(source());
  assert.equal(c.MAIL_TRANSPORT, "brevo");
  assert.equal(c.SMTP_HOST, undefined);
});

test("configuración rechaza Brevo incompleto y remitente inválido", () => {
  for (const override of [
    { BREVO_API_KEY: "" },
    { BREVO_API_KEY: "   " },
    { MAIL_FROM: "" },
    { MAIL_FROM: "invalid" },
  ]) {
    assert.throws(() => config({ ...source(), ...override }));
  }
});

test("Brevo no debilita los requisitos HTTPS y TLS de producción", () => {
  for (const override of [
    { DB_TLS: "false" },
    { PUBLIC_APP_URL: "http://diary.example.com" },
    { FRONTEND_ORIGIN: "http://diary.example.com" },
  ]) {
    assert.throws(() => config({ ...source(), ...override }));
  }
});

test("desarrollo conserva SMTP por defecto sin requerir Brevo", () => {
  const env = { ...source(), NODE_ENV: "development" };
  delete env.MAIL_TRANSPORT;
  delete env.BREVO_API_KEY;
  assert.equal(config(env).MAIL_TRANSPORT, "smtp");
});
