import { config } from "./config/env.js";
import { database } from "./config/database.js";
import { models } from "./models/index.js";
import { createApp, logger } from "./app.js";
import { Op } from "sequelize";
let server,
  db,
  cleanup,
  stopping = false;
async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  clearInterval(cleanup);
  const force = setTimeout(() => process.exit(1), 10000);
  force.unref();
  try {
    if (server) await new Promise((r) => server.close(r));
    if (db) await db.close();
    process.exitCode = code;
  } catch {
    process.exitCode = 1;
  }
  clearTimeout(force);
}
try {
  const c = config();
  db = database(c);
  const m = models(db);
  await db.authenticate();
  server = createApp({ db, m, c }).listen(c.PORT, "0.0.0.0", () =>
    logger.info({ port: c.PORT }, "listening"),
  );
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  cleanup = setInterval(
    () =>
      m.Session.destroy({
        where: { expiresAt: { [Op.lt]: new Date() } },
      }).catch(() => {
        logger.error("session_cleanup_failed");
        shutdown(1);
      }),
    60000,
  );
  cleanup.unref();
  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGINT", () => shutdown(0));
  process.on("unhandledRejection", () => {
    logger.fatal("unhandled_rejection");
    shutdown(1);
  });
  process.on("uncaughtException", () => {
    logger.fatal("uncaught_exception");
    shutdown(1);
  });
} catch {
  logger.fatal("startup_failed_check_configuration_and_database");
  await shutdown(1);
}
