import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  cryptography,
  hashPassword,
  verifyPassword,
  digest,
} from "../../src/services/crypto.js";
import { registration, note } from "../../src/validators/index.js";
import { config } from "../../src/config/env.js";
const c = {
    keys: { v1: randomBytes(32).toString("base64") },
    ACTIVE_ENCRYPTION_KEY_ID: "v1",
  },
  crypto = cryptography(c);
test("AES-GCM roundtrip, IV único y AAD propietario", () => {
  const a = crypto.encrypt({ title: "privado" }, "note:owner:id"),
    b = crypto.encrypt({ title: "privado" }, "note:owner:id");
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ciphertext, b.ciphertext);
  assert.deepEqual(crypto.decrypt(a, "note:owner:id"), { title: "privado" });
  assert.throws(() => crypto.decrypt(a, "note:other:id"));
});
test("manipulación de ciphertext, tag, versión y estructura falla", () => {
  const a = crypto.encrypt("privado", "x");
  for (const field of ["ciphertext", "authTag", "iv"]) {
    const bytes = Buffer.from(a[field], "base64");
    bytes[0] ^= 255;
    assert.throws(() =>
      crypto.decrypt({ ...a, [field]: bytes.toString("base64") }, "x"),
    );
  }
  assert.throws(() => crypto.decrypt({ ...a, version: 2 }, "x"));
  assert.throws(() => crypto.decrypt({ ...a, keyId: "unknown" }, "x"));
  assert.throws(() => crypto.decrypt({ ...a, iv: "xx" }, "x"));
});
test("Argon2id parámetros y verificación", async () => {
  const h = await hashPassword("Correcta-Frase123!");
  assert.match(h, /^\$argon2id\$v=19\$m=19456,t=2,p=1/);
  assert.equal(await verifyPassword(h, "Correcta-Frase123!"), true);
  assert.equal(await verifyPassword(h, "incorrecta"), false);
  assert.equal(digest("random").length, 64);
});
test("esquemas estrictos y límites", () => {
  assert.throws(() =>
    registration.parse({
      name: "A",
      email: "a@b.com",
      password: "Correcta-Frase123!",
      role: "administrador",
    }),
  );
  assert.throws(() =>
    note.parse({
      title: "a",
      body: "x".repeat(10001),
      entryDate: "2026-01-01",
    }),
  );
  assert.throws(() =>
    note.parse({ title: "a", body: "", entryDate: "2026-02-31" }),
  );
});
test("configuración falla sin llaves o secretos", () => {
  assert.throws(() => config({}));
});
