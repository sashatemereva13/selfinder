#!/usr/bin/env bash
# Runs on the VPS itself (via cron), not GitHub Actions — see
# docs/backup-strategy.md for why. Atlas's Network Access list for this
# project only allows this VPS's fixed IP; GitHub-hosted runners have no
# stable IP and would need Atlas opened to 0.0.0.0/0 to connect at all,
# which was deliberately rejected as too wide a security tradeoff just to
# run a cron job. Running the dump from the box already trusted for the
# live backend connection avoids that tradeoff entirely.
#
# Reads its secrets from /opt/selfinder/backup/backup.env (created once,
# by hand, same convention as backend/.env — never committed, never
# passed through GitHub Actions). Required keys: MONGODB_URI,
# MONGODB_BACKUP_PASSPHRASE, GH_TOKEN (a fine-grained PAT scoped to this
# repo only, with Contents: Read and write — GITHUB_TOKEN doesn't exist
# outside of an Actions run, so a real PAT is required here).
set -euo pipefail

SECRETS_FILE="${BACKUP_SECRETS_FILE:-/opt/selfinder/backup/backup.env}"
if [ ! -f "$SECRETS_FILE" ]; then
  echo "::error:: $SECRETS_FILE not found — see docs/backup-strategy.md for setup." >&2
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "$SECRETS_FILE"; set +a

for var in MONGODB_URI MONGODB_BACKUP_PASSPHRASE GH_TOKEN GITHUB_REPOSITORY; do
  if [ -z "${!var:-}" ]; then
    echo "::error:: $var is not set in $SECRETS_FILE" >&2
    exit 1
  fi
done

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
cd "$WORKDIR"

STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
ARCHIVE="selfinder-mongodb-$STAMP.archive.gz.enc"

mongodump --uri="$MONGODB_URI" --archive --gzip \
  | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:MONGODB_BACKUP_PASSPHRASE \
  > "$ARCHIVE"

# Sanity check: a real backup is never a few empty-collection bytes.
# Catches a silently-empty dump (wrong URI, Atlas unreachable) before
# it's published as if it were good — this is what actually caught the
# original GitHub-Actions-runner connectivity failure (a 32-byte "backup"
# refused rather than shipped).
SIZE=$(stat -c%s "$ARCHIVE")
if [ "$SIZE" -lt 1024 ]; then
  echo "::error:: Backup archive is suspiciously small ($SIZE bytes) — refusing to publish it as a release." >&2
  exit 1
fi
echo "Backup archive: $SIZE bytes"

export GH_TOKEN
gh release create "backup-$STAMP" \
  "$ARCHIVE" \
  --title "MongoDB backup — $STAMP" \
  --notes "Automated encrypted mongodump, run from the VPS. Restore procedure: docs/backup-strategy.md." \
  --repo "$GITHUB_REPOSITORY"

RETAIN_BACKUPS="${RETAIN_BACKUPS:-14}"
gh release list --repo "$GITHUB_REPOSITORY" --limit 200 \
  | awk -F'\t' '{print $3}' \
  | grep '^backup-' \
  | sort -r \
  | tail -n "+$((RETAIN_BACKUPS + 1))" \
  | while read -r tag; do
      echo "Pruning old backup release: $tag"
      gh release delete "$tag" --repo "$GITHUB_REPOSITORY" --yes --cleanup-tag
    done
