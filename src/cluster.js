import {
  ClusterClient as ShardClusterClient,
  getInfo,
} from "discord-hybrid-sharding";
import BotClient from "./structures/BotClient.js";
import "dotenv/config";
import logger from "./utils/logger.js";

const TOKEN = process.env.DISCORD_TOKEN;

const client = new BotClient();
client.cluster = new ShardClusterClient(client);
client.shards = getInfo().TOTAL_SHARDS;
client.shardCount = getInfo().SHARD_COUNT;

client.start(TOKEN).catch((error) => {
  logger.error(
    `Failed to start BotClient in Cluster ${client.cluster?.id ?? "N/A"}:`,
    error,
  );
  process.exit(1);
});

const originalLog = logger.log.bind(logger);
logger.log = (level, message, ...meta) => {
  originalLog(level, message, ...meta);
  if (process.send) {
    process.send({ _type: "log", log: { level, message, meta } });
  }
};

process.on("SIGINT", () => {
  logger.info(
    `Cluster ${client.cluster?.id ?? "N/A"} received SIGINT. Shutting down...`,
  );
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info(
    `Cluster ${client.cluster?.id ?? "N/A"} received SIGTERM. Shutting down...`,
  );
  client.destroy();
  process.exit(0);
});
