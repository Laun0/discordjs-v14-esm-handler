import mongoose from "mongoose";

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, required: true, default: "!" },
  modRoles: [{ type: String }],
  logChannelId: { type: String },
});

export default mongoose.model("GuildConfig", guildConfigSchema);
