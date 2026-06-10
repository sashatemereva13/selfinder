import "dotenv/config";
import express from "express";
import cors from "cors";

import healthRouter       from "./routes/health.js";
import philosophersRouter from "./routes/philosophers.js";
import chatRouter         from "./routes/chat.js";
import measureRouter      from "./routes/measure.js";
import conversationRouter from "./routes/conversation.js";
import feedbackRouter     from "./routes/feedback.js";
import authRouter         from "./routes/auth.js";
import userRouter         from "./routes/user.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/health",        healthRouter); 
app.use("/api/philosophers",  philosophersRouter);
app.use("/api/auth",          authRouter);
app.use("/api/user",          userRouter);
app.use("/api/chat",          chatRouter);
app.use("/api/measure",       measureRouter);
app.use("/api/conversation",  conversationRouter);
app.use("/api/feedback",      feedbackRouter);

app.listen(3001, () => console.log("Backend running on :3001"));
