import { Sequelize } from "sequelize";
export function database(c) {
  const url = new URL(c.DATABASE_URL);
  for (const p of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(p);
  return new Sequelize(url.toString(), {
    dialect: "postgres",
    logging: false,
    pool: { max: 5, min: 0, acquire: 10000, idle: 10000 },
    define: { schema: "securevault" },
    dialectOptions: {
      connectionTimeoutMillis: 10000,
      statement_timeout: 10000,
      ...(c.DB_TLS === "true"
        ? {
            ssl: {
              rejectUnauthorized: true,
              ...(c.DB_CA ? { ca: c.DB_CA.replace(/\\n/g, "\n") } : {}),
            },
          }
        : {}),
    },
  });
}
