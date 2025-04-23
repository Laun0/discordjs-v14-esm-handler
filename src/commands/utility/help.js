import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default {
  name: "help",
  description:
    "Displays a list of available commands or info about a specific command.",
  type: "hybrid",
  category: "utility",
  aliases: ["h", "commands"],
  cooldown: { duration: 5, scope: "user" },

  options: [
    {
      name: "command",
      description: "The command you want help with.",
      type: 3,
      required: false,
    },
  ],

  async execute(context) {
    const { client, isInteraction, args, options } = context;
    const specificCommandName = isInteraction
      ? options?.getString("command")
      : args[0];

    if (specificCommandName) {
      const command =
        client.commands.get(specificCommandName.toLowerCase()) ||
        client.commands.get(
          client.aliases.get(specificCommandName.toLowerCase()),
        );
      if (!command) {
        return context.reply({
          content: `Command \`${specificCommandName}\` not found.`,
          flags: 64,
        });
      }
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`❓ Help: \`${command.name}\``)
        .setDescription(command.description || "No description available.")
        .addFields({
          name: "Category",
          value: command.category || "Uncategorized",
          inline: true,
        });
      if (command.aliases?.length) {
        embed.addFields({
          name: "Aliases",
          value: command.aliases.map((a) => `\`${a}\``).join(", "),
          inline: true,
        });
      }
      if (command.cooldown) {
        embed.addFields({
          name: "Cooldown",
          value: `${command.cooldown.duration} second(s) (${command.cooldown.scope || "user"})`,
          inline: true,
        });
      }
      if (command.usage) {
        const prefix =
          context.guildConfig?.prefix || client.config.defaultPrefix;
        embed.addFields({
          name: "Usage",
          value: `\`${prefix}${command.name} ${command.usage}\``,
        });
      }

      return context.reply({ embeds: [embed] });
    }

    const categories = [...client.commandCategories].sort();

    if (categories.length === 0) {
      return context.reply({ content: "No commands found.", flags: 64 });
    }

    const categoryOptions = categories.map((category) => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      value: `help_category_${category}`,
      description: `View commands in the ${category} category`,
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_category_select")
      .setPlaceholder("Select a category...")
      .addOptions(categoryOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const initialEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`${client.user.username}'s Commands`)
      .setDescription(
        "Please select a category from the dropdown menu below to view its commands.",
      )
      .setFooter({
        text: `Use ${context.guildConfig?.prefix || client.config.defaultPrefix}help [command] for more info.`,
      });

    await context.reply({
      embeds: [initialEmbed],
      components: [row],
    });
  },
};
