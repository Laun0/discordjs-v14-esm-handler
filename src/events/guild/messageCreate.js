import { Events, PermissionsBitField } from "discord.js";
import logger from "../../utils/logger.js";
import {
  getGuildConfig,
  checkPermissions,
  checkCooldown,
} from "../../utils/functions.js";
import { createCommandContext } from "../../utils/commandContext.js";
import GuildConfig from "../../models/GuildConfig.js";

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildConfig = await getGuildConfig(message.guild.id);
    const prefix = guildConfig?.prefix || client.config.defaultPrefix;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command =
      client.commands.get(commandName) ||
      client.commands.get(client.aliases.get(commandName));

    if (!command) return;

    if (
      command.type === "slash" ||
      command.type === "context-user" ||
      command.type === "context-message"
    ) {
      return;
    }

    if (command.guildOnly && !message.guild) {
      return message.reply({
        content: "This command can only be used inside servers.",
      });
    }

    if (command.ownerOnly) {
      const ownerIds = process.env.OWNER_IDS?.split(",") || [];
      if (!ownerIds.includes(message.author.id)) {
        return message.reply({
          content: "This command can only be used by the bot owner.",
        });
      }
    }

    const context = await createCommandContext(
      message,
      args,
      client,
      guildConfig,
    );
    context.commandName = command.name;

    if (command.botPermissions && command.botPermissions.length > 0) {
      const botMember = message.guild.members.me;
      if (!botMember) {
        logger.error(`Could not get bot member in guild ${message.guild.id}`);
        return context.reply({
          content: "An internal error occurred trying to check my permissions.",
          flags: 64,
        });
      }
      const missingBotPerms = botMember
        .permissionsIn(message.channel)
        .missing(command.botPermissions);
      if (missingBotPerms.length > 0) {
        return context.reply({
          content: `I am missing the following permissions to run this command: ${missingBotPerms.map((p) => `\`${p}\``).join(", ")}`,
          flags: 64,
        });
      }
    }
    if (!checkPermissions(context, command.permissions)) {
      return;
    }

    if (!(await checkCooldown(context, command))) {
      return;
    }

    try {
      await command.execute(context);
    } catch (error) {
      logger.error(
        `Error executing prefix command "${command.name}" for user ${message.author.tag} (ID: ${message.author.id}) in guild ${message.guild.name} (ID: ${message.guild.id}):`,
        error,
      );
      await context
        .reply({
          content:
            "An error occurred while executing that command. Please try again later.",
          flags: 64,
        })
        .catch((e) =>
          logger.error(
            `Failed to send error reply for prefix command ${command.name}`,
            e,
          ),
        );
    }
  },
};
