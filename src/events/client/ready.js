import { Events } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    client.logger.info(
      `Event Handler: Client ready event received by Cluster ${client.cluster?.id ?? "N/A"}. User: ${client.user?.tag}`,
    );
  },
};
