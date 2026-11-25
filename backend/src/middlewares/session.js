import { timingSafeEqual } from "node:crypto";
import { token, digest } from "../services/crypto.js";
import { fail } from "../utils/errors.js";
export function sessions(m, c) {
  const cookieName = c.NODE_ENV === "production" ? "__Host-sv" : "sv";
  const cookie = {
    httpOnly: true,
    secure: c.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  const issue = async (req, res, user) => {
    if (req.session) await req.session.destroy();
    const raw = token(),
      now = Date.now();
    req.session = await m.Session.create({
      id: digest(raw),
      csrf: token(),
      userId: user?.id,
      authVersion: user?.authVersion,
      expiresAt: new Date(now + 30 * 60000),
      absoluteExpiresAt: new Date(now + 8 * 3600000),
    });
    res.cookie(cookieName, raw, { ...cookie, maxAge: 8 * 3600000 });
    return req.session;
  };
  return {
    issue,
    clear: (res) => res.clearCookie(cookieName, cookie),
    load: async (req, res, next) => {
      const raw = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(cookieName + "="))
        ?.slice(cookieName.length + 1);
      if (raw && /^[a-f0-9]{64}$/.test(raw))
        req.session = await m.Session.findByPk(digest(raw));
      if (
        req.session &&
        (req.session.expiresAt <= new Date() ||
          req.session.absoluteExpiresAt <= new Date())
      ) {
        await req.session.destroy();
        req.session = null;
      }
      if (req.session?.userId) {
        const user = await m.User.findByPk(req.session.userId);
        if (!user?.isActive || user.authVersion !== req.session.authVersion) {
          await req.session.destroy();
          req.session = null;
        } else req.user = user;
      }
      if (req.session)
        await req.session.update({
          expiresAt: new Date(
            Math.min(Date.now() + 30 * 60000, +req.session.absoluteExpiresAt),
          ),
        });
      next();
    },
    csrf: (req, res, next) => {
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
      let origin = req.get("origin");
      if (!origin && req.get("referer")) {
        try {
          origin = new URL(req.get("referer")).origin;
        } catch {
          /* reject below */
        }
      }
      const received = req.get("x-csrf-token") ?? "",
        expected = req.session?.csrf ?? "";
      if (
        !/^[a-f0-9]{64}$/.test(received) ||
        origin !== new URL(c.FRONTEND_ORIGIN).origin ||
        !expected ||
        received.length !== expected.length ||
        !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
      )
        fail(403, "Solicitud no autorizada");
      next();
    },
  };
}
export function authenticated(req, res, next) {
  if (!req.user) fail(401, "Iniciá sesión para continuar");
  next();
}
