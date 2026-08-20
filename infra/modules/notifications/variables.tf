variable "name" {
  description = "Resource name prefix."
  type        = string
}

variable "image_uri" {
  description = "Immutable ECR image URI shared with the API Lambda."
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID used to resolve the booker's email."
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN allowed for AdminGetUser."
  type        = string
}

variable "domain_name" {
  description = "Verified SES sender domain."
  type        = string
}

variable "cloudflare_zone_name" {
  description = "Cloudflare DNS zone containing domain_name."
  type        = string
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
