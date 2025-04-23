import { ClusterManager } from "discord-hybrid-sharding";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const managerLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp, clusterId }) => {
      const clusterLabel =
        clusterId !== undefined ? ` [Cluster-${clusterId}]` : "";
      return `${timestamp} [Manager]${clusterLabel} [${level}]: ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  managerLogger.error("DISCORD_TOKEN is missing in the environment variables!");
  process.exit(1);
}

const clusterFile = path.join(__dirname, "cluster.js");

const manager = new ClusterManager(clusterFile, {
  totalShards: "auto",
  shardsPerClusters: 2,
  mode: "process",
  token: TOKEN,
});

manager.on("clusterCreate", (cluster) => {
  managerLogger.info(`Launched Cluster ${cluster.id}`);
  cluster.on("message", (message) => {
    if (message._type === "log" && message.log) {
      managerLogger.log({
        level: message.log.level || "info",
        message: message.log.message,
        clusterId: cluster.id,
        ...(message.log.meta || {}),
      });
    }
  });
});

manager.on("debug", (message) => {
  // managerLogger.debug(`[SHARDING_DEBUG] ${message}`);
});

manager
  .spawn({ timeout: -1 })
  .then(() => managerLogger.info("All clusters launched successfully."))
  .catch((err) => managerLogger.error("Failed to launch clusters:", err));
