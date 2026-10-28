import "dotenv/config";
import express from "express";
import cors from "cors";
import { globalAiLimiter } from "./middleware/aiRequestLimits.js";
import { safeErrorHandler } from "./middleware/safeErrorHandler.js";

import { connectDB } from "./db.js";
import { logger, httpLogger } from "./logger.js";
import { register, metricsMiddleware } from "./metrics.js";
import healthRouter       from "./routes/health.js";
import philosophersRouter from "./routes/philosophers.js";
import chatRouter         from "./routes/chat.js";
import measureRouter      from "./routes/measure.js";
import conversationRouter from "./routes/conversation.js";
import spillRouter        from "./routes/spill.js";
import wishRouter         from "./routes/wish.js";
import crossingRouter     from "./routes/crossing.js";
import arcLineRouter      from "./routes/arcLine.js";
import feedbackRouter     from "./routes/feedback.js";
import authRouter         from "./routes/auth.js";
import userRouter         from "./routes/user.js";
import eventsRouter       from "./routes/events.js";
import journeysRouter     from "./routes/journeys.js";
import aiConsentRouter    from "./routes/aiConsent.js";

const app = express();
// Safe only for the current single nginx proxy hop. If deployment topology
// changes, replace with an explicit trusted-proxy range before release.
app.set("trust proxy", 1);
const port = Number(process.env.PORT || 3001);
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
}));
// Bound parsing cost before any route/controller runs. The app sends short
// reflections and structured history; 64 KB is ample for current flows.
app.use(express.json({ limit: "64kb", strict: true }));
app.use(httpLogger);
app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/health",        healthRouter);
app.use("/api/philosophers",  philosophersRouter);
app.use("/api/auth",          authRouter);
app.use("/api/ai-consent",    aiConsentRouter);
app.use("/api/user",          userRouter);
app.use("/api/chat",          globalAiLimiter, chatRouter);
app.use("/api/measure",       globalAiLimiter, measureRouter);
app.use("/api/conversation",  conversationRouter);
app.use("/api/spill",         spillRouter);
app.use("/api/wish",          wishRouter);
app.use("/api/crossing",      globalAiLimiter, crossingRouter);
app.use("/api/arc-line",      globalAiLimiter, arcLineRouter);
app.use("/api/feedback",      feedbackRouter);
app.use("/api/events",        eventsRouter);
app.use("/api/journeys",      globalAiLimiter, journeysRouter);

// Keep this last so parser, middleware, and uncaught route errors use a
// controlled response instead of Express's default error page.
app.use(safeErrorHandler);

connectDB()
  .then(() => {
    app.listen(port, () => logger.info({ port }, "Backend running"));
  })
  .catch((err) => {
    logger.fatal({ err }, "Failed to connect to MongoDB");
    process.exit(1);
  });
