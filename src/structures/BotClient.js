import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  ActivityType,
} from "discord.js";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";
import { loadConfig } from "../utils/configLoader.js";
import { connectDB } from "../handlers/mongooseHandler.js";
import { loadCommands, registerCommands } from "../handlers/commandHandler.js";
import { loadEvents } from "../handlers/eventHandler.js";
import { loadComponents } from "../handlers/componentHandler.js";
import { initializeReloadWatcher } from "../handlers/reloadHandler.js";
import { initializeErrorHandling } from "../handlers/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class BotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction,
      ],
      allowedMentions: {
        parse: ["users", "roles"],
        repliedUser: false,
      },
    });

    this.commands = new Collection();
    this.aliases = new Collection();
    this.cooldowns = new Collection();
    this.buttons = new Collection();
    this.selectMenus = new Collection();
    this.modals = new Collection();
    this.commandCategories = new Set();

    this.config = loadConfig();
    this.logger = logger;
    this.cluster = null;
    this.isClusterReady = false;
    this._applicationCommandData = [];
  }

  async _connectDB() {
    await connectDB();
  }

  async _loadCommands() {
    this._applicationCommandData = await loadCommands(this);
  }

  async _loadEvents() {
    await loadEvents(this);
  }

  async _loadComponents() {
    await loadComponents(this);
  }

  async _registerCommands() {
    if (this.cluster && this.cluster.id === 0) {
      this.logger.info(`Cluster 0 initiating global command registration...`);
      await registerCommands(this, this._applicationCommandData);
    } else if (!this.cluster) {
      this.logger.warn(
        "Running without sharding manager? Registering commands globally.",
      );
      await registerCommands(this, this._applicationCommandData);
    } else {
      this.logger.info(
        `Cluster ${this.cluster.id} skipping global command registration.`,
      );
    }
  }

  async _initializeHotReload() {
    if (process.env.NODE_ENV !== "production") {
      if (!this.cluster || this.cluster.id === 0) {
        this.logger.info("Initializing hot-reload watcher on Cluster 0...");
        await initializeReloadWatcher(this);
      } else {
        this.logger.info(
          `Cluster ${this.cluster.id}: Skipping hot-reload watcher initialization.`,
        );
      }
    } else {
      this.logger.info(
        "Hot reload watcher disabled in production environment.",
      );
    }
  }

  async start(token) {
    if (!token) {
      this.logger.error("TOKEN NOT PROVIDED TO BotClient#start!");
      process.exit(1);
    }
    this.logger.info("Initializing BotClient...");

    initializeErrorHandling(this);

    await this._connectDB();
    await this._loadCommands();
    await this._loadEvents();
    await this._loadComponents();

    this.logger.info("Attempting to log in...");

    try {
      await super.login(token);
      this.logger.info(`Successfully logged in as ${this.user?.tag}`);

      this.once(Events.ClientReady, async () => {
        this.logger.info(
          `Client is fully ready (Discord Event)! Cluster ID: ${this.cluster?.id ?? "N/A"}`,
        );
        this.isClusterReady = true;

        await this._registerCommands();
        await this._initializeHotReload();

        if (!this.cluster || this.cluster.id === 0) {
          this.user?.setPresence({
            activities: [
              {
                name: `Cluster ${this.cluster?.id ?? "N/A"} | ${this.config.defaultPrefix}help`,
                type: ActivityType.Watching,
              },
            ],
            status: "online",
          });
        } else {
          this.user?.setPresence({
            activities: [
              {
                name: `Handling shards on Cluster ${this.cluster.id}`,
                type: ActivityType.Playing,
              },
            ],
            status: "online",
          });
        }

        this.logger.info(
          `BotClient initialization complete for Cluster ${this.cluster?.id ?? "N/A"}.`,
        );
      });
    } catch (error) {
      this.logger.error("Client login failed:", error);
      process.exit(1);
    }
  }
}
