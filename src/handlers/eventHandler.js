import fs from "fs/promises";
import path from "path";
import logger from "../utils/logger.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const eventsPath = path.join(__dirname, "../events");

async function loadEvents(client) {
  try {
    const eventFolders = await fs.readdir(eventsPath);

    for (const folder of eventFolders) {
      const folderPath = path.join(eventsPath, folder);
      const stats = await fs.stat(folderPath);

      if (stats.isDirectory()) {
        const eventFiles = (await fs.readdir(folderPath)).filter((file) =>
          file.endsWith(".js"),
        );

        for (const file of eventFiles) {
          const filePath = path.join(folderPath, file);
          const eventModule = await import(
            `file://${filePath}?t=${Date.now()}`
          );
          const event = eventModule.default;

          if (!event || !event.name || !event.execute) {
            logger.warn(
              `Event file ${file} is missing 'name' or 'execute' export. Skipping.`,
            );
            continue;
          }

          if (event.once) {
            client.once(event.name, (...args) =>
              event.execute(...args, client),
            );
            logger.debug(
              `Registered ONCE event: ${event.name} from ${folder}/${file}`,
            );
          } else {
            const listener = (...args) => event.execute(...args, client);
            client.eventListeners = client.eventListeners || new Map();
            client.eventListeners.set(`${folder}/${file}`, {
              name: event.name,
              listener: listener,
            });
            client.on(event.name, listener);
            logger.debug(
              `Registered ON event: ${event.name} from ${folder}/${file}`,
            );
          }
        }
      }
    }
    logger.info(`Loaded ${client.eventListeners?.size || 0} event listeners.`);
  } catch (error) {
    logger.error("Error loading events:", error);
  }
}

function unloadEvent(client, filePath) {
  if (!client.eventListeners) return;

  const key = filePath
    .replace(path.join(__dirname, "../"), "")
    .replaceAll("\\", "/");
  const storedListener = client.eventListeners.get(key);

  if (storedListener) {
    client.off(storedListener.name, storedListener.listener);
    client.eventListeners.delete(key);
    logger.debug(`Unloaded event listener from: ${key}`);
    return true;
  }
  logger.warn(
    `Attempted to unload event listener for non-existent key: ${key}`,
  );
  return false;
}

export { loadEvents, unloadEvent };
