import { parseArguments, getGuildConfig } from "./functions.js";

export async function createCommandContext(
  source,
  prefixArgs = [],
  client,
  guildDbConfig = null,
) {
  const isInteraction = source.constructor.name !== "Message";
  const isPrefix = !isInteraction;

  const context = {
    client: client,
    source: source,
    isInteraction: isInteraction,
    isPrefix: isPrefix,
    isAutocomplete: isInteraction && source.isAutocomplete(),
    isCommand: isInteraction && source.isChatInputCommand(),
    isContextMenu: isInteraction && source.isContextMenuCommand(),
    isButton: isInteraction && source.isButton(),
    isSelectMenu: isInteraction && source.isStringSelectMenu(),
    isModal: isInteraction && source.isModalSubmit(),
    user: isInteraction ? source.user : source.author,
    member: source.member,
    channel: source.channel,
    guild: source.guild,
    createdAt: isInteraction ? source.createdAt : source.createdAt,
    createdTimestamp: isInteraction
      ? source.createdTimestamp
      : source.createdTimestamp,
    interaction: isInteraction ? source : null,
    deferred: isInteraction ? source.deferred : false,
    replied: isInteraction ? source.replied : false,
    message: isPrefix ? source : null,
    content: isPrefix ? source.content : null,
    args: [],
    options:
      isInteraction && (source.isCommand() || source.isAutocomplete())
        ? source.options
        : null,
    guildConfig: guildDbConfig,
    commandName: null,
    targetUser: null,
    targetMessage: null,
  };

  if (context.guild && !context.guildConfig) {
    context.guildConfig = await getGuildConfig(context.guild.id);
  }

  if (isPrefix) {
    const prefix = context.guildConfig?.prefix || client.config.defaultPrefix;
    const rawArgs = source.content.slice(prefix.length).trim().split(/ +/);
    rawArgs.shift();
    context.args = rawArgs;
  } else if (context.isContextMenu) {
    context.targetUser = source.targetUser;
    context.targetMessage = source.targetMessage;
  }

  context.reply = async (options) => {
    const messagePayload =
      typeof options === "string" ? { content: options } : options;
    try {
      if (isInteraction) {
        if (context.deferred || context.replied) {
          return await context.interaction.followUp(messagePayload);
        } else {
          return await context.interaction.reply(messagePayload);
        }
      } else {
        return await context.message.reply(messagePayload);
      }
    } catch (error) {
      client.logger.error(
        `Failed to send reply in context for ${context.commandName || "component"}:`,
        error,
      );
      if (isInteraction && !messagePayload.ephemeral) {
        try {
          await context.interaction.followUp({
            content: "An error occurred while sending the response.",
            ephemeral: true,
          });
        } catch (e) {
          client.logger.error(
            "Failed to send fallback ephemeral error message:",
            e,
          );
        }
      }
      return null;
    }
  };

  context.editReply = async (options) => {
    const messagePayload =
      typeof options === "string" ? { content: options } : options;
    try {
      if (isInteraction) {
        return await context.interaction.editReply(messagePayload);
      } else {
        client.logger.warn(
          "editReply called in a non-interaction context. Ignoring.",
        );
        return null;
      }
    } catch (error) {
      client.logger.error(
        `Failed to edit reply in context for ${context.commandName || "component"}:`,
        error,
      );
      return null;
    }
  };

  context.defer = async (ephemeral = false) => {
    if (isInteraction && !context.deferred && !context.replied) {
      try {
        await context.interaction.deferReply({ ephemeral: ephemeral });
        context.deferred = true;
      } catch (error) {
        client.logger.error(
          `Failed to defer reply for ${context.commandName || "component"}:`,
          error,
        );
      }
    }
  };

  context.getArgument = (identifier, required = false) => {
    if (
      context.isInteraction &&
      context.options &&
      typeof identifier === "string"
    ) {
      return context.options.get(identifier, required)?.value ?? null;
    } else if (
      context.isPrefix &&
      typeof identifier === "number" &&
      context.args.length > identifier
    ) {
      return context.args[identifier];
    }
    return null;
  };

  context.getString = (identifier, required = false) => {
    if (
      context.isInteraction &&
      context.options &&
      typeof identifier === "string"
    ) {
      return context.options.getString(identifier, required) ?? null;
    } else if (
      context.isPrefix &&
      typeof identifier === "number" &&
      context.args.length > identifier
    ) {
      return context.args[identifier];
    }
    return null;
  };

  context.getInteger = (identifier, required = false) => {
    if (
      context.isInteraction &&
      context.options &&
      typeof identifier === "string"
    ) {
      return context.options.getInteger(identifier, required) ?? null;
    } else if (
      context.isPrefix &&
      typeof identifier === "number" &&
      context.args.length > identifier
    ) {
      const val = parseInt(context.args[identifier], 10);
      return !isNaN(val) ? val : null;
    }
    return null;
  };

  context.getNumber = (identifier, required = false) => {
    if (
      context.isInteraction &&
      context.options &&
      typeof identifier === "string"
    ) {
      return context.options.getNumber(identifier, required) ?? null;
    } else if (
      context.isPrefix &&
      typeof identifier === "number" &&
      context.args.length > identifier
    ) {
      const val = parseFloat(context.args[identifier]);
      return !isNaN(val) ? val : null;
    }
    return null;
  };

  context.getBoolean = (identifier, required = false) => {
    if (
      context.isInteraction &&
      context.options &&
      typeof identifier === "string"
    ) {
      return context.options.getBoolean(identifier, required) ?? null;
    } else if (
      context.isPrefix &&
      typeof identifier === "number" &&
      context.args.length > identifier
    ) {
      const val = context.args[identifier]?.toLowerCase();
      if (["true", "yes", "1", "on"].includes(val)) return true;
      if (["false", "no", "0", "off"].includes(val)) return false;
      return null;
    }
    return null;
  };

  context.getUser = (identifier, required = false) =>
    context.isInteraction && context.options && typeof identifier === "string"
      ? context.options.getUser(identifier, required)
      : null;
  context.getMember = (identifier, required = false) =>
    context.isInteraction && context.options && typeof identifier === "string"
      ? context.options.getMember(identifier, required)
      : null;
  context.getRole = (identifier, required = false) =>
    context.isInteraction && context.options && typeof identifier === "string"
      ? context.options.getRole(identifier, required)
      : null;
  context.getChannel = (identifier, required = false) =>
    context.isInteraction && context.options && typeof identifier === "string"
      ? context.options.getChannel(identifier, required)
      : null;
  context.getAttachment = (identifier, required = false) =>
    context.isInteraction && context.options && typeof identifier === "string"
      ? context.options.getAttachment(identifier, required)
      : null;
  context.getMentionable = (identifier, required = false) =>
    context.isInteraction && context.options && typeof identifier === "string"
      ? context.options.getMentionable(identifier, required)
      : null;

  context.getArgumentsJoined = (startIndex = 0) => {
    if (
      context.isPrefix &&
      Array.isArray(context.args) &&
      context.args.length > startIndex
    ) {
      return context.args.slice(startIndex).join(" ");
    }
    return "";
  };

  return context;
}
