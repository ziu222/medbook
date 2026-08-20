output "notification_queue_url" {
  description = "SQS FIFO queue used for cancellation emails."
  value       = module.notifications.queue_url
}

output "notification_sender_email" {
  description = "SES sender used for cancellation emails."
  value       = module.notifications.sender_email
}
