# MongoDB backup & disaster recovery

**Status: real, live, automated (2026-09-10, redesigned 2026-09-15).**
Before this, Selfinder's production database had **zero backup coverage
of any kind** — not a policy gap, a literal capability gap: the Atlas
cluster (`cluster0`) is on Atlas's free/shared tier, and Atlas does not
offer *any* backup feature (continuous or snapshot) below the M10
dedicated tier. If that cluster had been deleted, corrupted, or the
account lost, every user's account, readings, and conversations would
have been unrecoverable. This doc exists so that stops being true
silently.

## Why not just upgrade the Atlas tier

M10+ gets Atlas's built-in continuous backup, which would be the
standard, less bespoke answer. Not done here because Selfinder is
currently fully free for everyone with no live payment path (see
`RULES.md`, "Selfinder is fully free right now") — there's no revenue to
size a recurring infra cost against yet. This is explicitly a stopgap
for the current no-budget stage, not a permanent architectural choice;
if/when a paid tier exists, re-evaluate moving to M10+ and retiring this
mechanism rather than running both.

## Real incident: the first version didn't work at all (2026-09-15)

The original design ran `mongodump` directly inside a GitHub Actions
job. Every run failed with a TLS error from Atlas
(`tls: internal error`, reported against all three shard members) that
looked, at first glance, like an OpenSSL/TLS compatibility problem
between Ubuntu 24.04's GitHub-hosted runner image and Atlas — a real,
documented issue for that combination in general. It wasn't that here.

**Root cause: Atlas's Network Access list for this project only allows
the VPS's fixed IP.** A GitHub-hosted runner has no stable, predictable
IP — Atlas correctly rejected the connection, but the rejection
surfaced as a generic TLS-layer error rather than a clear
authentication/access message, which is what made it look like a TLS
bug instead of an access-control one.

The tempting fix — add `0.0.0.0/0` to Atlas's Network Access list so any
IP can attempt to connect — was deliberately **rejected**: it would mean
database access is protected by the connection-string password alone,
for every IP on the internet, just to let an occasional cron job run.
Not worth that trade for this use case.

**Actual fix: run the backup from the VPS itself, not from GitHub
Actions.** The box already holds the one IP Atlas trusts (it's what the
live backend connects from), so the dump now runs there via cron
(`monitoring/backup-mongodb.sh`), and GitHub Actions' only remaining job
is keeping that script and its crontab entry up to date on the server
(`.github/workflows/backup-mongodb.yml`) — the same SSH-deploy shape
`deploy-backend.yml` already uses, applied to a script instead of a
container. Atlas's access list is unchanged. The size-sanity-check added
in the first version did exactly its job here, worth noting: it refused
to publish the 32-byte broken "backup" the TLS failure produced, so no
bad backup was ever shipped as if it were good — the failure was loud,
not silent, which is the entire point of that check.

## What actually runs

**On the VPS, via cron (`monitoring/backup-mongodb.sh`), daily at 04:00
UTC by default:**

1. Reads secrets from a standing file on the box
   (`/opt/selfinder/backup/backup.env` — see "VPS setup" below), the
   same convention as `backend/.env`: created once by hand, never
   committed, never passed through GitHub Actions.
2. `mongodump --uri=$MONGODB_URI --archive --gzip`, piped directly into
   `openssl enc -aes-256-cbc -pbkdf2` — the dump is never written to
   disk unencrypted, even transiently.
3. A size sanity check refuses to publish anything under 1KB, so a wrong
   URI or an unreachable Atlas fails loudly instead of silently
   publishing a broken "backup" that would fail on restore, undetected,
   for weeks. (This is the check that caught the incident above.)
4. Uploads the encrypted archive as a **private GitHub release** (tagged
   `backup-<UTC timestamp>`), not a GitHub Actions artifact — artifacts
   expire (90-day default retention) without anyone noticing; releases
   don't expire on their own. Publishing from the VPS requires a GitHub
   PAT (`GH_TOKEN` in the secrets file), since `GITHUB_TOKEN` only exists
   inside an Actions run.
5. Prunes releases older than the most recent `RETAIN_BACKUPS` (default
   14, i.e. ~2 weeks of daily history) so storage doesn't grow forever.

**In GitHub Actions (`.github/workflows/backup-mongodb.yml`), on a push
to `monitoring/backup-mongodb.sh` or manually:** copies the script to
the VPS over SCP and installs/updates its crontab entry (keyed by a
comment marker, so re-running replaces the one line rather than
accumulating duplicates or disturbing the box's other cron jobs — this
is a shared, multi-tenant VPS). Does **not** run the backup itself.

## VPS setup (one-time, by hand)

```bash
# on the VPS
sudo mkdir -p /opt/selfinder/backup
sudo touch /opt/selfinder/backup/backup.env
sudo chmod 600 /opt/selfinder/backup/backup.env
```

`backup.env` needs four values, none of which should ever be committed
or pass through a GitHub Actions secret (this file lives only on the
box):

- `MONGODB_URI` — same connection string as `backend/.env`.
- `MONGODB_BACKUP_PASSPHRASE` — a long random passphrase used only to
  encrypt/decrypt backup archives. **If this is lost, every existing
  backup becomes permanently unreadable** — store it somewhere durable
  outside the VPS too (a password manager), since there's no way to read
  it back from the file once written except by having it already.
- `GH_TOKEN` — a **fine-grained GitHub PAT scoped to this repo only**,
  with Contents: Read and write permission (needed for
  `gh release create`/`delete`). Scoping it to this one repo, not a
  classic all-repos token, limits the blast radius if this VPS is ever
  compromised — the same reasoning already applied to `SERVER_SSH_KEY`
  and the other deploy secrets.
- `GITHUB_REPOSITORY` — `<owner>/<repo>`, e.g. what
  `${{ github.repository }}` resolves to in Actions; the script isn't
  running inside Actions, so this can't be inferred automatically and
  has to be set explicitly.

Then install `mongodb-database-tools` on the VPS once (the script
assumes `mongodump` is already on `PATH`, unlike the old Actions-based
version which installed it fresh every run):

```bash
curl -fsSL -o /tmp/mongo-tools.deb \
  https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-x86_64-100.18.0.deb
sudo apt-get install -y /tmp/mongo-tools.deb
rm /tmp/mongo-tools.deb
```

Finally, push a change to `monitoring/backup-mongodb.sh` (or run
`workflow_dispatch` on `.github/workflows/backup-mongodb.yml`) to
install the script and cron entry — no new GitHub Actions secrets are
required beyond what `deploy-backend.yml` already uses
(`SERVER_HOST`/`SERVER_USER`/`SERVER_SSH_KEY`).

## Honest RPO / RTO

- **RPO (Recovery Point Objective): up to 24 hours.** Backups run once a
  day; a disaster right before the next scheduled run loses up to a
  day's worth of readings/conversations/accounts. This is a deliberate,
  named tradeoff for the free-tier stopgap, not an oversight — tightening
  it (e.g. every 6h) is a one-line crontab schedule change
  (`BACKUP_CRON_SCHEDULE` repo variable) if the real risk profile ever
  justifies it.
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

Note the target cluster's own Network Access list needs to allow
whatever machine runs this restore — the same class of gotcha that
caused the incident above, worth checking explicitly rather than
re-discovering it mid-restore during a real disaster.

## What's not done yet

- **No restore drill has actually been run.** The procedure above is
  correct by construction (standard `mongodump`/`mongorestore` usage)
  but has not been executed end-to-end against a real throwaway cluster
  to confirm it actually works and to replace the RTO estimate above
  with a measured number. This is the single most valuable next step —
  an untested backup is only a hypothesis.
- **No alert if the nightly cron job fails.** A failed run on the VPS
  currently surfaces nowhere unless someone SSHes in and checks
  (`grep CRON /var/log/syslog` or cron's own mail, if configured) —
  worse than the old GitHub-Actions version, which at least showed a red
  X in the Actions tab. Piping the script's failures into the same
  Discord channel Grafana alerting already posts to
  (`monitoring/grafana/provisioning/alerting/contact-points.yml`) would
  close this — not done yet, scoped here for whoever picks it up next.
- **Only the database is covered.** Nothing here backs up `terraform/`
  state (already durable — remote in Terraform Cloud, see
  `terraform/README.md`) or any files that might someday live outside
  Mongo (none currently do — no S3/GCS/file storage exists anywhere in
  this stack yet).
