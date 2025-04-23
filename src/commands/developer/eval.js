import { EmbedBuilder } from "discord.js";
import { inspect } from "util";

export default {
  name: "eval",
  description: "Executes arbitrary JavaScript code (Owner Only).",
  aliases: ["e"],
  type: "hybrid",
  category: "owner",
  ownerOnly: true,
  guildOnly: false,
  options: [
    {
      name: "code",
      description: "The JavaScript code to execute.",
      type: 3,
      required: true,
    },
    {
      name: "ephemeral",
      description: "Whether the reply should be ephemeral (default: true).",
      type: 5,
      required: false,
    },
    {
      name: "depth",
      description: "The inspection depth for objects (default: 0).",
      type: 4,
      required: false,
    },
  ],

  async execute(context) {
    const { client, guild, channel, user } = context;

    const codeToEvaluate =
      context.getString("code", true) ?? context.getArgumentsJoined(0);
    const isEphemeral = context.getBoolean("ephemeral") ?? true;
    const depth = context.getInteger("depth") ?? 0;

    if (!codeToEvaluate) {
      return context.reply({
        content: "❌ Please provide code to evaluate.",
        flags: 64,
      });
    }

    if (context.isInteraction) await context.defer(isEphemeral);

    const startTime = process.hrtime.bigint();
    let output,
      errorOccurred = false,
      evalTime;

    try {
      const evaluated = await eval(`(async () => { ${codeToEvaluate} })()`);
      output = inspect(evaluated, { depth: depth });
    } catch (error) {
      output = error.toString();
      errorOccurred = true;
    } finally {
      const endTime = process.hrtime.bigint();
      evalTime = (endTime - startTime) / BigInt(1000000);
    }

    const tokenRegex = new RegExp(client.token, "gi");
    output = output.replace(tokenRegex, "TOKEN_REDACTED");

    const maxLen = 1900;
    let truncatedOutput =
      output.length > maxLen ? output.substring(0, maxLen) + "..." : output;

    const embed = new EmbedBuilder()
      .setTitle(errorOccurred ? " Eval Error" : " Eval Result")
      .setColor(errorOccurred ? 0xff0000 : 0x00ff00)
      .addFields(
        {
          name: "📥 Input",
          value: `\`\`\`js\n${codeToEvaluate.substring(0, 1000)}${codeToEvaluate.length > 1000 ? "..." : ""}\n\`\`\``,
        },
        {
          name: `📤 Output ${errorOccurred ? "(Error)" : ""}`,
          value: `\`\`\`js\n${truncatedOutput}\n\`\`\``,
        },
        { name: "⏱️ Time Taken", value: `${evalTime}ms`, inline: true },
      )
      .setTimestamp();

    if (context.isInteraction && isEphemeral) {
      embed.addFields({
        name: "💡 Ephemeral",
        value: isEphemeral ? "Yes" : "No",
        inline: true,
      });
    }

    try {
      await context.reply({ embeds: [embed], ephemeral: isEphemeral });

      if (output.length > maxLen) {
        const followupTarget = context.interaction ?? context.message?.channel;
        if (followupTarget) {
          await followupTarget.send({
            content: "Output was too long, see attached file.",
            files: [
              { attachment: Buffer.from(output), name: "eval_output.js" },
            ],
            ...(context.interaction && { ephemeral: isEphemeral }),
          });
        }
      }
    } catch (replyError) {
      client.logger.error("Eval reply/followUp failed:", replyError);
      console.error("Failed Eval Input:", codeToEvaluate);
      console.error("Failed Eval Output:", output);
    }
  },
};
