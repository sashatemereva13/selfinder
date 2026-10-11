import mongoose from "mongoose";

// "Running" isn't "useful": report the database connection too, so the
// container healthcheck and the deploy check fail when MongoDB is gone
// even though the process itself is still up.
export function getHealth(req, res) {
  const db = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(db === "connected" ? 200 : 503).json({
    status: db === "connected" ? "ok" : "degraded",
    db,
    timestamp: new Date().toISOString(),
  });
}
