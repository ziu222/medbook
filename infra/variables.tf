variable "aws_region" {
  description = "AWS region for regional resources."
  type        = string
}

variable "project" {
  description = "Lowercase project identifier used in names and tags."
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
}

variable "domain_name" {
  description = "Public hostname for CloudFront."
  type        = string
}

variable "cloudflare_zone_name" {
  description = "Cloudflare DNS zone containing domain_name."
  type        = string
}

variable "cognito_callback_urls" {
  description = "Allowed Cognito OAuth callback URLs."
  type        = list(string)
  default     = ["http://localhost:5173/auth/callback"]
}

variable "cognito_logout_urls" {
  description = "Allowed Cognito logout URLs."
  type        = list(string)
  default     = ["http://localhost:5173/"]
}

variable "monthly_budget_usd" {
  description = "Monthly project budget in USD."
  type        = number
  default     = 30
}

variable "budget_alert_email" {
  description = "Email for budget alerts."
  type        = string
  nullable    = false
}
