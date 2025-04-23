import { EmbedBuilder, PermissionsBitField } from "discord.js";
import GuildConfig from "../../models/GuildConfig.js";
import { getGuildConfig } from "../../utils/functions.js";

export default {
  name: "setprefix",
  description: "Sets a custom command prefix for this server.",
  aliases: ["prefix"],
  type: "hybrid",
  category: "config",
  guildOnly: true,
  permissions: {
    discord: [PermissionsBitField.Flags.ManageGuild],
  },
  options: [
    {
      name: "new_prefix",
      description: "The new prefix to set (1-5 characters).",
      type: 3,
      required: true,
      min_length: 1,
      max_length: 5,
    },
  ],

  async execute(context) {
    const { client, guild, user } = context;

    const newPrefix =
      context.getString("new_prefix", true) ?? context.getString(0);

    if (!newPrefix) {
      return context.reply({
        content: "❌ You need to provide a prefix!",
        ephemeral: true,
      });
    }

    if (newPrefix.length > 5) {
      return context.reply({
        content: "❌ Prefix cannot be longer than 5 characters.",
        ephemeral: true,
      });
    }

    if (/\s/.test(newPrefix)) {
      return context.reply({
        content: "❌ Prefix cannot contain spaces.",
        ephemeral: true,
      });
    }
    if (["/", "@", "#"].includes(newPrefix[0])) {
      return context.reply({
        content: "❌ Prefix cannot start with `/`, `@`, or `#`.",
        ephemeral: true,
      });
    }

    try {
      const updatedConfig = await GuildConfig.findOneAndUpdate(
        { guildId: guild.id },
        { prefix: newPrefix },
        { upsert: true, new: true },
      );

      if (!updatedConfig) {
        throw new Error("Failed to update or create guild configuration.");
      }

      if (context.guildConfig) {
        context.guildConfig.prefix = newPrefix;
      }

      client.logger.info(
        `Prefix updated to '${newPrefix}' for guild ${guild.name} (ID: ${guild.id}) by ${user.tag}`,
      );

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Prefix Updated!")
        .setDescription(
          `The command prefix for this server has been successfully changed to: \`${newPrefix}\``,
        )
        .setFooter({ text: `Changed by: ${user.tag}` })
        .setTimestamp();

      await context.reply({ embeds: [embed] });
    } catch (error) {
      client.logger.error(
        `Failed to update prefix for guild ${guild.id}:`,
        error,
      );
      await context.reply({
        content:
          "❌ An error occurred while trying to update the prefix. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
