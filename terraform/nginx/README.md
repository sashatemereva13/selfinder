# VPS config snapshots — nginx + firewall

These are captured, not managed, as of 2026-08-18. `srv1229561.hstgr.cloud`
is a shared, multi-tenant VPS — it fronts several unrelated projects
(Amber, Aureliu, Estelle, SpotifyVisualiser, this apply subdomain, and
Selfinder) via one nginx install and one host-level firewall. Everything
in this directory is scoped to what's relevant to Selfinder specifically;
the other sites' nginx configs under `/etc/nginx/sites-available/` are
intentionally not captured here.

## `selfinder.conf`

Verbatim copy of `/etc/nginx/sites-available/selfinder`. Confirms:
Certbot-managed TLS (Let's Encrypt), HTTP→HTTPS redirect on port 80,
static frontend served from `/var/www/selfinder/frontend` (matches
`deploy-frontend.yml`'s rsync target), `/api/` reverse-proxied to
`localhost:3002` (matches the backend container's published port).

## Firewall (`ufw`), not yet captured as a file

`sudo ufw status verbose` on 2026-08-18 showed:

```
Default: deny (incoming), allow (outgoing), deny (routed)
22/tcp    ALLOW  Anywhere   (SSH)
80/tcp    ALLOW  Anywhere   (nginx HTTP → redirects to 443)
443/tcp   ALLOW  Anywhere   (nginx HTTPS, all sites incl. Selfinder)
3478/tcp  ALLOW  Anywhere   (Amber's coturn TURN — not Selfinder)
3478/udp  ALLOW  Anywhere   (Amber's coturn TURN — not Selfinder)
5349/tcp  ALLOW  Anywhere   (Amber's coturn TURNS/TLS — not Selfinder)
49152:65535/udp ALLOW Anywhere (Amber's coturn media relay range)
```
(plus IPv6 duplicates of each rule)

**Verified, not assumed:** the backend container publishes port 3002 on
`0.0.0.0` at the Docker/OS socket level (confirmed via `ss -tlnp`), which
looked like a potential direct-access bypass of nginx/TLS. Checked
against the live `ufw` ruleset above — 3002 is not in the allow list, and
default incoming policy is deny, so this is not actually exposed
externally. Worth re-checking if the firewall config ever changes, since
Docker's own `iptables` manipulation is a well-known source of `ufw`
bypasses in other setups — not confirmed to be happening here, but not
exhaustively ruled out beyond this one check either.

**Not yet done:** `firewall_group_id` on the Hostinger VPS API is `null`
— there is no Hostinger-level (cloud) firewall, only this host-level
`ufw`. This means firewall rules currently live only on the box itself,
invisible to Terraform and to anyone without SSH access. Whether to
formalize this as a `hostinger` cloud firewall resource (if/when the
provider supports one) or as a checked-in `ufw` rules file applied via
the future Ansible/cloud-init config-management step is an open decision
— see `docs/roadmap.md`.
