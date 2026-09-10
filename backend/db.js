import mongoose from "mongoose";
import { logger } from "./logger.js";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set — add it to backend/.env");
  }

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  await mongoose.connect(uri);
  logger.info("Connected to MongoDB");
}
