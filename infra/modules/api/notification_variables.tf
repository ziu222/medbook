variable "notification_queue_arn" {
  description = "SQS queue ARN used by the cancellation outbox dispatcher."
  type        = string
}

variable "notification_queue_url" {
  description = "SQS queue URL used by the cancellation outbox dispatcher."
  type        = string
}
