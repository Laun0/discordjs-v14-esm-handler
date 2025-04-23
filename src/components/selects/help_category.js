import { EmbedBuilder } from "discord.js";

export default {
  customId: "help_category_select",
  async execute(context) {
    const { interaction, client } = context;
    const selectedCategory = interaction.values[0].split("_")[2];

    const commandsInCategory = client.commands
      .filter((cmd) => cmd.category === selectedCategory)
      .map((cmd) => `\`${cmd.name}\``)
      .join(", ");

    const categoryEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(
        `📚 ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Commands`,
      )
      .setDescription(
        commandsInCategory.length > 0
          ? commandsInCategory
          : "No commands found in this category.",
      )
      .setFooter({
        text: `Use ${context.guildConfig?.prefix || client.config.defaultPrefix}help [command] for more info.`,
      });

    await interaction.update({
      embeds: [categoryEmbed],
    });
  },
};
