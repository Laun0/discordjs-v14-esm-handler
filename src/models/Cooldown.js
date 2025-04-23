import mongoose from "mongoose";

const cooldownSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

cooldownSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Cooldown", cooldownSchema);
