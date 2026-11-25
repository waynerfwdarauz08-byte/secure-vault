import { z } from "zod";
import { page, uuid } from "../validators/index.js";
import { audit } from "./audit.js";
import { fail } from "../utils/errors.js";
import { userDto } from "./auth.js";
export function administration(db, m) {
  const guard = async (req, res, next) => {
    if (req.user.role !== "administrador") {
      await audit(m, req, "admin.denied", "failure");
      fail(403, "Acceso denegado");
    }
    next();
  };
  async function change(req, res, field) {
    uuid.parse(req.params.id);
    const input = z
      .strictObject(
        field === "role"
          ? { role: z.enum(["usuario", "administrador"]) }
          : { isActive: z.boolean() },
      )
      .parse(req.body);
    await db.transaction(async (t) => {
      await db.query("SELECT pg_advisory_xact_lock(736281)", {
        transaction: t,
      });
      const actor = await m.User.findByPk(req.user.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!actor?.isActive || actor.role !== "administrador")
        fail(403, "Acceso denegado");
      const u = await m.User.findByPk(req.params.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!u) fail(404, "Cuenta no encontrada");
      if (
        u.role === "administrador" &&
        u.isActive &&
        (input.role === "usuario" || input.isActive === false) &&
        (await m.User.count({
          where: { role: "administrador", isActive: true },
          transaction: t,
        })) <= 1
      )
        fail(409, "Debe permanecer un administrador activo");
      await u.update(
        { ...input, authVersion: u.authVersion + 1 },
        { transaction: t },
      );
      await m.Session.destroy({ where: { userId: u.id }, transaction: t });
      await audit(
        m,
        req,
        "user." + field,
        "success",
        { targetType: "user", targetId: u.id },
        t,
      );
    });
    res.json({ data: { ok: true } });
  }
  return {
    guard,
    role: (req, res) => change(req, res, "role"),
    status: (req, res) => change(req, res, "isActive"),
    users: async (req, res) => {
      const p = page.parse(req.query);
      const r = await m.User.findAndCountAll({
        attributes: ["id", "name", "email", "role", "isActive"],
        limit: p.limit,
        offset: (p.page - 1) * p.limit,
        order: [
          ["createdAt", "DESC"],
          ["id", "ASC"],
        ],
      });
      res.json({ data: r.rows.map(userDto), meta: { ...p, total: r.count } });
    },
    events: async (req, res) => {
      const p = page
        .extend({
          eventType: z.string().max(80).optional(),
          outcome: z.enum(["success", "failure"]).optional(),
        })
        .parse(req.query);
      const where = {
        ...(p.eventType ? { eventType: p.eventType } : {}),
        ...(p.outcome ? { outcome: p.outcome } : {}),
      };
      const r = await m.Event.findAndCountAll({
        where,
        limit: p.limit,
        offset: (p.page - 1) * p.limit,
        order: [
          ["createdAt", "DESC"],
          ["id", "ASC"],
        ],
      });
      res.json({
        data: r.rows.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          outcome: e.outcome,
          actorId: e.actorId,
          targetType: e.targetType,
          targetId: e.targetId,
          requestId: e.requestId,
          createdAt: e.createdAt,
        })),
        meta: { page: p.page, limit: p.limit, total: r.count },
      });
    },
  };
}
