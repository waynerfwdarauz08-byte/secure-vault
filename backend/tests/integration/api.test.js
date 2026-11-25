import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { Op } from "sequelize";
import { randomUUID } from "node:crypto";
import { config } from "../../src/config/env.js";
import { database } from "../../src/config/database.js";
import { models } from "../../src/models/index.js";
import { createApp } from "../../src/app.js";
import { migrate } from "../../scripts/migrate.js";
import { cryptography, digest } from "../../src/services/crypto.js";
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(process.env.DATABASE_URL ?? "http://invalid").pathname.endsWith(
    "_test",
  )
)
  throw new Error("Refusing non-test database");
const c = config(),
  db = database(c),
  m = models(db),
  mail = [];
const app = createApp({
  db,
  m,
  c,
  sendMail: async (email, token) => mail.push({ email, token }),
});
const pass = "Una-Frase-Segura123!";
const payload = {
  title: "Un recuerdo <script>alert(1)</script>",
  body: "Contenido privado",
  entryDate: "2026-11-25",
  mood: "sereno",
  tags: ["vida"],
  isFavorite: false,
  cardColor: "sage",
  coverId: "botanical",
};
function client(targetApp = app) {
  const agent = request.agent(targetApp);
  let csrf;
  return {
    agent,
    async boot() {
      const r = await agent.get("/api/auth/csrf");
      assert.equal(r.status, 200);
      csrf = r.body.csrfToken;
      return r;
    },
    async send(method, url, body) {
      const r = await agent[method](url)
        .set("Origin", c.FRONTEND_ORIGIN)
        .set("X-CSRF-Token", csrf ?? "")
        .send(body);
      if (r.body?.csrfToken) csrf = r.body.csrfToken;
      return r;
    },
  };
}
test("RF01–08 y controles OWASP con PostgreSQL real", async (t) => {
  try {
    await t.test(
      "migraciones usan securevault y conservan vault ajeno intacto",
      async () => {
        // Fixture de plataforma, solo en la base aislada terminada en _test.
        await db.query(
          "CREATE SCHEMA vault; CREATE TABLE vault.platform_marker (id integer PRIMARY KEY); INSERT INTO vault.platform_marker VALUES (1); GRANT USAGE ON SCHEMA vault TO PUBLIC",
        );
        const [before] = await db.query(
          "SELECT nspowner, nspacl::text AS permissions FROM pg_namespace WHERE nspname = 'vault'",
        );
        await migrate(db);
        await migrate(db);
        const [after] = await db.query(
          "SELECT nspowner, nspacl::text AS permissions FROM pg_namespace WHERE nspname = 'vault'",
        );
        assert.deepEqual(after, before);
        const [foreignTables] = await db.query(
          "SELECT tablename AS name FROM pg_catalog.pg_tables WHERE schemaname = 'vault' ORDER BY tablename",
        );
        assert.deepEqual(foreignTables, [{ name: "platform_marker" }]);
        const [marker] = await db.query("SELECT id FROM vault.platform_marker");
        assert.deepEqual(marker, [{ id: 1 }]);
        const [appTables] = await db.query(
          "SELECT tablename AS name FROM pg_catalog.pg_tables WHERE schemaname = 'securevault' ORDER BY tablename",
        );
        assert.deepEqual(
          appTables.map((row) => row.name),
          [
            "auth_attempts",
            "migrations",
            "notes",
            "password_reset_tokens",
            "security_events",
            "sessions",
            "users",
          ],
        );
        for (const model of Object.values(m)) {
          assert.equal(model.getTableName().schema, "securevault");
        }
      },
    );
    const a = client(),
      b = client(),
      admin = client();
    await a.boot();
    await b.boot();
    await admin.boot();
    let aid, bid, adminid, nid;
    await t.test("salud mínima y cabeceras", async () => {
      const r = await request(app).get("/health");
      assert.deepEqual(r.body, { status: "ok" });
      assert.equal(r.headers["x-powered-by"], undefined);
      assert.equal(r.headers["cache-control"], "no-store");
    });
    await t.test("registro, validación, unicidad y escalada", async () => {
      assert.equal(
        (
          await a.send("post", "/api/auth/register", {
            name: "A",
            email: "a@example.com",
            password: "weak",
          })
        ).status,
        422,
      );
      assert.equal(
        (
          await a.send("post", "/api/auth/register", {
            name: "A",
            email: "a@example.com",
            password: pass,
            role: "administrador",
          })
        ).status,
        422,
      );
      for (const [cl, email, name] of [
        [a, "a@example.com", "A"],
        [b, "b@example.com", "B"],
        [admin, "admin@example.com", "Admin"],
      ]) {
        const r = await cl.send("post", "/api/auth/register", {
          name,
          email,
          password: pass,
        });
        assert.equal(r.status, 201);
        if (cl === a) aid = r.body.data.id;
        if (cl === b) bid = r.body.data.id;
        if (cl === admin) adminid = r.body.data.id;
      }
      assert.equal(
        (
          await a.send("post", "/api/auth/register", {
            name: "A",
            email: "A@EXAMPLE.COM",
            password: pass,
          })
        ).status,
        409,
      );
      const u = await m.User.findByPk(aid);
      assert.match(u.passwordHash, /^\$argon2id/);
      await m.User.update(
        { role: "administrador" },
        { where: { id: adminid } },
      );
    });
    await t.test("CSRF y Origin", async () => {
      assert.equal(
        (
          await a.agent
            .post("/api/auth/login")
            .set("Origin", c.FRONTEND_ORIGIN)
            .set("X-CSRF-Token", "é".repeat(64))
            .send({})
        ).status,
        403,
      );
      assert.equal(
        (
          await a.agent
            .post("/api/auth/login")
            .set("Origin", c.FRONTEND_ORIGIN)
            .send({ email: "a@example.com", password: pass })
        ).status,
        403,
      );
      assert.equal(
        (
          await a.agent
            .post("/api/auth/login")
            .set("Origin", "https://evil.invalid")
            .set("X-CSRF-Token", "x")
            .send({})
        ).status,
        403,
      );
    });
    await t.test("login regenera sesión y permite acceso", async () => {
      const before = await a.boot();
      const previousTokens = (await m.Session.findAll()).map((s) => s.id);
      const r = await a.send("post", "/api/auth/login", {
        email: "a@example.com",
        password: pass,
      });
      assert.equal(r.status, 200);
      assert.notEqual(
        r.headers["set-cookie"][0].split(";")[0],
        before.headers["set-cookie"]?.[0]?.split(";")[0],
      );
      assert.equal(
        previousTokens.includes(
          digest(r.headers["set-cookie"][0].split(";")[0].split("=")[1]),
        ),
        false,
      );
      await b.send("post", "/api/auth/login", {
        email: "b@example.com",
        password: pass,
      });
      await admin.send("post", "/api/auth/login", {
        email: "admin@example.com",
        password: pass,
      });
      assert.equal((await a.agent.get("/api/auth/me")).status, 200);
    });
    await t.test("CRUD y cifrado completo", async () => {
      const r = await a.send("post", "/api/notes", payload);
      assert.equal(r.status, 201);
      nid = r.body.data.id;
      const n = await m.Note.findByPk(nid);
      assert.equal(
        JSON.stringify(n.toJSON()).includes("Contenido privado"),
        false,
      );
      assert.equal(JSON.stringify(n.toJSON()).includes("sereno"), false);
      assert.equal(
        (await a.agent.get("/api/notes/" + nid)).body.data.title,
        payload.title,
      );
      assert.equal(
        (
          await a.send("patch", "/api/notes/" + nid, {
            ...payload,
            isFavorite: true,
          })
        ).body.data.isFavorite,
        true,
      );
    });
    await t.test("IDOR lectura edición borrado y administrador", async () => {
      for (const cl of [b, admin]) {
        assert.equal((await cl.agent.get("/api/notes/" + nid)).status, 404);
        assert.equal(
          (await cl.send("patch", "/api/notes/" + nid, payload)).status,
          404,
        );
        assert.equal(
          (await cl.send("delete", "/api/notes/" + nid)).status,
          404,
        );
      }
      assert.equal((await b.agent.get("/api/admin/users")).status, 403);
    });
    await t.test("perfil enmascarado y revelado explícito", async () => {
      const r = await a.send("patch", "/api/profile", {
        phone: "+506 8888 1234",
      });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.phoneMasked, "***-***-1234");
      assert.equal(JSON.stringify(r.body).includes("+506"), false);
      assert.equal(
        (await a.send("post", "/api/profile/reveal-sensitive")).body.data.phone,
        "+506 8888 1234",
      );
      assert.equal(
        JSON.stringify(
          (await admin.agent.get("/api/admin/users")).body,
        ).includes("1234"),
        false,
      );
    });
    await t.test(
      "último administrador y cambios afectan sesiones",
      async () => {
        assert.equal(
          (
            await admin.send("patch", "/api/admin/users/" + adminid + "/role", {
              role: "usuario",
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await admin.send(
              "patch",
              "/api/admin/users/" + adminid + "/status",
              { isActive: false },
            )
          ).status,
          409,
        );
        await admin.send("patch", "/api/admin/users/" + bid + "/status", {
          isActive: false,
        });
        assert.equal((await b.agent.get("/api/auth/me")).status, 401);
        await admin.send("patch", "/api/admin/users/" + bid + "/status", {
          isActive: true,
        });
      },
    );
    await t.test(
      "recuperación genérica, tokens hash, vencido y consumo concurrente",
      async () => {
        const anon = client();
        await anon.boot();
        const absent = await anon.send("post", "/api/auth/forgot-password", {
          email: "nobody@example.com",
        });
        const found = await anon.send("post", "/api/auth/forgot-password", {
          email: "a@example.com",
        });
        assert.deepEqual(absent.body, found.body);
        let raw = mail.at(-1).token;
        assert.ok(await m.Reset.findOne({ where: { tokenHash: digest(raw) } }));
        await m.Reset.update(
          { expiresAt: new Date(0) },
          { where: { userId: aid } },
        );
        assert.equal(
          (
            await anon.send("post", "/api/auth/reset-password", {
              token: raw,
              password: pass,
            })
          ).status,
          400,
        );
        await anon.send("post", "/api/auth/forgot-password", {
          email: "a@example.com",
        });
        raw = mail.at(-1).token;
        const responses = await Promise.all([
          anon.send("post", "/api/auth/reset-password", {
            token: raw,
            password: pass,
          }),
          anon.send("post", "/api/auth/reset-password", {
            token: raw,
            password: pass,
          }),
        ]);
        assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
        assert.equal((await a.agent.get("/api/auth/me")).status, 401);
        await anon.boot();
        assert.equal(
          (
            await anon.send("post", "/api/auth/reset-password", {
              token: raw,
              password: pass,
            })
          ).status,
          400,
        );
      },
    );
    await t.test("límite 100 ante concurrencia", async () => {
      const cl = client();
      await cl.boot();
      await cl.send("post", "/api/auth/login", {
        email: "a@example.com",
        password: pass,
      });
      const crypto = cryptography(c);
      await m.Note.bulkCreate(
        Array.from({ length: 98 }, () => {
          const id = randomUUID();
          return {
            id,
            ownerId: aid,
            encryptedPayload: crypto.encrypt(payload, "note:" + aid + ":" + id),
          };
        }),
      );
      const r = await Promise.all([
        cl.send("post", "/api/notes", payload),
        cl.send("post", "/api/notes", payload),
      ]);
      assert.deepEqual(r.map((x) => x.status).sort(), [201, 409]);
      assert.equal(await m.Note.count({ where: { ownerId: aid } }), 100);
      assert.equal((await cl.send("delete", "/api/notes/" + nid)).status, 204);
    });
    await t.test("SQL injection y bloqueo persistente 429", async () => {
      const cl = client();
      await cl.boot();
      assert.equal(
        (
          await cl.send("post", "/api/auth/login", {
            email: "' OR 1=1 --",
            password: pass,
          })
        ).status,
        422,
      );
      for (let i = 0; i < 5; i++)
        assert.equal(
          (
            await cl.send("post", "/api/auth/login", {
              email: "unknown@example.com",
              password: pass,
            })
          ).status,
          401,
        );
      assert.equal(
        (
          await cl.send("post", "/api/auth/login", {
            email: "unknown@example.com",
            password: pass,
          })
        ).status,
        429,
      );
      assert.ok(
        await m.Attempt.count({
          where: { blockedUntil: { [Op.gt]: new Date() } },
        }),
      );
      assert.ok(await m.Event.count({ where: { eventType: "login.alert" } }));
      await m.Attempt.destroy({ where: {} });
    });
    await t.test(
      "logout, expiración y errores internos genéricos",
      async () => {
        const cl = client();
        await cl.boot();
        await cl.send("post", "/api/auth/login", {
          email: "b@example.com",
          password: pass,
        });
        await cl.send("post", "/api/auth/logout");
        assert.equal((await cl.agent.get("/api/auth/me")).status, 401);
        await cl.boot();
        await cl.send("post", "/api/auth/login", {
          email: "b@example.com",
          password: pass,
        });
        await m.Session.update(
          { absoluteExpiresAt: new Date(0) },
          { where: { userId: bid } },
        );
        assert.equal((await cl.agent.get("/api/auth/me")).status, 401);
        const original = m.User.findByPk;
        m.User.findByPk = async () => {
          throw new Error("secret database detail");
        };
        try {
          const r = await admin.agent.get("/api/auth/me");
          assert.equal(r.status, 500);
          assert.equal(
            JSON.stringify(r.body).includes("secret database detail"),
            false,
          );
        } finally {
          m.User.findByPk = original;
        }
      },
    );
    await t.test(
      "auditoría no contiene secretos ni datos privados",
      async () => {
        const events = (await m.Event.findAll()).map((e) => e.toJSON());
        for (const event of events) {
          assert.deepEqual(Object.keys(event).sort(), [
            "actorId",
            "createdAt",
            "eventType",
            "id",
            "outcome",
            "requestId",
            "targetId",
            "targetType",
          ]);
        }
        const text = JSON.stringify(events);
        for (const secret of [
          pass,
          "Contenido privado",
          "+506 8888 1234",
          mail.at(-1).token,
        ])
          assert.equal(text.includes(secret), false);
      },
    );
    await t.test(
      "rol revoca sesión; persistencia entre instancias e inactividad",
      async () => {
        const nextApp = createApp({ db, m, c, sendMail: async () => {} });
        const cl = client(nextApp);
        await cl.boot();
        let r = await cl.send("post", "/api/auth/login", {
          email: "b@example.com",
          password: pass,
        });
        assert.equal(r.status, 200);
        const cookie = r.headers["set-cookie"][0].split(";")[0];
        assert.equal(
          (await request(app).get("/api/auth/me").set("Cookie", cookie)).status,
          200,
        );
        await admin.send("patch", "/api/admin/users/" + bid + "/role", {
          role: "administrador",
        });
        assert.equal((await cl.agent.get("/api/auth/me")).status, 401);
        await cl.boot();
        r = await cl.send("post", "/api/auth/login", {
          email: "b@example.com",
          password: pass,
        });
        assert.equal(r.body.data.role, "administrador");
        await admin.send("patch", "/api/admin/users/" + bid + "/role", {
          role: "usuario",
        });
        assert.equal((await cl.agent.get("/api/auth/me")).status, 401);
        await cl.boot();
        await cl.send("post", "/api/auth/login", {
          email: "b@example.com",
          password: pass,
        });
        await m.Session.update(
          { expiresAt: new Date(0) },
          { where: { userId: bid } },
        );
        assert.equal((await cl.agent.get("/api/auth/me")).status, 401);
      },
    );
  } finally {
    await db.close();
  }
});
