import client from "prom-client";

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Cardinality control: every distinct value ever observed for a labeled
// metric becomes its own permanent Prometheus time series — this is the
// same failure mode Datadog's own ingestion pipeline pre-aggregates
// against for high-cardinality tags (see docs/roadmap.md's metrics-
// cardinality note). `route` MUST stay bounded to Express's route
// *patterns* (`/:id`, not the literal id) — enforced above for matched
// requests via req.route.path. An unmatched request (404: a bot/scanner
// probe, a typo'd client URL, a stale bookmarked link) has no req.route,
// so naively falling back to req.path would label every distinct garbage
// URL as its own route forever — an unbounded, attacker-influenced
// cardinality source, since anyone can generate a new "route" just by
// requesting a new nonexistent path. Collapsed to a single constant label
// instead: still distinguishable from real 404s on known routes (a
// legitimate 404 keeps its real route pattern, e.g. GET /api/wish/:id on
// a deleted wish), and the *rate* of unmatched-route traffic is still
// fully visible via this one time series, which is all that's actually
// actionable — the distinct paths themselves belong in Loki's logs
// (unbounded text fields are fine there; Loki indexes labels, not full
// line content), not as Prometheus label values.
const UNMATCHED_ROUTE_LABEL = "unmatched_route";

export function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : UNMATCHED_ROUTE_LABEL;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}
