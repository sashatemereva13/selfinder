# Monitoring — Prometheus, Grafana, Loki

Observability for the whole VPS (`srv1229561.hstgr.cloud`), not just
Selfinder — Phases 2 (metrics) and 3 (logs) of the DevOps upgrade plan in
`docs/roadmap.md`. The VPS is fully owned/maintained by one person and
hosts several projects (Selfinder, Amber, and others); this stack is
scoped to cover all of them at the infrastructure level from the start,
with rich app-level metrics starting with Selfinder specifically (see
"What's instrumented" below).

## What's instrumented

- **Selfinder backend app-level metrics** (`backend/metrics.js`) — real
  request rate, latency (histogram, so p50/p95/p99 are all queryable),
  and error rate, labeled by route/method/status code. Exposed at
  `GET /metrics` on the backend itself, scraped by Prometheus.
- **Whole-VPS host metrics** (`node-exporter`) — CPU, memory, disk,
  network for the box itself, covering every project on it, not just
  Selfinder.
- **Per-container metrics** (`cadvisor`) — CPU/memory/restart count for
  every running container on the VPS (Selfinder's backend, all of
  Amber's stack, everything else), without needing to add instrumentation
  code to any of those other projects individually.

- **Logs, every container on the VPS** (`loki` + `promtail`) — Promtail
  discovers every running container via the Docker socket (read-only
  mount) and tails its stdout/stderr directly from Docker's own JSON log
  files, no per-app code changes needed. Loki stores and indexes them,
  labeled by container name, queryable from the same Grafana instance as
  the metrics dashboards (Explore → Loki datasource, or
  `{container="selfinder-backend"}` as a starting query).

**Not yet instrumented:** app-level metrics (request rate/latency/error
rate) for Amber or other projects — those would need `prom-client` (or
an equivalent for their stack) added to their own source code, the same
way `backend/metrics.js` was added here. Deliberately out of scope for
this pass; cadvisor's container-level metrics and Loki's logs both
already cover them in the meantime, since neither requires touching
those other projects' code. See `docs/roadmap.md`.

## Networking

Selfinder's backend container is attached to the `monitoring` Docker
network (created by this compose file) so Prometheus can reach
`http://selfinder-backend:3002/metrics` by container name rather than a
host IP/port. This required a small addition to
`.github/workflows/deploy-backend.yml`'s `docker run` command
(`--network monitoring`) — the network must already exist on the VPS
(i.e. `docker compose -f monitoring/docker-compose.yml up -d` has been
run at least once) before a backend deploy will succeed; if the network
is ever missing, `deploy-backend.yml`'s `docker run` step will fail
loudly rather than silently degrade.

## Deploying to the VPS

Not yet wired into CI/Terraform — currently a manual step:

```bash
# on the VPS, from wherever this repo is checked out
echo "<a real password, not this text>" > monitoring/secrets/grafana_admin_password.txt
docker compose -f monitoring/docker-compose.yml up -d
```

Grafana and Prometheus are both bound to `127.0.0.1` only (see
`docker-compose.yml`) — **not** exposed on the public internet. Reach
them via an SSH tunnel for now:

```bash
ssh -L 3000:localhost:3000 -L 9090:localhost:9090 ubuntu@72.60.88.91
# then open http://localhost:3000 (Grafana) / http://localhost:9090 (Prometheus) locally
```

Fronting Grafana with nginx + a real subdomain + TLS (matching how
Selfinder itself is served) is future work, not yet done — see
`docs/roadmap.md` Phase 4 area for the alerting/exposure follow-up.

## Dashboard

`grafana/dashboards/selfinder-backend.json` is provisioned automatically
(see `grafana/provisioning/`) — no manual "add dashboard" click-through
needed on a fresh Grafana instance. Covers: request rate by route,
p50/p95 latency by route, error rate by route, container CPU across the
whole VPS, host CPU/memory, and container restart counts.
