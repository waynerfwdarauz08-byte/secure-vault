import readline from "node:readline/promises";
import { Writable } from "node:stream";
import { config } from "../src/config/env.js";
import { database } from "../src/config/database.js";
import { models } from "../src/models/index.js";
import { registration } from "../src/validators/index.js";
import { hashPassword } from "../src/services/crypto.js";
const db = database(config());
const m = models(db);
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk);
    callback();
  },
});
const rl = readline.createInterface({
  input: process.stdin,
  output,
  terminal: true,
});
try {
  const name = await rl.question("Nombre: "),
    email = await rl.question("Correo: ");
  process.stdout.write("Contraseña (oculta): ");
  muted = true;
  const password = await rl.question("");
  muted = false;
  process.stdout.write("\n");
  const input = registration.parse({ name, email, password });
  await db.transaction(async (t) => {
    await db.query("SELECT pg_advisory_xact_lock(736281)", { transaction: t });
    await m.User.create(
      {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: "administrador",
      },
      { transaction: t },
    );
  });
  console.log("Administrador creado");
} catch {
  console.error("No se pudo crear: revisá datos, correo único y conexión");
  process.exitCode = 1;
} finally {
  rl.close();
  await db.close();
}
