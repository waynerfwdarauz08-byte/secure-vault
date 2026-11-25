import test from "node:test";
import assert from "node:assert/strict";
import { selectProductionDatabase } from "../../../tools/production-database.mjs";

const development = {
  DATABASE_URL:
    "postgresql://postgres.dev:dev-example@pool.example.com:5432/postgres",
};
const production = {
  NODE_ENV: "production",
  DB_TLS: "true",
  DATABASE_URL:
    "postgresql://postgres.prod:prod-example@pool.example.com:5432/postgres",
  DB_CA: "certificate-example",
};

test("operación de base de producción exige destino distinto y TLS sin depender de web/correo", () => {
  const c = selectProductionDatabase(production, development);
  assert.equal(c.DATABASE_URL, production.DATABASE_URL);
  assert.equal(c.DB_TLS, "true");
  assert.equal(c.DB_CA, production.DB_CA);
  assert.equal(c.SESSION_SECRET, undefined);
  assert.equal(c.BREVO_API_KEY, undefined);
});

test("contraseña distinta no convierte la misma base en un destino separado", () => {
  assert.throws(() =>
    selectProductionDatabase(
      {
        ...production,
        DATABASE_URL: development.DATABASE_URL.replace(
          "dev-example",
          "other-example",
        ),
      },
      development,
    ),
  );
});

test("operación de producción rechaza modo incorrecto, TLS desactivado y URI inválida", () => {
  for (const change of [
    { NODE_ENV: "development" },
    { DB_TLS: "false" },
    { DATABASE_URL: "invalid" },
    { DATABASE_URL: "https://user:password@example.com" },
    { DATABASE_URL: "postgresql://APP_USER:PASSWORD@HOST:5432/postgres" },
    { DATABASE_URL: "postgresql://postgres@host/postgres" },
  ])
    assert.throws(() =>
      selectProductionDatabase({ ...production, ...change }, development),
    );
});
