# Terraform — Selfinder VPS

Manages the existing, already-provisioned Hostinger VPS
(`srv1229561.hstgr.cloud`) that `.github/workflows/deploy-backend.yml`
and `deploy-frontend.yml` deploy to. This is an **import**, not a
from-scratch provision — the VPS is a year-long prepaid rental; the goal
is to bring its configuration under version control, not to replace it.

Provider: [`hostinger/hostinger`](https://registry.terraform.io/providers/hostinger/hostinger/latest)
(official, first-party, pre-1.0 as of writing — see the caveats section
in the root `docs/roadmap.md` DevOps plan entry).

## Setup

1. Generate an API token at `hpanel.hostinger.com/profile/api`.
2. Export it — **never** put it in a `.tfvars` file that could be
   committed, and never paste it anywhere outside your own shell:
   ```bash
   export TF_VAR_hostinger_api_token="<your token>"
   ```
3. `terraform init`

## Importing the existing VPS

The VPS already exists (id `1229561`) and is not created by `terraform
apply` — it's brought into state via import so Terraform describes
reality without touching the running server:

```bash
terraform import hostinger_vps.selfinder 1229561
```

After import, run:

```bash
terraform plan
```

This **must** show no changes. If it doesn't, the `.tf` in `main.tf`
doesn't yet match the real VPS's attributes — adjust `main.tf` (not the
live server) until `plan` is clean. That clean-diff state is the actual
goal of this exercise: code that's a truthful description of what's
running, not aspirational config that would recreate/mutate the server
if ever applied for real.

## What this does NOT cover yet

- **Firewall rules** — the live VPS currently reports
  `firewall_group_id: null` (confirmed via the VPS API on 2026-08-18),
  meaning no Hostinger-level firewall is attached. Access control today
  is presumably OS-level (`ufw`/`iptables` on the box itself), which is
  not yet captured anywhere as code. Worth adding a
  `hostinger_vps_firewall`-equivalent resource if/when the provider
  supports one, or documenting the current `ufw` rules explicitly
  in-repo otherwise.
- **DNS** — not yet added. `hostinger_dns_record` exists in this
  provider; a known open issue (hostinger/terraform-provider-hostinger#8)
  affects TXT record creation specifically — stick to A/CNAME records for
  now if this gets added.
- **In-instance configuration** (Docker, nginx, the `/opt/selfinder/
  backend/` directory `deploy-backend.yml` assumes exists) — deliberately
  out of scope for Terraform itself. Terraform's own docs treat
  `provisioner "remote-exec"` as a last resort; the plan is to use
  `hostinger_vps_post_install_script` or a separate Ansible playbook for
  this, not Terraform provisioners. Not yet implemented.

See `docs/roadmap.md` → "Production-grade DevOps upgrade" for the full
phased plan this fits into.
