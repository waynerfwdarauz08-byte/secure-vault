import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
export function mailer(
  c,
  {
    fetchImpl = globalThis.fetch,
    createTransport = nodemailer.createTransport,
  } = {},
) {
  const useBrevo = c.MAIL_TRANSPORT === "brevo";
  if (useBrevo && (!c.BREVO_API_KEY || !c.MAIL_FROM)) {
    throw new Error("Email configuration unavailable");
  }
  const transport =
    !useBrevo && c.SMTP_HOST
      ? createTransport({
          host: c.SMTP_HOST,
          port: c.SMTP_PORT,
          secure: c.SMTP_PORT === 465,
          requireTLS: true,
          disableFileAccess: true,
          disableUrlAccess: true,
          auth: c.SMTP_USER
            ? { user: c.SMTP_USER, pass: c.SMTP_PASS }
            : undefined,
          connectionTimeout: 10000,
          socketTimeout: 10000,
        })
      : null;
  return async (email, raw) => {
    const link = new URL("/restablecer", c.PUBLIC_APP_URL);
    link.hash = "token=" + raw;
    const message = {
      from: c.MAIL_FROM,
      to: email,
      subject: "Restablecer contraseña de SecureVault",
      text:
        "El enlace vence en 15 minutos y funciona una sola vez: " + link.href,
    };
    if (useBrevo) {
      try {
        const response = await fetchImpl(
          "https://api.brevo.com/v3/smtp/email",
          {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(10000),
            headers: {
              "api-key": c.BREVO_API_KEY,
              accept: "application/json",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              sender: { name: "SecureVault", email: c.MAIL_FROM },
              to: [{ email: message.to }],
              subject: message.subject,
              textContent: message.text,
            }),
          },
        );
        // Brevo acepta el mensaje con 201; la entrega final se verifica aparte.
        // No conservar ni registrar respuesta, destinatario, clave o enlace.
        await response.body?.cancel();
        if (response.status !== 201) throw new Error("Email delivery failed");
      } catch {
        throw new Error("Email delivery failed");
      }
    } else if (transport) await transport.sendMail(message);
    else {
      if (c.NODE_ENV === "production") throw new Error("Email unavailable");
      await fs.mkdir(".mail", { recursive: true });
      await fs.writeFile(
        ".mail/" + randomUUID() + ".json",
        JSON.stringify(message),
        { mode: 0o600 },
      );
    }
  };
}
