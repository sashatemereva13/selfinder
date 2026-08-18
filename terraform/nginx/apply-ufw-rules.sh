#!/usr/bin/env bash
# Reproduces the ufw ruleset captured live from srv1229561.hstgr.cloud on
# 2026-08-18 (see README.md in this directory for the raw `ufw status
# verbose` output this was transcribed from). Not wired into any CI/CD
# pipeline — run manually, and only against a fresh/rebuilt box, or after
# diffing against `sudo ufw status verbose` on the real server to confirm
# nothing has drifted since this was written.
#
# This VPS is shared across multiple projects (Selfinder, Amber, and
# others — see terraform/nginx/README.md). The coturn-related rules below
# belong to Amber, not Selfinder, and are included only because removing
# them would break a different, unrelated project running on the same
# host — this script's job is "reproduce the box," not "reproduce
# Selfinder's own minimal ruleset."
set -euo pipefail

echo "This will apply firewall rules matching the live VPS as of 2026-08-18."
echo "Review the rules below before running on a real server."
read -rp "Continue? [y/N] " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 1; }

ufw default deny incoming
ufw default allow outgoing
ufw default deny routed

# SSH
ufw allow 22/tcp comment "OpenSSH"

# nginx (HTTP redirects to HTTPS; HTTPS serves all vhosts, incl. Selfinder)
ufw allow 80/tcp
ufw allow 443/tcp

# Amber's coturn (TURN/TLS + media relay) — NOT Selfinder. Keep only as
# long as Amber is co-located on this host.
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp
ufw allow 49152:65535/udp

ufw --force enable

echo "Done. Verify with: ufw status verbose"
