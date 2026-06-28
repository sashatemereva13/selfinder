import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./db.js";
import healthRouter       from "./routes/health.js";
import philosophersRouter from "./routes/philosophers.js";
import chatRouter         from "./routes/chat.js";
import measureRouter      from "./routes/measure.js";
import conversationRouter from "./routes/conversation.js";
import feedbackRouter     from "./routes/feedback.js";
import authRouter         from "./routes/auth.js";
import userRouter         from "./routes/user.js";

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

app.use("/api/health",        healthRouter); 
app.use("/api/philosophers",  philosophersRouter);
app.use("/api/auth",          authRouter);
app.use("/api/user",          userRouter);
app.use("/api/chat",          chatRouter);
app.use("/api/measure",       measureRouter);
app.use("/api/conversation",  conversationRouter);
app.use("/api/feedback",      feedbackRouter);

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Backend running on :${port}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
