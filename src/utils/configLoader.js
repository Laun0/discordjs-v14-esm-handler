import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, "../../config/config.json");
let config = {};

async function loadConfigInternal() {
  try {
    const data = await fs.readFile(configPath, "utf8");
    config = JSON.parse(data);
    return config;
  } catch (error) {
    console.error(`Error loading configuration from ${configPath}:`, error);
    return {};
  }
}

await loadConfigInternal();

export function loadConfig() {
  return config;
}

export { loadConfigInternal as reloadConfig };
