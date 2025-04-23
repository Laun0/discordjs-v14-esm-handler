import logger from "../utils/logger.js";

function initializeErrorHandling(client) {
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    if (reason instanceof Error) {
      logger.error(reason.stack);
    }
  });

  process.on("uncaughtException", (error, origin) => {
    logger.error(`Uncaught Exception: ${error.message}`, {
      stack: error.stack,
      origin,
    });

    // process.exit(1);
  });

  process.on("uncaughtExceptionMonitor", (error, origin) => {
    logger.warn(`Uncaught Exception Monitor: ${error.message}`, {
      stack: error.stack,
      origin,
    });
  });

  client.on("warn", (message) => logger.warn(`[D.JS WARN] ${message}`));
  client.on("error", (error) => logger.error("[D.JS ERROR]", error));

  logger.info("Centralized error handlers initialized.");
}

export { initializeErrorHandling };
