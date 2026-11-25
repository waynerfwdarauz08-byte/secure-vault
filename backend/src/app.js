import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pino from "pino";
import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import { sessions, authenticated } from "./middlewares/session.js";
import { authentication, userDto } from "./services/auth.js";
import { notes } from "./services/notes.js";
import { profile } from "./controllers/profile.js";
import { administration } from "./services/admin.js";
import { cryptography } from "./services/crypto.js";
import { mailer } from "./services/mail.js";
import { audit } from "./services/audit.js";
export const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  redact: [
    "req.headers.cookie",
    "req.headers.authorization",
    "password",
    "token",
    "body",
  ],
});
export function createApp({ db, m, c, sendMail = mailer(c) }) {
  const app = express(),
    crypto = cryptography(c),
    s = sessions(m, c),
    auth = authentication(db, m, c, s, sendMail),
    n = notes(db, m, crypto),
    p = profile(m, crypto),
    a = administration(db, m);
  app.disable("x-powered-by");
  app.set(
    "trust proxy",
    c.TRUSTED_PROXIES
      ? c.TRUSTED_PROXIES.split(",").map((x) => x.trim())
      : false,
  );
  app.use(helmet());
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set({
      "X-Request-Id": req.requestId,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    const start = Date.now();
    res.on("finish", () =>
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          status: res.statusCode,
          duration: Date.now() - start,
        },
        "http",
      ),
    );
    next();
  });
  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: { message: "Demasiadas solicitudes" } },
    }),
  );
  app.use(express.json({ limit: "64kb", strict: true }));
  app.use("/api", s.load, s.csrf);
  app.get("/api/auth/csrf", async (req, res) => {
    if (!req.session) await s.issue(req, res);
    res.json({ csrfToken: req.session.csrf });
  });
  const authLimit = rateLimit({
    windowMs: 900000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { message: "Demasiados intentos. Intentá más tarde" } },
  });
  app.post("/api/auth/register", authLimit, auth.register);
  app.post("/api/auth/login", authLimit, auth.login);
  app.post("/api/auth/forgot-password", authLimit, auth.forgot);
  app.post("/api/auth/reset-password", authLimit, auth.reset);
  app.post("/api/auth/logout", auth.logout);
  app.get("/api/auth/me", authenticated, (req, res) =>
    res.json({ data: userDto(req.user) }),
  );
  app.use("/api/profile", authenticated);
  app.get("/api/profile", p.get);
  app.patch("/api/profile", p.update);
  app.post("/api/profile/reveal-sensitive", p.reveal);
  app.use("/api/notes", authenticated);
  app.get("/api/notes", n.list);
  app.post("/api/notes", n.create);
  app.get("/api/notes/:id", n.get);
  app.patch("/api/notes/:id", n.update);
  app.delete("/api/notes/:id", n.remove);
  app.use("/api/admin", authenticated, a.guard);
  app.get("/api/admin/users", a.users);
  app.patch("/api/admin/users/:id/role", a.role);
  app.patch("/api/admin/users/:id/status", a.status);
  app.get("/api/admin/security-events", a.events);
  app.post("/api/help", authenticated, authLimit, async (req, res) => {
    const { topic } = z
      .strictObject({
        topic: z.enum([
          "passwords",
          "encryption",
          "phishing",
          "sessions",
          "csrf",
        ]),
      })
      .parse(req.body);
    if (!c.AI_API_KEY || !c.AI_MODEL)
      return res
        .status(503)
        .json({ error: { message: "Asistente no configurado" } });
    const response = await fetch(
      c.AI_PROVIDER === "mistral"
        ? "https://api.mistral.ai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: "Bearer " + c.AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: c.AI_MODEL,
          ...(c.AI_PROVIDER === "mistral"
            ? { max_tokens: 350 }
            : { max_completion_tokens: 350 }),
          messages: [
            {
              role: "system",
              content:
                "Explicá seguridad digital en español para principiantes. No solicités datos personales ni del diario. No diagnostiqués emociones.",
            },
            { role: "user", content: "Explicá este tema: " + topic },
          ],
        }),
      },
    );
    if (!response.ok) throw new Error("AI provider unavailable");
    const result = await response.json();
    res.json({
      data: {
        text: z
          .string()
          .max(12000)
          .parse(result.choices?.[0]?.message?.content),
      },
    });
  });
  app.use(async (req, res) => {
    if (req.user) await audit(m, req, "route.denied", "failure");
    res.status(404).json({ error: { message: "Recurso no encontrado" } });
  });
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    let status = 500,
      message = "No pudimos completar la solicitud",
      fields;
    if (err instanceof ZodError) {
      status = 422;
      message = "Revisá los campos indicados";
      fields = err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
    } else if (err.name === "SequelizeUniqueConstraintError") {
      status = 409;
      message = "No se pudo registrar ese correo";
    } else if (err.status >= 400 && err.status < 500) {
      status = err.status;
      message =
        status === 413
          ? "Solicitud demasiado grande"
          : status === 400
            ? "Solicitud inválida"
            : err.message;
    }
    logger[status >= 500 ? "error" : "info"](
      { requestId: req.requestId, status, errorType: err.name },
      "request_error",
    );
    res.status(status).json({
      error: { message, ...(fields ? { fields } : {}) },
      requestId: req.requestId,
    });
  });
  return app;
}
