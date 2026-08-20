variable "aws_region" {
  description = "AWS region used by the managed-login domain."
  type        = string
}

variable "name" {
  description = "Resource name prefix."
  type        = string
}

variable "callback_urls" {
  description = "Allowed OAuth callback URLs."
  type        = list(string)
}

variable "logout_urls" {
  description = "Allowed OAuth logout URLs."
  type        = list(string)
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
