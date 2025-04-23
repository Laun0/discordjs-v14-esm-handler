import { SlashCommandBuilder } from "discord.js";

export default {
  name: "ping",
  description: "Checks the bot's latency.",
  aliases: ["pong", "latency"],
  type: "hybrid",
  category: "utility",
  cooldown: {
    duration: 5,
    scope: "user",
  },

  async execute(context) {
    const isSlash = context.isInteraction;

    const sentMsg = await context.reply({
      content: "Pinging...",
      fetchReply: true,
    });

    if (!sentMsg) {
      context.client.logger.warn(
        `Failed to get reply message for ping command.`,
      );
      return;
    }

    const embed = {
      color: 0x0099ff,
      title: "🏓 Pong!",
      fields: [],
      timestamp: new Date().toISOString(),
    };

    if (isSlash && context.interaction?.createdTimestamp) {
      const roundtripLatency =
        sentMsg.createdTimestamp - context.interaction.createdTimestamp;
      embed.fields.push({
        name: "Roundtrip Latency",
        value: `${roundtripLatency}ms`,
        inline: true,
      });
    } else if (!isSlash && context.message?.createdTimestamp) {
      const prefixLatency =
        sentMsg.createdTimestamp - context.message.createdTimestamp;
      embed.fields.push({
        name: "Response Latency",
        value: `${prefixLatency}ms`,
        inline: true,
      });
    }

    embed.fields.push({
      name: "API Latency (WebSocket)",
      value: `${context.client.ws.ping}ms`,
      inline: true,
    });

    if (isSlash) {
      await context.editReply({ content: null, embeds: [embed] });
    } else {
      await sentMsg.edit({ content: null, embeds: [embed] });
    }
  },
};
