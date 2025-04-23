import mongoose from "mongoose";
import logger from "../utils/logger.js";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
  if (!MONGO_URI) {
    logger.error("MONGO_URI is not defined in the environment variables.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    logger.info("MongoDB Connected Successfully.");
  } catch (error) {
    logger.error("MongoDB Connection Failed:", error);
  }

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected.");
  });
}

export { connectDB };
