import {
  hashPassword,
  verifyPassword,
  token,
  digest,
  pseudonym,
} from "./crypto.js";
import { audit } from "./audit.js";
import { fail } from "../utils/errors.js";
import * as v from "../validators/index.js";
import { z } from "zod";
export const userDto = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.isActive,
});
export function authentication(db, m, c, s, sendMail) {
  const dummy = hashPassword(token());
  async function buckets(req, failed) {
    return db.transaction(async (t) => {
      let allowed = true;
      for (const key of [
        pseudonym("ip:" + req.ip, c.SESSION_SECRET),
        pseudonym("account:" + req.body.email, c.SESSION_SECRET),
      ]) {
        await m.Attempt.findOrCreate({
          where: { key },
          defaults: { windowStart: new Date() },
          transaction: t,
        });
        const a = await m.Attempt.findByPk(key, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (a.blockedUntil > new Date()) allowed = false;
        if (failed) {
          if (Date.now() - a.windowStart > 3600000) {
            a.failures = 0;
            a.windowStart = new Date();
          }
          a.failures++;
          if (a.failures >= 5)
            a.blockedUntil = new Date(
              Date.now() +
                Math.min(900000, 30000 * 2 ** Math.min(a.failures - 5, 5)),
            );
          await a.save({ transaction: t });
          if (a.failures === 5)
            await audit(m, req, "login.alert", "failure", {}, t);
        }
      }
      if (failed) await audit(m, req, "login", "failure", {}, t);
      return allowed;
    });
  }
  return {
    register: async (req, res) => {
      const data = v.registration.parse(req.body);
      const u = await m.User.create({
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role: "usuario",
      });
      await audit(m, { ...req, user: u }, "register");
      res.status(201).json({ data: userDto(u) });
    },
    login: async (req, res) => {
      req.body = v.login.parse(req.body);
      if (!(await buckets(req, false)))
        fail(429, "Demasiados intentos. Intentá más tarde");
      const u = await m.User.findOne({ where: { email: req.body.email } });
      const valid = await verifyPassword(
        u?.passwordHash ?? (await dummy),
        req.body.password,
      );
      if (!valid || !u?.isActive) {
        await buckets(req, true);
        fail(401, "Correo o contraseña incorrectos");
      }
      await m.Attempt.destroy({
        where: { key: pseudonym("account:" + u.email, c.SESSION_SECRET) },
      });
      await s.issue(req, res, u);
      req.user = u;
      await audit(m, req, "login");
      res.json({ data: userDto(u), csrfToken: req.session.csrf });
    },
    logout: async (req, res) => {
      await audit(m, req, "logout");
      if (req.session) await req.session.destroy();
      s.clear(res);
      res.json({ data: { ok: true } });
    },
    forgot: async (req, res) => {
      const { email } = z.strictObject({ email: v.email }).parse(req.body);
      const raw = token();
      let destination;
      await db.transaction(async (t) => {
        const u = await m.User.findOne({
          where: { email, isActive: true },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (u) {
          await m.Reset.destroy({ where: { userId: u.id }, transaction: t });
          await m.Reset.create(
            {
              userId: u.id,
              tokenHash: digest(raw),
              expiresAt: new Date(Date.now() + 900000),
            },
            { transaction: t },
          );
          destination = u.email;
        }
        await audit(m, req, "password.request", "success", {}, t);
      });
      if (destination) {
        try {
          await sendMail(destination, raw);
        } catch {
          await audit(m, req, "password.delivery", "failure");
        }
      }
      res.json({
        data: { message: "Si la cuenta existe, recibirás instrucciones." },
      });
    },
    reset: async (req, res) => {
      const input = z
        .strictObject({
          token: z.string().regex(/^[a-f0-9]{64}$/),
          password: v.password,
        })
        .parse(req.body);
      const hash = await hashPassword(input.password);
      await db.transaction(async (t) => {
        const peek = await m.Reset.findOne({
          where: { tokenHash: digest(input.token) },
          transaction: t,
        });
        if (!peek) fail(400, "Enlace inválido o vencido");
        const u = await m.User.findByPk(peek.userId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        const r = await m.Reset.findByPk(peek.id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!u?.isActive || !r || r.usedAt || r.expiresAt <= new Date())
          fail(400, "Enlace inválido o vencido");
        await r.update({ usedAt: new Date() }, { transaction: t });
        await u.update(
          { passwordHash: hash, authVersion: u.authVersion + 1 },
          { transaction: t },
        );
        await m.Session.destroy({ where: { userId: u.id }, transaction: t });
        await audit(m, { ...req, user: u }, "password.reset", "success", {}, t);
      });
      s.clear(res);
      res.json({ data: { message: "Contraseña actualizada. Iniciá sesión." } });
    },
  };
}
