variable "name" {
  description = "Resource name prefix."
  type        = string
}

variable "api_endpoint" {
  description = "API Gateway endpoint used as the /api/* origin."
  type        = string
}

variable "domain_name" {
  description = "Custom hostname served by CloudFront."
  type        = string
}

variable "certificate_arn" {
  description = "Validated ACM certificate ARN in us-east-1 for domain_name."
  type        = string
}

variable "waf_rate_limit_per_5min" {
  description = "Maximum requests from one IP during a five-minute WAF evaluation window."
  type        = number
  default     = 2000
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
