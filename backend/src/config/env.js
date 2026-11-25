import { z } from "zod";
export function config(source = process.env) {
  const c = z
    .object({
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
      PORT: z.coerce.number().default(3000),
      DATABASE_URL: z.url(),
      DB_TLS: z.enum(["true", "false"]).default("true"),
      DB_CA: z.string().optional(),
      SESSION_SECRET: z.string().min(43),
      DATA_ENCRYPTION_KEYS: z.string(),
      ACTIVE_ENCRYPTION_KEY_ID: z.string().min(1),
      FRONTEND_ORIGIN: z.url(),
      PUBLIC_APP_URL: z.url(),
      TRUSTED_PROXIES: z.string().default(""),
      SMTP_HOST: z.string().optional(),
      SMTP_PORT: z.coerce.number().default(587),
      SMTP_USER: z.string().optional(),
      SMTP_PASS: z.string().optional(),
      MAIL_FROM: z.string().optional(),
      AI_PROVIDER: z.enum(["openai", "mistral"]).default("openai"),
      AI_API_KEY: z.string().optional(),
      AI_MODEL: z.string().optional(),
    })
    .parse(source);
  c.keys = JSON.parse(c.DATA_ENCRYPTION_KEYS);
  if (
    !c.keys[c.ACTIVE_ENCRYPTION_KEY_ID] ||
    Object.values(c.keys).some(
      (k) =>
        typeof k !== "string" ||
        Buffer.from(k, "base64").length !== 32 ||
        Buffer.from(k, "base64").toString("base64") !== k,
    )
  )
    throw new Error("Invalid encryption key configuration");
  if (
    c.NODE_ENV === "production" &&
    (c.DB_TLS !== "true" ||
      !c.PUBLIC_APP_URL.startsWith("https://") ||
      !c.FRONTEND_ORIGIN.startsWith("https://") ||
      !c.SMTP_HOST ||
      !c.MAIL_FROM)
  )
    throw new Error("Production requires TLS, HTTPS and email");
  return c;
}
