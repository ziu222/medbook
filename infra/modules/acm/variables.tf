variable "domain_name" {
  description = "Primary certificate domain name"
  type        = string
}

variable "cloudflare_zone_name" {
  description = "Cloudflare DNS zone name used for ACM validation records"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
