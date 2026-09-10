import pino from "pino";
import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";

// Plain JSON to stdout in every environment — Promtail tails Docker's own
// JSON log driver (see monitoring/README.md), so pretty-printing here would
// just mean Loki indexes a harder-to-query blob instead of structured fields.
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];
    const id = existing || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  // Health checks and metrics scrapes happen every few seconds — logging
  // each one at "info" would drown out everything else in Loki.
  autoLogging: {
    ignore: (req) => req.url === "/api/health" || req.url === "/metrics",
  },
});
