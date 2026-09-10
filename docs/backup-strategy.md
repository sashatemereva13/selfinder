# MongoDB backup & disaster recovery

**Status: real, live, automated (2026-09-10).** Before this, Selfinder's
production database had **zero backup coverage of any kind** — not a
policy gap, a literal capability gap: the Atlas cluster (`cluster0`) is
on Atlas's free/shared tier, and Atlas does not offer *any* backup
feature (continuous or snapshot) below the M10 dedicated tier. If that
cluster had been deleted, corrupted, or the account lost, every user's
account, readings, and conversations would have been unrecoverable. This
doc exists so that stops being true silently.

## Why not just upgrade the Atlas tier

M10+ gets Atlas's built-in continuous backup, which would be the
standard, less bespoke answer. Not done here because Selfinder is
currently fully free for everyone with no live payment path (see
`RULES.md`, "Selfinder is fully free right now") — there's no revenue to
size a recurring infra cost against yet. This is explicitly a stopgap
for the current no-budget stage, not a permanent architectural choice;
if/when a paid tier exists, re-evaluate moving to M10+ and retiring this
workflow rather than running both.

## What actually runs

`.github/workflows/backup-mongodb.yml`, daily at 04:00 UTC (plus
`workflow_dispatch` for an on-demand run):

1. Installs `mongodb-database-tools` (pinned version, matching this
   repo's general "pin exact versions" discipline — see `terraform/`,
   `deploy-backend.yml`).
2. `mongodump --uri=$MONGODB_URI --archive --gzip`, piped directly into
   `openssl enc -aes-256-cbc -pbkdf2` — the dump is never written to disk
   unencrypted, even transiently, since the runner's filesystem isn't
   trusted storage for user data.
3. A size sanity check refuses to publish anything under 1KB, so a wrong
   URI or a network failure to Atlas fails loudly instead of silently
   publishing an empty "backup" that would fail on restore, undetected,
   for weeks.
4. Uploads the encrypted archive as a **private GitHub release** (tagged
   `backup-<UTC timestamp>`), not a GitHub Actions artifact — artifacts
   expire (90-day default retention) without anyone noticing; releases
   don't expire on their own.
5. Prunes releases older than the most recent `RETAIN_BACKUPS` (currently
   14, i.e. ~2 weeks of daily history) so storage doesn't grow forever.

## Required secrets

Two GitHub Actions secrets this workflow depends on, neither of which
existed before this change:

- `MONGODB_URI` — same connection string as the backend's own `.env`.
  Kept as its own secret (not reused from anywhere else) since this is
  the only workflow that needs direct database network access; every
  other workflow only ever touches Mongo indirectly through the deployed
  backend.
- `MONGODB_BACKUP_PASSPHRASE` — a long random passphrase, used only to
  encrypt/decrypt backup archives. **If this is lost, every existing
  backup becomes permanently unreadable** — store it somewhere durable
  outside GitHub too (a password manager), not only as the GitHub
  secret, since GitHub secrets are write-only and can't be read back to
  recover it if it's ever needed outside CI.

## Honest RPO / RTO

- **RPO (Recovery Point Objective): up to 24 hours.** Backups run once a
  day; a disaster right before the next scheduled run loses up to a
  day's worth of readings/conversations/accounts. This is a deliberate,
  named tradeoff for the free-tier stopgap, not an oversight — tightening
  it (e.g. every 6h) is a one-line cron change if the real risk profile
  ever justifies the extra Actions minutes.
- **RTO (Recovery Time Objective): untested as a full drill, estimated
  15–30 minutes** for a human to notice, download the right release
  asset, decrypt it, and run `mongorestore` against a fresh or repaired
  cluster. This estimate should be replaced with a real measured number
  the first time a restore drill is actually run (see "What's not done
  yet" below) — an untested RTO is a guess, not a guarantee.

## Restore procedure

```bash
# 1. Find the release to restore from
gh release list --repo <owner>/<repo> | grep backup-

# 2. Download the encrypted archive
gh release download backup-2026-09-10T04-00-00Z --repo <owner>/<repo> \
  --pattern '*.enc'

# 3. Decrypt (same passphrase as MONGODB_BACKUP_PASSPHRASE)
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in selfinder-mongodb-2026-09-10T04-00-00Z.archive.gz.enc \
  -out selfinder-mongodb-2026-09-10T04-00-00Z.archive.gz \
  -pass pass:'<the passphrase>'

# 4. Restore into a target cluster (a NEW/empty one is safest — restoring
#    into the live cluster with --drop will overwrite current data)
mongorestore --uri="<target MONGODB_URI>" --archive="selfinder-mongodb-2026-09-10T04-00-00Z.archive.gz" --gzip
```

## What's not done yet

- **No restore drill has actually been run.** The procedure above is
  correct by construction (standard `mongodump`/`mongorestore` usage)
  but has not been executed end-to-end against a real throwaway cluster
  to confirm it actually works and to replace the RTO estimate above
  with a measured number. This is the single most valuable next step —
  an untested backup is only a hypothesis.
- **No alert if the nightly backup job fails.** A failed run currently
  surfaces only as a red X in the Actions tab, which nobody is watching
  continuously. Wiring workflow-failure notifications into the same
  Discord channel `monitoring/grafana/provisioning/alerting/contact-
  points.yml` already posts to (via a GitHub Actions Discord-webhook
  step on failure) would close this — not done yet, scoped here for
  whoever picks it up next.
- **Only the database is covered.** Nothing here backs up `terraform/`
  state (already durable — remote in Terraform Cloud, see
  `terraform/README.md`) or any files that might someday live outside
  Mongo (none currently do — no S3/GCS/file storage exists anywhere in
  this stack yet).
