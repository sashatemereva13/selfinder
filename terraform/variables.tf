variable "hostinger_api_token" {
  description = "Hostinger API token (hpanel.hostinger.com/profile/api). Supply via TF_VAR_hostinger_api_token env var — never commit this."
  type        = string
  sensitive   = true
}
