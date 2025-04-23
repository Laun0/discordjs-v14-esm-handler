import { Collection } from "discord.js";
import GuildConfig from "../models/GuildConfig.js";
import Cooldown from "../models/Cooldown.js";
import logger from "./logger.js";
import { loadConfig } from "./configLoader.js";

const config = loadConfig();
const ownerIds = process.env.OWNER_IDS?.split(",") || [];

export function checkPermissions(context, requiredPerms) {
  if (!requiredPerms) return true;

  const member = context.member;
  if (!member) return false;

  if (ownerIds.includes(context.user.id)) return true;

  if (
    Array.isArray(requiredPerms.discord) &&
    requiredPerms.discord.length > 0
  ) {
    const missingPerms = member.permissions.missing(requiredPerms.discord);
    if (missingPerms.length > 0) {
      context.reply({
        content: `You are missing the following permissions: ${missingPerms.join(", ")}`,
        ephemeral: true,
      });
      return false;
    }
  }

  if (
    Array.isArray(requiredPerms.role) &&
    requiredPerms.role.length > 0 &&
    context.guildConfig?.modRoles
  ) {
    const hasRequiredRole = member.roles.cache.some(
      (role) =>
        requiredPerms.role.includes(role.id) ||
        context.guildConfig.modRoles.includes(role.id),
    );
    if (!hasRequiredRole) {
      context.reply({
        content: `You do not have the required roles to use this command.`,
        ephemeral: true,
      });
      return false;
    }
  }

  if (Array.isArray(requiredPerms.user) && requiredPerms.user.length > 0) {
    if (!requiredPerms.user.includes(context.user.id)) {
      context.reply({
        content: `You are not authorized to use this command.`,
        ephemeral: true,
      });
      return false;
    }
  }

  return true;
}

export async function checkCooldown(context, command) {
  if (!command.cooldown || !context.user) return true;

  const { duration, scope = "user" } = command.cooldown;
  if (!duration || duration <= 0) return true;

  const key = `${command.name}-${scope === "guild" && context.guild ? context.guild.id : context.user.id}`;
  const now = Date.now();

  try {
    const cooldown = await Cooldown.findOne({ key: key });

    if (cooldown && cooldown.expiresAt > now) {
      const timeLeft = Math.ceil((cooldown.expiresAt - now) / 1000);
      context.reply({
        content: `Please wait ${timeLeft} more second(s) before reusing the \`${command.name}\` command.`,
        ephemeral: true,
      });
      return false;
    }

    await Cooldown.findOneAndUpdate(
      { key: key },
      { expiresAt: now + duration * 1000 },
      { upsert: true, new: true },
    );
    return true;
  } catch (error) {
    logger.error(`Error checking/setting cooldown for key ${key}:`, error);
    context.reply({
      content: "Could not verify command cooldown. Please try again.",
      ephemeral: true,
    });
    return false;
  }
}

export async function getGuildConfig(guildId) {
  if (!guildId) return null;
  try {
    let guildConfig = await GuildConfig.findOne({ guildId: guildId });
    if (!guildConfig) {
      guildConfig = new GuildConfig({
        guildId: guildId,
        prefix: config.defaultPrefix || "!",
      });
      await guildConfig.save();
    }
    return guildConfig;
  } catch (error) {
    logger.error(`Error fetching guild config for ${guildId}:`, error);
    return { prefix: config.defaultPrefix || "!" };
  }
}

export function parseArguments(messageContent, prefix) {
  const contentWithoutPrefix = messageContent.slice(prefix.length).trim();
  const args = contentWithoutPrefix.split(/ +/);
  args.shift();
  return args;
}
