variable "vnpay_secret_arn" {
  description = "Secrets Manager ARN containing VNPAY credentials."
  type        = string
}

variable "vnpay_pay_url" {
  description = "VNPAY checkout endpoint required by the shared image config."
  type        = string
}

variable "vnpay_return_url" {
  description = "VNPAY browser return URL required by the shared image config."
  type        = string
}

variable "vnpay_api_url" {
  description = "VNPAY query and refund endpoint."
  type        = string
}

variable "api_function_name" {
  description = "API Lambda alias invoked to persist refund results."
  type        = string
}
