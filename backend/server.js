import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./db.js";
import { register, metricsMiddleware } from "./metrics.js";
import healthRouter       from "./routes/health.js";
import philosophersRouter from "./routes/philosophers.js";
import chatRouter         from "./routes/chat.js";
import measureRouter      from "./routes/measure.js";
import conversationRouter from "./routes/conversation.js";
import spillRouter        from "./routes/spill.js";
import wishRouter         from "./routes/wish.js";
import crossingRouter     from "./routes/crossing.js";
import feedbackRouter     from "./routes/feedback.js";
import authRouter         from "./routes/auth.js";
import userRouter         from "./routes/user.js";
import eventsRouter       from "./routes/events.js";

const app = express();
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
app.use(express.json());
app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/health",        healthRouter);
app.use("/api/philosophers",  philosophersRouter);
app.use("/api/auth",          authRouter);
app.use("/api/user",          userRouter);
app.use("/api/chat",          chatRouter);
app.use("/api/measure",       measureRouter);
app.use("/api/conversation",  conversationRouter);
app.use("/api/spill",         spillRouter);
app.use("/api/wish",          wishRouter);
app.use("/api/crossing",      crossingRouter);
app.use("/api/feedback",      feedbackRouter);
app.use("/api/events",        eventsRouter);

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Backend running on :${port}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
