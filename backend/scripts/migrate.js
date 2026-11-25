import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { config } from "../src/config/env.js";
import { database } from "../src/config/database.js";
export async function migrate(db) {
  await db.transaction(async (t) => {
    await db.query("SELECT pg_advisory_xact_lock(736280)", { transaction: t });
    await db.query(
      "CREATE SCHEMA IF NOT EXISTS securevault; REVOKE ALL ON SCHEMA securevault FROM PUBLIC; CREATE TABLE IF NOT EXISTS securevault.migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
      { transaction: t },
    );
    const [rows] = await db.query("SELECT name FROM securevault.migrations", {
      transaction: t,
    });
    const applied = new Set(rows.map((r) => r.name));
    const dir = new URL("../migrations/", import.meta.url);
    for (const name of (await fs.readdir(dir))
      .filter((n) => /^\d+.*\.sql$/.test(n))
      .sort()) {
      if (!applied.has(name)) {
        await db.query(await fs.readFile(new URL(name, dir), "utf8"), {
          transaction: t,
        });
        await db.query("INSERT INTO securevault.migrations(name) VALUES ($1)", {
          bind: [name],
          transaction: t,
        });
      }
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = database(config());
  try {
    await migrate(db);
    console.log("Migraciones aplicadas");
  } finally {
    await db.close();
  }
}
