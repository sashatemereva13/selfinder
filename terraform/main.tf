# Adopts the existing, already-paid-for VPS into Terraform state via
# `terraform import` — this resource is NOT meant to provision a new
# server. See README.md in this directory for the import procedure.
#
# Values below match the live VPS as of 2026-08-18, read directly from
# GET /api/vps/v1/virtual-machines (id 1229561). `plan` is set to the
# raw string the VPS API itself reports ("KVM 2"), not a billing-catalog
# slug — the provider's Read function repopulates this field from the
# same source on refresh/import, so this is expected to match exactly.
resource "hostinger_vps" "selfinder" {
  plan           = "KVM 2"
  data_center_id = 15
  template_id    = 1077 # Ubuntu 24.04 LTS
  hostname       = "srv1229561.hstgr.cloud"

  # No password/ssh_key_ids set here deliberately — these are ForceNew
  # or create-time-only fields for a *new* VPS. On an imported resource,
  # Terraform will read the current state and these should not trigger
  # any change. Do not add a `password` value here; it would have no
  # effect on read but any future non-import apply must never carry a
  # plaintext password in version control.

  lifecycle {
    prevent_destroy = true
  }
}

output "vps_id" {
  value = hostinger_vps.selfinder.vps_id
}

output "ipv4_address" {
  value = hostinger_vps.selfinder.ipv4_address
}

output "ipv6_address" {
  value = hostinger_vps.selfinder.ipv6_address
}

output "status" {
  value = hostinger_vps.selfinder.status
}
