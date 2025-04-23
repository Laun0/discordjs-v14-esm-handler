import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
} from "discord.js";

export default {
  name: "User Information",
  type: "context-user",
  category: "utility",

  data: new ContextMenuCommandBuilder()
    .setName("User Information")
    .setType(ApplicationCommandType.User),

  async execute(context) {
    const targetUser = context.targetUser;
    const targetMember = context.interaction.guild
      ? await context.interaction.guild.members
          .fetch(targetUser.id)
          .catch(() => null)
      : null;

    if (!targetUser) {
      return context.reply({
        content: "Could not find the target user.",
        flags: 64,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(targetMember?.displayHexColor || "#0099ff")
      .setTitle(`${targetUser.tag}'s Information`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 128 }))
      .addFields(
        { name: "🆔 User ID", value: targetUser.id, inline: true },
        {
          name: "🤖 Is Bot",
          value: targetUser.bot ? "Yes" : "No",
          inline: true,
        },
        {
          name: "📅 Account Created",
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${context.user.tag}`,
        iconURL: context.user.displayAvatarURL({ dynamic: true }),
      });

    if (targetMember) {
      embed.addFields(
        {
          name: "📌 Nickname",
          value: targetMember.nickname || "None",
          inline: true,
        },
        {
          name: "🤝 Joined Server",
          value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: "🎨 Highest Role",
          value: targetMember.roles.highest.toString(),
          inline: true,
        },
        {
          name: `🎭 Roles (${targetMember.roles.cache.size - 1})`,
          value:
            targetMember.roles.cache
              .filter((r) => r.id !== context.guild.id)
              .map((r) => r.toString())
              .join(", ")
              .substring(0, 1020) || "None",
        },
      );
      embed.setColor(targetMember.displayHexColor);
    }

    await context.reply({ embeds: [embed], flags: 64 });
  },
};
