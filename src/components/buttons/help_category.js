import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default {
  customId: "help_category_button_",
  async execute(context) {
    const category = context.interaction.customId.split("_")[3];
    const { client } = context;

    const commandsInCategory = client.commands
      .filter((cmd) => cmd.category === category)
      .map((cmd) => `\`${cmd.name}\``)
      .join(", ");

    const categoryEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(
        `📚 ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
      )
      .setDescription(
        commandsInCategory.length > 0
          ? commandsInCategory
          : "No commands found.",
      )
      .setFooter({
        text: `Use ${context.guildConfig?.prefix || client.config.defaultPrefix}help [command] for more info.`,
      });

    const originalMessage = await context.interaction.channel.message.fetch(
      context.interaction.message.id,
    );

    const selectMenu = originalMessage.components[0].components[0];
    const row = new ActionRowBuilder().addComponents(selectMenu);

    await context.interaction.update({
      embeds: [categoryEmbed],
      components: [row],
    });
  },
};
