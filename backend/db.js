import mongoose from "mongoose";
import { logger } from "./logger.js";

// App-wide NoSQL-injection guard (2026-11-07): any object in a query filter
// whose keys start with "$" is treated as a literal value to match, not as an
// operator — so `{"username": {"$ne": null}}` from a request body can only
// ever match a username that literally *is* that object (none). A query that
// genuinely needs an operator wraps it in mongoose.trusted(...), which makes
// every intentional operator visible in code review.
mongoose.set("sanitizeFilter", true);

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
