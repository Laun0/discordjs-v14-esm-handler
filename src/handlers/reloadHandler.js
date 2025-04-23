import chokidar from "chokidar";
import path from "path";
import logger from "../utils/logger.js";
import { loadCommands, registerCommands } from "./commandHandler.js";
import { loadEvents, unloadEvent } from "./eventHandler.js";
import { loadComponents, unloadComponent } from "./componentHandler.js";
import { reloadConfig } from "../utils/configLoader.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = path.join(__dirname, "..");
const configPath = path.join(__dirname, "../../config/config.json");

async function initializeReloadWatcher(client) {
  logger.info("Initializing hot-reload watcher...");

  const clearCommand = (client, commandName) => {
    if (!client.commands) return;
    const command = client.commands.get(commandName);
    if (command) {
      client.commands.delete(commandName);
      logger.debug(`[Reload] Cleared command cache for: ${commandName}`);
      if (client.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias) => {
          if (client.aliases.get(alias) === commandName) {
            client.aliases.delete(alias);
            logger.debug(`[Reload] Cleared alias cache for: ${alias}`);
          }
        });
      }
    } else {
      logger.warn(
        `[Reload] Command ${commandName} not found in cache during clearing.`,
      );
    }
  };

  const watcher = chokidar.watch(
    [
      path.join(basePath, "commands/**/*.js"),
      path.join(basePath, "events/**/*.js"),
      path.join(basePath, "components/**/*.js"),
      configPath,
    ],
    {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    },
  );

  watcher
    .on("change", async (filePath) => {
      const normalizedPath = path.normalize(filePath);
      logger.info(
        `Detected change in: ${normalizedPath}. Initiating hot reload...`,
      );

      try {
        if (normalizedPath === path.normalize(configPath)) {
          await reloadConfig();
          client.config = await reloadConfig();
          logger.info("Configuration reloaded.");
        } else if (normalizedPath.startsWith(path.join(basePath, "commands"))) {
          logger.info("Reloading commands...");
          const appCommands = await loadCommands(client);
          await registerCommands(client, appCommands);
        } else if (normalizedPath.startsWith(path.join(basePath, "events"))) {
          logger.info(
            `Reloading event listener from ${path.basename(filePath)}...`,
          );
          const relativePath = path
            .relative(basePath, normalizedPath)
            .replace(/\\/g, "/");

          if (unloadEvent(client, relativePath)) {
            const eventModule = await import(
              `file://${filePath}?t=${Date.now()}`
            );
            const event = eventModule.default;
            if (event && event.name && event.execute) {
              const listener = (...args) => event.execute(...args, client);
              client.eventListeners.set(relativePath, {
                name: event.name,
                listener: listener,
              });
              if (event.once) {
                client.once(event.name, listener);
              } else {
                client.on(event.name, listener);
              }
              logger.info(
                `Successfully reloaded event listener: ${event.name}`,
              );
            } else {
              logger.warn(
                `Failed to reload event from ${filePath}: Invalid export.`,
              );
            }
          } else {
            logger.warn(
              `Could not unload existing listener for ${relativePath}. Adding new one (potential duplicate).`,
            );
            const eventModule = await import(
              `file://${filePath}?t=${Date.now()}`
            );
            const event = eventModule.default;
            if (event && event.name && event.execute) {
              const listener = (...args) => event.execute(...args, client);
              client.eventListeners.set(relativePath, {
                name: event.name,
                listener: listener,
              });
              if (event.once) client.once(event.name, listener);
              else client.on(event.name, listener);
              logger.info(
                `Loaded event listener: ${event.name} (possibly duplicate).`,
              );
            }
          }
        } else if (
          normalizedPath.startsWith(path.join(basePath, "components"))
        ) {
          logger.info(`Reloading component from ${path.basename(filePath)}...`);
          const relativePath = path
            .relative(basePath, normalizedPath)
            .replace(/\\/g, "/");

          unloadComponent(client, relativePath);

          const componentModule = await import(
            `file://${filePath}?t=${Date.now()}`
          );
          const component = componentModule.default;
          if (component && component.customId && component.execute) {
            const type = path.basename(path.dirname(filePath));
            switch (type) {
              case "buttons":
                client.buttons.set(component.customId, component);
                break;
              case "selects":
                client.selectMenus.set(component.customId, component);
                break;
              case "modals":
                client.modals.set(component.customId, component);
                break;
            }
            logger.info(
              `Successfully reloaded ${type.slice(0, -1)} component: ${component.customId}`,
            );
          } else {
            logger.warn(
              `Failed to reload component from ${filePath}: Invalid export.`,
            );
          }
        }
      } catch (error) {
        logger.error(`Error during hot reload for ${filePath}:`, error);
      }
    })
    .on("unlink", (filePath) => {
      const normalizedPath = path.normalize(filePath);
      logger.info(`Detected deletion: ${normalizedPath}. Attempting unload...`);
      if (normalizedPath.startsWith(path.join(basePath, "commands"))) {
        (async () => {
          logger.warn(
            `Command file deleted: ${path.basename(filePath)}. Reloading all commands and re-registering...`,
          );
          const appCommands = await loadCommands(client);
          await registerCommands(client, appCommands);
        })();
      } else if (normalizedPath.startsWith(path.join(basePath, "events"))) {
        const relativePath = path
          .relative(basePath, normalizedPath)
          .replace(/\\/g, "/");
        if (unloadEvent(client, relativePath)) {
          logger.info(
            `Successfully unloaded event listener associated with deleted file: ${relativePath}`,
          );
        } else {
          logger.warn(
            `Could not find listener to unload for deleted event file: ${relativePath}`,
          );
        }
      } else if (normalizedPath.startsWith(path.join(basePath, "components"))) {
        const relativePath = path
          .relative(basePath, normalizedPath)
          .replace(/\\/g, "/");
        if (unloadComponent(client, relativePath)) {
          logger.info(
            `Successfully unloaded component associated with deleted file: ${relativePath}`,
          );
        } else {
          logger.warn(
            `Could not find component to unload for deleted file: ${relativePath}`,
          );
        }
      }
    })
    .on("error", (error) => logger.error(`Watcher error: ${error}`))
    .on("ready", () =>
      logger.info("Hot-reload watcher is ready and watching files."),
    );

  process.on("SIGINT", () => {
    logger.info("Closing file watcher...");
    watcher.close().then(() => process.exit(0));
  });
}

export { initializeReloadWatcher };
