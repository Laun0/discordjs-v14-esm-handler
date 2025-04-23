import { Events, InteractionType, PermissionsBitField } from "discord.js";
import logger from "../../utils/logger.js";
import { checkPermissions, checkCooldown } from "../../utils/functions.js";
import { createCommandContext } from "../../utils/commandContext.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const context = await createCommandContext(interaction, [], client);

    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;

      try {
        await command.autocomplete(context);
      } catch (error) {
        logger.error(
          `Error executing autocomplete for command "${interaction.commandName}":`,
          error,
        );
      }
      return;
    }

    if (
      interaction.isChatInputCommand() ||
      interaction.isContextMenuCommand()
    ) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(
          `No command matching interaction "${interaction.commandName}" was found.`,
        );
        try {
          await interaction.reply({
            content: "Sorry, I couldn't find that command!",
            flags: 64,
          });
        } catch (e) {
          logger.error(
            `Failed to reply to unknown interaction ${interaction.commandName}`,
            e,
          );
        }
        return;
      }
      context.commandName = command.name;

      if (
        interaction.isChatInputCommand() &&
        !(command.type === "slash" || command.type === "hybrid")
      ) {
        logger.warn(
          `Received slash command interaction for non-slash/hybrid command: ${command.name}`,
        );
        return interaction.reply({
          content: `Command \`${command.name}\` is not available as a slash command.`,
          flags: 64,
        });
      }
      if (
        interaction.isUserContextMenuCommand() &&
        command.type !== "context-user"
      ) {
        logger.warn(
          `Received user context menu interaction for non-user-context command: ${command.name}`,
        );
        return interaction.reply({
          content: `Command \`${command.name}\` is not a user context menu command.`,
          flags: 64,
        });
      }
      if (
        interaction.isMessageContextMenuCommand() &&
        command.type !== "context-message"
      ) {
        logger.warn(
          `Received message context menu interaction for non-message-context command: ${command.name}`,
        );
        return interaction.reply({
          content: `Command \`${command.name}\` is not a message context menu command.`,
          flags: 64,
        });
      }

      if (command.guildOnly && !interaction.inGuild()) {
        return interaction.reply({
          content: "This command can only be used inside a server.",
          flags: 64,
        });
      }
      if (command.ownerOnly) {
        const ownerIds = process.env.OWNER_IDS?.split(",") || [];
        if (!ownerIds.includes(interaction.user.id)) {
          return interaction.reply({
            content: "This command can only be used by the bot owner.",
            flags: 64,
          });
        }
      }

      if (
        command.botPermissions &&
        command.botPermissions.length > 0 &&
        interaction.inGuild()
      ) {
        const botMember = interaction.guild.members.me;
        if (!botMember) {
          logger.error(
            `Could not get bot member in guild ${interaction.guild.id}`,
          );
          return context.reply({
            content:
              "An internal error occurred trying to check my permissions.",
            flags: 64,
          });
        }
        const missingBotPerms = botMember.permissions.missing(
          command.botPermissions,
        );
        if (missingBotPerms.length > 0) {
          logger.warn(
            `Bot is missing permissions [${missingBotPerms.join(", ")}] for command ${command.name} in guild ${interaction.guildId}, although appPermissions might allow it.`,
          );
        }

        if (!interaction.appPermissions?.has(command.botPermissions)) {
          const missingAppPerms = interaction.appPermissions
            ? interaction.appPermissions.missing(command.botPermissions)
            : command.botPermissions;
          return context.reply({
            content: `I am missing the following permissions to run this command via interaction: ${missingAppPerms.map((p) => `\`${p}\``).join(", ")}`,
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
          `Error executing interaction command "${command.name}" for user ${interaction.user.tag} (ID: ${interaction.user.id}) in guild ${interaction.guild?.name || "DM"} (ID: ${interaction.guildId || "N/A"}):`,
          error,
        );
        await context
          .reply({
            content:
              "An error occurred while executing that command. Please try again later.",
            ephemeral: true,
          })
          .catch((e) =>
            logger.error(
              `Failed to send error reply for interaction ${command.name}`,
              e,
            ),
          );
      }
    } else if (
      interaction.isMessageComponent() ||
      interaction.isModalSubmit()
    ) {
      let component;
      const customId = interaction.customId;

      if (interaction.isButton()) {
        component =
          client.buttons.find((btn, id) => customId.startsWith(id)) ||
          client.buttons.get(customId);
        if (component) context.componentType = "button";
      } else if (interaction.isStringSelectMenu()) {
        component =
          client.selectMenus.find((menu, id) => customId.startsWith(id)) ||
          client.selectMenus.get(customId);
        if (component) context.componentType = "selectMenu";
      } else if (interaction.isModalSubmit()) {
        component =
          client.modals.find((modal, id) => customId.startsWith(id)) ||
          client.modals.get(customId);
        if (component) context.componentType = "modal";
      }

      if (!component) {
        logger.warn(`No component handler found for custom ID: ${customId}`);
        try {
          if (
            interaction.isMessageComponent() &&
            !interaction.replied &&
            !interaction.deferred
          ) {
            await interaction.reply({
              content: "This component seems to be outdated or invalid.",
              flags: 64,
            });
          } else if (interaction.isModalSubmit()) {
            await interaction.reply({
              content: "This modal submission could not be processed.",
              flags: 64,
            });
          }
        } catch (e) {
          logger.error(`Failed to reply to unknown component ${customId}`, e);
        }
        return;
      }
      context.componentCustomId = component.customId;

      try {
        await component.execute(context);
      } catch (error) {
        logger.error(
          `Error executing component "${component.customId}" for user ${interaction.user.tag}:`,
          error,
        );
        await context
          .reply({
            content: "An error occurred while processing this action.",
            flags: 64,
          })
          .catch((e) =>
            logger.error(
              `Failed to send error reply for component ${component.customId}`,
              e,
            ),
          );
      }
    }
  },
};
