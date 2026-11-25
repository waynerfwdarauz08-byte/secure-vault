import { randomUUID } from "node:crypto";
import * as v from "../validators/index.js";
import { fail } from "../utils/errors.js";
import { audit } from "./audit.js";
export function notes(db, m, crypto) {
  const dto = (n) => ({
    id: n.id,
    ...v.note.parse(
      crypto.decrypt(n.encryptedPayload, "note:" + n.ownerId + ":" + n.id),
    ),
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  });
  const owned = async (req) => {
    v.uuid.parse(req.params.id);
    const n = await m.Note.findOne({
      where: { id: req.params.id, ownerId: req.user.id },
    });
    if (!n) {
      await audit(m, req, "note.denied", "failure");
      fail(404, "Entrada no encontrada");
    }
    return n;
  };
  return {
    list: async (req, res) => {
      const rows = await m.Note.findAll({
        where: { ownerId: req.user.id },
        limit: 100,
        order: [["createdAt", "DESC"]],
      });
      res.json({
        data: rows.map(dto),
        meta: { limit: 100, total: rows.length },
      });
    },
    get: async (req, res) => res.json({ data: dto(await owned(req)) }),
    create: async (req, res) => {
      const input = v.note.parse(req.body);
      let n;
      await db.transaction(async (t) => {
        const u = await m.User.findByPk(req.user.id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!u?.isActive) fail(401, "Sesión inválida");
        if (
          (await m.Note.count({ where: { ownerId: u.id }, transaction: t })) >=
          100
        )
          fail(409, "Alcanzaste el límite de 100 entradas");
        const id = randomUUID();
        n = await m.Note.create(
          {
            id,
            ownerId: u.id,
            encryptedPayload: crypto.encrypt(input, "note:" + u.id + ":" + id),
          },
          { transaction: t },
        );
      });
      res.status(201).json({ data: dto(n) });
    },
    update: async (req, res) => {
      const input = v.note.parse(req.body),
        n = await owned(req);
      await n.update({
        encryptedPayload: crypto.encrypt(
          input,
          "note:" + req.user.id + ":" + n.id,
        ),
      });
      res.json({ data: dto(n) });
    },
    remove: async (req, res) => {
      await (await owned(req)).destroy();
      res.status(204).end();
    },
  };
}
