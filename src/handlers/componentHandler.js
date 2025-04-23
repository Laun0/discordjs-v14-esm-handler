import { Collection } from "discord.js";
import fs from "fs/promises";
import path from "path";
import logger from "../utils/logger.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const componentsPath = path.join(__dirname, "../components");

async function loadComponents(client) {
  client.buttons = new Collection();
  client.selectMenus = new Collection();
  client.modals = new Collection();

  try {
    const componentTypes = await fs.readdir(componentsPath);

    for (const type of componentTypes) {
      const typePath = path.join(componentsPath, type);
      const stats = await fs.stat(typePath);

      if (stats.isDirectory()) {
        const componentFiles = (await fs.readdir(typePath)).filter((file) =>
          file.endsWith(".js"),
        );

        for (const file of componentFiles) {
          const filePath = path.join(typePath, file);
          const componentModule = await import(
            `file://${filePath}?t=${Date.now()}`
          );
          const component = componentModule.default;

          if (!component || !component.customId || !component.execute) {
            logger.warn(
              `Component file ${type}/${file} is missing 'customId' or 'execute'. Skipping.`,
            );
            continue;
          }

          switch (type) {
            case "buttons":
              client.buttons.set(component.customId, component);
              logger.debug(`Loaded button: ${component.customId}`);
              break;
            case "selects":
              client.selectMenus.set(component.customId, component);
              logger.debug(`Loaded select menu: ${component.customId}`);
              break;
            case "modals":
              client.modals.set(component.customId, component);
              logger.debug(`Loaded modal: ${component.customId}`);
              break;
            default:
              logger.warn(`Unknown component type directory: ${type}`);
              break;
          }
        }
      }
    }
    logger.info(
      `Loaded ${client.buttons.size} buttons, ${client.selectMenus.size} select menus, and ${client.modals.size} modals.`,
    );
  } catch (error) {
    logger.error("Error loading components:", error);
    if (!client.buttons) client.buttons = new Collection();
    if (!client.selectMenus) client.selectMenus = new Collection();
    if (!client.modals) client.modals = new Collection();
  }
}

function unloadComponent(client, filePath) {
  try {
    const type = path.basename(path.dirname(filePath));
    const customIdGuess = path.basename(filePath, ".js");
    let removed = false;

    logger.debug(
      `Attempting to unload component: Type=${type}, File=${path.basename(filePath)}`,
    );

    const removeByCustomId = (collection, id) => {
      if (collection && collection.has(id)) {
        collection.delete(id);
        logger.info(
          `Unloaded ${type.slice(0, -1)} component with Custom ID: ${id}`,
        );
        return true;
      }
      return false;
    };

    switch (type) {
      case "buttons":
        removed = removeByCustomId(client.buttons, customIdGuess);
        break;
      case "selects":
        removed = removeByCustomId(client.selectMenus, customIdGuess);
        break;
      case "modals":
        removed = removeByCustomId(client.modals, customIdGuess);
        break;
    }
    if (!removed) {
      logger.warn(
        `Could not reliably unload component from ${filePath}. It might still be cached if the custom ID doesn't match the filename.`,
      );
    }
    return removed;
  } catch (error) {
    logger.error(`Error unloading component from ${filePath}:`, error);
    return false;
  }
}

export { loadComponents, unloadComponent };
