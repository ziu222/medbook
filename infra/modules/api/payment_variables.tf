variable "vnpay_secret_arn" {
  description = "Secrets Manager ARN containing tmn_code and hash_secret."
  type        = string
}

variable "vnpay_pay_url" {
  description = "VNPAY checkout endpoint."
  type        = string
}

variable "vnpay_return_url" {
  description = "Frontend URL shown after VNPAY redirects the browser."
  type        = string
}
