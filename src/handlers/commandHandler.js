import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Collection } from "discord.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "../commands");
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

async function loadCommands(client) {
  client.commands = new Collection();
  client.aliases = new Collection();
  client.commandCategories = new Set();
  const applicationCommands = [];

  try {
    const categoryFolders = await fs.readdir(commandsPath);

    for (const folder of categoryFolders) {
      const folderPath = path.join(commandsPath, folder);
      let stats;
      try {
        stats = await fs.stat(folderPath);
      } catch (statError) {
        if (statError.code === "ENOENT") {
          client.logger.warn(
            `Commands directory '${folder}' not found or inaccessible. Skipping.`,
          );
          continue;
        }
        throw statError;
      }

      if (stats.isDirectory()) {
        const commandFiles = (await fs.readdir(folderPath)).filter((file) =>
          file.endsWith(".js"),
        );

        for (const file of commandFiles) {
          const filePath = path.join(folderPath, file);
          try {
            const commandModule = await import(
              `file://${filePath}?t=${Date.now()}`
            );
            const command = commandModule.default;

            if (!command || !command.name || !command.execute) {
              client.logger.warn(
                `Command file ${folder}/${file} is missing 'name' or 'execute' export. Skipping.`,
              );
              continue;
            }

            command.category = folder;
            client.commandCategories.add(folder);

            client.commands.set(command.name, command);
            client.logger.debug(
              `Loaded command: ${command.name} from ${folder}/${file}`,
            );

            if (Array.isArray(command.aliases)) {
              command.aliases.forEach((alias) => {
                client.aliases.set(alias, command.name);
                client.logger.debug(
                  `  - Registered alias: ${alias} -> ${command.name}`,
                );
              });
            }

            if (command.type === "slash" || command.type === "hybrid") {
              if (!command.description) {
                client.logger.warn(
                  `Slash command ${command.name} is missing a description.`,
                );
              }
              applicationCommands.push({
                name: command.name,
                description: command.description || "No description provided.",
                options: command.options || [],
                type: 1,
              });
            } else if (command.type === "context-user") {
              if (!command.data || command.data.type !== 2) {
                client.logger.warn(
                  `Context Menu (User) ${command.name} is missing valid 'data' export. Skipping registration.`,
                );
                continue;
              }
              applicationCommands.push(command.data);
            } else if (command.type === "context-message") {
              if (!command.data || command.data.type !== 3) {
                client.logger.warn(
                  `Context Menu (Message) ${command.name} is missing valid 'data' export. Skipping registration.`,
                );
                continue;
              }
              applicationCommands.push(command.data);
            }
          } catch (importError) {
            client.logger.error(
              `Error loading command from file ${filePath}:`,
              importError,
            );
          }
        }
      }
    }
    client.logger.info(
      `Loaded ${client.commands.size} commands across ${client.commandCategories.size} categories for Cluster ${client.cluster?.id ?? "N/A"}.`,
    );
    return applicationCommands;
  } catch (error) {
    client.logger.error(
      `Error reading command directories for Cluster ${client.cluster?.id ?? "N/A"}:`,
      error,
    );
    return [];
  }
}

async function registerCommands(client, commandsToRegister) {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const currentClusterId = client.cluster?.id ?? "N/A (Non-Sharded?)";

  if (!TOKEN || !CLIENT_ID) {
    client.logger.error(
      `[Cluster-${currentClusterId}] TOKEN or CLIENT_ID missing. Aborting command registration.`,
    );
    return;
  }
  if (commandsToRegister.length === 0) {
    client.logger.info(
      `[Cluster-${currentClusterId}] No application commands data provided for registration.`,
    );

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    return;
  }

  client.logger.info(
    `[Cluster-${currentClusterId}] Attempting to refresh ${commandsToRegister.length} application (/) commands globally...`,
  );

  try {
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commandsToRegister,
    });

    client.logger.info(
      `[Cluster-${currentClusterId}] Successfully reloaded ${data?.length ?? "unknown number of"} application (/) commands globally.`,
    );
  } catch (error) {
    client.logger.error(
      `[Cluster-${currentClusterId}] Failed to register application commands globally:`,
      error,
    );
  }
}

export { loadCommands, registerCommands };
