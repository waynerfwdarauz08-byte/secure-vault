import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
export function mailer(c) {
  const transport = c.SMTP_HOST
    ? nodemailer.createTransport({
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
    if (transport) await transport.sendMail(message);
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
