import fs from "node:fs/promises";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { database } from "../backend/src/config/database.js";
import { migrate } from "../backend/scripts/migrate.js";

// Solo operaciones de despliegue. No inicia servidor ni utiliza correo o llaves.
export function selectProductionDatabase(production, development) {
  if (production.NODE_ENV !== "production" || production.DB_TLS !== "true") {
    throw new Error("Production mode and verified database TLS are required");
  }
  const target = (value) => {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
      throw new Error("PostgreSQL connection required");
    }
    if (
      !url.password ||
      value.includes("APP_USER:PASSWORD") ||
      value.includes("[YOUR-PASSWORD]")
    ) {
      throw new Error("Database connection is incomplete");
    }
    return [
      url.hostname,
      url.port || "5432",
      url.username,
      url.pathname || "/postgres",
    ].join("|");
  };
  if (target(production.DATABASE_URL) === target(development.DATABASE_URL)) {
    throw new Error(
      "Production and development must have separate database targets",
    );
  }
  return {
    DATABASE_URL: production.DATABASE_URL,
    DB_TLS: "true",
    DB_CA: production.DB_CA,
  };
}

async function inspect(db, transaction) {
  const [rows] = await db.query(
    "SELECT (SELECT count(*)::int FROM pg_catalog.pg_tables WHERE schemaname = 'securevault') AS table_count, to_regclass('securevault.sessions') IS NOT NULL AS sessions_exists, to_regclass('securevault.migrations') IS NOT NULL AS migrations_exists",
    { transaction },
  );
  return rows[0];
}

async function run() {
  let db;
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== "--apply") || args.length > 1)
      throw new Error("Invalid arguments");
    const apply = args.includes("--apply");
    const production = parseEnv(
      await fs.readFile(
        new URL("../backend/.env.production.local", import.meta.url),
        "utf8",
      ),
    );
    const development = parseEnv(
      await fs.readFile(new URL("../backend/.env", import.meta.url), "utf8"),
    );
    db = database(selectProductionDatabase(production, development));
    const before = await db.transaction(async (transaction) => {
      await db.query("SET TRANSACTION READ ONLY", { transaction });
      return inspect(db, transaction);
    });
    console.log(
      JSON.stringify({
        mode: apply ? "apply" : "read-only",
        separateFromDevelopment: true,
        verifiedTls: true,
        ...before,
      }),
    );
    if (apply) {
      if (before.table_count > 0 && !before.migrations_exists) {
        throw new Error(
          "Existing tables without migration ledger require manual review",
        );
      }
      // Mismo runner versionado y transaccional. Sin force, sync, DROP o TRUNCATE.
      await migrate(db);
      const after = await inspect(db);
      if (
        !after.sessions_exists ||
        !after.migrations_exists ||
        after.table_count < 7
      ) {
        throw new Error("Migration verification failed");
      }
      console.log(JSON.stringify({ migrationsCompleted: true, ...after }));
    }
  } catch (error) {
    const code = error?.original?.code || error?.code;
    console.error(
      JSON.stringify({
        ok: false,
        errorCode:
          typeof code === "string" && /^[A-Z0-9_]{3,60}$/.test(code)
            ? code
            : "CONFIG_OR_CONNECTION_ERROR",
      }),
    );
    process.exitCode = 1;
  } finally {
    if (db) {
      try {
        await db.close();
      } catch {
        process.exitCode = 1;
      }
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
