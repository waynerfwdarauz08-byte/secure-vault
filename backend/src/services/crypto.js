import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
} from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
export const hashPassword = (p) =>
  argon2.hash(p, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
export const verifyPassword = (h, p) => argon2.verify(h, p);
export const token = () => randomBytes(32).toString("hex");
export const digest = (t) => createHash("sha256").update(t).digest("hex");
export const pseudonym = (value, secret) =>
  createHmac("sha256", secret).update(value).digest("hex");
const b64 = z
  .string()
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
const envelope = z.strictObject({
  version: z.literal(1),
  keyId: z.string().max(100),
  iv: b64,
  authTag: b64,
  ciphertext: b64.max(100000),
});
export function cryptography(c) {
  return {
    encrypt(value, context) {
      const iv = randomBytes(12),
        keyId = c.ACTIVE_ENCRYPTION_KEY_ID;
      const cipher = createCipheriv(
        "aes-256-gcm",
        Buffer.from(c.keys[keyId], "base64"),
        iv,
      );
      cipher.setAAD(Buffer.from(`1:${keyId}:${context}`));
      const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(value), "utf8"),
        cipher.final(),
      ]);
      return {
        version: 1,
        keyId,
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        ciphertext: ciphertext.toString("base64"),
      };
    },
    decrypt(value, context) {
      const p = envelope.parse(value);
      if (!c.keys[p.keyId]) throw new Error("Unknown key");
      const iv = Buffer.from(p.iv, "base64"),
        tag = Buffer.from(p.authTag, "base64");
      if (iv.length !== 12 || tag.length !== 16)
        throw new Error("Invalid envelope");
      const decipher = createDecipheriv(
        "aes-256-gcm",
        Buffer.from(c.keys[p.keyId], "base64"),
        iv,
      );
      decipher.setAAD(Buffer.from(`1:${p.keyId}:${context}`));
      decipher.setAuthTag(tag);
      return JSON.parse(
        Buffer.concat([
          decipher.update(Buffer.from(p.ciphertext, "base64")),
          decipher.final(),
        ]).toString("utf8"),
      );
    },
  };
}
